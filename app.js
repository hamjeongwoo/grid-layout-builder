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
  columnTemplate: "repeat(4, 1fr)",
  rowTemplate: "repeat(3, minmax(80px, 1fr))",
  includeAreas: true,
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

function normalizeTrackTemplate(value, count, fallbackUnit) {
  const template = String(value || "").trim();
  return template || `repeat(${count}, ${fallbackUnit})`;
}

function generateCss(currentState) {
  const areaClasses = getAreaNames(currentState.cells)
    .map((name) => `.${name} {\n  grid-area: ${name};\n}`)
    .join("\n\n");
  const areasBlock = currentState.includeAreas
    ? `  grid-template-areas:\n${cellsToTemplateAreas(currentState.cells).split("\n").map((line) => `    ${line}`).join("\n")};\n`
    : "";
  return `.layout {\n  display: grid;\n  grid-template-columns: ${normalizeTrackTemplate(currentState.columnTemplate, currentState.columns, "1fr")};\n  grid-template-rows: ${normalizeTrackTemplate(currentState.rowTemplate, currentState.rows, "minmax(80px, 1fr)")};\n${areasBlock}  gap: ${currentState.gap}px;\n}${currentState.includeAreas && areaClasses ? `\n\n${areaClasses}` : ""}`;
}

function generateHtml(currentState) {
  const names = currentState.includeAreas ? getAreaNames(currentState.cells) : ["item-1", "item-2", "item-3"];
  return `<div class="layout">\n${names.map((name) => `  <section class="${name}">${name}</section>`).join("\n")}\n</div>`;
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

function makeRectangle(start, current) {
  if (!start || !current) return null;
  return {
    minRow: Math.min(start.row, current.row),
    maxRow: Math.max(start.row, current.row),
    minColumn: Math.min(start.column, current.column),
    maxColumn: Math.max(start.column, current.column)
  };
}

function getDragRectangle() {
  return makeRectangle(state.dragStart, state.dragCurrent);
}

function isCellInRectangle(row, column, rect) {
  return row >= rect.minRow && row <= rect.maxRow && column >= rect.minColumn && column <= rect.maxColumn;
}

function fillRectangle(rect, areaName) {
  const next = state.cells.map((row) => row.map((value) => (value === areaName ? "." : value)));
  for (let row = rect.minRow; row <= rect.maxRow; row += 1) {
    for (let column = rect.minColumn; column <= rect.maxColumn; column += 1) {
      next[row][column] = areaName;
    }
  }
  state.cells = clearInvalidAreaFragments(next, areaName);
}

function clearInvalidAreaFragments(cells, protectedArea) {
  let next = cloneCells(cells);
  getAreaNames(next).forEach((name) => {
    if (name === protectedArea || isRectangularArea(next, name)) return;
    next = next.map((row) => row.map((value) => (value === name ? "." : value)));
  });
  return next;
}

if (typeof document !== "undefined") {
  const dom = {
    columns: document.querySelector("#columns-input"),
    rows: document.querySelector("#rows-input"),
    gap: document.querySelector("#gap-input"),
    columnTemplate: document.querySelector("#column-template-input"),
    rowTemplate: document.querySelector("#row-template-input"),
    includeAreas: document.querySelector("#include-areas-input"),
    areaName: document.querySelector("#area-name-input"),
    areaColor: document.querySelector("#area-color-input"),
    areaList: document.querySelector("#area-list"),
    canvas: document.querySelector("#grid-canvas"),
    canvasMessage: document.querySelector("#canvas-message"),
    areasTextarea: document.querySelector("#areas-textarea"),
    areasError: document.querySelector("#areas-error"),
    cssOutput: document.querySelector("#css-output"),
    htmlOutput: document.querySelector("#html-output")
  };

  function ensureAreaMeta(areaName, color) {
    if (!state.areas[areaName]) {
      state.areas[areaName] = { color: color || palette[getAreaNames(state.cells).length % palette.length] };
    }
  }

  function syncAreaMetadata() {
    const names = getAreaNames(state.cells);
    names.forEach((name) => ensureAreaMeta(name));
    Object.keys(state.areas).forEach((name) => {
      if (!names.includes(name)) delete state.areas[name];
    });
  }

  function renderControls() {
    dom.columns.value = state.columns;
    dom.rows.value = state.rows;
    dom.gap.value = state.gap;
    dom.columnTemplate.value = state.columnTemplate;
    dom.rowTemplate.value = state.rowTemplate;
    dom.includeAreas.checked = state.includeAreas;
    dom.areaName.value = state.activeArea;
    dom.areaColor.value = state.activeColor;
  }

  function renameArea(oldName, newName) {
    const clean = normalizeAreaName(newName);
    if (clean === oldName) return;
    const previousCells = cloneCells(state.cells);
    const previousAreas = { ...state.areas };
    state.cells = state.cells.map((row) => row.map((value) => (value === oldName ? clean : value)));
    state.areas[clean] = state.areas[oldName] || { color: state.activeColor };
    delete state.areas[oldName];
    if (state.activeArea === oldName) state.activeArea = clean;
    const validation = validateCells(state.cells);
    if (!validation.ok) {
      state.cells = previousCells;
      state.areas = previousAreas;
      if (state.activeArea === clean) state.activeArea = oldName;
      dom.canvasMessage.textContent = validation.message;
    }
  }

  function deleteArea(areaName) {
    state.cells = state.cells.map((row) => row.map((value) => (value === areaName ? "." : value)));
    delete state.areas[areaName];
    if (state.activeArea === areaName) {
      state.activeArea = "content";
      state.activeColor = "#2a9d8f";
    }
  }

  function renderAreaList() {
    const names = getAreaNames(state.cells);
    dom.areaList.innerHTML = names.length ? "" : '<p class="hint">No areas yet.</p>';
    names.forEach((name) => {
      const item = document.createElement("div");
      item.className = "area-item editable";
      item.innerHTML = `
        <span class="swatch"></span>
        <input class="area-rename" value="${name}" aria-label="Rename ${name}">
        <button class="mini-button use-area" type="button">Use</button>
        <button class="mini-button delete-area" type="button">Delete</button>
      `;
      item.querySelector(".swatch").style.background = state.areas[name]?.color || "#98a2b3";
      item.querySelector(".use-area").addEventListener("click", () => {
        state.activeArea = name;
        state.activeColor = state.areas[name]?.color || state.activeColor;
        render();
      });
      item.querySelector(".delete-area").addEventListener("click", () => {
        deleteArea(name);
        render();
      });
      item.querySelector(".area-rename").addEventListener("change", (event) => {
        renameArea(name, event.target.value);
        render();
      });
      dom.areaList.appendChild(item);
    });
  }

  function renderCanvas() {
    dom.canvas.style.gridTemplateRows = state.rowTemplate;
    dom.canvas.style.gridTemplateColumns = state.columnTemplate;
    dom.canvas.style.gap = `${Math.max(4, Math.min(state.gap, 24))}px`;
    dom.canvas.innerHTML = "";
    const preview = getDragRectangle();
    state.cells.forEach((row, rowIndex) => {
      row.forEach((areaName, columnIndex) => {
        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = `grid-cell ${areaName === "." ? "empty" : ""}`;
        cell.dataset.row = String(rowIndex);
        cell.dataset.column = String(columnIndex);
        cell.textContent = areaName === "." ? "empty" : areaName;
        if (areaName !== ".") cell.style.background = state.areas[areaName]?.color || "#98a2b3";
        if (preview && isCellInRectangle(rowIndex, columnIndex, preview)) cell.classList.add("preview");
        dom.canvas.appendChild(cell);
      });
    });
  }

  function renderOutputs() {
    dom.areasTextarea.value = cellsToTemplateAreas(state.cells);
    dom.cssOutput.textContent = generateCss(state);
    dom.htmlOutput.textContent = generateHtml(state);
  }

  function render() {
    syncAreaMetadata();
    renderControls();
    renderAreaList();
    renderCanvas();
    renderOutputs();
  }

  function resizeCells(rows, columns) {
    const next = createEmptyCells(rows, columns);
    for (let row = 0; row < Math.min(rows, state.rows); row += 1) {
      for (let column = 0; column < Math.min(columns, state.columns); column += 1) {
        next[row][column] = state.cells[row][column];
      }
    }
    state.rows = rows;
    state.columns = columns;
    state.rowTemplate = `repeat(${rows}, minmax(80px, 1fr))`;
    state.columnTemplate = `repeat(${columns}, 1fr)`;
    state.cells = clearInvalidAreaFragments(next, state.activeArea);
  }

  function bindControls() {
    dom.columns.addEventListener("input", () => {
      resizeCells(state.rows, Math.max(1, Math.min(8, Number(dom.columns.value) || 1)));
      render();
    });
    dom.rows.addEventListener("input", () => {
      resizeCells(Math.max(1, Math.min(8, Number(dom.rows.value) || 1)), state.columns);
      render();
    });
    dom.gap.addEventListener("input", () => {
      state.gap = Math.max(0, Math.min(64, Number(dom.gap.value) || 0));
      render();
    });
    dom.columnTemplate.addEventListener("input", () => {
      state.columnTemplate = normalizeTrackTemplate(dom.columnTemplate.value, state.columns, "1fr");
      render();
    });
    dom.rowTemplate.addEventListener("input", () => {
      state.rowTemplate = normalizeTrackTemplate(dom.rowTemplate.value, state.rows, "minmax(80px, 1fr)");
      render();
    });
    dom.includeAreas.addEventListener("change", () => {
      state.includeAreas = dom.includeAreas.checked;
      render();
    });
    dom.areaName.addEventListener("input", () => {
      state.activeArea = normalizeAreaName(dom.areaName.value);
    });
    dom.areaColor.addEventListener("input", () => {
      state.activeColor = dom.areaColor.value;
      ensureAreaMeta(state.activeArea, state.activeColor);
      state.areas[state.activeArea].color = state.activeColor;
      render();
    });
    document.querySelector("#reset-grid").addEventListener("click", () => {
      state.rows = 3;
      state.columns = 4;
      state.gap = 16;
      state.columnTemplate = "repeat(4, 1fr)";
      state.rowTemplate = "repeat(3, minmax(80px, 1fr))";
      state.includeAreas = true;
      state.cells = cloneCells(initialCells);
      state.areas = {
        header: { color: "#3167d4" },
        sidebar: { color: "#f4a261" },
        content: { color: "#2a9d8f" },
        footer: { color: "#495057" }
      };
      state.activeArea = "content";
      state.activeColor = "#2a9d8f";
      dom.areasError.textContent = "";
      dom.canvasMessage.textContent = "Grid reset.";
      render();
    });
    document.querySelector("#preset-dashboard").addEventListener("click", () => {
      state.rows = 4;
      state.columns = 4;
      state.gap = 16;
      state.columnTemplate = "240px 1fr 1fr 1fr";
      state.rowTemplate = "64px minmax(160px, 1fr) minmax(160px, 1fr) 72px";
      state.includeAreas = true;
      state.cells = [
        ["nav", "nav", "nav", "nav"],
        ["sidebar", "main", "main", "main"],
        ["sidebar", "main", "main", "main"],
        ["footer", "footer", "footer", "footer"]
      ];
      state.areas = {
        nav: { color: "#3167d4" },
        sidebar: { color: "#f4a261" },
        main: { color: "#2a9d8f" },
        footer: { color: "#495057" }
      };
      state.activeArea = "main";
      state.activeColor = "#2a9d8f";
      dom.areasError.textContent = "";
      dom.canvasMessage.textContent = "Dashboard preset applied.";
      render();
    });
  }

  function getCellPoint(target) {
    const cell = target?.closest?.(".grid-cell");
    if (!cell) return null;
    return {
      row: Number(cell.dataset.row),
      column: Number(cell.dataset.column)
    };
  }

  function getCellPointFromEvent(event) {
    return getCellPoint(document.elementFromPoint(event.clientX, event.clientY));
  }

  function bindCanvasDrag() {
    dom.canvas.addEventListener("pointerdown", (event) => {
      const point = getCellPoint(event.target);
      if (!point) return;
      state.dragStart = point;
      state.dragCurrent = point;
      dom.canvas.setPointerCapture(event.pointerId);
      renderCanvas();
    });

    dom.canvas.addEventListener("pointermove", (event) => {
      if (!state.dragStart) return;
      const point = getCellPointFromEvent(event);
      if (!point) return;
      state.dragCurrent = point;
      renderCanvas();
    });

    dom.canvas.addEventListener("pointerup", (event) => {
      if (!state.dragStart) return;
      const rect = getDragRectangle();
      const areaName = normalizeAreaName(state.activeArea);
      state.activeArea = areaName;
      ensureAreaMeta(areaName, state.activeColor);
      state.areas[areaName].color = state.activeColor;
      fillRectangle(rect, areaName);
      state.dragStart = null;
      state.dragCurrent = null;
      if (dom.canvas.hasPointerCapture(event.pointerId)) dom.canvas.releasePointerCapture(event.pointerId);
      dom.areasError.textContent = "";
      dom.canvasMessage.textContent = `${areaName} area updated.`;
      render();
    });

    dom.canvas.addEventListener("pointercancel", () => {
      state.dragStart = null;
      state.dragCurrent = null;
      renderCanvas();
    });
  }

  async function copyText(text, statusElement, message) {
    try {
      await navigator.clipboard.writeText(text);
      statusElement.textContent = message;
    } catch (error) {
      const helper = document.createElement("textarea");
      helper.value = text;
      helper.style.position = "fixed";
      helper.style.opacity = "0";
      document.body.appendChild(helper);
      helper.select();
      document.execCommand("copy");
      helper.remove();
      statusElement.textContent = message;
    }
  }

  function applyTemplateAreas() {
    const parsed = parseTemplateAreas(dom.areasTextarea.value);
    if (!parsed.ok) {
      dom.areasError.textContent = parsed.message;
      return;
    }
    state.cells = parsed.cells;
    state.rows = parsed.cells.length;
    state.columns = parsed.cells[0].length;
    state.rowTemplate = `repeat(${state.rows}, minmax(80px, 1fr))`;
    state.columnTemplate = `repeat(${state.columns}, 1fr)`;
    getAreaNames(state.cells).forEach((name) => ensureAreaMeta(name));
    dom.areasError.textContent = "";
    dom.canvasMessage.textContent = "Template areas applied.";
    render();
  }

  function bindCodePanel() {
    document.querySelector("#apply-areas").addEventListener("click", applyTemplateAreas);
    document.querySelector("#copy-areas").addEventListener("click", () => {
      copyText(dom.areasTextarea.value, dom.canvasMessage, "grid-template-areas copied.");
    });
    document.querySelector("#copy-css").addEventListener("click", () => {
      copyText(dom.cssOutput.textContent, dom.canvasMessage, "CSS copied.");
    });
    document.querySelector("#copy-html").addEventListener("click", () => {
      copyText(dom.htmlOutput.textContent, dom.canvasMessage, "HTML copied.");
    });
  }

  bindCanvasDrag();
  bindControls();
  bindCodePanel();
  render();
}
