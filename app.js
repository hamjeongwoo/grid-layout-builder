const palette = ["#3167d4", "#2a9d8f", "#f4a261", "#495057", "#8b5cf6", "#0f766e", "#be123c"];

const initialCells = [
  ["header", "header", "header", "header"],
  ["sidebar", "content", "content", "content"],
  ["footer", "footer", "footer", "footer"]
];

const state = {
  rows: 3,
  columns: 4,
  gap: 16,
  cells: cloneCells(initialCells),
  areas: {
    header: { color: "#3167d4" },
    sidebar: { color: "#f4a261" },
    content: { color: "#2a9d8f" },
    footer: { color: "#495057" }
  },
  activeArea: "content",
  activeColor: "#2a9d8f",
  dragStart: null,
  dragCurrent: null
};

function cloneCells(cells) {
  return cells.map((row) => row.slice());
}

function normalizeAreaName(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "");
  return normalized || "area";
}

function createEmptyCells(rows, columns) {
  return Array.from({ length: rows }, () => Array.from({ length: columns }, () => "."));
}

function getAreaNames(cells) {
  return Array.from(new Set(cells.flat().filter((name) => name && name !== "."))).sort();
}

function getAreaBounds(cells, areaName) {
  let minRow = Infinity;
  let maxRow = -1;
  let minColumn = Infinity;
  let maxColumn = -1;
  cells.forEach((row, rowIndex) => {
    row.forEach((value, columnIndex) => {
      if (value === areaName) {
        minRow = Math.min(minRow, rowIndex);
        maxRow = Math.max(maxRow, rowIndex);
        minColumn = Math.min(minColumn, columnIndex);
        maxColumn = Math.max(maxColumn, columnIndex);
      }
    });
  });
  if (maxRow === -1) return null;
  return { minRow, maxRow, minColumn, maxColumn };
}

function isRectangularArea(cells, areaName) {
  const bounds = getAreaBounds(cells, areaName);
  if (!bounds) return true;
  for (let row = bounds.minRow; row <= bounds.maxRow; row += 1) {
    for (let column = bounds.minColumn; column <= bounds.maxColumn; column += 1) {
      if (cells[row][column] !== areaName) return false;
    }
  }
  return true;
}

function validateCells(cells) {
  if (!cells.length || !cells[0].length) return { ok: false, message: "Grid must contain at least one cell." };
  const width = cells[0].length;
  const sameWidth = cells.every((row) => row.length === width);
  if (!sameWidth) return { ok: false, message: "Every row must contain the same number of tokens." };
  const invalidName = getAreaNames(cells).find((name) => normalizeAreaName(name) !== name);
  if (invalidName) return { ok: false, message: `"${invalidName}" is not a CSS-safe area name.` };
  const invalidArea = getAreaNames(cells).find((name) => !isRectangularArea(cells, name));
  if (invalidArea) return { ok: false, message: `"${invalidArea}" must form one rectangle.` };
  return { ok: true, message: "" };
}

function cellsToTemplateAreas(cells) {
  return cells.map((row) => `"${row.join(" ")}"`).join("\n");
}

function generateCss(currentState) {
  const areaClasses = getAreaNames(currentState.cells)
    .map((name) => `.${name} {\n  grid-area: ${name};\n}`)
    .join("\n\n");
  return `.layout {\n  display: grid;\n  grid-template-columns: repeat(${currentState.columns}, 1fr);\n  grid-template-rows: repeat(${currentState.rows}, 1fr);\n  grid-template-areas:\n${cellsToTemplateAreas(currentState.cells).split("\n").map((line) => `    ${line}`).join("\n")};\n  gap: ${currentState.gap}px;\n}\n\n${areaClasses}`;
}

function generateHtml(currentState) {
  return `<div class="layout">\n${getAreaNames(currentState.cells).map((name) => `  <section class="${name}">${name}</section>`).join("\n")}\n</div>`;
}

function parseTemplateAreas(text) {
  const rows = String(text || "")
    .split(/\n+/)
    .map((line) => line.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean)
    .map((line) => line.split(/\s+/).map((token) => token === "." ? "." : normalizeAreaName(token)));
  const validation = validateCells(rows);
  if (!validation.ok) return { ok: false, message: validation.message, cells: null };
  return { ok: true, message: "", cells: rows };
}
