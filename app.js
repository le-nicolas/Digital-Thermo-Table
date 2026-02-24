const MODE_LABELS = {
  "sat-T": "Saturated (T input)",
  "sat-P": "Saturated (P input)",
  PT: "2D Table (T + P)",
};

const PROPERTY_META = {
  vf: { symbol: "vf", name: "Sat. liquid specific volume" },
  vfg: { symbol: "vfg", name: "Evaporation specific volume" },
  vg: { symbol: "vg", name: "Sat. vapor specific volume" },
  uf: { symbol: "uf", name: "Sat. liquid internal energy" },
  ufg: { symbol: "ufg", name: "Evaporation internal energy" },
  ug: { symbol: "ug", name: "Sat. vapor internal energy" },
  hf: { symbol: "hf", name: "Sat. liquid enthalpy" },
  hfg: { symbol: "hfg", name: "Evaporation enthalpy" },
  hg: { symbol: "hg", name: "Sat. vapor enthalpy" },
  sf: { symbol: "sf", name: "Sat. liquid entropy" },
  sfg: { symbol: "sfg", name: "Evaporation entropy" },
  sg: { symbol: "sg", name: "Sat. vapor entropy" },
  v: { symbol: "v", name: "Specific volume" },
  u: { symbol: "u", name: "Internal energy" },
  h: { symbol: "h", name: "Enthalpy" },
  s: { symbol: "s", name: "Entropy" },
  P: { symbol: "P", name: "Pressure" },
  T: { symbol: "T", name: "Temperature" },
};

const PROPERTY_ORDER = [
  "P",
  "T",
  "vf",
  "vfg",
  "vg",
  "uf",
  "ufg",
  "ug",
  "hf",
  "hfg",
  "hg",
  "sf",
  "sfg",
  "sg",
  "v",
  "u",
  "h",
  "s",
];

const state = {
  dataset: null,
  tables: [],
  filteredTables: [],
  selectedTableId: null,
};

const el = {
  datasetMeta: document.getElementById("datasetMeta"),
  tableSearch: document.getElementById("tableSearch"),
  tableSelect: document.getElementById("tableSelect"),
  tableMeta: document.getElementById("tableMeta"),
  queryForm: document.getElementById("queryForm"),
  queryFields: document.getElementById("queryFields"),
  queryBtn: document.getElementById("queryBtn"),
  statusText: document.getElementById("statusText"),
  resultGrid: document.getElementById("resultGrid"),
  stepsList: document.getElementById("stepsList"),
};

function setStatus(message, kind = "") {
  el.statusText.textContent = message;
  el.statusText.className = "status";
  if (kind) {
    el.statusText.classList.add(kind);
  }
}

function formatNumber(value) {
  if (!Number.isFinite(value)) {
    return "—";
  }
  const abs = Math.abs(value);
  if ((abs !== 0 && abs < 1e-3) || abs >= 1e5) {
    return value.toExponential(5);
  }
  return value.toFixed(6).replace(/\.?0+$/, "");
}

function getSelectedTable() {
  return state.tables.find((table) => table.id === state.selectedTableId) || null;
}

function sortedProperties(properties) {
  return [...properties].sort((a, b) => {
    const ai = PROPERTY_ORDER.indexOf(a);
    const bi = PROPERTY_ORDER.indexOf(b);
    const av = ai === -1 ? 999 : ai;
    const bv = bi === -1 ? 999 : bi;
    if (av !== bv) {
      return av - bv;
    }
    return a.localeCompare(b);
  });
}

function clearResults() {
  el.resultGrid.innerHTML = "";
  el.stepsList.innerHTML = "";
}

function renderSteps(stepLines) {
  el.stepsList.innerHTML = "";
  stepLines.forEach((line) => {
    const item = document.createElement("li");
    item.textContent = line;
    el.stepsList.appendChild(item);
  });
}

function renderResults(table, results, steps, inputLabel) {
  clearResults();
  const keys = sortedProperties(Object.keys(results));
  keys.forEach((key) => {
    const meta = PROPERTY_META[key] || { symbol: key, name: key };
    const card = document.createElement("article");
    card.className = "result-card";
    card.innerHTML = `
      <p class="prop">${meta.symbol}</p>
      <p class="value">${formatNumber(results[key])}</p>
      <p class="desc">${meta.name}</p>
    `;
    el.resultGrid.appendChild(card);
  });
  renderSteps(steps);
  setStatus(
    `Interpolated ${keys.length} properties from "${table.sheet_name}" using ${inputLabel}.`,
    "ok",
  );
}

function setLoadingState(isLoading) {
  el.queryBtn.disabled = isLoading;
  el.tableSelect.disabled = isLoading;
  el.tableSearch.disabled = isLoading;
}

function tableLabel(table) {
  return `${table.sheet_name} | ${MODE_LABELS[table.mode]} | ${table.unit_system}`;
}

function renderTableMeta(table) {
  const mode = MODE_LABELS[table.mode] || table.mode;
  const props = sortedProperties(table.properties).join(", ");
  const inputRanges = Object.entries(table.inputs || {})
    .map(([key, range]) => `${key}: ${formatNumber(range.min)} to ${formatNumber(range.max)}`)
    .join(" | ");

  el.tableMeta.innerHTML = `
    Fluid: ${table.fluid}<br/>
    Mode: ${mode}<br/>
    Unit system: ${table.unit_system}<br/>
    Rows: ${table.row_count}<br/>
    Available props: ${props}<br/>
    Input range: ${inputRanges}
  `;
}

function queryKeysForMode(mode) {
  if (mode === "PT") {
    return ["T", "P"];
  }
  if (mode === "sat-T") {
    return ["T"];
  }
  return ["P"];
}

function renderQueryFields(table) {
  el.queryFields.innerHTML = "";
  const keys = queryKeysForMode(table.mode);
  keys.forEach((key) => {
    const wrap = document.createElement("div");
    const range = table.inputs[key];
    const label = `${key} (${formatNumber(range.min)} to ${formatNumber(range.max)})`;
    wrap.innerHTML = `
      <label for="input_${key}">${label}</label>
      <input id="input_${key}" type="number" step="any" placeholder="Enter ${key}" />
    `;
    el.queryFields.appendChild(wrap);
  });
}

function updateSelectedTable(nextId) {
  const existing = state.filteredTables.some((table) => table.id === nextId);
  const fallback = state.filteredTables[0]?.id || null;
  state.selectedTableId = existing ? nextId : fallback;

  el.tableSelect.value = state.selectedTableId || "";
  clearResults();

  const table = getSelectedTable();
  if (!table) {
    el.tableMeta.textContent = "No table matches your search.";
    setStatus("No tables available for this search.", "error");
    return;
  }

  renderTableMeta(table);
  renderQueryFields(table);
  setStatus("Enter values and click Interpolate.");
}

function renderTableOptions(preserveId = null) {
  el.tableSelect.innerHTML = "";
  if (state.filteredTables.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "No tables found";
    el.tableSelect.appendChild(option);
    updateSelectedTable(null);
    return;
  }

  state.filteredTables.forEach((table) => {
    const option = document.createElement("option");
    option.value = table.id;
    option.textContent = tableLabel(table);
    el.tableSelect.appendChild(option);
  });

  updateSelectedTable(preserveId);
}

function applyTableFilter() {
  const query = el.tableSearch.value.trim().toLowerCase();
  const previousId = state.selectedTableId;
  state.filteredTables = state.tables.filter((table) => {
    if (!query) {
      return true;
    }
    return (
      table.sheet_name.toLowerCase().includes(query) ||
      table.fluid.toLowerCase().includes(query) ||
      table.mode.toLowerCase().includes(query) ||
      table.unit_system.toLowerCase().includes(query)
    );
  });
  renderTableOptions(previousId);
}

function toFiniteNumber(value, label) {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    throw new Error(`Please provide a valid numeric value for ${label}.`);
  }
  return num;
}

function findBracket(sortedRows, key, target) {
  const first = sortedRows[0][key];
  const last = sortedRows[sortedRows.length - 1][key];
  if (target < first || target > last) {
    throw new Error(`${key} = ${target} is outside range ${formatNumber(first)} to ${formatNumber(last)}.`);
  }

  for (let i = 0; i < sortedRows.length; i += 1) {
    const current = sortedRows[i][key];
    if (Math.abs(current - target) < 1e-9) {
      return { exact: sortedRows[i] };
    }
  }

  for (let i = 0; i < sortedRows.length - 1; i += 1) {
    const x1 = sortedRows[i][key];
    const x2 = sortedRows[i + 1][key];
    if (x1 <= target && target <= x2) {
      return { low: sortedRows[i], high: sortedRows[i + 1] };
    }
  }

  throw new Error(`Could not find interpolation bracket for ${key} = ${target}.`);
}

function interpolate1D(rows, key, target, props) {
  const sortedRows = [...rows]
    .filter((row) => Number.isFinite(row[key]))
    .sort((a, b) => a[key] - b[key]);

  if (sortedRows.length < 2) {
    throw new Error(`Not enough rows to interpolate on ${key}.`);
  }

  const bracket = findBracket(sortedRows, key, target);
  const steps = [];
  const values = {};

  if (bracket.exact) {
    props.forEach((prop) => {
      if (Number.isFinite(bracket.exact[prop])) {
        values[prop] = bracket.exact[prop];
      }
    });
    steps.push(`Exact row match at ${key} = ${formatNumber(target)}. No interpolation needed.`);
    return { values, steps };
  }

  const { low, high } = bracket;
  const x1 = low[key];
  const x2 = high[key];
  const alpha = (target - x1) / (x2 - x1);
  steps.push(`Bracket on ${key}: ${formatNumber(x1)} to ${formatNumber(x2)}.`);
  steps.push(`Interpolation factor alpha = (${formatNumber(target)} - ${formatNumber(x1)}) / (${formatNumber(x2)} - ${formatNumber(x1)}) = ${formatNumber(alpha)}.`);

  props.forEach((prop) => {
    const y1 = low[prop];
    const y2 = high[prop];
    if (Number.isFinite(y1) && Number.isFinite(y2)) {
      values[prop] = y1 + alpha * (y2 - y1);
      steps.push(
        `${prop}: ${formatNumber(y1)} + ${formatNumber(alpha)} * (${formatNumber(y2)} - ${formatNumber(y1)}) = ${formatNumber(values[prop])}.`,
      );
    }
  });

  return { values, steps };
}

function interpolatePT(table, tInput, pInput) {
  const props = sortedProperties(table.properties);
  const pressureValues = [...new Set(table.rows.map((row) => row.P))]
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b);

  if (pressureValues.length < 2) {
    throw new Error("Table needs at least two pressure levels for 2D interpolation.");
  }

  const pMin = pressureValues[0];
  const pMax = pressureValues[pressureValues.length - 1];
  if (pInput < pMin || pInput > pMax) {
    throw new Error(`P = ${pInput} is outside range ${formatNumber(pMin)} to ${formatNumber(pMax)}.`);
  }

  const exactPressure = pressureValues.find((p) => Math.abs(p - pInput) < 1e-9);
  const steps = [];

  if (Number.isFinite(exactPressure)) {
    const subset = table.rows.filter((row) => Math.abs(row.P - exactPressure) < 1e-9);
    const oneD = interpolate1D(subset, "T", tInput, props);
    steps.push(`Exact pressure match at P = ${formatNumber(exactPressure)}. Interpolating on T only.`);
    steps.push(...oneD.steps);
    return { values: oneD.values, steps };
  }

  let p1 = null;
  let p2 = null;
  for (let i = 0; i < pressureValues.length - 1; i += 1) {
    if (pressureValues[i] <= pInput && pInput <= pressureValues[i + 1]) {
      p1 = pressureValues[i];
      p2 = pressureValues[i + 1];
      break;
    }
  }

  if (!Number.isFinite(p1) || !Number.isFinite(p2)) {
    throw new Error(`Unable to find pressure bracket for P = ${pInput}.`);
  }

  const rowsAtP1 = table.rows.filter((row) => Math.abs(row.P - p1) < 1e-9);
  const rowsAtP2 = table.rows.filter((row) => Math.abs(row.P - p2) < 1e-9);
  const first = interpolate1D(rowsAtP1, "T", tInput, props);
  const second = interpolate1D(rowsAtP2, "T", tInput, props);

  const beta = (pInput - p1) / (p2 - p1);
  const values = {};
  steps.push(`Pressure bracket: ${formatNumber(p1)} to ${formatNumber(p2)}.`);
  steps.push(`At P = ${formatNumber(p1)}: ${first.steps[0]}`);
  steps.push(`At P = ${formatNumber(p2)}: ${second.steps[0]}`);
  steps.push(`Pressure factor beta = (${formatNumber(pInput)} - ${formatNumber(p1)}) / (${formatNumber(p2)} - ${formatNumber(p1)}) = ${formatNumber(beta)}.`);

  props.forEach((prop) => {
    const y1 = first.values[prop];
    const y2 = second.values[prop];
    if (Number.isFinite(y1) && Number.isFinite(y2)) {
      values[prop] = y1 + beta * (y2 - y1);
      steps.push(
        `${prop}: ${formatNumber(y1)} + ${formatNumber(beta)} * (${formatNumber(y2)} - ${formatNumber(y1)}) = ${formatNumber(values[prop])}.`,
      );
    }
  });

  return { values, steps };
}

function interpolateTable(table, inputs) {
  const props = sortedProperties(table.properties);
  if (table.mode === "PT") {
    return interpolatePT(table, inputs.T, inputs.P);
  }

  const indexKey = table.mode === "sat-T" ? "T" : "P";
  return interpolate1D(table.rows, indexKey, inputs[indexKey], props);
}

function handleQuery(event) {
  event.preventDefault();
  clearResults();

  const table = getSelectedTable();
  if (!table) {
    setStatus("Select a valid table first.", "error");
    return;
  }

  try {
    const requiredKeys = queryKeysForMode(table.mode);
    const inputs = {};
    requiredKeys.forEach((key) => {
      const element = document.getElementById(`input_${key}`);
      inputs[key] = toFiniteNumber(element?.value, key);
    });

    const { values, steps } = interpolateTable(table, inputs);
    if (Object.keys(values).length === 0) {
      throw new Error("No numeric result columns found for this query.");
    }

    const inputLabel = requiredKeys.map((key) => `${key}=${formatNumber(inputs[key])}`).join(", ");
    renderResults(table, values, steps, inputLabel);
  } catch (error) {
    setStatus(error.message, "error");
    renderSteps([error.message]);
  }
}

async function loadDataset() {
  setLoadingState(true);
  setStatus("Loading dataset...");

  try {
    const response = await fetch("data/thermo_tables.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Dataset request failed (${response.status}).`);
    }

    const dataset = await response.json();
    state.dataset = dataset;
    state.tables = dataset.tables || [];
    state.filteredTables = [...state.tables];

    el.datasetMeta.textContent = `${dataset.table_count} tables loaded`;
    renderTableOptions();
    setStatus("Dataset loaded. Enter values and run interpolation.");
  } catch (error) {
    const message = `Could not load dataset. Serve this project with a local web server (example: python -m http.server 8080). ${error.message}`;
    el.datasetMeta.textContent = "Dataset unavailable";
    setStatus(message, "error");
  } finally {
    setLoadingState(false);
  }
}

function wireEvents() {
  el.tableSearch.addEventListener("input", applyTableFilter);
  el.tableSelect.addEventListener("change", () => {
    updateSelectedTable(el.tableSelect.value);
  });
  el.queryForm.addEventListener("submit", handleQuery);
}

function init() {
  wireEvents();
  loadDataset();
}

init();
