# ThermoLookup

ThermoLookup is a thermodynamic property interpolation tool for mechanical engineering students.

This version is rebuilt to use your bundled workbook data directly. Users do **not** upload any file.

## What it does

- Loads normalized tables from `data/thermo_tables.json`
- Supports:
  - Saturated tables by temperature (`sat-T`)
  - Saturated tables by pressure (`sat-P`)
  - 2D tables by temperature + pressure (`PT`)
- Computes interpolated properties and shows calculation steps
- Works as a static web app

## Data flow

Source workbook:
- `Themodynamic and Transport Properties.xlsm`

Build pipeline:
1. `scripts/build_dataset.py` parses the workbook
2. Outputs `data/thermo_tables.json`
3. Frontend (`index.html`, `styles.css`, `app.js`) consumes JSON directly

## Quick start

1. Clone:
   ```bash
   git clone https://github.com/le-nicolas/thermo-lookup.git
   cd thermo-lookup
   ```
2. Install Python dependency (for dataset rebuild):
   ```bash
   pip install -r requirements.txt
   ```
3. Run a local server:
   ```bash
   python -m http.server 8080
   ```
4. Open:
   - `http://localhost:8080/index.html`

## Rebuild dataset (after workbook changes)

```bash
python scripts/build_dataset.py
```

Optional explicit paths:
```bash
python scripts/build_dataset.py --input "Themodynamic and Transport Properties.xlsm" --output data/thermo_tables.json
```

## Project structure

```text
thermo-lookup/
  index.html
  styles.css
  app.js
  thermo-lookup.html
  Themodynamic and Transport Properties.xlsm
  data/
    thermo_tables.json
  scripts/
    build_dataset.py
  README.md
  LICENSE
```

## SaaS-ready direction

Next product steps:
- authenticated user accounts
- saved queries and favorite tables
- API endpoints for interpolation
- classroom/team workspaces
- paid plans for advanced datasets and exports

## License

MIT (`LICENSE`).
