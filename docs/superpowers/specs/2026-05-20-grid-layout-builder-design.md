# CSS Grid Layout Builder Design

## Goal

Build a single-page CSS Grid layout builder that lets users create layouts visually with drag selection while always showing the generated CSS Grid syntax. The first version should be useful without a backend, framework setup, or account system.

## User Experience

The app opens directly into the builder workspace. It uses a three-column layout on desktop and stacks panels on smaller screens:

- Left panel: grid controls, area list, and basic presets.
- Center canvas: interactive grid cells where users drag to create or update layout areas.
- Right panel: generated CSS and export controls.

Users can set row count, column count, gap size, and cell preview size. They can drag across cells to select a rectangular region, name that region, and see it appear as a CSS Grid area. Existing areas can be selected, renamed, recolored, deleted, and replaced by dragging a new rectangular region. Advanced users can edit `grid-template-areas` text directly and apply it back to the visual canvas.

## Core Interactions

The canvas is a visible grid of cells. Pointer drag starts on a cell, previews the rectangular selection while dragging, and commits the selected rectangle on release. The first version supports rectangular areas only because CSS Grid named areas must form rectangles to be valid.

When a selection overlaps existing areas, the app should either replace those cells with the active area or ask the user to confirm through a lightweight inline state. For the first version, replacement is acceptable as long as the UI makes the result obvious before export.

Area names are normalized for CSS compatibility: lowercase letters, numbers, underscores, and hyphens. Empty cells are emitted as `.` in `grid-template-areas`.

## CSS Output

The generated CSS includes:

```css
.layout {
  display: grid;
  grid-template-columns: repeat(N, 1fr);
  grid-template-rows: repeat(N, 1fr);
  grid-template-areas:
    "...";
  gap: 16px;
}
```

Each named area also receives a class mapping:

```css
.header {
  grid-area: header;
}
```

The app should also provide a minimal HTML export with child elements using the generated area class names. The CSS panel includes an editable `grid-template-areas` field, an apply button, a generated full CSS block, and copy buttons.

## Components

- `GridState`: stores rows, columns, gap, cells, and area metadata.
- `ToolbarPanel`: controls dimensions, gap, reset, and presets.
- `GridCanvas`: handles pointer drag, selection preview, area selection, and visual rendering.
- `AreaList`: lists existing areas and supports rename, color edit, delete, and active area selection.
- `CodePanel`: shows editable `grid-template-areas`, generated CSS, HTML export, apply action, and copy buttons.
- `PreviewRenderer`: renders a live CSS Grid preview from the current state.

## Data Model

The source of truth is a 2D matrix of area names or empty cells:

```js
{
  rows: 3,
  columns: 4,
  gap: 16,
  cells: [
    ["header", "header", "header", "header"],
    ["sidebar", "content", "content", "content"],
    ["footer", "footer", "footer", "footer"]
  ],
  areas: {
    header: { color: "#3167d4" }
  }
}
```

Generated CSS is derived from this state, not manually stored. When users edit `grid-template-areas`, the app parses that text into the same matrix shape and updates the visual canvas if the text is valid.

## Validation And Errors

The builder should prevent invalid CSS area output:

- Area names must be CSS-safe.
- A named area must form a rectangle.
- Empty cells are allowed.
- Row and column counts should be capped to keep the UI usable.
- Edited `grid-template-areas` text must have the same number of tokens on every row.

If a user action creates a non-rectangular area, the app should either split the action into a rectangular replacement or show a clear validation message and keep the previous valid state.

If direct text editing fails validation, the app keeps the current canvas state and shows an inline error near the editable field.

## Testing

Manual verification should cover:

- Creating an area by dragging across cells.
- Replacing cells with another area.
- Renaming and deleting an area.
- Changing row, column, and gap values.
- Copying generated CSS and HTML.
- Applying valid and invalid `grid-template-areas` text.
- Responsive layout on desktop and mobile widths.

For automated checks, pure functions that generate CSS and validate rectangular areas should be tested independently if a test runner is introduced.

## Initial Implementation Scope

The first version will be a static HTML/CSS/JavaScript app:

- No backend.
- No build step required.
- No external dependency required.
- The app can be opened directly in a browser.

This keeps the first deliverable small and usable while leaving room to migrate to a framework later if needed.
