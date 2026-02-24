# ThermoLookup

A lightweight thermodynamic property lookup tool for mechanical engineering students, built with an SaaS-ready direction.

ThermoLookup lets you load your own Excel tables (`.xlsx`, `.xls`, `.xlsm`, `.csv`), map columns, and query interpolated values with full working steps shown.

## Why This Exists

Most students waste time manually searching steam/air/refrigerant tables and repeating interpolation by hand.

This project focuses on:
- faster property lookup during study/problem-solving
- transparent interpolation steps (so you still learn the method)
- support for your own class/lab data files

## Current Features

- Drag-and-drop Excel/CSV table loading
- Multi-sheet dataset support
- Auto-detection for common thermo table formats
- Configurable table types:
  - Saturated by temperature (`sat-T`)
  - Saturated by pressure (`sat-P`)
  - Superheated (`T + P`)
  - Ideal gas (`T`-based)
  - Subcooled/compressed liquid (`T + P`)
- 1D linear interpolation
- 2D (bilinear-style) interpolation for `T + P`
- Calculation steps/work panel for learning + verification
- Fully client-side (works offline; data stays local)

## Tech Stack

- Single-page HTML/CSS/JavaScript app
- [SheetJS](https://github.com/SheetJS/sheetjs) (`xlsx`) for Excel parsing in browser

## Quick Start

1. Clone the repo:
   ```bash
   git clone <your-repo-url>
   cd thermo-lookup
   ```
2. Open `thermo-lookup.html` in your browser.
3. Drag your Excel file into the app.
4. Configure sheet type/columns and start querying.

Optional local server (recommended for consistent browser behavior):
```bash
python -m http.server 8080
```
Then open `http://localhost:8080/thermo-lookup.html`.

## Included Data

This repo currently includes:
- `Themodynamic and Transport Properties.xlsm`

You can replace this with your own class/lab/property datasets.

## SaaS Direction (Roadmap)

Planned evolution from utility to SaaS:
- user accounts + saved table configurations
- cloud-hosted curated property datasets
- team/class workspaces
- shareable query links and reports
- API access for integration into calculators and simulation tools

## Project Structure

```text
thermo-lookup/
  thermo-lookup.html
  Themodynamic and Transport Properties.xlsm
  README.md
```

## Contributions

Contributions are welcome, especially from mechanical engineering students who want:
- better UX for exam/lab workflows
- more property table templates
- validation tests against textbook/reference data

## License

No license has been added yet. Add one (for example, MIT) before public open-source distribution.
