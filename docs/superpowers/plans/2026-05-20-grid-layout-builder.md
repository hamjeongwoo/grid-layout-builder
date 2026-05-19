# Grid Layout Builder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static single-page CSS Grid layout builder with drag selection, generated CSS/HTML, and editable `grid-template-areas`.

**Architecture:** Use plain HTML, CSS, and JavaScript. `app.js` owns state, pure grid/CSS helpers, rendering, pointer interactions, text parsing, and clipboard actions; the DOM stays small and derived from one state object.

**Tech Stack:** Static HTML, modern CSS Grid/Flexbox, vanilla JavaScript pointer events, Clipboard API with textarea fallback.

---

## File Structure

- Create: `index.html`
  - Loads the app shell, control panel, canvas container, code panel, and scripts.
- Create: `styles.css`
  - Owns all visual layout, responsive behavior, grid cells, panels, buttons, form controls, and validation states.
- Create: `app.js`
  - Owns state, area normalization, rectangle validation, CSS/HTML generation, `grid-template-areas` parsing, rendering, and event handlers.
- Modify: `README.md`
  - Adds local usage instructions and feature summary.

The implementation stays dependency-free. The first version uses a single `app.js` because the app is small and no bundler exists; pure helper functions should remain grouped near the top so they can be split later without changing behavior.

---

### Task 1: Static App Shell

**Files:**
- Create: `index.html`
- Create: `styles.css`
- Modify: `README.md`

- [ ] **Step 1: Create the HTML shell**

Create `index.html` with this complete structure:

```html
<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>CSS Grid Layout Builder</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <main class="app-shell">
    <header class="topbar">
      <div>
        <h1>CSS Grid Layout Builder</h1>
        <p>드래그로 영역을 만들고 CSS Grid 문법을 바로 확인하세요.</p>
      </div>
      <div class="topbar-actions">
        <button id="preset-dashboard" class="button secondary" type="button">Dashboard</button>
        <button id="reset-grid" class="button danger" type="button">Reset</button>
      </div>
    </header>

    <section class="workspace" aria-label="CSS Grid builder workspace">
      <aside class="panel controls-panel">
        <h2>Grid</h2>
        <label>Columns <input id="columns-input" type="number" min="1" max="8" value="4"></label>
        <label>Rows <input id="rows-input" type="number" min="1" max="8" value="3"></label>
        <label>Gap <input id="gap-input" type="number" min="0" max="64" value="16"></label>

        <h2>Active Area</h2>
        <label>Name <input id="area-name-input" type="text" value="content" spellcheck="false"></label>
        <label>Color <input id="area-color-input" type="color" value="#2a9d8f"></label>
        <p id="area-name-help" class="hint">영문, 숫자, 하이픈, 언더스코어를 사용할 수 있습니다.</p>

        <h2>Areas</h2>
        <div id="area-list" class="area-list"></div>
      </aside>

      <section class="panel canvas-panel">
        <div class="panel-heading">
          <h2>Canvas</h2>
          <p>셀을 드래그해서 사각형 영역을 만드세요.</p>
        </div>
        <div id="grid-canvas" class="grid-canvas" aria-label="Interactive grid canvas"></div>
        <p id="canvas-message" class="status-message" role="status"></p>
      </section>

      <aside class="panel code-panel">
        <h2>grid-template-areas</h2>
        <textarea id="areas-textarea" spellcheck="false" rows="6"></textarea>
        <div class="button-row">
          <button id="apply-areas" class="button" type="button">Apply Areas</button>
          <button id="copy-areas" class="button secondary" type="button">Copy Areas</button>
        </div>
        <p id="areas-error" class="error-message" role="alert"></p>

        <h2>Generated CSS</h2>
        <pre><code id="css-output"></code></pre>
        <button id="copy-css" class="button secondary" type="button">Copy CSS</button>

        <h2>HTML</h2>
        <pre><code id="html-output"></code></pre>
        <button id="copy-html" class="button secondary" type="button">Copy HTML</button>
      </aside>
    </section>
  </main>
  <script src="app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Add responsive base CSS**

Create `styles.css` with base layout and component styles. Include stable dimensions for panels, cells, buttons, and text areas:

```css
:root {
  --bg: #eef2f7;
  --panel: #ffffff;
  --text: #172033;
  --muted: #657083;
  --line: #cfd7e3;
  --primary: #3167d4;
  --danger: #b42318;
  --focus: #f4a261;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  min-width: 320px;
  background: var(--bg);
  color: var(--text);
  font-family: Arial, sans-serif;
}

button, input, textarea { font: inherit; }

.app-shell {
  min-height: 100vh;
  padding: 20px;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.topbar h1 {
  margin: 0 0 4px;
  font-size: 28px;
  letter-spacing: 0;
}

.topbar p {
  margin: 0;
  color: var(--muted);
}

.topbar-actions, .button-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.workspace {
  display: grid;
  grid-template-columns: 260px minmax(360px, 1fr) 360px;
  gap: 12px;
  align-items: start;
}

.panel {
  min-width: 0;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--panel);
  padding: 14px;
}

.panel h2 {
  margin: 0 0 10px;
  font-size: 15px;
}

.panel-heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.panel-heading p, .hint, .status-message, .error-message {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
}

label {
  display: grid;
  gap: 6px;
  margin-bottom: 10px;
  color: var(--muted);
  font-size: 13px;
  font-weight: 700;
}

input, textarea {
  width: 100%;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: #fbfbfd;
  color: var(--text);
  padding: 9px 10px;
}

textarea {
  min-height: 132px;
  resize: vertical;
  font-family: Consolas, "Courier New", monospace;
  line-height: 1.45;
}

.button {
  min-height: 38px;
  border: 0;
  border-radius: 6px;
  background: var(--primary);
  color: white;
  padding: 0 12px;
  font-weight: 700;
  cursor: pointer;
}

.button.secondary { background: #495057; }
.button.danger { background: var(--danger); }
.button:focus-visible, input:focus-visible, textarea:focus-visible {
  outline: 3px solid rgba(244, 162, 97, 0.45);
  outline-offset: 2px;
}

.grid-canvas {
  display: grid;
  min-height: 520px;
  border: 1px dashed #9aa6b5;
  border-radius: 8px;
  background: #f8fafc;
  padding: 10px;
  gap: 8px;
  touch-action: none;
  user-select: none;
}

.grid-cell {
  min-width: 0;
  min-height: 72px;
  border: 1px solid #d8dee8;
  border-radius: 6px;
  background: #ffffff;
  color: var(--text);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  overflow: hidden;
  text-align: center;
}

.grid-cell.preview {
  outline: 3px solid var(--focus);
  outline-offset: -3px;
}

.grid-cell.empty {
  color: #98a2b3;
  font-weight: 400;
}

.area-list {
  display: grid;
  gap: 8px;
}

.area-item {
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 8px;
  background: #fbfbfd;
}

.swatch {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.14);
}

pre {
  max-height: 260px;
  overflow: auto;
  margin: 0 0 10px;
  border-radius: 6px;
  background: #172033;
  color: #e8eefc;
  padding: 12px;
  font-size: 13px;
  line-height: 1.45;
}

.error-message {
  min-height: 18px;
  margin: 8px 0 12px;
  color: var(--danger);
}

@media (max-width: 1080px) {
  .workspace {
    grid-template-columns: 1fr;
  }

  .grid-canvas {
    min-height: 420px;
  }
}

@media (max-width: 640px) {
  .app-shell { padding: 12px; }
  .topbar { align-items: flex-start; flex-direction: column; }
  .topbar h1 { font-size: 23px; }
  .grid-cell { min-height: 56px; font-size: 12px; }
}
```

- [ ] **Step 3: Update README usage**

Replace `README.md` with:

```markdown
# grid-layout-builder

A dependency-free CSS Grid layout builder. Open `index.html` in a browser, drag across cells to create named grid areas, and copy the generated CSS or HTML.

## Features

- Drag-select rectangular CSS Grid areas
- Edit rows, columns, gap, area name, and area color
- Rename or delete existing areas
- Edit `grid-template-areas` text and apply it back to the canvas
- Copy generated CSS and HTML
```

- [ ] **Step 4: Verify shell loads**

Run: `Get-ChildItem index.html, styles.css, README.md`

Expected: all three files exist. Open `index.html` manually or through an available local preview and confirm the three panels render without JavaScript behavior.

- [ ] **Step 5: Commit**

Run:

```powershell
git -c safe.directory=C:/Users/hjw/Documents/codex-workspace/grid-layout-builder add index.html styles.css README.md
git -c safe.directory=C:/Users/hjw/Documents/codex-workspace/grid-layout-builder commit -m "feat: add static grid builder shell"
```

---

### Task 2: Grid State And Output Helpers

**Files:**
- Create: `app.js`

- [ ] **Step 1: Add initial state and pure helpers**

Create `app.js` with state and helper functions:

```js
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
```

- [ ] **Step 2: Add helper smoke tests at the bottom**

Temporarily add this block at the end of `app.js`:

```js
console.assert(normalizeAreaName("Main Content!") === "main-content", "normalizes area names");
console.assert(validateCells(initialCells).ok, "initial cells are valid");
console.assert(!validateCells([["a", "a"], ["a", "."]]).ok, "rejects non-rectangular areas");
console.assert(parseTemplateAreas('"a a"\n"b b"').ok, "parses valid template areas");
console.assert(generateCss(state).includes("grid-template-areas"), "generates CSS");
```

- [ ] **Step 3: Run helper smoke tests**

Run: `node app.js`

Expected: no output and exit code `0`. If Node is unavailable, open `index.html` after Task 3 and check the browser console for assertion failures.

- [ ] **Step 4: Remove temporary smoke tests**

Delete only the `console.assert(...)` lines from the bottom of `app.js`. Keep all helper functions.

- [ ] **Step 5: Commit**

Run:

```powershell
git -c safe.directory=C:/Users/hjw/Documents/codex-workspace/grid-layout-builder add app.js
git -c safe.directory=C:/Users/hjw/Documents/codex-workspace/grid-layout-builder commit -m "feat: add grid state helpers"
```

---

### Task 3: Rendering And Controls

**Files:**
- Modify: `app.js`
- Modify: `styles.css`

- [ ] **Step 1: Add DOM references and render functions**

Append this code to `app.js`:

```js
const dom = {
  columns: document.querySelector("#columns-input"),
  rows: document.querySelector("#rows-input"),
  gap: document.querySelector("#gap-input"),
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
  getAreaNames(state.cells).forEach((name) => ensureAreaMeta(name));
  Object.keys(state.areas).forEach((name) => {
    if (!getAreaNames(state.cells).includes(name)) delete state.areas[name];
  });
}

function renderControls() {
  dom.columns.value = state.columns;
  dom.rows.value = state.rows;
  dom.gap.value = state.gap;
  dom.areaName.value = state.activeArea;
  dom.areaColor.value = state.activeColor;
}

function renderAreaList() {
  const names = getAreaNames(state.cells);
  dom.areaList.innerHTML = names.length ? "" : '<p class="hint">아직 영역이 없습니다.</p>';
  names.forEach((name) => {
    const item = document.createElement("div");
    item.className = "area-item";
    item.innerHTML = `<span class="swatch"></span><strong></strong><button class="mini-button" type="button">Use</button>`;
    item.querySelector(".swatch").style.background = state.areas[name]?.color || "#98a2b3";
    item.querySelector("strong").textContent = name;
    item.querySelector("button").addEventListener("click", () => {
      state.activeArea = name;
      state.activeColor = state.areas[name]?.color || state.activeColor;
      render();
    });
    dom.areaList.appendChild(item);
  });
}

function renderCanvas() {
  dom.canvas.style.gridTemplateColumns = `repeat(${state.columns}, minmax(0, 1fr))`;
  dom.canvas.style.gridTemplateRows = `repeat(${state.rows}, minmax(56px, 1fr))`;
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
```

- [ ] **Step 2: Add control event handlers**

Append this code to `app.js`:

```js
function resizeCells(rows, columns) {
  const next = createEmptyCells(rows, columns);
  for (let row = 0; row < Math.min(rows, state.rows); row += 1) {
    for (let column = 0; column < Math.min(columns, state.columns); column += 1) {
      next[row][column] = state.cells[row][column];
    }
  }
  state.rows = rows;
  state.columns = columns;
  state.cells = next;
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
    state.cells = cloneCells(initialCells);
    state.areas = {
      header: { color: "#3167d4" },
      sidebar: { color: "#f4a261" },
      content: { color: "#2a9d8f" },
      footer: { color: "#495057" }
    };
    state.activeArea = "content";
    state.activeColor = "#2a9d8f";
    render();
  });
}

bindControls();
render();
```

- [ ] **Step 3: Add missing mini button style**

Append to `styles.css`:

```css
.mini-button {
  min-height: 30px;
  border: 0;
  border-radius: 5px;
  background: #e9eef7;
  color: var(--text);
  padding: 0 8px;
  cursor: pointer;
  font-weight: 700;
}
```

- [ ] **Step 4: Verify rendering and controls**

Open `index.html`. Expected:

- The initial dashboard layout renders.
- Changing columns or rows changes the canvas.
- Changing gap updates visual spacing and generated CSS.
- Area list `Use` button updates the active area fields.

- [ ] **Step 5: Commit**

Run:

```powershell
git -c safe.directory=C:/Users/hjw/Documents/codex-workspace/grid-layout-builder add app.js styles.css
git -c safe.directory=C:/Users/hjw/Documents/codex-workspace/grid-layout-builder commit -m "feat: render grid builder state"
```

---

### Task 4: Drag Selection And Area Editing

**Files:**
- Modify: `app.js`
- Modify: `styles.css`

- [ ] **Step 1: Add drag rectangle helpers**

Insert these functions before `renderCanvas()` in `app.js`:

```js
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
  const next = cloneCells(state.cells);
  for (let row = rect.minRow; row <= rect.maxRow; row += 1) {
    for (let column = rect.minColumn; column <= rect.maxColumn; column += 1) {
      next[row][column] = areaName;
    }
  }
  state.cells = next;
}
```

- [ ] **Step 2: Add pointer event handlers**

Append this code to `app.js` before `bindControls()` is called:

```js
function getCellPoint(target) {
  const cell = target.closest(".grid-cell");
  if (!cell) return null;
  return {
    row: Number(cell.dataset.row),
    column: Number(cell.dataset.column)
  };
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
    const point = getCellPoint(event.target);
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
    dom.canvas.releasePointerCapture(event.pointerId);
    dom.canvasMessage.textContent = `${areaName} area updated.`;
    render();
  });

  dom.canvas.addEventListener("pointercancel", () => {
    state.dragStart = null;
    state.dragCurrent = null;
    renderCanvas();
  });
}
```

Then update the boot sequence at the bottom to:

```js
bindCanvasDrag();
bindControls();
render();
```

- [ ] **Step 3: Add delete and rename behavior**

Replace `renderAreaList()` with a version that includes rename and delete controls:

```js
function renameArea(oldName, newName) {
  const clean = normalizeAreaName(newName);
  if (clean === oldName) return;
  state.cells = state.cells.map((row) => row.map((value) => value === oldName ? clean : value));
  state.areas[clean] = state.areas[oldName] || { color: state.activeColor };
  delete state.areas[oldName];
  if (state.activeArea === oldName) state.activeArea = clean;
}

function deleteArea(areaName) {
  state.cells = state.cells.map((row) => row.map((value) => value === areaName ? "." : value));
  delete state.areas[areaName];
  if (state.activeArea === areaName) {
    state.activeArea = "content";
    state.activeColor = "#2a9d8f";
  }
}

function renderAreaList() {
  const names = getAreaNames(state.cells);
  dom.areaList.innerHTML = names.length ? "" : '<p class="hint">아직 영역이 없습니다.</p>';
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
```

- [ ] **Step 4: Add editable area list CSS**

Append to `styles.css`:

```css
.area-item.editable {
  grid-template-columns: 18px minmax(0, 1fr) auto auto;
}

.area-rename {
  min-width: 0;
  height: 32px;
  padding: 5px 7px;
}
```

- [ ] **Step 5: Verify drag and area editing**

Open `index.html`. Expected:

- Dragging across cells previews an outline and commits the active area.
- Dragging over existing areas replaces those cells.
- Renaming an area updates the canvas and generated code.
- Deleting an area changes its cells to empty `.`.

- [ ] **Step 6: Commit**

Run:

```powershell
git -c safe.directory=C:/Users/hjw/Documents/codex-workspace/grid-layout-builder add app.js styles.css
git -c safe.directory=C:/Users/hjw/Documents/codex-workspace/grid-layout-builder commit -m "feat: add drag area editing"
```

---

### Task 5: Editable Template Areas And Copy Actions

**Files:**
- Modify: `app.js`

- [ ] **Step 1: Add apply and copy helpers**

Append this code before the boot sequence in `app.js`:

```js
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
```

Update the boot sequence to:

```js
bindCanvasDrag();
bindControls();
bindCodePanel();
render();
```

- [ ] **Step 2: Add dashboard preset behavior**

Add this event handler inside `bindControls()`:

```js
document.querySelector("#preset-dashboard").addEventListener("click", () => {
  state.rows = 4;
  state.columns = 4;
  state.gap = 16;
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
  render();
});
```

- [ ] **Step 3: Verify direct text editing**

Open `index.html`, replace the textarea with:

```text
"top top top"
"side main main"
"foot foot foot"
```

Click `Apply Areas`.

Expected: canvas becomes 3 columns by 3 rows and generated CSS includes `top`, `side`, `main`, and `foot`.

- [ ] **Step 4: Verify invalid text editing**

Replace the textarea with:

```text
"a a"
"a ."
```

Click `Apply Areas`.

Expected: canvas remains unchanged and an inline error says `"a" must form one rectangle.`

- [ ] **Step 5: Verify copy buttons**

Click each copy button. Expected: status message updates for areas, CSS, and HTML. If browser permissions block clipboard, fallback still attempts copy without crashing.

- [ ] **Step 6: Commit**

Run:

```powershell
git -c safe.directory=C:/Users/hjw/Documents/codex-workspace/grid-layout-builder add app.js
git -c safe.directory=C:/Users/hjw/Documents/codex-workspace/grid-layout-builder commit -m "feat: support template editing and export"
```

---

### Task 6: Final Polish And Verification

**Files:**
- Modify: `styles.css`
- Modify: `README.md`

- [ ] **Step 1: Improve mobile and dense states**

Append to `styles.css`:

```css
@media (max-width: 420px) {
  .panel { padding: 10px; }
  .topbar-actions, .button-row { width: 100%; }
  .button { flex: 1 1 140px; }
  .area-item.editable { grid-template-columns: 18px minmax(0, 1fr); }
  .area-item.editable .mini-button { width: 100%; }
}
```

- [ ] **Step 2: Add README manual test notes**

Append to `README.md`:

```markdown
## Manual Verification

1. Open `index.html`.
2. Drag across the canvas to create a named area.
3. Rename and delete an area from the area list.
4. Change rows, columns, and gap.
5. Apply valid `grid-template-areas` text.
6. Apply invalid non-rectangular text and confirm the current layout remains unchanged.
7. Copy CSS and HTML.
```

- [ ] **Step 3: Run static file checks**

Run:

```powershell
Get-ChildItem index.html, styles.css, app.js, README.md
```

Expected: all files exist.

Run:

```powershell
Select-String -Path app.js -Pattern "console.assert|debug marker|unfinished marker"
```

Expected: no matches.

- [ ] **Step 4: Run manual browser verification**

Open `index.html` and complete the README manual verification list. Confirm:

- No visible text overlaps at desktop width.
- Panels stack on narrow widths.
- Drag selection works with mouse or trackpad.
- Generated CSS remains valid after edits.

- [ ] **Step 5: Commit**

Run:

```powershell
git -c safe.directory=C:/Users/hjw/Documents/codex-workspace/grid-layout-builder add styles.css README.md
git -c safe.directory=C:/Users/hjw/Documents/codex-workspace/grid-layout-builder commit -m "docs: add grid builder verification notes"
```

---

## Self-Review

- Spec coverage: drag selection is Task 4; generated CSS/HTML is Tasks 2 and 5; editable `grid-template-areas` is Task 5; controls and area list are Tasks 3 and 4; responsive layout is Tasks 1 and 6.
- Placeholder scan: this plan contains no unfinished implementation markers. Every code step includes concrete code and expected verification.
- Type consistency: state uses `rows`, `columns`, `gap`, `cells`, `areas`, `activeArea`, `activeColor`, `dragStart`, and `dragCurrent` consistently across all tasks.
