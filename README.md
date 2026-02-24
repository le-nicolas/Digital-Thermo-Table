# ThermoLookup

ThermoLookup is a thermodynamic property interpolation tool for mechanical engineering students.


<img width="1872" height="888" alt="Screenshot 2026-02-24 210313" src="https://github.com/user-attachments/assets/b95361d4-d773-408e-94cc-a34a26faf4a7" />


<img width="1228" height="910" alt="Screenshot 2026-02-24 212419" src="https://github.com/user-attachments/assets/781b4251-ff5a-4106-8303-1a8a20d2eab6" />


## What it does

- Loads normalized tables from `data/thermo_tables.json`
- Supports table-driven lookup:
  - Saturated tables by temperature (`sat-T`)
  - Saturated tables by pressure (`sat-P`)
  - 2D tables by temperature + pressure (`PT`)
- Supports workflow solvers (new):
  - `Phase Determination` from `T` and `P` using saturation checks
  - `Two-Phase Mixture` using quality `x` (or back-calculating `x` from a known property)
  - `Isentropic Turbine / Compressor` with reverse lookup (`P + s`) and efficiency correction
  - `Property Differences` (`Delta h`, `Delta s`, `Delta u`, `Delta v`) between two states
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


## License

MIT (`LICENSE`).
