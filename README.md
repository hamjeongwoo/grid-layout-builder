# grid-layout-builder

A dependency-free CSS Grid layout builder. Open `index.html` in a browser, drag across cells to create named grid areas, and copy the generated CSS or HTML.

This project was created end-to-end by AI, from initial design through implementation.

## Features

- Drag-select rectangular CSS Grid areas
- Edit rows, columns, gap, column widths, row heights, area name, and area color
- Rename or delete existing areas
- Optionally include or edit `grid-template-areas` text and apply it back to the canvas
- Copy generated CSS and HTML

## Manual Verification

1. Open `index.html`.
2. Drag across the canvas to create a named area.
3. Rename and delete an area from the area list.
4. Change rows, columns, and gap.
5. Change column widths and row heights with CSS track syntax such as `240px 1fr 2fr`.
6. Toggle optional `grid-template-areas` output.
7. Apply valid `grid-template-areas` text.
8. Apply invalid non-rectangular text and confirm the current layout remains unchanged.
9. Copy CSS and HTML.
