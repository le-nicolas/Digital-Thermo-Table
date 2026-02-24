# ThermoLookup

ThermoLookup is a thermodynamic property interpolation tool for mechanical engineering students.


<img width="1919" height="990" alt="image" src="https://github.com/user-attachments/assets/ee15ac62-ad32-4f9e-91ba-4e408b55da41" />



## What it does

- Loads normalized tables from `data/thermo_tables.json`
- Supports table-driven lookup:
  - Saturated tables by temperature (`sat-T`)
  - Saturated tables by pressure (`sat-P`)
  - 2D tables by temperature + pressure (`PT`)
- Supports workflow solvers (new):
  - `Phase Determination` from `T` and `P` using saturation checks
  - `Two-Phase Mixture` using quality `x` (or back-calculating `x` from a known property)
  - `Reverse Lookup` from `P + h` or `P + s` to infer `T`, phase, and quality where applicable
  - `Guided State Identification` that recommends which table family to use next
  - `Isentropic Turbine / Compressor` with reverse lookup (`P + s`) and efficiency correction
  - `Property Differences` (`Delta h`, `Delta s`, `Delta u`, `Delta v`) between two states
- Adds sanity warnings for common mistakes (for example `x` outside `0..1`, non-physical pressure, and suspicious irreversible-process trends)
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
