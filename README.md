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
  - Switch between `ASHRAE Page 1` Imperial units and `ASHRAE Page 2` SI units
  - Uses bundled ASHRAE chart images as the visual background instead of a generic custom redraw
  - Live hover preview on the chart so values update continuously as the mouse moves
  - Click the chart to lock a state and read all calculated properties
  - Add multiple states to a visible psychrometric process path
  - Shows an explicit accuracy note so the overlay is treated as chart-guided, not exact ASHRAE digitization
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

5. Run the psychrometric validation harness:
   ```bash
   node scripts/validate_psychrometrics.js
   ```

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

## Psychrometric Validation

The psychrometric solver is validated in two layers:

- `scripts/psychrometric_benchmarks.json` defines internal benchmarks, official ASHRAE worked examples in both SI and IP units, and edge-region checks near saturation, low humidity, and hot/humid limits.
- `scripts/validate_psychrometrics.js` runs those cases with the same equations used by the frontend and reports pass/fail.

Official benchmark sources used in the harness:

- ASHRAE Handbook Fundamentals 2021 SI, Chapter 1 Psychrometrics
- ASHRAE Handbook Fundamentals 2017 IP, Chapter 1 Psychrometrics

This validates the equation-based solver directly. The interactive chart overlay is still an image-calibrated reading aid, so cursor placement should be treated as approximate alignment to the printed chart rather than a formal digital reproduction.

## Project Structure

```text
digital-thermo-table/
  index.html
  styles.css
  app.js
  Themodynamic and Transport Properties.xlsm
  assets/
    Imperial.png
    SI.png
  data/
    thermo_tables.json
  scripts/
    build_dataset.py
    psychrometric_benchmarks.json
    validate_psychrometrics.js
  README.md
  LICENSE
```

## License

MIT (`LICENSE`).
