# Digital Thermo Table

Digital Thermo Table is a browser-based thermodynamic and psychrometric property tool for mechanical engineering students.

<img width="1919" height="990" alt="image" src="https://github.com/user-attachments/assets/ee15ac62-ad32-4f9e-91ba-4e408b55da41" />

## What it does

- Loads normalized tables from `data/thermo_tables.json`
- Supports table-driven lookup:
  - Saturated tables by temperature (`sat-T`)
  - Saturated tables by pressure (`sat-P`)
  - 2D tables by temperature + pressure (`PT`)
- Automatically returns the saturation pair during saturated lookups:
  - Input `T` also returns `Psat`
  - Input `P` also returns `Tsat`
- Supports workflow solvers:
  - `Phase Determination` from `T` and `P` using saturation checks
  - `Two-Phase Mixture` using quality `x` (or back-calculating `x` from a known property)
  - `Reverse Lookup` from `P + h` or `P + s` to infer `T`, phase, and quality where applicable
  - `Guided State Identification` that recommends which table family to use next
  - `Isentropic Turbine / Compressor` with reverse lookup (`P + s`) and efficiency correction
  - `Property Differences` (`Delta h`, `Delta s`, `Delta u`, `Delta v`) between two states
- Includes cycle plotting with configurable inputs, iterative unknown solving, and sanity-check warnings
- Includes an interactive `Psychrometric Chart` tab:
  - Solve moist-air states from `dry-bulb + RH`, `W`, `wet-bulb`, `dew point`, or `enthalpy`
  - Live hover preview on the chart so values update continuously as the mouse moves
  - Click the chart to lock a state and read all calculated properties
  - Add multiple states to a visible psychrometric process path
  - Keeps the provided `ASHRAE-PSYCHROMETRIC-CHART.pdf` embedded on-screen as a flashing reference panel
- Computes interpolated properties and shows calculation steps
- Works as a static web app

## Data Flow

Source workbook:
- `Themodynamic and Transport Properties.xlsm`

Build pipeline:
1. `scripts/build_dataset.py` parses the workbook
2. Outputs `data/thermo_tables.json`
3. Frontend (`index.html`, `styles.css`, `app.js`) consumes JSON directly
4. Psychrometric calculations are handled directly in the frontend and do not require the thermodynamic dataset

## Quick Start

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

Tabs available in the app:
- `Property Lookup`
- `Problem Workflows`
- `Query History`
- `Compare`
- `Cycle Plotter`
- `Psychrometric Chart`

## Rebuild Dataset

```bash
python scripts/build_dataset.py
```

Optional explicit paths:
```bash
python scripts/build_dataset.py --input "Themodynamic and Transport Properties.xlsm" --output data/thermo_tables.json
```

## Project Structure

```text
digital-thermo-table/
  index.html
  styles.css
  app.js
  Themodynamic and Transport Properties.xlsm
  assets/
    ASHRAE-PSYCHROMETRIC-CHART.pdf
  data/
    thermo_tables.json
  scripts/
    build_dataset.py
  README.md
  LICENSE
```

## License

MIT (`LICENSE`).
