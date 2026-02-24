"use strict";

const MODE_LABELS = {
  "sat-T": "Saturated (T input)",
  "sat-P": "Saturated (P input)",
  PT: "Superheated / PT (T + P)",
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

const CYCLE_TEMPLATES = [
  { id: "rankine-ideal", label: "Ideal Rankine", type: "rankine" },
  { id: "rankine-reheat", label: "Rankine with Reheat", type: "rankine" },
  { id: "vcr", label: "Vapor Compression Refrigeration", type: "refrigeration" },
  { id: "brayton", label: "Brayton", type: "brayton" },
  { id: "steam-loop", label: "Simple Steam Loop", type: "rankine" },
];

const CYCLE_INPUT_SCHEMAS = {
  "rankine-ideal": [
    { key: "pLow", label: "Condenser pressure P_low", defaultValue: 10, step: "any" },
    { key: "pHigh", label: "Boiler pressure P_high", defaultValue: 8000, step: "any" },
    { key: "t3", label: "Turbine inlet temperature T3", defaultValue: 480, step: "any" },
    { key: "etaT", label: "Turbine efficiency eta_t", defaultValue: 1, step: "any" },
    { key: "etaP", label: "Pump efficiency eta_p", defaultValue: 1, step: "any" },
  ],
  "rankine-reheat": [
    { key: "pLow", label: "Condenser pressure P_low", defaultValue: 10, step: "any" },
    { key: "pMid", label: "Reheat pressure P_mid", defaultValue: 2500, step: "any" },
    { key: "pHigh", label: "Boiler pressure P_high", defaultValue: 12000, step: "any" },
    { key: "t3", label: "HP turbine inlet temperature T3", defaultValue: 520, step: "any" },
    { key: "t5", label: "Reheat temperature T5", defaultValue: 520, step: "any" },
    { key: "etaTHP", label: "HP turbine efficiency", defaultValue: 1, step: "any" },
    { key: "etaTLP", label: "LP turbine efficiency", defaultValue: 1, step: "any" },
    { key: "etaP", label: "Pump efficiency eta_p", defaultValue: 1, step: "any" },
  ],
  vcr: [
    { key: "pLow", label: "Evaporator pressure P_low", defaultValue: 220, step: "any" },
    { key: "pHigh", label: "Condenser pressure P_high", defaultValue: 900, step: "any" },
    { key: "superheat", label: "Evaporator outlet superheat DeltaT", defaultValue: 0, step: "any" },
    { key: "etaC", label: "Compressor isentropic efficiency", defaultValue: 1, step: "any" },
  ],
  brayton: [
    { key: "pLow", label: "Compressor inlet pressure P_low", defaultValue: 100, step: "any" },
    { key: "pHigh", label: "Compressor outlet pressure P_high", defaultValue: 1000, step: "any" },
    { key: "t1", label: "Compressor inlet temperature T1", defaultValue: 300, step: "any" },
    { key: "t3", label: "Turbine inlet temperature T3", defaultValue: 950, step: "any" },
    { key: "etaC", label: "Compressor efficiency eta_c", defaultValue: 1, step: "any" },
    { key: "etaT", label: "Turbine efficiency eta_t", defaultValue: 1, step: "any" },
  ],
  "steam-loop": [
    { key: "pLow", label: "Low pressure P_low", defaultValue: 500, step: "any" },
    { key: "pHigh", label: "High pressure P_high", defaultValue: 5000, step: "any" },
    { key: "t3", label: "Heater outlet temperature T3", defaultValue: 420, step: "any" },
    { key: "etaT", label: "Expansion efficiency eta_t", defaultValue: 1, step: "any" },
    { key: "etaP", label: "Pump efficiency eta_p", defaultValue: 1, step: "any" },
  ],
};

const CYCLE_TARGET_METRICS = {
  "rankine-ideal": [
    { key: "wnet", label: "Net work", unit: "kJ/kg" },
    { key: "eta_th", label: "Thermal efficiency", unit: "-" },
    { key: "wt", label: "Turbine work", unit: "kJ/kg" },
    { key: "wp", label: "Pump work", unit: "kJ/kg" },
    { key: "qin", label: "Heat input", unit: "kJ/kg" },
    { key: "qout", label: "Heat rejected", unit: "kJ/kg" },
    { key: "bwr", label: "Back work ratio", unit: "-" },
    { key: "x4", label: "Turbine exit quality", unit: "-" },
  ],
  "rankine-reheat": [
    { key: "wnet", label: "Net work", unit: "kJ/kg" },
    { key: "eta_th", label: "Thermal efficiency", unit: "-" },
    { key: "wt", label: "Turbine work", unit: "kJ/kg" },
    { key: "wp", label: "Pump work", unit: "kJ/kg" },
    { key: "qin", label: "Heat input", unit: "kJ/kg" },
    { key: "qout", label: "Heat rejected", unit: "kJ/kg" },
    { key: "bwr", label: "Back work ratio", unit: "-" },
    { key: "x6", label: "LP turbine exit quality", unit: "-" },
  ],
  vcr: [
    { key: "cop", label: "COP", unit: "-" },
    { key: "qL", label: "Refrigerating effect", unit: "kJ/kg" },
    { key: "wcomp", label: "Compressor work", unit: "kJ/kg" },
    { key: "qH", label: "Heat rejected", unit: "kJ/kg" },
    { key: "x4", label: "Valve exit quality", unit: "-" },
  ],
  brayton: [
    { key: "wnet", label: "Net work", unit: "kJ/kg" },
    { key: "eta_th", label: "Thermal efficiency", unit: "-" },
    { key: "wt", label: "Turbine work", unit: "kJ/kg" },
    { key: "wcomp", label: "Compressor work", unit: "kJ/kg" },
    { key: "pressure_ratio", label: "Pressure ratio", unit: "-" },
  ],
  "steam-loop": [
    { key: "wnet", label: "Net specific work", unit: "kJ/kg" },
    { key: "eta_th", label: "Thermal efficiency", unit: "-" },
    { key: "wt", label: "Turbine-side work", unit: "kJ/kg" },
    { key: "wp", label: "Pump-side work", unit: "kJ/kg" },
    { key: "qin", label: "Heat input", unit: "kJ/kg" },
    { key: "qout", label: "Heat rejected", unit: "kJ/kg" },
    { key: "x4", label: "Expansion exit quality", unit: "-" },
  ],
};

const WORKFLOW_TYPES = [
  { id: "phase-check", label: "Phase Determination" },
  { id: "two-phase", label: "Two-Phase Mixture" },
  { id: "reverse-lookup", label: "Reverse Lookup (P+h / P+s)" },
  { id: "state-guide", label: "Guided State Identification" },
  { id: "isentropic-device", label: "Isentropic Turbine / Compressor" },
  { id: "property-delta", label: "Property Differences" },
];

const QUALITY_PROPERTY_MAP = {
  h: { f: "hf", fg: "hfg", g: "hg", label: "enthalpy" },
  s: { f: "sf", fg: "sfg", g: "sg", label: "entropy" },
  u: { f: "uf", fg: "ufg", g: "ug", label: "internal energy" },
  v: { f: "vf", fg: "vfg", g: "vg", label: "specific volume" },
};

const state = {
  dataset: null,
  tables: [],
  filteredTables: [],
  selectedTableId: null,
  queryHistory: [],
  querySeq: 1,
  activeTab: "lookup",
  workflow: {
    type: "phase-check",
  },
  cycle: {
    diagram: "Ts",
    templateId: "rankine-ideal",
    templateInputs: {},
    inverseInputs: {},
    templatePoints: [],
    manualPoints: [],
    metrics: [],
    warnings: [],
    workingFluid: null,
    domeVisible: true,
    isobarsVisible: false,
  },
};

const el = {
  datasetMeta: document.getElementById("datasetMeta"),
  tabButtons: [...document.querySelectorAll(".tab-btn")],
  tabPanels: [...document.querySelectorAll(".tab-panel")],

  fluidFilter: document.getElementById("fluidFilter"),
  modeFilter: document.getElementById("modeFilter"),
  tableSearch: document.getElementById("tableSearch"),
  tableSelect: document.getElementById("tableSelect"),
  tableMeta: document.getElementById("tableMeta"),
  queryForm: document.getElementById("queryForm"),
  queryFields: document.getElementById("queryFields"),
  validationMessage: document.getElementById("validationMessage"),
  queryBtn: document.getElementById("queryBtn"),
  statusText: document.getElementById("statusText"),
  resultGrid: document.getElementById("resultGrid"),
  stepsList: document.getElementById("stepsList"),

  workflowTypeSelect: document.getElementById("workflowTypeSelect"),
  workflowFluidSelect: document.getElementById("workflowFluidSelect"),
  workflowUnitSelect: document.getElementById("workflowUnitSelect"),
  workflowForm: document.getElementById("workflowForm"),
  workflowFields: document.getElementById("workflowFields"),
  workflowValidationMessage: document.getElementById("workflowValidationMessage"),
  workflowBtn: document.getElementById("workflowBtn"),
  workflowStatus: document.getElementById("workflowStatus"),
  workflowResultGrid: document.getElementById("workflowResultGrid"),
  workflowStepsList: document.getElementById("workflowStepsList"),

  statTotalQueries: document.getElementById("statTotalQueries"),
  statMostUsedFluid: document.getElementById("statMostUsedFluid"),
  statInterpolatedQueries: document.getElementById("statInterpolatedQueries"),
  historyTableBody: document.getElementById("historyTableBody"),
  compareTableBody: document.getElementById("compareTableBody"),

  cycleDiagramSelect: document.getElementById("cycleDiagramSelect"),
  cycleTemplateSelect: document.getElementById("cycleTemplateSelect"),
  loadTemplateBtn: document.getElementById("loadTemplateBtn"),
  cycleInputForm: document.getElementById("cycleInputForm"),
  cycleInputFields: document.getElementById("cycleInputFields"),
  cycleInputMessage: document.getElementById("cycleInputMessage"),
  solveCycleBtn: document.getElementById("solveCycleBtn"),
  cycleInverseForm: document.getElementById("cycleInverseForm"),
  cycleUnknownSelect: document.getElementById("cycleUnknownSelect"),
  cycleTargetMetricSelect: document.getElementById("cycleTargetMetricSelect"),
  cycleTargetValue: document.getElementById("cycleTargetValue"),
  cycleSolveMin: document.getElementById("cycleSolveMin"),
  cycleSolveMax: document.getElementById("cycleSolveMax"),
  cycleUnknownSelect2: document.getElementById("cycleUnknownSelect2"),
  cycleTargetMetricSelect2: document.getElementById("cycleTargetMetricSelect2"),
  cycleTargetValue2: document.getElementById("cycleTargetValue2"),
  cycleSolveMin2: document.getElementById("cycleSolveMin2"),
  cycleSolveMax2: document.getElementById("cycleSolveMax2"),
  cycleDofMessage: document.getElementById("cycleDofMessage"),
  cycleInverseMessage: document.getElementById("cycleInverseMessage"),
  solveUnknownBtn: document.getElementById("solveUnknownBtn"),
  toggleDome: document.getElementById("toggleDome"),
  toggleIsobars: document.getElementById("toggleIsobars"),
  manualLabel: document.getElementById("manualLabel"),
  manualT: document.getElementById("manualT"),
  manualP: document.getElementById("manualP"),
  manualH: document.getElementById("manualH"),
  manualS: document.getElementById("manualS"),
  addManualPointBtn: document.getElementById("addManualPointBtn"),
  clearManualPointsBtn: document.getElementById("clearManualPointsBtn"),
  cycleStatus: document.getElementById("cycleStatus"),
  cycleCanvas: document.getElementById("cycleCanvas"),
  cycleMetrics: document.getElementById("cycleMetrics"),
  cycleWarnings: document.getElementById("cycleWarnings"),
  cyclePointsBody: document.getElementById("cyclePointsBody"),
};

function formatNumber(value) {
  if (!Number.isFinite(value)) {
    return "-";
  }
  const abs = Math.abs(value);
  if ((abs !== 0 && abs < 1e-3) || abs >= 1e5) {
    return value.toExponential(5);
  }
  return value.toFixed(6).replace(/\.?0+$/, "");
}

function formatTimestamp(dateIso) {
  const date = new Date(dateIso);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
}

function firstFinite(...values) {
  for (const value of values) {
    if (Number.isFinite(value)) {
      return value;
    }
  }
  return null;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function safeRatio(numerator, denominator) {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || Math.abs(denominator) < 1e-12) {
    return null;
  }
  return numerator / denominator;
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function setStatus(message, kind = "") {
  el.statusText.textContent = message;
  el.statusText.className = "status";
  if (kind) {
    el.statusText.classList.add(kind);
  }
}

function setValidationMessage(message, kind = "") {
  el.validationMessage.textContent = message;
  el.validationMessage.className = "validation-msg";
  if (kind) {
    el.validationMessage.classList.add(kind);
  }
}

function setCycleStatus(message, kind = "") {
  el.cycleStatus.textContent = message;
  el.cycleStatus.className = "status";
  if (kind) {
    el.cycleStatus.classList.add(kind);
  }
}

function setCycleInputMessage(message, kind = "") {
  if (!el.cycleInputMessage) {
    return;
  }
  el.cycleInputMessage.textContent = message;
  el.cycleInputMessage.className = "validation-msg";
  if (kind) {
    el.cycleInputMessage.classList.add(kind);
  }
}

function setCycleInverseMessage(message, kind = "") {
  if (!el.cycleInverseMessage) {
    return;
  }
  el.cycleInverseMessage.textContent = message;
  el.cycleInverseMessage.className = "validation-msg";
  if (kind) {
    el.cycleInverseMessage.classList.add(kind);
  }
}

function setCycleDofMessage(message, kind = "") {
  if (!el.cycleDofMessage) {
    return;
  }
  el.cycleDofMessage.textContent = message;
  el.cycleDofMessage.className = "validation-msg";
  if (kind) {
    el.cycleDofMessage.classList.add(kind);
  }
}

function setWorkflowStatus(message, kind = "") {
  el.workflowStatus.textContent = message;
  el.workflowStatus.className = "status";
  if (kind) {
    el.workflowStatus.classList.add(kind);
  }
}

function setWorkflowValidationMessage(message, kind = "") {
  el.workflowValidationMessage.textContent = message;
  el.workflowValidationMessage.className = "validation-msg";
  if (kind) {
    el.workflowValidationMessage.classList.add(kind);
  }
}

function setInputHint(key, text, kind = "") {
  const hint = document.getElementById(`hint_${key}`);
  if (!hint) {
    return;
  }
  hint.textContent = text;
  hint.className = "input-hint";
  if (kind) {
    hint.classList.add(kind);
  }
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

function clearLookupResults() {
  el.resultGrid.innerHTML = "";
  el.stepsList.innerHTML = "";
}

function renderSteps(stepLines) {
  el.stepsList.innerHTML = "";
  for (const line of stepLines) {
    const li = document.createElement("li");
    li.textContent = line;
    el.stepsList.appendChild(li);
  }
}

function tableLabel(table) {
  return `${table.sheet_name} | ${MODE_LABELS[table.mode]} | ${table.unit_system}`;
}

function getSelectedTable() {
  return state.tables.find((table) => table.id === state.selectedTableId) || null;
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

function setLookupLoading(isLoading) {
  el.queryBtn.disabled = isLoading;
  el.tableSelect.disabled = isLoading;
  el.tableSearch.disabled = isLoading;
  el.modeFilter.disabled = isLoading;
  el.fluidFilter.disabled = isLoading;
}

function setActiveTab(tabId) {
  state.activeTab = tabId;
  for (const button of el.tabButtons) {
    button.classList.toggle("active", button.dataset.tab === tabId);
  }
  for (const panel of el.tabPanels) {
    panel.classList.toggle("active", panel.id === `tab-${tabId}`);
  }
}

function wireTabs() {
  for (const button of el.tabButtons) {
    button.addEventListener("click", () => {
      setActiveTab(button.dataset.tab);
      if (button.dataset.tab === "cycle") {
        renderCyclePlot();
      }
    });
  }
}

function populateFluidFilter() {
  const fluids = [...new Set(state.tables.map((table) => table.fluid))].sort((a, b) => a.localeCompare(b));
  el.fluidFilter.innerHTML = "";

  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.textContent = "All fluids";
  el.fluidFilter.appendChild(allOption);

  for (const fluid of fluids) {
    const option = document.createElement("option");
    option.value = fluid;
    option.textContent = fluid;
    el.fluidFilter.appendChild(option);
  }

  el.fluidFilter.value = "all";
}

function applyTableFilters() {
  const selectedFluid = el.fluidFilter.value || "all";
  const selectedMode = el.modeFilter.value || "all";
  const query = el.tableSearch.value.trim().toLowerCase();
  const previousSelected = state.selectedTableId;

  state.filteredTables = state.tables.filter((table) => {
    if (selectedFluid !== "all" && table.fluid !== selectedFluid) {
      return false;
    }
    if (selectedMode !== "all" && table.mode !== selectedMode) {
      return false;
    }
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

  renderTableOptions(previousSelected);
}

function renderTableOptions(preserveId = null) {
  el.tableSelect.innerHTML = "";
  if (state.filteredTables.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "No matching tables";
    el.tableSelect.appendChild(option);
    state.selectedTableId = null;
    el.tableMeta.textContent = "No table matches the current filter.";
    clearLookupResults();
    setStatus("Adjust filters to find a table.", "warn");
    el.queryBtn.disabled = true;
    return;
  }

  for (const table of state.filteredTables) {
    const option = document.createElement("option");
    option.value = table.id;
    option.textContent = tableLabel(table);
    el.tableSelect.appendChild(option);
  }

  const found = state.filteredTables.some((table) => table.id === preserveId);
  state.selectedTableId = found ? preserveId : state.filteredTables[0].id;
  el.tableSelect.value = state.selectedTableId;
  updateSelectedTable(state.selectedTableId);
}

function renderTableMeta(table) {
  const props = sortedProperties(table.properties).join(", ");
  const ranges = Object.entries(table.inputs)
    .map(([key, range]) => `${key}: ${formatNumber(range.min)} to ${formatNumber(range.max)}`)
    .join(" | ");

  el.tableMeta.innerHTML = `
    Fluid: ${table.fluid}<br/>
    Type: ${MODE_LABELS[table.mode]}<br/>
    Unit system: ${table.unit_system}<br/>
    Rows: ${table.row_count}<br/>
    Available props: ${props}<br/>
    Input range: ${ranges}
  `;
}

function renderQueryFields(table) {
  const keys = queryKeysForMode(table.mode);
  el.queryFields.innerHTML = "";

  for (const key of keys) {
    const range = table.inputs[key];
    const wrap = document.createElement("div");
    wrap.className = "query-field";
    wrap.innerHTML = `
      <label for="input_${key}">${key} (${formatNumber(range.min)} to ${formatNumber(range.max)})</label>
      <input id="input_${key}" type="number" step="any" placeholder="Enter ${key}" />
      <div id="hint_${key}" class="input-hint">Allowed range: ${formatNumber(range.min)} to ${formatNumber(range.max)}</div>
    `;
    el.queryFields.appendChild(wrap);
  }

  for (const key of keys) {
    const input = document.getElementById(`input_${key}`);
    input.addEventListener("input", () => {
      validateLookupInputs({ showStatus: false });
    });
  }
}

function updateSelectedTable(nextId) {
  const exists = state.filteredTables.some((table) => table.id === nextId);
  if (!exists) {
    return;
  }

  state.selectedTableId = nextId;
  const table = getSelectedTable();
  if (!table) {
    return;
  }

  clearLookupResults();
  renderTableMeta(table);
  renderQueryFields(table);
  setValidationMessage("Enter inputs within range. Out-of-range values are blocked before computing.");
  setStatus("Set inputs and click Compute Properties.");
  el.queryBtn.disabled = true;
}

function sortRowsByKey(rows, key) {
  return [...rows].filter((row) => Number.isFinite(row[key])).sort((a, b) => a[key] - b[key]);
}

function findBracket(sortedRows, key, target) {
  const first = sortedRows[0][key];
  const last = sortedRows[sortedRows.length - 1][key];

  if (target < first || target > last) {
    throw new Error(`${key} = ${formatNumber(target)} is outside ${formatNumber(first)} to ${formatNumber(last)}.`);
  }

  for (const row of sortedRows) {
    if (Math.abs(row[key] - target) < 1e-9) {
      return { exact: row };
    }
  }

  for (let i = 0; i < sortedRows.length - 1; i += 1) {
    const x1 = sortedRows[i][key];
    const x2 = sortedRows[i + 1][key];
    if (x1 <= target && target <= x2) {
      return { low: sortedRows[i], high: sortedRows[i + 1] };
    }
  }

  throw new Error(`Could not bracket ${key} = ${formatNumber(target)}.`);
}

function interpolate1D(rows, key, target, props) {
  const sortedRows = sortRowsByKey(rows, key);
  if (sortedRows.length < 2) {
    throw new Error(`Not enough rows to interpolate with ${key}.`);
  }

  const bracket = findBracket(sortedRows, key, target);
  const values = {};
  const steps = [];

  if (bracket.exact) {
    for (const prop of props) {
      if (Number.isFinite(bracket.exact[prop])) {
        values[prop] = bracket.exact[prop];
      }
    }
    steps.push(`Exact match at ${key} = ${formatNumber(target)}.`);
    return {
      values,
      steps,
      meta: { method: "exact", interpolationStages: 0 },
    };
  }

  const { low, high } = bracket;
  const x1 = low[key];
  const x2 = high[key];
  const alpha = (target - x1) / (x2 - x1);

  steps.push(`Bracket on ${key}: ${formatNumber(x1)} to ${formatNumber(x2)}.`);
  steps.push(
    `alpha = (${formatNumber(target)} - ${formatNumber(x1)}) / (${formatNumber(x2)} - ${formatNumber(x1)}) = ${formatNumber(alpha)}.`,
  );

  for (const prop of props) {
    const y1 = low[prop];
    const y2 = high[prop];
    if (Number.isFinite(y1) && Number.isFinite(y2)) {
      values[prop] = y1 + alpha * (y2 - y1);
      steps.push(`${prop}: ${formatNumber(values[prop])}`);
    }
  }

  return {
    values,
    steps,
    meta: { method: "linear-1d", interpolationStages: 1 },
  };
}

function buildPressureGroups(rows) {
  const map = new Map();
  for (const row of rows) {
    if (!Number.isFinite(row.P) || !Number.isFinite(row.T)) {
      continue;
    }
    if (!map.has(row.P)) {
      map.set(row.P, []);
    }
    map.get(row.P).push(row);
  }

  return [...map.entries()]
    .map(([pressure, groupRows]) => {
      const sorted = [...groupRows].sort((a, b) => a.T - b.T);
      return {
        pressure,
        rows: sorted,
        tMin: sorted[0].T,
        tMax: sorted[sorted.length - 1].T,
      };
    })
    .sort((a, b) => a.pressure - b.pressure);
}

function temperatureRangeAtPressure(table, pressure) {
  if (table.mode !== "PT") {
    return null;
  }

  const groups = buildPressureGroups(table.rows);
  if (groups.length === 0) {
    return null;
  }

  const pMin = groups[0].pressure;
  const pMax = groups[groups.length - 1].pressure;
  if (pressure < pMin || pressure > pMax) {
    return null;
  }

  const exact = groups.find((group) => Math.abs(group.pressure - pressure) < 1e-9);
  if (exact) {
    return { min: exact.tMin, max: exact.tMax };
  }

  for (let i = 0; i < groups.length - 1; i += 1) {
    const low = groups[i];
    const high = groups[i + 1];
    if (low.pressure <= pressure && pressure <= high.pressure) {
      const min = Math.max(low.tMin, high.tMin);
      const max = Math.min(low.tMax, high.tMax);
      if (min <= max) {
        return { min, max };
      }
      return null;
    }
  }

  return null;
}

function pressureRangeAtTemperature(table, temperature) {
  if (table.mode !== "PT") {
    return null;
  }

  const groups = buildPressureGroups(table.rows).filter((group) => group.tMin <= temperature && temperature <= group.tMax);
  if (groups.length === 0) {
    return null;
  }

  return {
    min: groups[0].pressure,
    max: groups[groups.length - 1].pressure,
  };
}
function interpolatePT(table, tInput, pInput, optionalProps = null) {
  const props = optionalProps || sortedProperties(table.properties);
  const groups = buildPressureGroups(table.rows);

  if (groups.length < 2) {
    throw new Error("Table needs at least two pressure groups for double interpolation.");
  }

  const pMin = groups[0].pressure;
  const pMax = groups[groups.length - 1].pressure;
  if (pInput < pMin || pInput > pMax) {
    throw new Error(`P = ${formatNumber(pInput)} is outside ${formatNumber(pMin)} to ${formatNumber(pMax)}.`);
  }

  const supportsT = (group) => group.tMin <= tInput && tInput <= group.tMax;
  const exact = groups.find((group) => Math.abs(group.pressure - pInput) < 1e-9);

  if (exact && supportsT(exact)) {
    const oneD = interpolate1D(exact.rows, "T", tInput, props);
    return {
      values: oneD.values,
      steps: [`Exact pressure match at P = ${formatNumber(exact.pressure)}.`].concat(oneD.steps),
      meta: {
        method: oneD.meta.interpolationStages > 0 ? "linear-1d-at-exact-P" : "exact",
        interpolationStages: oneD.meta.interpolationStages,
      },
    };
  }

  const lowerGroups = groups.filter((group) => group.pressure <= pInput && supportsT(group));
  const upperGroups = groups.filter((group) => group.pressure >= pInput && supportsT(group));

  let lower = null;
  let upper = null;
  let bestSpan = Number.POSITIVE_INFINITY;

  for (const low of lowerGroups) {
    for (const high of upperGroups) {
      if (low.pressure === high.pressure) {
        continue;
      }
      if (!(low.pressure <= pInput && pInput <= high.pressure)) {
        continue;
      }
      const span = high.pressure - low.pressure;
      if (span < bestSpan) {
        bestSpan = span;
        lower = low;
        upper = high;
      }
    }
  }

  if (!lower || !upper) {
    const validP = groups.filter((group) => supportsT(group)).map((group) => group.pressure);
    if (validP.length === 0) {
      const tMin = Math.min(...groups.map((group) => group.tMin));
      const tMax = Math.max(...groups.map((group) => group.tMax));
      throw new Error(`T = ${formatNumber(tInput)} is outside PT slices (${formatNumber(tMin)} to ${formatNumber(tMax)}).`);
    }
    throw new Error(
      `At T = ${formatNumber(tInput)}, valid pressure range is ${formatNumber(validP[0])} to ${formatNumber(validP[validP.length - 1])}.`,
    );
  }

  const lowInterp = interpolate1D(lower.rows, "T", tInput, props);
  const highInterp = interpolate1D(upper.rows, "T", tInput, props);

  const beta = (pInput - lower.pressure) / (upper.pressure - lower.pressure);
  const values = {};
  const steps = [
    `Pressure bracket: ${formatNumber(lower.pressure)} to ${formatNumber(upper.pressure)}.`,
    `Interpolate on T at P = ${formatNumber(lower.pressure)}.`,
    `Interpolate on T at P = ${formatNumber(upper.pressure)}.`,
    `beta = (${formatNumber(pInput)} - ${formatNumber(lower.pressure)}) / (${formatNumber(upper.pressure)} - ${formatNumber(lower.pressure)}) = ${formatNumber(beta)}.`,
  ];

  for (const prop of props) {
    const v1 = lowInterp.values[prop];
    const v2 = highInterp.values[prop];
    if (Number.isFinite(v1) && Number.isFinite(v2)) {
      values[prop] = v1 + beta * (v2 - v1);
      steps.push(`${prop}: ${formatNumber(values[prop])}`);
    }
  }

  return {
    values,
    steps,
    meta: { method: "double-interpolation-PT", interpolationStages: 2 },
  };
}

function interpolateTable(table, inputs, optionalProps = null) {
  const props = optionalProps || sortedProperties(table.properties);
  if (table.mode === "PT") {
    return interpolatePT(table, inputs.T, inputs.P, props);
  }

  const indexKey = table.mode === "sat-T" ? "T" : "P";
  return interpolate1D(table.rows, indexKey, inputs[indexKey], props);
}

function valueRangeForRows(rows, key) {
  const values = rows.map((row) => row[key]).filter(Number.isFinite).sort((a, b) => a - b);
  if (values.length < 2) {
    return null;
  }
  return { min: values[0], max: values[values.length - 1] };
}

function interpolatePTByProperty(table, pInput, lookupKey, lookupValue, optionalProps = null) {
  const props = optionalProps || sortedProperties(table.properties);
  const groups = buildPressureGroups(table.rows);

  if (groups.length < 2) {
    throw new Error("Table needs at least two pressure groups for reverse lookup.");
  }

  const pMin = groups[0].pressure;
  const pMax = groups[groups.length - 1].pressure;
  if (pInput < pMin || pInput > pMax) {
    throw new Error(`P = ${formatNumber(pInput)} is outside ${formatNumber(pMin)} to ${formatNumber(pMax)}.`);
  }

  const supportsLookup = (group) => {
    const range = valueRangeForRows(group.rows, lookupKey);
    return range && range.min <= lookupValue && lookupValue <= range.max;
  };

  const exact = groups.find((group) => Math.abs(group.pressure - pInput) < 1e-9);
  if (exact && supportsLookup(exact)) {
    const oneD = interpolate1D(exact.rows, lookupKey, lookupValue, props);
    return {
      values: oneD.values,
      steps: [`Exact pressure match at P = ${formatNumber(exact.pressure)}.`].concat(oneD.steps),
      meta: {
        method: oneD.meta.interpolationStages > 0 ? `linear-1d-at-exact-P-using-${lookupKey}` : "exact",
        interpolationStages: oneD.meta.interpolationStages,
      },
    };
  }

  const lowerGroups = groups.filter((group) => group.pressure <= pInput && supportsLookup(group));
  const upperGroups = groups.filter((group) => group.pressure >= pInput && supportsLookup(group));

  let lower = null;
  let upper = null;
  let bestSpan = Number.POSITIVE_INFINITY;

  for (const low of lowerGroups) {
    for (const high of upperGroups) {
      if (low.pressure === high.pressure) {
        continue;
      }
      if (!(low.pressure <= pInput && pInput <= high.pressure)) {
        continue;
      }
      const span = high.pressure - low.pressure;
      if (span < bestSpan) {
        bestSpan = span;
        lower = low;
        upper = high;
      }
    }
  }

  if (!lower || !upper) {
    const validP = groups.filter((group) => supportsLookup(group)).map((group) => group.pressure);
    if (validP.length === 0) {
      throw new Error(`${lookupKey} = ${formatNumber(lookupValue)} is not available in any pressure slice for this table.`);
    }
    throw new Error(
      `At ${lookupKey}=${formatNumber(lookupValue)}, valid P is ${formatNumber(validP[0])} to ${formatNumber(validP[validP.length - 1])}.`,
    );
  }

  const lowInterp = interpolate1D(lower.rows, lookupKey, lookupValue, props);
  const highInterp = interpolate1D(upper.rows, lookupKey, lookupValue, props);
  const beta = (pInput - lower.pressure) / (upper.pressure - lower.pressure);
  const values = {};
  const steps = [
    `Pressure bracket: ${formatNumber(lower.pressure)} to ${formatNumber(upper.pressure)}.`,
    `Interpolate on ${lookupKey} at P = ${formatNumber(lower.pressure)}.`,
    `Interpolate on ${lookupKey} at P = ${formatNumber(upper.pressure)}.`,
    `beta = (${formatNumber(pInput)} - ${formatNumber(lower.pressure)}) / (${formatNumber(upper.pressure)} - ${formatNumber(lower.pressure)}) = ${formatNumber(beta)}.`,
  ];

  for (const prop of props) {
    const v1 = lowInterp.values[prop];
    const v2 = highInterp.values[prop];
    if (Number.isFinite(v1) && Number.isFinite(v2)) {
      values[prop] = v1 + beta * (v2 - v1);
      steps.push(`${prop}: ${formatNumber(values[prop])}`);
    }
  }

  return {
    values,
    steps,
    meta: { method: `double-interpolation-P${lookupKey}`, interpolationStages: 2 },
  };
}

function validateLookupInputs({ showStatus = false } = {}) {
  const table = getSelectedTable();
  if (!table) {
    el.queryBtn.disabled = true;
    return { valid: false, inputs: {}, errors: ["No selected table"], warnings: [] };
  }

  const keys = queryKeysForMode(table.mode);
  const inputs = {};
  const errors = [];
  const warnings = [];

  for (const key of keys) {
    const range = table.inputs[key];
    const input = document.getElementById(`input_${key}`);
    const raw = input ? input.value.trim() : "";

    if (!raw) {
      errors.push(`${key} is required.`);
      setInputHint(key, `Required. Allowed: ${formatNumber(range.min)} to ${formatNumber(range.max)}.`, "error");
      continue;
    }

    const value = Number(raw);
    if (!Number.isFinite(value)) {
      errors.push(`${key} must be numeric.`);
      setInputHint(key, `Enter a numeric value for ${key}.`, "error");
      continue;
    }

    inputs[key] = value;
    setInputHint(key, `Allowed range: ${formatNumber(range.min)} to ${formatNumber(range.max)}.`);

    if (value < range.min || value > range.max) {
      warnings.push(`${key}=${formatNumber(value)} is outside ${formatNumber(range.min)} to ${formatNumber(range.max)}.`);
      setInputHint(key, `${key} out of range (${formatNumber(range.min)} to ${formatNumber(range.max)}).`, "warn");
    }
  }

  if (table.mode === "PT") {
    const tValue = inputs.T;
    const pValue = inputs.P;

    if (Number.isFinite(tValue)) {
      const pressureRange = pressureRangeAtTemperature(table, tValue);
      if (!pressureRange) {
        warnings.push(`No valid pressure slice available at T=${formatNumber(tValue)}.`);
        setInputHint("P", `At T=${formatNumber(tValue)}, no pressure slice is available.`, "warn");
      } else {
        setInputHint(
          "P",
          `At T=${formatNumber(tValue)}, valid P is ${formatNumber(pressureRange.min)} to ${formatNumber(pressureRange.max)}.`,
        );
        if (Number.isFinite(pValue) && (pValue < pressureRange.min || pValue > pressureRange.max)) {
          warnings.push(`At T=${formatNumber(tValue)}, P must be between ${formatNumber(pressureRange.min)} and ${formatNumber(pressureRange.max)}.`);
          setInputHint(
            "P",
            `For T=${formatNumber(tValue)}, use P=${formatNumber(pressureRange.min)} to ${formatNumber(pressureRange.max)}.`,
            "warn",
          );
        }
      }
    }

    if (Number.isFinite(pValue)) {
      const temperatureRange = temperatureRangeAtPressure(table, pValue);
      if (!temperatureRange) {
        warnings.push(`No valid temperature slice available at P=${formatNumber(pValue)}.`);
        setInputHint("T", `At P=${formatNumber(pValue)}, no temperature slice is available.`, "warn");
      } else {
        setInputHint(
          "T",
          `At P=${formatNumber(pValue)}, valid T is ${formatNumber(temperatureRange.min)} to ${formatNumber(temperatureRange.max)}.`,
        );
        if (Number.isFinite(tValue) && (tValue < temperatureRange.min || tValue > temperatureRange.max)) {
          warnings.push(`At P=${formatNumber(pValue)}, T must be between ${formatNumber(temperatureRange.min)} and ${formatNumber(temperatureRange.max)}.`);
          setInputHint(
            "T",
            `For P=${formatNumber(pValue)}, use T=${formatNumber(temperatureRange.min)} to ${formatNumber(temperatureRange.max)}.`,
            "warn",
          );
        }
      }
    }
  }

  const valid = errors.length === 0 && warnings.length === 0;
  el.queryBtn.disabled = !valid;

  if (showStatus) {
    if (errors.length > 0) {
      setValidationMessage(errors[0], "error");
      setStatus("Fix input errors before computing.", "warn");
    } else if (warnings.length > 0) {
      setValidationMessage(warnings[0], "warn");
      setStatus("Input out of valid interpolation range.", "warn");
    } else {
      setValidationMessage("Inputs are valid. Ready to compute.");
    }
  } else if (errors.length > 0) {
    setValidationMessage(errors[0], "error");
  } else if (warnings.length > 0) {
    setValidationMessage(warnings[0], "warn");
  } else {
    setValidationMessage("Inputs are valid. Ready to compute.");
  }

  return { valid, inputs, errors, warnings };
}

function renderLookupResults(table, results, steps, inputLabel) {
  clearLookupResults();
  const resultKeys = sortedProperties(Object.keys(results));

  for (const key of resultKeys) {
    const meta = PROPERTY_META[key] || { symbol: key, name: key };
    const card = document.createElement("article");
    card.className = "result-card";
    card.innerHTML = `
      <p class="prop">${meta.symbol}</p>
      <p class="value">${formatNumber(results[key])}</p>
      <p class="desc">${meta.name}</p>
    `;
    el.resultGrid.appendChild(card);
  }

  renderSteps(steps);
  setStatus(`Computed ${resultKeys.length} properties from ${table.sheet_name} using ${inputLabel}.`, "ok");
}

function toCompareColumnValue(entry, key) {
  if (key === "T") {
    return firstFinite(entry.inputs.T, entry.results.T);
  }
  if (key === "P") {
    return firstFinite(entry.inputs.P, entry.results.P);
  }
  if (key === "hg") {
    return firstFinite(entry.results.hg, entry.results.h, Number.isFinite(entry.results.hf) && Number.isFinite(entry.results.hfg) ? entry.results.hf + entry.results.hfg : null);
  }
  if (key === "sg") {
    return firstFinite(entry.results.sg, entry.results.s, Number.isFinite(entry.results.sf) && Number.isFinite(entry.results.sfg) ? entry.results.sf + entry.results.sfg : null);
  }
  if (key === "vg") {
    return firstFinite(entry.results.vg, entry.results.v, Number.isFinite(entry.results.vf) && Number.isFinite(entry.results.vfg) ? entry.results.vf + entry.results.vfg : null);
  }
  return null;
}

function renderSessionStats() {
  const total = state.queryHistory.length;
  const fluidCounts = new Map();
  let interpolated = 0;

  for (const entry of state.queryHistory) {
    fluidCounts.set(entry.fluid, (fluidCounts.get(entry.fluid) || 0) + 1);
    if (entry.interpolationStages > 0) {
      interpolated += 1;
    }
  }

  let mostUsedFluid = "-";
  let bestCount = 0;
  for (const [fluid, count] of fluidCounts.entries()) {
    if (count > bestCount) {
      bestCount = count;
      mostUsedFluid = fluid;
    }
  }

  el.statTotalQueries.textContent = String(total);
  el.statMostUsedFluid.textContent = mostUsedFluid;
  el.statInterpolatedQueries.textContent = String(interpolated);
}

function renderHistoryTable() {
  el.historyTableBody.innerHTML = "";

  if (state.queryHistory.length === 0) {
    el.historyTableBody.innerHTML = '<tr><td colspan="7" class="empty-cell">No queries yet.</td></tr>';
    return;
  }

  for (const entry of state.queryHistory) {
    const row = document.createElement("tr");
    const inputText = Object.entries(entry.inputs)
      .map(([key, value]) => `${key}=${formatNumber(value)}`)
      .join(", ");
    row.innerHTML = `
      <td>${entry.id}</td>
      <td>${formatTimestamp(entry.timestamp)}</td>
      <td>${entry.fluid}</td>
      <td>${entry.tableName}</td>
      <td>${MODE_LABELS[entry.mode]}</td>
      <td>${inputText}</td>
      <td>${entry.method}</td>
    `;
    el.historyTableBody.appendChild(row);
  }
}

function renderCompareTable() {
  el.compareTableBody.innerHTML = "";

  if (state.queryHistory.length === 0) {
    el.compareTableBody.innerHTML = '<tr><td colspan="9" class="empty-cell">No comparison rows yet.</td></tr>';
    return;
  }

  for (const entry of state.queryHistory) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${entry.id}</td>
      <td>${entry.fluid}</td>
      <td>${MODE_LABELS[entry.mode]}</td>
      <td>${formatNumber(toCompareColumnValue(entry, "T"))}</td>
      <td>${formatNumber(toCompareColumnValue(entry, "P"))}</td>
      <td>${formatNumber(toCompareColumnValue(entry, "hg"))}</td>
      <td>${formatNumber(toCompareColumnValue(entry, "sg"))}</td>
      <td>${formatNumber(toCompareColumnValue(entry, "vg"))}</td>
      <td>${formatTimestamp(entry.timestamp)}</td>
    `;
    el.compareTableBody.appendChild(row);
  }
}

function addHistoryEntry(table, inputs, results, meta) {
  const entry = {
    id: state.querySeq,
    timestamp: new Date().toISOString(),
    fluid: table.fluid,
    tableName: table.sheet_name,
    mode: table.mode,
    inputs: { ...inputs },
    results: { ...results },
    method: meta.method,
    interpolationStages: meta.interpolationStages,
  };

  state.querySeq += 1;
  state.queryHistory.unshift(entry);
  renderSessionStats();
  renderHistoryTable();
  renderCompareTable();
}

function handleLookupSubmit(event) {
  event.preventDefault();

  const table = getSelectedTable();
  if (!table) {
    setStatus("Select a table first.", "error");
    return;
  }

  const validation = validateLookupInputs({ showStatus: true });
  if (!validation.valid) {
    return;
  }

  try {
    const interpolation = interpolateTable(table, validation.inputs);
    if (Object.keys(interpolation.values).length === 0) {
      throw new Error("No numeric output columns were found for this query.");
    }

    const inputLabel = Object.entries(validation.inputs)
      .map(([key, value]) => `${key}=${formatNumber(value)}`)
      .join(", ");

    renderLookupResults(table, interpolation.values, interpolation.steps, inputLabel);
    addHistoryEntry(table, validation.inputs, interpolation.values, interpolation.meta);
  } catch (error) {
    clearLookupResults();
    setValidationMessage(error.message, "error");
    setStatus(error.message, "error");
    renderSteps([error.message]);
  }
}

function workflowTypeLabel(workflowType) {
  return WORKFLOW_TYPES.find((entry) => entry.id === workflowType)?.label || workflowType;
}

function workflowRequiredModes(workflowType) {
  if (workflowType === "phase-check" || workflowType === "two-phase") {
    return ["sat-T"];
  }
  if (workflowType === "reverse-lookup" || workflowType === "state-guide") {
    return ["PT", "sat-T"];
  }
  return ["PT"];
}

function fluidHasMode(fluid, mode) {
  return state.tables.some((table) => table.fluid === fluid && table.mode === mode);
}

function workflowFluidsForType(workflowType) {
  const allFluids = [...new Set(state.tables.map((table) => table.fluid))];
  if (workflowType === "reverse-lookup" || workflowType === "state-guide") {
    return allFluids.filter((fluid) => fluidHasMode(fluid, "PT") && fluidHasMode(fluid, "sat-T")).sort((a, b) => a.localeCompare(b));
  }

  const mode = workflowType === "phase-check" || workflowType === "two-phase" ? "sat-T" : "PT";
  return allFluids.filter((fluid) => fluidHasMode(fluid, mode)).sort((a, b) => a.localeCompare(b));
}

function findWorkflowTable({ mode, fluid, unitSystem }) {
  const fluidRegex = new RegExp(`^${escapeRegex(fluid)}$`, "i");
  return findBestTable({ mode, fluidRegex, unitSystem });
}

function getWorkflowSatTable(fluid, unitSystem) {
  return findWorkflowTable({ mode: "sat-T", fluid, unitSystem });
}

function getWorkflowPtTable(fluid, unitSystem) {
  return findWorkflowTable({ mode: "PT", fluid, unitSystem });
}

function workflowUnitsForType(fluid, workflowType) {
  if (!fluid) {
    return [];
  }

  const unitsByMode = (mode) => new Set(state.tables.filter((table) => table.fluid === fluid && table.mode === mode).map((table) => table.unit_system));

  if (workflowType === "reverse-lookup" || workflowType === "state-guide") {
    const ptUnits = unitsByMode("PT");
    const satUnits = unitsByMode("sat-T");
    return [...ptUnits].filter((unit) => satUnits.has(unit)).sort((a, b) => a.localeCompare(b));
  }

  const mode = workflowType === "phase-check" || workflowType === "two-phase" ? "sat-T" : "PT";
  return [...unitsByMode(mode)].sort((a, b) => a.localeCompare(b));
}

function clearWorkflowResults() {
  el.workflowResultGrid.innerHTML = "";
  el.workflowStepsList.innerHTML = "";
}

function renderWorkflowSteps(stepLines) {
  el.workflowStepsList.innerHTML = "";
  for (const line of stepLines) {
    const li = document.createElement("li");
    li.textContent = line;
    el.workflowStepsList.appendChild(li);
  }
}

function formatWorkflowCardValue(item) {
  const numeric = item && Number.isFinite(item.value);
  if (!numeric) {
    return item && item.value !== null && item.value !== undefined ? String(item.value) : "-";
  }
  return item.unit ? `${formatNumber(item.value)} ${item.unit}` : formatNumber(item.value);
}

function renderWorkflowResults(items, steps) {
  clearWorkflowResults();

  for (const item of items) {
    const card = document.createElement("article");
    card.className = "result-card";

    const prop = document.createElement("p");
    prop.className = "prop";
    prop.textContent = item.label;

    const value = document.createElement("p");
    value.className = "value";
    value.textContent = formatWorkflowCardValue(item);

    const desc = document.createElement("p");
    desc.className = "desc";
    desc.textContent = item.desc || "";

    card.appendChild(prop);
    card.appendChild(value);
    card.appendChild(desc);
    el.workflowResultGrid.appendChild(card);
  }

  renderWorkflowSteps(steps);
}

function parseWorkflowNumberInput(fieldId, label, required = true) {
  const input = document.getElementById(fieldId);
  if (!input) {
    throw new Error(`Missing workflow field: ${label}.`);
  }

  const raw = input.value.trim();
  if (!raw) {
    if (!required) {
      return null;
    }
    throw new Error(`${label} is required.`);
  }

  const value = Number(raw);
  if (!Number.isFinite(value)) {
    throw new Error(`${label} must be numeric.`);
  }
  return value;
}

function qualityRegionFromX(x) {
  if (!Number.isFinite(x)) {
    return "Unknown";
  }
  if (x < 0) {
    return "Compressed liquid side (x < 0)";
  }
  if (x > 1) {
    return "Superheated vapor side (x > 1)";
  }
  if (Math.abs(x) < 1e-9) {
    return "Saturated liquid (x = 0)";
  }
  if (Math.abs(x - 1) < 1e-9) {
    return "Saturated vapor (x = 1)";
  }
  return "Saturated mixture (0 < x < 1)";
}

function phaseGuidance(phaseRegion) {
  if (/compressed/i.test(phaseRegion)) {
    return {
      table: "Use compressed-liquid data if available; otherwise use saturated-liquid approximation cautiously.",
      next: "Bring a second independent property (for example T or h) to lock the state.",
    };
  }
  if (/superheated/i.test(phaseRegion)) {
    return {
      table: "Use the superheated/PT table.",
      next: "Interpolate with pressure and one additional property or temperature.",
    };
  }
  if (/saturated mixture/i.test(phaseRegion)) {
    return {
      table: "Use saturated table and quality relations.",
      next: "You need one extra property (x, h, s, u, or v) to locate the state in the dome.",
    };
  }
  if (/saturated liquid/i.test(phaseRegion) || /saturated vapor/i.test(phaseRegion)) {
    return {
      table: "Use saturated table at the same T or P.",
      next: "Use f/g properties directly at the saturation state.",
    };
  }
  return {
    table: "Check available tables for this fluid and unit system.",
    next: "Reconfirm which two independent properties are known.",
  };
}

function addWorkflowWarnings(solution, warnings) {
  if (!warnings || warnings.length === 0) {
    return solution;
  }

  const merged = {
    ...solution,
    items: [...solution.items],
    steps: [...solution.steps],
  };

  merged.steps.push(`Sanity checks flagged ${warnings.length} potential issue(s).`);
  for (let i = 0; i < warnings.length; i += 1) {
    merged.items.push({
      label: `Sanity ${i + 1}`,
      value: warnings[i],
      desc: "Review assumptions",
    });
    merged.steps.push(`Sanity ${i + 1}: ${warnings[i]}`);
  }

  return merged;
}

function classifyFromSaturationProperty(satState, propertyKey, propertyValue) {
  const map = QUALITY_PROPERTY_MAP[propertyKey];
  if (!map) {
    throw new Error(`Property ${propertyKey} is not supported for saturation classification.`);
  }

  const f = satState[map.f];
  const g = satState[map.g];
  const fg = satState[map.fg];
  if (!Number.isFinite(f) || !Number.isFinite(g) || !Number.isFinite(fg) || Math.abs(fg) < 1e-12) {
    throw new Error(`Saturation values ${map.f}/${map.g}/${map.fg} are unavailable.`);
  }

  const span = Math.abs(g - f);
  const tol = Math.max(1e-9, span * 0.002);
  const x = (propertyValue - f) / fg;

  if (propertyValue < f - tol) {
    return { phase: "Compressed liquid (subcooled)", x, tolerance: tol, f, g };
  }
  if (propertyValue > g + tol) {
    return { phase: "Superheated vapor", x, tolerance: tol, f, g };
  }
  if (Math.abs(propertyValue - f) <= tol) {
    return { phase: "Saturated liquid (x = 0)", x: 0, tolerance: tol, f, g };
  }
  if (Math.abs(propertyValue - g) <= tol) {
    return { phase: "Saturated vapor (x = 1)", x: 1, tolerance: tol, f, g };
  }
  return { phase: "Saturated mixture (0 < x < 1)", x, tolerance: tol, f, g };
}

function solveReverseLookupWorkflow({ fluid, unitSystem, lookupKey, P, lookupValue }) {
  const ptTable = getWorkflowPtTable(fluid, unitSystem);
  const satTable = getWorkflowSatTable(fluid, unitSystem);

  if (!ptTable) {
    throw new Error(`No PT table found for ${fluid} (${unitSystem}).`);
  }
  if (!satTable) {
    throw new Error(`No saturated table found for ${fluid} (${unitSystem}).`);
  }

  const warnings = [];
  const steps = [];
  const satProps = ["T", "P", "vf", "vfg", "vg", "uf", "ufg", "ug", "hf", "hfg", "hg", "sf", "sfg", "sg"];
  let satState = null;
  let classified = null;
  let phase = "Unknown";

  try {
    satState = interpolate1D(satTable.rows, "P", P, satProps).values;
    classified = classifyFromSaturationProperty(satState, lookupKey, lookupValue);
    phase = classified.phase;
    steps.push(`Step 1: At P=${formatNumber(P)}, interpolate saturated properties.`);
    steps.push(`Step 2: Compare ${lookupKey}=${formatNumber(lookupValue)} to saturation bounds ${formatNumber(classified.f)} to ${formatNumber(classified.g)}.`);
    steps.push(`Phase classification: ${phase}.`);
  } catch (error) {
    warnings.push(`Could not classify phase from saturation data at this pressure: ${error.message}`);
    steps.push(`Saturation classification unavailable at P=${formatNumber(P)}. Proceeding with PT reverse lookup only.`);
  }

  const items = [
    { label: "Known Pair", value: `P + ${lookupKey}`, desc: "Reverse lookup inputs" },
    { label: "Phase Region", value: phase, desc: "From saturation comparison" },
  ];

  if (satState) {
    items.push({ label: "Tsat(P)", value: satState.T, desc: "Saturation temperature at given pressure" });
  }
  if (classified) {
    items.push({ label: `${lookupKey}_f`, value: classified.f, desc: "Saturated liquid limit" });
    items.push({ label: `${lookupKey}_g`, value: classified.g, desc: "Saturated vapor limit" });
  }

  if (Number.isFinite(P) && P <= 0) {
    warnings.push("Pressure should be positive for physical states.");
  }

  if (classified && /saturated/i.test(phase)) {
    const x = /liquid/i.test(phase) ? 0 : /vapor/i.test(phase) ? 1 : classified.x;
    items.push({ label: "Quality x", value: x, desc: qualityRegionFromX(x) });
    items.push({ label: "T", value: satState.T, desc: "For two-phase states, T = Tsat(P)" });
    steps.push("Since the state is in the saturation dome, temperature is Tsat at the specified pressure.");

    for (const [baseProp, map] of Object.entries(QUALITY_PROPERTY_MAP)) {
      if (Number.isFinite(satState[map.f]) && Number.isFinite(satState[map.fg])) {
        items.push({
          label: baseProp,
          value: satState[map.f] + x * satState[map.fg],
          desc: `${map.f} + x*${map.fg}`,
        });
      }
    }

    if (x < 0 || x > 1) {
      warnings.push("Computed quality is outside 0..1; check the selected property value and units.");
    }

    return addWorkflowWarnings(
      {
        items,
        steps,
        status: `Reverse lookup solved for ${fluid} (${lookupKey} at fixed pressure).`,
      },
      warnings,
    );
  }

  try {
    const solved = interpolatePTByProperty(ptTable, P, lookupKey, lookupValue, ["T", "P", "h", "s", "u", "v"]);
    items.push({ label: "T", value: solved.values.T, desc: "Recovered from reverse PT lookup" });
    items.push({ label: "h", value: solved.values.h, desc: "Resolved state property" });
    items.push({ label: "s", value: solved.values.s, desc: "Resolved state property" });
    items.push({ label: "u", value: solved.values.u, desc: "Resolved state property" });
    items.push({ label: "v", value: solved.values.v, desc: "Resolved state property" });
    steps.push(`Step 3: Perform reverse lookup in PT table using known pair (P, ${lookupKey}).`);
    steps.push(...solved.steps);
  } catch (error) {
    if (/compressed/i.test(phase)) {
      warnings.push("The state is on the compressed-liquid side and PT tables often do not cover it.");
    }
    throw new Error(`Reverse lookup could not recover temperature: ${error.message}`);
  }

  return addWorkflowWarnings(
    {
      items,
      steps,
      status: `Reverse lookup solved for ${fluid} (${lookupKey} at fixed pressure).`,
    },
    warnings,
  );
}

function solveStateGuideWorkflow({ fluid, unitSystem, knownPair, T, P, h, s }) {
  const steps = [];
  const warnings = [];
  let items = [
    { label: "Known Pair", value: knownPair, desc: "Guided state identification input" },
  ];
  let phase = "Unknown";

  steps.push("Step A: Identify a valid pair of independent properties.");
  steps.push("Step B: Determine likely phase region before selecting a table.");

  if (knownPair === "TP") {
    const phaseSolved = solvePhaseCheckWorkflow({
      fluid,
      unitSystem,
      T,
      P,
      qualityProperty: "none",
      qualityValue: null,
    });
    phase = phaseSolved.items.find((item) => item.label === "Phase Region")?.value || "Unknown";
    items = items.concat(phaseSolved.items);
    steps.push(...phaseSolved.steps);
  } else if (knownPair === "Ph") {
    const reverse = solveReverseLookupWorkflow({ fluid, unitSystem, lookupKey: "h", P, lookupValue: h });
    phase = reverse.items.find((item) => item.label === "Phase Region")?.value || "Unknown";
    items = items.concat(reverse.items);
    steps.push(...reverse.steps);
  } else if (knownPair === "Ps") {
    const reverse = solveReverseLookupWorkflow({ fluid, unitSystem, lookupKey: "s", P, lookupValue: s });
    phase = reverse.items.find((item) => item.label === "Phase Region")?.value || "Unknown";
    items = items.concat(reverse.items);
    steps.push(...reverse.steps);
  } else {
    throw new Error("Unsupported guided pair. Use TP, Ph, or Ps.");
  }

  const guidance = phaseGuidance(phase);
  items.push({ label: "Recommended Table", value: guidance.table, desc: "What to open next" });
  items.push({ label: "Next Step", value: guidance.next, desc: "How to continue the solution" });
  steps.push(`Step C: Recommended table path -> ${guidance.table}`);
  steps.push(`Step D: Next action -> ${guidance.next}`);

  if (/saturated mixture/i.test(phase)) {
    warnings.push("State is in the two-phase dome; a second property (or quality) is needed for a unique state.");
  }

  return addWorkflowWarnings(
    {
      items,
      steps,
      status: `Guided state identification completed for ${fluid}.`,
    },
    warnings,
  );
}

function solvePhaseCheckWorkflow({ fluid, unitSystem, T, P, qualityProperty, qualityValue }) {
  const satTable = getWorkflowSatTable(fluid, unitSystem);
  if (!satTable) {
    throw new Error(`No saturated table found for ${fluid} (${unitSystem}).`);
  }

  const satProps = ["P", "vf", "vfg", "vg", "uf", "ufg", "ug", "hf", "hfg", "hg", "sf", "sfg", "sg"];
  const satLookup = interpolate1D(satTable.rows, "T", T, satProps);
  const sat = satLookup.values;

  if (!Number.isFinite(sat.P)) {
    throw new Error("Saturation pressure was not found at the selected temperature.");
  }

  const pSat = sat.P;
  const deltaP = P - pSat;
  const deltaPct = safeRatio(deltaP, pSat);
  const tolerance = Math.max(1e-4, Math.abs(pSat) * 0.01);
  const warnings = [];
  let region = "Saturated mixture region";

  if (P > pSat + tolerance) {
    region = "Compressed liquid (subcooled)";
  } else if (P < pSat - tolerance) {
    region = "Superheated vapor";
  }

  const steps = [];
  steps.push(`From saturated table at T=${formatNumber(T)}, Psat=${formatNumber(pSat)}.`);
  steps.push(`Compare given P=${formatNumber(P)} against Psat with tolerance ${formatNumber(tolerance)}.`);
  steps.push(`Phase decision: ${region}.`);

  let quality = null;
  if (qualityProperty !== "none") {
    const map = QUALITY_PROPERTY_MAP[qualityProperty];
    if (!map) {
      throw new Error("Unsupported quality property selected.");
    }
    if (!Number.isFinite(qualityValue)) {
      throw new Error(`Enter a ${map.label} value to compute quality.`);
    }
    if (!Number.isFinite(sat[map.f]) || !Number.isFinite(sat[map.fg]) || Math.abs(sat[map.fg]) < 1e-12) {
      throw new Error(`Could not compute quality from ${qualityProperty}; saturation data is incomplete.`);
    }
    quality = (qualityValue - sat[map.f]) / sat[map.fg];
    steps.push(
      `Quality from ${qualityProperty}: x = (${formatNumber(qualityValue)} - ${formatNumber(sat[map.f])}) / ${formatNumber(sat[map.fg])} = ${formatNumber(quality)}.`,
    );
    steps.push(`Quality interpretation: ${qualityRegionFromX(quality)}.`);
  }

  const items = [
    { label: "Phase Region", value: region, desc: "From P vs Psat(T)" },
    { label: "Psat at T", value: pSat, desc: "Saturation pressure", unit: satTable.inputs.P?.unit || "" },
    { label: "Delta P", value: deltaP, desc: "P - Psat" },
    { label: "Delta P %", value: Number.isFinite(deltaPct) ? deltaPct * 100 : null, desc: "Relative pressure offset", unit: "%" },
  ];

  if (Number.isFinite(quality)) {
    items.push({ label: "Quality x", value: quality, desc: qualityRegionFromX(quality) });

    for (const [baseProp, map] of Object.entries(QUALITY_PROPERTY_MAP)) {
      if (Number.isFinite(sat[map.f]) && Number.isFinite(sat[map.fg])) {
        items.push({
          label: `${baseProp} (from x)`,
          value: sat[map.f] + quality * sat[map.fg],
          desc: `${map.f} + x*${map.fg}`,
        });
      }
    }

    if (quality < 0 || quality > 1) {
      warnings.push("Quality is outside 0..1, which is not physically valid for a two-phase mixture.");
    }
  }

  if (Number.isFinite(P) && P <= 0) {
    warnings.push("Pressure should be positive for a physical state.");
  }

  if (/Saturated mixture/i.test(region) && !Number.isFinite(quality)) {
    warnings.push("Region is saturated; add one more property (or x) to locate a unique state.");
  }

  return addWorkflowWarnings(
    {
      items,
      steps,
      status: `Phase workflow solved for ${fluid}.`,
    },
    warnings,
  );
}

function solveTwoPhaseWorkflow({ fluid, unitSystem, basis, basisValue, qualityMode, xInput, qualityProperty, qualityPropertyValue }) {
  const satTable = getWorkflowSatTable(fluid, unitSystem);
  if (!satTable) {
    throw new Error(`No saturated table found for ${fluid} (${unitSystem}).`);
  }

  const satProps = ["T", "P", "vf", "vfg", "vg", "uf", "ufg", "ug", "hf", "hfg", "hg", "sf", "sfg", "sg"];
  const satLookup = interpolate1D(satTable.rows, basis, basisValue, satProps);
  const sat = satLookup.values;
  const warnings = [];
  const steps = [];
  steps.push(`Saturation lookup using ${basis}=${formatNumber(basisValue)}.`);
  steps.push(`Resolved state: Tsat=${formatNumber(sat.T)}, Psat=${formatNumber(sat.P)}.`);

  let quality = null;
  if (qualityMode === "given-x") {
    if (!Number.isFinite(xInput)) {
      throw new Error("Quality x is required when quality mode is 'given x'.");
    }
    quality = xInput;
    steps.push(`Using provided quality x=${formatNumber(quality)}.`);
  } else {
    const map = QUALITY_PROPERTY_MAP[qualityProperty];
    if (!map) {
      throw new Error("Select a valid property to compute quality.");
    }
    if (!Number.isFinite(qualityPropertyValue)) {
      throw new Error(`Enter a ${map.label} value to compute quality.`);
    }
    if (!Number.isFinite(sat[map.f]) || !Number.isFinite(sat[map.fg]) || Math.abs(sat[map.fg]) < 1e-12) {
      throw new Error(`Could not compute quality from ${qualityProperty}; saturation data is incomplete.`);
    }
    quality = (qualityPropertyValue - sat[map.f]) / sat[map.fg];
    steps.push(
      `Computed quality from ${qualityProperty}: x = (${formatNumber(qualityPropertyValue)} - ${formatNumber(sat[map.f])}) / ${formatNumber(sat[map.fg])} = ${formatNumber(quality)}.`,
    );
  }

  const items = [
    { label: "Tsat", value: sat.T, desc: "Saturation temperature" },
    { label: "Psat", value: sat.P, desc: "Saturation pressure" },
    { label: "Quality x", value: quality, desc: qualityRegionFromX(quality) },
    { label: "Region", value: qualityRegionFromX(quality), desc: "From quality" },
  ];

  for (const [baseProp, map] of Object.entries(QUALITY_PROPERTY_MAP)) {
    if (Number.isFinite(sat[map.f]) && Number.isFinite(sat[map.fg])) {
      items.push({
        label: baseProp,
        value: sat[map.f] + quality * sat[map.fg],
        desc: `${map.f} + x*${map.fg}`,
      });
      steps.push(`${baseProp} = ${map.f} + x*${map.fg}.`);
    }
  }

  if (quality < 0 || quality > 1) {
    warnings.push("Quality is outside 0..1, so this is not a physically valid saturated-mixture state.");
  }

  return addWorkflowWarnings(
    {
      items,
      steps,
      status: `Two-phase workflow solved for ${fluid}.`,
    },
    warnings,
  );
}

function solveIsentropicDeviceWorkflow({ fluid, unitSystem, device, P1, T1, P2, eta }) {
  const ptTable = getWorkflowPtTable(fluid, unitSystem);
  if (!ptTable) {
    throw new Error(`No PT table found for ${fluid} (${unitSystem}).`);
  }
  if (!Number.isFinite(eta) || eta <= 0) {
    throw new Error("Isentropic efficiency must be a positive value.");
  }

  const inlet = interpolatePT(ptTable, T1, P1, ["T", "P", "h", "s", "u", "v"]);
  const h1 = inlet.values.h;
  const s1 = inlet.values.s;
  if (!Number.isFinite(h1) || !Number.isFinite(s1)) {
    throw new Error("Inlet h and s could not be resolved at state 1.");
  }

  const isentropicExit = interpolatePTByProperty(ptTable, P2, "s", s1, ["T", "P", "h", "s", "u", "v"]);
  const h2s = isentropicExit.values.h;
  if (!Number.isFinite(h2s)) {
    throw new Error("Could not resolve isentropic exit enthalpy h2s.");
  }

  const warnings = [];
  let h2 = null;
  let specificWorkIsentropic = null;
  let specificWorkActual = null;
  const isTurbine = device === "turbine";

  if (isTurbine) {
    specificWorkIsentropic = h1 - h2s;
    h2 = h1 - eta * specificWorkIsentropic;
    specificWorkActual = h1 - h2;
  } else {
    specificWorkIsentropic = h2s - h1;
    h2 = h1 + specificWorkIsentropic / eta;
    specificWorkActual = h2 - h1;
  }

  const steps = [];
  steps.push(`State 1 from PT lookup at T1=${formatNumber(T1)}, P1=${formatNumber(P1)} -> h1=${formatNumber(h1)}, s1=${formatNumber(s1)}.`);
  steps.push(`Isentropic condition: s2s = s1 = ${formatNumber(s1)} at P2=${formatNumber(P2)}.`);
  steps.push(`Resolved h2s=${formatNumber(h2s)} from reverse lookup (P + s).`);
  if (isTurbine) {
    steps.push(`Turbine efficiency: eta_t = (h1-h2)/(h1-h2s), so h2 = h1 - eta_t*(h1-h2s).`);
  } else {
    steps.push(`Compressor efficiency: eta_c = (h2s-h1)/(h2-h1), so h2 = h1 + (h2s-h1)/eta_c.`);
  }
  steps.push(`Computed actual exit enthalpy h2=${formatNumber(h2)}.`);

  let actualExit = null;
  let actualExitNote = null;
  try {
    actualExit = interpolatePTByProperty(ptTable, P2, "h", h2, ["T", "P", "h", "s", "u", "v"]).values;
    steps.push(`Recovered actual exit state from reverse lookup (P + h).`);
  } catch (error) {
    actualExitNote = `Actual exit T/s not recovered from table range: ${error.message}`;
    steps.push(actualExitNote);
  }

  const items = [
    { label: "h1", value: h1, desc: "Inlet enthalpy" },
    { label: "s1", value: s1, desc: "Inlet entropy" },
    { label: "h2s", value: h2s, desc: "Isentropic exit enthalpy" },
    { label: "h2", value: h2, desc: "Actual exit enthalpy" },
    { label: "w_is", value: specificWorkIsentropic, desc: "Isentropic specific work" },
    { label: "w_actual", value: specificWorkActual, desc: "Actual specific work" },
    { label: "eta_is", value: eta, desc: "Input isentropic efficiency" },
  ];

  if (actualExit && Number.isFinite(actualExit.T)) {
    items.push({ label: "T2 actual", value: actualExit.T, desc: "Recovered from P + h lookup" });
  }
  if (actualExit && Number.isFinite(actualExit.s)) {
    items.push({ label: "s2 actual", value: actualExit.s, desc: "Recovered from P + h lookup" });
  }
  if (actualExitNote) {
    items.push({ label: "State note", value: actualExitNote, desc: "Range warning" });
    warnings.push(actualExitNote);
  }

  if (eta > 1) {
    warnings.push("Isentropic efficiency greater than 1 is typically non-physical.");
  }
  if (isTurbine && P2 >= P1) {
    warnings.push("Turbines usually expand, so outlet pressure is expected to be lower than inlet pressure.");
  }
  if (!isTurbine && P2 <= P1) {
    warnings.push("Compressors usually raise pressure, so outlet pressure is expected to be higher than inlet pressure.");
  }
  if (actualExit && Number.isFinite(actualExit.s) && actualExit.s < s1 - 1e-6 && eta < 1) {
    warnings.push("Entropy decreased across an irreversible device; check inputs and selected tables.");
  }

  return addWorkflowWarnings(
    {
      items,
      steps,
      status: `Isentropic ${isTurbine ? "turbine" : "compressor"} workflow solved for ${fluid}.`,
    },
    warnings,
  );
}

function solvePropertyDeltaWorkflow({ fluid, unitSystem, T1, P1, T2, P2 }) {
  const ptTable = getWorkflowPtTable(fluid, unitSystem);
  if (!ptTable) {
    throw new Error(`No PT table found for ${fluid} (${unitSystem}).`);
  }

  const st1 = interpolatePT(ptTable, T1, P1, ["T", "P", "h", "s", "u", "v"]).values;
  const st2 = interpolatePT(ptTable, T2, P2, ["T", "P", "h", "s", "u", "v"]).values;

  const delta = {
    h: Number.isFinite(st2.h) && Number.isFinite(st1.h) ? st2.h - st1.h : null,
    s: Number.isFinite(st2.s) && Number.isFinite(st1.s) ? st2.s - st1.s : null,
    u: Number.isFinite(st2.u) && Number.isFinite(st1.u) ? st2.u - st1.u : null,
    v: Number.isFinite(st2.v) && Number.isFinite(st1.v) ? st2.v - st1.v : null,
  };

  const steps = [];
  steps.push(`State 1 lookup at T1=${formatNumber(T1)}, P1=${formatNumber(P1)}.`);
  steps.push(`State 2 lookup at T2=${formatNumber(T2)}, P2=${formatNumber(P2)}.`);
  steps.push("Compute deltas with Delta(property) = property_2 - property_1.");

  const items = [
    { label: "h1", value: st1.h, desc: "State 1 enthalpy" },
    { label: "h2", value: st2.h, desc: "State 2 enthalpy" },
    { label: "Delta h", value: delta.h, desc: "h2 - h1" },
    { label: "Delta s", value: delta.s, desc: "s2 - s1" },
    { label: "Delta u", value: delta.u, desc: "u2 - u1" },
    { label: "Delta v", value: delta.v, desc: "v2 - v1" },
  ];

  return {
    items,
    steps,
    status: `Property-change workflow solved for ${fluid}.`,
  };
}

function workflowReferenceTable(workflowType, fluid, unitSystem) {
  if (!fluid || !unitSystem) {
    return null;
  }
  if (workflowType === "phase-check" || workflowType === "two-phase") {
    return getWorkflowSatTable(fluid, unitSystem);
  }
  return getWorkflowPtTable(fluid, unitSystem);
}

function populateWorkflowTypeSelect() {
  const current = state.workflow.type;
  el.workflowTypeSelect.innerHTML = "";
  for (const workflow of WORKFLOW_TYPES) {
    const option = document.createElement("option");
    option.value = workflow.id;
    option.textContent = workflow.label;
    el.workflowTypeSelect.appendChild(option);
  }
  el.workflowTypeSelect.value = WORKFLOW_TYPES.some((item) => item.id === current) ? current : WORKFLOW_TYPES[0].id;
  state.workflow.type = el.workflowTypeSelect.value;
}

function populateWorkflowFluidSelect(preserveFluid = null) {
  const fluids = workflowFluidsForType(state.workflow.type);
  el.workflowFluidSelect.innerHTML = "";

  if (fluids.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "No compatible fluid";
    el.workflowFluidSelect.appendChild(option);
    el.workflowFluidSelect.value = "";
    return;
  }

  for (const fluid of fluids) {
    const option = document.createElement("option");
    option.value = fluid;
    option.textContent = fluid;
    el.workflowFluidSelect.appendChild(option);
  }

  const canPreserve = preserveFluid && fluids.includes(preserveFluid);
  el.workflowFluidSelect.value = canPreserve ? preserveFluid : fluids[0];
}

function populateWorkflowUnitSelect(preserveUnit = null) {
  const fluid = el.workflowFluidSelect.value;
  el.workflowUnitSelect.innerHTML = "";

  if (!fluid) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "No compatible units";
    el.workflowUnitSelect.appendChild(option);
    el.workflowUnitSelect.value = "";
    return;
  }

  const units = workflowUnitsForType(fluid, state.workflow.type);

  if (units.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "No compatible units";
    el.workflowUnitSelect.appendChild(option);
    el.workflowUnitSelect.value = "";
    return;
  }

  for (const unit of units) {
    const option = document.createElement("option");
    option.value = unit;
    option.textContent = unit;
    el.workflowUnitSelect.appendChild(option);
  }

  const canPreserve = preserveUnit && units.includes(preserveUnit);
  el.workflowUnitSelect.value = canPreserve ? preserveUnit : units[0];
}

function renderWorkflowFields() {
  const fluid = el.workflowFluidSelect.value;
  const unitSystem = el.workflowUnitSelect.value;
  const table = workflowReferenceTable(state.workflow.type, fluid, unitSystem);

  if (!table) {
    el.workflowFields.innerHTML = '<p class="validation-msg warn">No compatible table for this fluid/unit workflow combination.</p>';
    el.workflowBtn.disabled = true;
    setWorkflowValidationMessage("Select a fluid and unit system with compatible tables.", "warn");
    return;
  }

  el.workflowBtn.disabled = false;
  const tRange = table.inputs.T;
  const pRangeInput = table.inputs.P;
  const pRangeRows = valueRangeForRows(table.rows, "P");
  const pRange = pRangeInput || pRangeRows;
  const tRangeText = tRange ? `${formatNumber(tRange.min)} to ${formatNumber(tRange.max)}` : "table range";
  const pRangeText = pRange ? `${formatNumber(pRange.min)} to ${formatNumber(pRange.max)}` : "table range";

  if (state.workflow.type === "phase-check") {
    el.workflowFields.innerHTML = `
      <div class="query-field">
        <label for="wfPhaseT">Temperature T (${tRangeText})</label>
        <input id="wfPhaseT" type="number" step="any" placeholder="Known T" />
      </div>
      <div class="query-field">
        <label for="wfPhaseP">Pressure P (${pRangeText})</label>
        <input id="wfPhaseP" type="number" step="any" placeholder="Known P" />
      </div>
      <div class="query-field">
        <label for="wfPhaseQualityProp">Optional quality property</label>
        <select id="wfPhaseQualityProp">
          <option value="none">No quality calculation</option>
          <option value="h">h-based quality</option>
          <option value="s">s-based quality</option>
          <option value="u">u-based quality</option>
          <option value="v">v-based quality</option>
        </select>
      </div>
      <div class="query-field">
        <label for="wfPhaseQualityValue">Optional property value</label>
        <input id="wfPhaseQualityValue" type="number" step="any" placeholder="Value used for x" />
      </div>
    `;
    setWorkflowValidationMessage("Provide T and P to classify phase. Optional property can estimate quality x.");
    return;
  }

  if (state.workflow.type === "two-phase") {
    el.workflowFields.innerHTML = `
      <div class="query-field">
        <label for="wfTwoPhaseBasis">Saturation basis</label>
        <select id="wfTwoPhaseBasis">
          <option value="T">Known T</option>
          <option value="P">Known P</option>
        </select>
      </div>
      <div class="query-field">
        <label for="wfTwoPhaseBasisValue">Saturation value (T or P)</label>
        <input id="wfTwoPhaseBasisValue" type="number" step="any" placeholder="Known T or P" />
      </div>
      <div class="query-field">
        <label for="wfTwoPhaseQualityMode">Quality input mode</label>
        <select id="wfTwoPhaseQualityMode">
          <option value="given-x">Given quality x</option>
          <option value="from-property">Compute x from property</option>
        </select>
      </div>
      <div class="query-field">
        <label for="wfTwoPhaseX">Quality x (if given)</label>
        <input id="wfTwoPhaseX" type="number" step="any" placeholder="0 to 1" />
      </div>
      <div class="query-field">
        <label for="wfTwoPhaseQualityProp">Property for x (if computed)</label>
        <select id="wfTwoPhaseQualityProp">
          <option value="h">h</option>
          <option value="s">s</option>
          <option value="u">u</option>
          <option value="v">v</option>
        </select>
      </div>
      <div class="query-field">
        <label for="wfTwoPhaseQualityValue">Property value (if computed)</label>
        <input id="wfTwoPhaseQualityValue" type="number" step="any" placeholder="Known h, s, u, or v" />
      </div>
    `;
    setWorkflowValidationMessage("Use given x or compute x from a known two-phase property.");
    return;
  }

  if (state.workflow.type === "reverse-lookup") {
    el.workflowFields.innerHTML = `
      <div class="query-field">
        <label for="wfReverseKey">Known property with pressure</label>
        <select id="wfReverseKey">
          <option value="h">P + h (find T, phase)</option>
          <option value="s">P + s (find T, phase)</option>
        </select>
      </div>
      <div class="query-field">
        <label for="wfReverseP">Pressure P (${pRangeText})</label>
        <input id="wfReverseP" type="number" step="any" placeholder="Known P" />
      </div>
      <div class="query-field">
        <label for="wfReverseValue">Known property value (${unitSystem})</label>
        <input id="wfReverseValue" type="number" step="any" placeholder="Known h or s" />
      </div>
    `;
    setWorkflowValidationMessage("Reverse lookup solves unknown temperature/phase from a pressure-property pair.");
    return;
  }

  if (state.workflow.type === "state-guide") {
    el.workflowFields.innerHTML = `
      <div class="query-field">
        <label for="wfGuidePair">Known property pair</label>
        <select id="wfGuidePair">
          <option value="TP">T + P</option>
          <option value="Ph">P + h</option>
          <option value="Ps">P + s</option>
        </select>
      </div>
      <div class="query-field">
        <label for="wfGuideT">Temperature T (${tRangeText}, only for T+P)</label>
        <input id="wfGuideT" type="number" step="any" placeholder="Known T" />
      </div>
      <div class="query-field">
        <label for="wfGuideP">Pressure P (${pRangeText})</label>
        <input id="wfGuideP" type="number" step="any" placeholder="Known P" />
      </div>
      <div class="query-field">
        <label for="wfGuideH">Enthalpy h (only for P+h)</label>
        <input id="wfGuideH" type="number" step="any" placeholder="Known h" />
      </div>
      <div class="query-field">
        <label for="wfGuideS">Entropy s (only for P+s)</label>
        <input id="wfGuideS" type="number" step="any" placeholder="Known s" />
      </div>
    `;
    setWorkflowValidationMessage("Guided flow: identify phase first, then choose the right table and next equation.");
    return;
  }

  if (state.workflow.type === "isentropic-device") {
    el.workflowFields.innerHTML = `
      <div class="query-field">
        <label for="wfIsoDevice">Device</label>
        <select id="wfIsoDevice">
          <option value="turbine">Turbine</option>
          <option value="compressor">Compressor</option>
        </select>
      </div>
      <div class="query-field">
        <label for="wfIsoP1">Inlet pressure P1 (${pRangeText})</label>
        <input id="wfIsoP1" type="number" step="any" placeholder="P1" />
      </div>
      <div class="query-field">
        <label for="wfIsoT1">Inlet temperature T1 (${tRangeText})</label>
        <input id="wfIsoT1" type="number" step="any" placeholder="T1" />
      </div>
      <div class="query-field">
        <label for="wfIsoP2">Exit pressure P2 (${pRangeText})</label>
        <input id="wfIsoP2" type="number" step="any" placeholder="P2" />
      </div>
      <div class="query-field">
        <label for="wfIsoEta">Isentropic efficiency eta (default 1.0)</label>
        <input id="wfIsoEta" type="number" step="any" placeholder="e.g. 0.85" />
      </div>
    `;
    setWorkflowValidationMessage("Solve s1 = s2s first, then apply device efficiency to get actual exit state.");
    return;
  }

  el.workflowFields.innerHTML = `
    <div class="query-field">
      <label for="wfDeltaP1">State 1 pressure P1 (${pRangeText})</label>
      <input id="wfDeltaP1" type="number" step="any" placeholder="P1" />
    </div>
    <div class="query-field">
      <label for="wfDeltaT1">State 1 temperature T1 (${tRangeText})</label>
      <input id="wfDeltaT1" type="number" step="any" placeholder="T1" />
    </div>
    <div class="query-field">
      <label for="wfDeltaP2">State 2 pressure P2 (${pRangeText})</label>
      <input id="wfDeltaP2" type="number" step="any" placeholder="P2" />
    </div>
    <div class="query-field">
      <label for="wfDeltaT2">State 2 temperature T2 (${tRangeText})</label>
      <input id="wfDeltaT2" type="number" step="any" placeholder="T2" />
    </div>
  `;
  setWorkflowValidationMessage("Compute delta values directly from two PT states.");
}

function refreshWorkflowControls({ preserveFluid = null, preserveUnit = null } = {}) {
  populateWorkflowFluidSelect(preserveFluid);
  populateWorkflowUnitSelect(preserveUnit);
  renderWorkflowFields();
}

function handleWorkflowSubmit(event) {
  event.preventDefault();
  const workflowType = state.workflow.type;
  const fluid = el.workflowFluidSelect.value;
  const unitSystem = el.workflowUnitSelect.value;

  if (!fluid || !unitSystem) {
    setWorkflowValidationMessage("Select a compatible fluid and unit system first.", "error");
    setWorkflowStatus("Workflow cannot run without a valid fluid/unit selection.", "error");
    return;
  }

  try {
    let solved = null;

    if (workflowType === "phase-check") {
      const T = parseWorkflowNumberInput("wfPhaseT", "Temperature T");
      const P = parseWorkflowNumberInput("wfPhaseP", "Pressure P");
      const qualityProperty = document.getElementById("wfPhaseQualityProp").value;
      const qualityValue = parseWorkflowNumberInput("wfPhaseQualityValue", "Quality property value", false);
      solved = solvePhaseCheckWorkflow({ fluid, unitSystem, T, P, qualityProperty, qualityValue });
    } else if (workflowType === "two-phase") {
      const basis = document.getElementById("wfTwoPhaseBasis").value;
      const basisValue = parseWorkflowNumberInput("wfTwoPhaseBasisValue", `${basis} value`);
      const qualityMode = document.getElementById("wfTwoPhaseQualityMode").value;
      const xInput = parseWorkflowNumberInput("wfTwoPhaseX", "Quality x", false);
      const qualityProperty = document.getElementById("wfTwoPhaseQualityProp").value;
      const qualityPropertyValue = parseWorkflowNumberInput("wfTwoPhaseQualityValue", "Quality property value", false);
      solved = solveTwoPhaseWorkflow({
        fluid,
        unitSystem,
        basis,
        basisValue,
        qualityMode,
        xInput,
        qualityProperty,
        qualityPropertyValue,
      });
    } else if (workflowType === "reverse-lookup") {
      const lookupKey = document.getElementById("wfReverseKey").value;
      const P = parseWorkflowNumberInput("wfReverseP", "Pressure P");
      const lookupValue = parseWorkflowNumberInput("wfReverseValue", `Known ${lookupKey} value`);
      solved = solveReverseLookupWorkflow({ fluid, unitSystem, lookupKey, P, lookupValue });
    } else if (workflowType === "state-guide") {
      const knownPair = document.getElementById("wfGuidePair").value;
      const T = parseWorkflowNumberInput("wfGuideT", "Temperature T", false);
      const P = parseWorkflowNumberInput("wfGuideP", "Pressure P", false);
      const h = parseWorkflowNumberInput("wfGuideH", "Enthalpy h", false);
      const s = parseWorkflowNumberInput("wfGuideS", "Entropy s", false);

      if (knownPair === "TP" && (!Number.isFinite(T) || !Number.isFinite(P))) {
        throw new Error("For T + P guidance, enter both temperature and pressure.");
      }
      if (knownPair === "Ph" && (!Number.isFinite(P) || !Number.isFinite(h))) {
        throw new Error("For P + h guidance, enter both pressure and enthalpy.");
      }
      if (knownPair === "Ps" && (!Number.isFinite(P) || !Number.isFinite(s))) {
        throw new Error("For P + s guidance, enter both pressure and entropy.");
      }

      solved = solveStateGuideWorkflow({
        fluid,
        unitSystem,
        knownPair,
        T,
        P,
        h,
        s,
      });
    } else if (workflowType === "isentropic-device") {
      const device = document.getElementById("wfIsoDevice").value;
      const P1 = parseWorkflowNumberInput("wfIsoP1", "Inlet pressure P1");
      const T1 = parseWorkflowNumberInput("wfIsoT1", "Inlet temperature T1");
      const P2 = parseWorkflowNumberInput("wfIsoP2", "Exit pressure P2");
      const etaInput = parseWorkflowNumberInput("wfIsoEta", "Isentropic efficiency", false);
      const eta = Number.isFinite(etaInput) ? etaInput : 1;
      solved = solveIsentropicDeviceWorkflow({ fluid, unitSystem, device, P1, T1, P2, eta });
    } else {
      const P1 = parseWorkflowNumberInput("wfDeltaP1", "State 1 pressure P1");
      const T1 = parseWorkflowNumberInput("wfDeltaT1", "State 1 temperature T1");
      const P2 = parseWorkflowNumberInput("wfDeltaP2", "State 2 pressure P2");
      const T2 = parseWorkflowNumberInput("wfDeltaT2", "State 2 temperature T2");
      solved = solvePropertyDeltaWorkflow({ fluid, unitSystem, T1, P1, T2, P2 });
    }

    renderWorkflowResults(solved.items, solved.steps);
    setWorkflowValidationMessage(`${workflowTypeLabel(workflowType)} solved.`);
    setWorkflowStatus(solved.status || "Workflow solved.", "ok");
  } catch (error) {
    clearWorkflowResults();
    setWorkflowValidationMessage(error.message, "error");
    setWorkflowStatus(error.message, "error");
    renderWorkflowSteps([error.message]);
  }
}

function wireWorkflowEvents() {
  el.workflowTypeSelect.addEventListener("change", () => {
    const previousFluid = el.workflowFluidSelect.value;
    const previousUnit = el.workflowUnitSelect.value;
    state.workflow.type = el.workflowTypeSelect.value;
    refreshWorkflowControls({ preserveFluid: previousFluid, preserveUnit: previousUnit });
    clearWorkflowResults();
    setWorkflowStatus(`Workflow ready: ${workflowTypeLabel(state.workflow.type)}.`);
  });

  el.workflowFluidSelect.addEventListener("change", () => {
    const previousUnit = el.workflowUnitSelect.value;
    populateWorkflowUnitSelect(previousUnit);
    renderWorkflowFields();
    clearWorkflowResults();
    setWorkflowStatus(`Workflow ready: ${workflowTypeLabel(state.workflow.type)}.`);
  });

  el.workflowUnitSelect.addEventListener("change", () => {
    renderWorkflowFields();
    clearWorkflowResults();
    setWorkflowStatus(`Workflow ready: ${workflowTypeLabel(state.workflow.type)}.`);
  });

  el.workflowForm.addEventListener("submit", handleWorkflowSubmit);
}
function findBestTable({ mode = null, fluidRegex = null, unitSystem = "SI", sheetRegex = null }) {
  let candidates = state.tables.filter((table) => {
    if (mode && table.mode !== mode) {
      return false;
    }
    if (unitSystem && table.unit_system !== unitSystem) {
      return false;
    }
    if (fluidRegex && !fluidRegex.test(table.fluid)) {
      return false;
    }
    return true;
  });

  if (sheetRegex) {
    const narrowed = candidates.filter((table) => sheetRegex.test(table.sheet_name));
    if (narrowed.length > 0) {
      candidates = narrowed;
    }
  }

  candidates.sort((a, b) => b.row_count - a.row_count);
  return candidates[0] || null;
}

function findTemplateBuilder(templateId) {
  if (templateId === "rankine-ideal") {
    return buildIdealRankineTemplate;
  }
  if (templateId === "rankine-reheat") {
    return buildRankineReheatTemplate;
  }
  if (templateId === "vcr") {
    return buildVcrTemplate;
  }
  if (templateId === "brayton") {
    return buildBraytonTemplate;
  }
  if (templateId === "steam-loop") {
    return buildSteamLoopTemplate;
  }
  return null;
}

function cycleInputSchema(templateId) {
  return CYCLE_INPUT_SCHEMAS[templateId] || [];
}

function cycleMetricSchema(templateId) {
  return CYCLE_TARGET_METRICS[templateId] || [];
}

function defaultCycleInputs(templateId) {
  const defaults = {};
  for (const field of cycleInputSchema(templateId)) {
    defaults[field.key] = field.defaultValue;
  }
  return defaults;
}

function normalizedEfficiency(value, label) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be greater than 0.`);
  }
  return value;
}

function mergeCycleInputs(templateId, inputOverride = null) {
  const base = defaultCycleInputs(templateId);
  if (!inputOverride) {
    return base;
  }

  const merged = { ...base };
  for (const field of cycleInputSchema(templateId)) {
    const value = inputOverride[field.key];
    if (Number.isFinite(value)) {
      merged[field.key] = value;
    }
  }
  return merged;
}

function defaultCycleInverseInputs(templateId) {
  const fields = cycleInputSchema(templateId);
  const metrics = cycleMetricSchema(templateId);
  return {
    unknownKey: fields[0]?.key || "",
    targetKey: metrics[0]?.key || "",
    targetValue: "",
    min: "",
    max: "",
    unknownKey2: "none",
    targetKey2: "none",
    targetValue2: "",
    min2: "",
    max2: "",
  };
}

function cycleInverseInputsForTemplate(templateId) {
  if (!state.cycle.inverseInputs[templateId]) {
    state.cycle.inverseInputs[templateId] = defaultCycleInverseInputs(templateId);
  }
  return state.cycle.inverseInputs[templateId];
}

function readCycleInputsFromForm(templateId) {
  const inputs = {};
  for (const field of cycleInputSchema(templateId)) {
    const input = document.getElementById(`cycleInput_${field.key}`);
    if (!input) {
      continue;
    }
    const raw = input.value.trim();
    if (!raw) {
      throw new Error(`${field.label} is required.`);
    }
    const value = Number(raw);
    if (!Number.isFinite(value)) {
      throw new Error(`${field.label} must be numeric.`);
    }
    inputs[field.key] = value;
  }
  return inputs;
}

function readCycleInputsFromFormExcludingKeys(templateId, excludedKeys) {
  const excludeSet = new Set(excludedKeys);
  const inputs = {};
  for (const field of cycleInputSchema(templateId)) {
    if (excludeSet.has(field.key)) {
      continue;
    }
    const input = document.getElementById(`cycleInput_${field.key}`);
    if (!input) {
      continue;
    }
    const raw = input.value.trim();
    if (!raw) {
      throw new Error(`${field.label} is required.`);
    }
    const value = Number(raw);
    if (!Number.isFinite(value)) {
      throw new Error(`${field.label} must be numeric.`);
    }
    inputs[field.key] = value;
  }
  return inputs;
}

function parseOptionalCycleNumber(valueText, label) {
  const raw = String(valueText || "").trim();
  if (!raw) {
    return null;
  }
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    throw new Error(`${label} must be numeric.`);
  }
  return value;
}

function renderCycleInputFields(templateId) {
  if (!el.cycleInputFields) {
    return;
  }

  const schema = cycleInputSchema(templateId);
  el.cycleInputFields.innerHTML = "";

  if (schema.length === 0) {
    setCycleInputMessage("No configurable inputs for this template.");
    return;
  }

  const current = mergeCycleInputs(templateId, state.cycle.templateInputs[templateId] || null);
  for (const field of schema) {
    const wrap = document.createElement("div");
    wrap.className = "query-field";
    wrap.innerHTML = `
      <label for="cycleInput_${field.key}">${field.label}</label>
      <input id="cycleInput_${field.key}" type="number" step="${field.step || "any"}" value="${String(current[field.key])}" />
    `;
    el.cycleInputFields.appendChild(wrap);
  }

  setCycleInputMessage("Update inputs and click Solve Cycle.");
}

function safeFiniteFromInput(inputEl) {
  if (!inputEl) {
    return { present: false, valid: true, value: null };
  }
  const raw = inputEl.value.trim();
  if (!raw) {
    return { present: false, valid: true, value: null };
  }
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    return { present: true, valid: false, value: null };
  }
  return { present: true, valid: true, value };
}

function cycleInverseDofState() {
  const unknown1 = el.cycleUnknownSelect?.value || "";
  const unknown2 = el.cycleUnknownSelect2?.value || "none";
  const target1 = el.cycleTargetMetricSelect?.value || "";
  const target2 = el.cycleTargetMetricSelect2?.value || "none";

  const targetValue1 = safeFiniteFromInput(el.cycleTargetValue);
  const targetValue2 = safeFiniteFromInput(el.cycleTargetValue2);

  if (targetValue1.present && !targetValue1.valid) {
    return { canSolve: false, kind: "error", message: "Target value #1 must be numeric.", unknownCount: 0, equationCount: 0 };
  }
  if (targetValue2.present && !targetValue2.valid) {
    return { canSolve: false, kind: "error", message: "Target value #2 must be numeric.", unknownCount: 0, equationCount: 0 };
  }

  const unknownCount = (unknown1 && unknown1 !== "none" ? 1 : 0) + (unknown2 && unknown2 !== "none" ? 1 : 0);

  if (!unknown1 || unknown1 === "none") {
    return { canSolve: false, kind: "warn", message: "Select unknown input #1.", unknownCount, equationCount: 0 };
  }
  if (unknown2 !== "none" && unknown2 === unknown1) {
    return { canSolve: false, kind: "warn", message: "Unknown inputs must be different.", unknownCount, equationCount: 0 };
  }

  if (!target1 || target1 === "none") {
    return { canSolve: false, kind: "warn", message: "Select target metric #1.", unknownCount, equationCount: 0 };
  }
  if (!targetValue1.present) {
    return { canSolve: false, kind: "warn", message: "Enter target value #1.", unknownCount, equationCount: 0 };
  }

  const target2Requested = (target2 && target2 !== "none") || targetValue2.present;
  if (target2Requested) {
    if (target2 === "none") {
      return { canSolve: false, kind: "warn", message: "Choose target metric #2 or clear target value #2.", unknownCount, equationCount: 1 };
    }
    if (!targetValue2.present) {
      return { canSolve: false, kind: "warn", message: "Enter target value #2 for the second equation.", unknownCount, equationCount: 1 };
    }
  }

  if (target2 !== "none" && target2 === target1) {
    return { canSolve: false, kind: "warn", message: "Target metrics must be different.", unknownCount, equationCount: 1 };
  }

  const equationCount = 1 + (target2Requested ? 1 : 0);
  if (unknownCount !== equationCount) {
    return {
      canSolve: false,
      kind: "warn",
      message: `DOF mismatch: ${unknownCount} unknown(s), ${equationCount} equation(s).`,
      unknownCount,
      equationCount,
    };
  }

  return {
    canSolve: true,
    kind: "ok",
    message: `DOF balanced: ${unknownCount} unknown(s), ${equationCount} equation(s). Ready to solve.`,
    unknownCount,
    equationCount,
  };
}

function refreshCycleDofStatus(validConfig = true) {
  if (!validConfig) {
    setCycleDofMessage("DOF check unavailable for this template.", "warn");
    if (el.solveUnknownBtn) {
      el.solveUnknownBtn.disabled = true;
    }
    return;
  }

  const status = cycleInverseDofState();
  setCycleDofMessage(status.message, status.kind);
  if (el.solveUnknownBtn) {
    el.solveUnknownBtn.disabled = !status.canSolve;
  }
}

function renderCycleInverseControls(templateId) {
  if (!el.cycleUnknownSelect || !el.cycleTargetMetricSelect || !el.cycleUnknownSelect2 || !el.cycleTargetMetricSelect2) {
    return;
  }

  const fields = cycleInputSchema(templateId);
  const metrics = cycleMetricSchema(templateId);
  const config = cycleInverseInputsForTemplate(templateId);

  if (!fields.some((field) => field.key === config.unknownKey)) {
    config.unknownKey = fields[0]?.key || "";
  }
  if (!metrics.some((metric) => metric.key === config.targetKey)) {
    config.targetKey = metrics[0]?.key || "";
  }
  if (!fields.some((field) => field.key === config.unknownKey2)) {
    config.unknownKey2 = "none";
  }
  if (!metrics.some((metric) => metric.key === config.targetKey2)) {
    config.targetKey2 = "none";
  }

  el.cycleUnknownSelect.innerHTML = "";
  for (const field of fields) {
    const option = document.createElement("option");
    option.value = field.key;
    option.textContent = field.label;
    el.cycleUnknownSelect.appendChild(option);
  }
  el.cycleUnknownSelect2.innerHTML = '<option value="none">None</option>';
  for (const field of fields) {
    const option = document.createElement("option");
    option.value = field.key;
    option.textContent = field.label;
    el.cycleUnknownSelect2.appendChild(option);
  }

  el.cycleTargetMetricSelect.innerHTML = "";
  for (const metric of metrics) {
    const suffix = metric.unit && metric.unit !== "-" ? ` [${metric.unit}]` : "";
    const option = document.createElement("option");
    option.value = metric.key;
    option.textContent = `${metric.label}${suffix}`;
    el.cycleTargetMetricSelect.appendChild(option);
  }
  el.cycleTargetMetricSelect2.innerHTML = '<option value="none">None</option>';
  for (const metric of metrics) {
    const suffix = metric.unit && metric.unit !== "-" ? ` [${metric.unit}]` : "";
    const option = document.createElement("option");
    option.value = metric.key;
    option.textContent = `${metric.label}${suffix}`;
    el.cycleTargetMetricSelect2.appendChild(option);
  }

  const validConfig = fields.length > 0 && metrics.length > 0;
  el.cycleUnknownSelect.disabled = !validConfig;
  el.cycleTargetMetricSelect.disabled = !validConfig;
  el.cycleTargetValue.disabled = !validConfig;
  el.cycleSolveMin.disabled = !validConfig;
  el.cycleSolveMax.disabled = !validConfig;
  el.cycleUnknownSelect2.disabled = !validConfig;
  el.cycleTargetMetricSelect2.disabled = !validConfig;
  el.cycleTargetValue2.disabled = !validConfig;
  el.cycleSolveMin2.disabled = !validConfig;
  el.cycleSolveMax2.disabled = !validConfig;

  if (!validConfig) {
    setCycleInverseMessage("Unknown solver is unavailable for this template.", "warn");
    refreshCycleDofStatus(false);
    return;
  }

  el.cycleUnknownSelect.value = config.unknownKey;
  el.cycleTargetMetricSelect.value = config.targetKey;
  el.cycleUnknownSelect2.value = config.unknownKey2 || "none";
  el.cycleTargetMetricSelect2.value = config.targetKey2 || "none";
  el.cycleTargetValue.value = Number.isFinite(config.targetValue) ? String(config.targetValue) : "";
  el.cycleSolveMin.value = Number.isFinite(config.min) ? String(config.min) : "";
  el.cycleSolveMax.value = Number.isFinite(config.max) ? String(config.max) : "";
  el.cycleTargetValue2.value = Number.isFinite(config.targetValue2) ? String(config.targetValue2) : "";
  el.cycleSolveMin2.value = Number.isFinite(config.min2) ? String(config.min2) : "";
  el.cycleSolveMax2.value = Number.isFinite(config.max2) ? String(config.max2) : "";

  setCycleInverseMessage("Set 1 unknown + 1 target, or 2 unknowns + 2 targets, then click Solve Unknown.");
  refreshCycleDofStatus(true);
}

function satStateAtPressure(table, pressure, props) {
  return interpolate1D(table.rows, "P", pressure, props).values;
}

function clampTemperatureForPressure(table, pressure, preferredTemp) {
  const range = temperatureRangeAtPressure(table, pressure);
  if (!range) {
    throw new Error(`No valid T range at P=${formatNumber(pressure)} for ${table.sheet_name}.`);
  }
  return clamp(preferredTemp, range.min, range.max);
}

function approximateCompressedLiquidTemperature(tRef, hRef, hOut) {
  if (!Number.isFinite(tRef)) {
    return null;
  }
  if (!Number.isFinite(hRef) || !Number.isFinite(hOut)) {
    return tRef;
  }
  const deltaT = clamp((hOut - hRef) / 4.2, 0.2, 12);
  return tRef + deltaT;
}

function solveIsentropicPtStateAtPressure(table, pressure, entropyTarget, fallbackTemp = null) {
  try {
    const values = interpolatePTByProperty(table, pressure, "s", entropyTarget, ["T", "P", "h", "s", "u", "v"]).values;
    return { ...values, P: pressure, region: "single-phase" };
  } catch (error) {
    if (!Number.isFinite(fallbackTemp)) {
      throw error;
    }
    const t = clampTemperatureForPressure(table, pressure, fallbackTemp);
    const values = interpolatePT(table, t, pressure, ["T", "P", "h", "s", "u", "v"]).values;
    return { ...values, P: pressure, region: "fallback-PT" };
  }
}

function solvePtStateAtPressureAndEnthalpy(table, pressure, enthalpyTarget, fallbackTemp = null) {
  try {
    const values = interpolatePTByProperty(table, pressure, "h", enthalpyTarget, ["T", "P", "h", "s", "u", "v"]).values;
    return { ...values, P: pressure, region: "single-phase" };
  } catch (error) {
    if (!Number.isFinite(fallbackTemp)) {
      throw error;
    }
    const t = clampTemperatureForPressure(table, pressure, fallbackTemp);
    const values = interpolatePT(table, t, pressure, ["T", "P", "h", "s", "u", "v"]).values;
    return { ...values, P: pressure, region: "fallback-PT" };
  }
}

function solveStateAtPressureAndEntropyWithSat(satTable, ptTable, pressure, entropyTarget) {
  const sat = satStateAtPressure(satTable, pressure, ["T", "vf", "vfg", "uf", "ufg", "hf", "hfg", "sf", "sfg", "sg"]);
  const sf = sat.sf;
  const sg = Number.isFinite(sat.sg) ? sat.sg : Number.isFinite(sat.sf) && Number.isFinite(sat.sfg) ? sat.sf + sat.sfg : null;
  const tol = 1e-7;

  if (Number.isFinite(sf) && Number.isFinite(sg) && Number.isFinite(sat.sfg) && Math.abs(sat.sfg) > 1e-12) {
    if (entropyTarget < sf - tol) {
      return {
        T: sat.T,
        P: pressure,
        h: sat.hf,
        s: entropyTarget,
        u: sat.uf,
        v: sat.vf,
        x: null,
        region: "compressed-liquid-approx",
      };
    }

    if (entropyTarget <= sg + tol) {
      const xRaw = (entropyTarget - sf) / sat.sfg;
      const x = clamp(xRaw, 0, 1);
      return {
        T: sat.T,
        P: pressure,
        h: Number.isFinite(sat.hf) && Number.isFinite(sat.hfg) ? sat.hf + x * sat.hfg : null,
        s: entropyTarget,
        u: Number.isFinite(sat.uf) && Number.isFinite(sat.ufg) ? sat.uf + x * sat.ufg : null,
        v: Number.isFinite(sat.vf) && Number.isFinite(sat.vfg) ? sat.vf + x * sat.vfg : null,
        x,
        region: "saturated-mixture",
      };
    }
  }

  const superState = solveIsentropicPtStateAtPressure(ptTable, pressure, entropyTarget, sat.T);
  return { ...superState, x: null, region: "superheated" };
}

function solveStateAtPressureAndEnthalpyWithSat(satTable, ptTable, pressure, hTarget, fallbackTemp = null) {
  const sat = satStateAtPressure(satTable, pressure, ["T", "vf", "vfg", "uf", "ufg", "hf", "hfg", "sf", "sfg", "sg"]);
  const hf = sat.hf;
  const hg = Number.isFinite(sat.hg) ? sat.hg : Number.isFinite(sat.hf) && Number.isFinite(sat.hfg) ? sat.hf + sat.hfg : null;
  const tol = 1e-7;

  if (Number.isFinite(hf) && Number.isFinite(hg) && Number.isFinite(sat.hfg) && Math.abs(sat.hfg) > 1e-12) {
    if (hTarget < hf - tol) {
      return {
        T: sat.T,
        P: pressure,
        h: hTarget,
        s: sat.sf,
        u: sat.uf,
        v: sat.vf,
        x: null,
        region: "compressed-liquid-approx",
      };
    }

    if (hTarget <= hg + tol) {
      const xRaw = (hTarget - hf) / sat.hfg;
      const x = clamp(xRaw, 0, 1);
      return {
        T: sat.T,
        P: pressure,
        h: hTarget,
        s: Number.isFinite(sat.sf) && Number.isFinite(sat.sfg) ? sat.sf + x * sat.sfg : null,
        u: Number.isFinite(sat.uf) && Number.isFinite(sat.ufg) ? sat.uf + x * sat.ufg : null,
        v: Number.isFinite(sat.vf) && Number.isFinite(sat.vfg) ? sat.vf + x * sat.vfg : null,
        x,
        region: "saturated-mixture",
      };
    }
  }

  try {
    const superState = interpolatePTByProperty(ptTable, pressure, "h", hTarget, ["T", "P", "h", "s", "u", "v"]).values;
    return { ...superState, x: null, region: "superheated" };
  } catch (error) {
    if (!Number.isFinite(fallbackTemp)) {
      throw error;
    }
    const t = clampTemperatureForPressure(ptTable, pressure, fallbackTemp);
    const values = interpolatePT(ptTable, t, pressure, ["T", "P", "h", "s", "u", "v"]).values;
    return { ...values, x: null, region: "fallback-PT" };
  }
}

function solveIsentropicWaterStateAtPressure(satPWater, superWater, pressure, entropyTarget) {
  return solveStateAtPressureAndEntropyWithSat(satPWater, superWater, pressure, entropyTarget);
}

function metricValueByKey(metrics, key) {
  const entry = metrics.find((metric) => metric.key === key);
  return entry && Number.isFinite(entry.value) ? entry.value : null;
}

function cycleSanityWarnings(templateId, points, metrics) {
  const warnings = [];

  for (const point of points) {
    if (Number.isFinite(point.x) && (point.x < 0 || point.x > 1)) {
      warnings.push(`Point ${point.point}: quality x=${formatNumber(point.x)} is outside 0..1.`);
    }
  }

  const eta = metricValueByKey(metrics, "eta_th");
  if (Number.isFinite(eta) && (eta <= 0 || eta >= 1.2)) {
    warnings.push(`Thermal efficiency ${formatNumber(eta)} looks outside a typical range.`);
  }

  if (templateId === "rankine-ideal" || templateId === "rankine-reheat" || templateId === "steam-loop") {
    const wt = metricValueByKey(metrics, "wt");
    const wp = metricValueByKey(metrics, "wp");
    if (Number.isFinite(wt) && wt <= 0) {
      warnings.push("Turbine-side work is non-positive; check pressures/temperatures.");
    }
    if (Number.isFinite(wp) && wp <= 0) {
      warnings.push("Pump work is non-positive; check P_high and P_low inputs.");
    }
  }

  if (templateId === "vcr") {
    const cop = metricValueByKey(metrics, "cop");
    const wcomp = metricValueByKey(metrics, "wcomp");
    if (Number.isFinite(wcomp) && wcomp <= 0) {
      warnings.push("Compressor work is non-positive; this is physically unlikely for standard VCR operation.");
    }
    if (Number.isFinite(cop) && cop <= 0) {
      warnings.push("COP is non-positive; check state points and pressures.");
    }
    if (points.length >= 2 && Number.isFinite(points[1].s) && Number.isFinite(points[0].s) && points[1].s < points[0].s) {
      warnings.push("Compressor outlet entropy is lower than inlet entropy; verify compressor model assumptions.");
    }
  }

  if (templateId === "brayton") {
    const pressureRatio = metricValueByKey(metrics, "pressure_ratio");
    if (Number.isFinite(pressureRatio) && pressureRatio <= 1) {
      warnings.push("Pressure ratio should be greater than 1 for a Brayton compressor stage.");
    }
    const wnet = metricValueByKey(metrics, "wnet");
    if (Number.isFinite(wnet) && wnet <= 0) {
      warnings.push("Net work is non-positive; cycle may be operating as a net consumer, not a power cycle.");
    }
    if (points.length >= 2 && Number.isFinite(points[1].s) && Number.isFinite(points[0].s) && points[1].s < points[0].s) {
      warnings.push("Compressor outlet entropy is lower than inlet entropy; check data range and assumptions.");
    }
  }

  return warnings;
}

function defaultSearchBoundsForUnknown(templateId, unknownKey, knownInputs, minOverride = null, maxOverride = null) {
  if (Number.isFinite(minOverride) && Number.isFinite(maxOverride) && minOverride >= maxOverride) {
    throw new Error("Search max must be greater than search min.");
  }

  const defaults = defaultCycleInputs(templateId);
  const baseline = firstFinite(knownInputs[unknownKey], defaults[unknownKey], 1);

  let minAuto = null;
  let maxAuto = null;
  if (/^eta/i.test(unknownKey)) {
    minAuto = 0.2;
    maxAuto = 1.2;
  } else if (/^p/i.test(unknownKey)) {
    const ref = Math.max(Math.abs(baseline), 1);
    minAuto = Math.max(1e-6, ref * 0.2);
    maxAuto = ref * 8;
  } else if (/^t/i.test(unknownKey)) {
    const ref = Math.max(Math.abs(baseline), 1);
    minAuto = baseline - Math.max(120, ref * 0.5);
    maxAuto = baseline + Math.max(220, ref * 1.2);
  } else {
    const ref = Math.max(Math.abs(baseline), 1);
    minAuto = Math.max(1e-6, ref * 0.2);
    maxAuto = ref * 8;
  }

  const min = Number.isFinite(minOverride) ? minOverride : minAuto;
  const max = Number.isFinite(maxOverride) ? maxOverride : maxAuto;

  if (!Number.isFinite(min) || !Number.isFinite(max) || min >= max) {
    throw new Error("Could not construct a valid search range for the selected unknown.");
  }

  return { min, max };
}

function evaluateCycleMetric(templateId, unknownKey, unknownValue, knownInputs, targetKey) {
  const builder = findTemplateBuilder(templateId);
  if (!builder) {
    throw new Error(`Unknown cycle template: ${templateId}.`);
  }

  const candidateInputs = mergeCycleInputs(templateId, { ...knownInputs, [unknownKey]: unknownValue });
  let built = null;
  try {
    built = builder(candidateInputs);
  } catch (error) {
    return null;
  }

  const metric = built.metrics.find((entry) => entry.key === targetKey);
  if (!metric || !Number.isFinite(metric.value)) {
    return null;
  }

  return {
    unknownValue,
    metricValue: metric.value,
    built,
    inputs: candidateInputs,
  };
}

function solveUnknownByTarget(templateId, unknownKey, targetKey, targetValue, knownInputs, minValue, maxValue) {
  const range = defaultSearchBoundsForUnknown(templateId, unknownKey, knownInputs, minValue, maxValue);
  const points = [];
  const sampleCount = 80;
  const valueTol = Math.max(1e-7, Math.abs(targetValue) * 1e-5);

  for (let i = 0; i <= sampleCount; i += 1) {
    const x = range.min + (i / sampleCount) * (range.max - range.min);
    const evaluation = evaluateCycleMetric(templateId, unknownKey, x, knownInputs, targetKey);
    if (!evaluation) {
      continue;
    }
    const residual = evaluation.metricValue - targetValue;
    points.push({ ...evaluation, residual });
    if (Math.abs(residual) <= valueTol) {
      return { ...evaluation, residual, iterations: i, bracketed: false };
    }
  }

  if (points.length < 2) {
    throw new Error("Could not evaluate enough valid states in the search range. Adjust bounds.");
  }

  let left = null;
  let right = null;
  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i];
    const b = points[i + 1];
    if (a.residual === 0) {
      return { ...a, iterations: i, bracketed: true };
    }
    if (a.residual * b.residual < 0) {
      left = a;
      right = b;
      break;
    }
  }

  if (!left || !right) {
    const closest = points.reduce((best, point) =>
      !best || Math.abs(point.residual) < Math.abs(best.residual) ? point : best,
    null);
    throw new Error(
      `Target metric could not be bracketed in [${formatNumber(range.min)}, ${formatNumber(range.max)}]. Closest residual: ${formatNumber(closest.residual)}.`,
    );
  }

  let best = Math.abs(left.residual) <= Math.abs(right.residual) ? left : right;
  let iteration = 0;
  const maxIterations = 80;

  while (iteration < maxIterations) {
    iteration += 1;
    const midValue = 0.5 * (left.unknownValue + right.unknownValue);
    let mid = evaluateCycleMetric(templateId, unknownKey, midValue, knownInputs, targetKey);

    if (!mid) {
      const nearLeftValue = 0.5 * (left.unknownValue + midValue);
      const nearRightValue = 0.5 * (midValue + right.unknownValue);
      mid = evaluateCycleMetric(templateId, unknownKey, nearLeftValue, knownInputs, targetKey);
      if (!mid) {
        mid = evaluateCycleMetric(templateId, unknownKey, nearRightValue, knownInputs, targetKey);
      }
      if (!mid) {
        break;
      }
    }

    mid.residual = mid.metricValue - targetValue;
    if (Math.abs(mid.residual) < Math.abs(best.residual)) {
      best = mid;
    }

    if (Math.abs(mid.residual) <= valueTol) {
      return { ...mid, iterations: iteration, bracketed: true };
    }

    if (left.residual * mid.residual <= 0) {
      right = mid;
    } else {
      left = mid;
    }

    if (Math.abs(right.unknownValue - left.unknownValue) <= 1e-8 * Math.max(1, Math.abs(mid.unknownValue))) {
      break;
    }
  }

  return { ...best, iterations: iteration, bracketed: true };
}

function evaluateCycleMetricSet(templateId, unknownAssignments, knownInputs, targetKeys) {
  const builder = findTemplateBuilder(templateId);
  if (!builder) {
    throw new Error(`Unknown cycle template: ${templateId}.`);
  }

  const candidateInputs = mergeCycleInputs(templateId, { ...knownInputs, ...unknownAssignments });
  let built = null;
  try {
    built = builder(candidateInputs);
  } catch (error) {
    return null;
  }

  const targetValues = {};
  for (const key of targetKeys) {
    const metric = built.metrics.find((entry) => entry.key === key);
    if (!metric || !Number.isFinite(metric.value)) {
      return null;
    }
    targetValues[key] = metric.value;
  }

  return {
    built,
    inputs: candidateInputs,
    targetValues,
  };
}

function solveTwoUnknownsByTargets({
  templateId,
  unknownKeys,
  targetKeys,
  targetValues,
  knownInputs,
  bounds,
}) {
  const [u1, u2] = unknownKeys;
  const [k1, k2] = targetKeys;
  const [t1, t2] = targetValues;

  const range1 = defaultSearchBoundsForUnknown(templateId, u1, knownInputs, bounds[0]?.min ?? null, bounds[0]?.max ?? null);
  const range2 = defaultSearchBoundsForUnknown(templateId, u2, knownInputs, bounds[1]?.min ?? null, bounds[1]?.max ?? null);
  const scale1 = Math.max(Math.abs(t1), 1);
  const scale2 = Math.max(Math.abs(t2), 1);
  const tol1 = Math.max(1e-7, Math.abs(t1) * 1e-4);
  const tol2 = Math.max(1e-7, Math.abs(t2) * 1e-4);

  const objective = (r1, r2) => (r1 / scale1) ** 2 + (r2 / scale2) ** 2;

  const sampleN = 28;
  let best = null;
  let evalCount = 0;

  for (let i = 0; i <= sampleN; i += 1) {
    const x1 = range1.min + (i / sampleN) * (range1.max - range1.min);
    for (let j = 0; j <= sampleN; j += 1) {
      const x2 = range2.min + (j / sampleN) * (range2.max - range2.min);
      const evaluation = evaluateCycleMetricSet(templateId, { [u1]: x1, [u2]: x2 }, knownInputs, [k1, k2]);
      if (!evaluation) {
        continue;
      }

      evalCount += 1;
      const r1 = evaluation.targetValues[k1] - t1;
      const r2 = evaluation.targetValues[k2] - t2;
      const obj = objective(r1, r2);
      if (!best || obj < best.objective) {
        best = {
          x1,
          x2,
          r1,
          r2,
          objective: obj,
          evaluation,
        };
      }
    }
  }

  if (!best) {
    throw new Error("Could not evaluate valid states for the selected two-unknown solve. Adjust search ranges.");
  }

  let step1 = (range1.max - range1.min) / 6;
  let step2 = (range2.max - range2.min) / 6;
  let iterations = 0;
  const maxIterations = 80;

  while (iterations < maxIterations) {
    iterations += 1;
    let improved = false;

    for (const d1 of [0, -step1, step1]) {
      for (const d2 of [0, -step2, step2]) {
        if (Math.abs(d1) < 1e-14 && Math.abs(d2) < 1e-14) {
          continue;
        }

        const x1 = clamp(best.x1 + d1, range1.min, range1.max);
        const x2 = clamp(best.x2 + d2, range2.min, range2.max);
        const evaluation = evaluateCycleMetricSet(templateId, { [u1]: x1, [u2]: x2 }, knownInputs, [k1, k2]);
        if (!evaluation) {
          continue;
        }

        evalCount += 1;
        const r1 = evaluation.targetValues[k1] - t1;
        const r2 = evaluation.targetValues[k2] - t2;
        const obj = objective(r1, r2);
        if (obj + 1e-14 < best.objective) {
          best = {
            x1,
            x2,
            r1,
            r2,
            objective: obj,
            evaluation,
          };
          improved = true;
        }
      }
    }

    if (!improved) {
      step1 *= 0.5;
      step2 *= 0.5;
    }

    if ((Math.abs(best.r1) <= tol1 && Math.abs(best.r2) <= tol2) || (step1 < 1e-8 && step2 < 1e-8)) {
      break;
    }
  }

  return {
    unknownValues: { [u1]: best.x1, [u2]: best.x2 },
    solvedMetrics: {
      [k1]: best.evaluation.targetValues[k1],
      [k2]: best.evaluation.targetValues[k2],
    },
    residuals: { [k1]: best.r1, [k2]: best.r2 },
    objective: best.objective,
    inputs: best.evaluation.inputs,
    iterations,
    evaluations: evalCount,
    converged: Math.abs(best.r1) <= tol1 && Math.abs(best.r2) <= tol2,
  };
}

function buildIdealRankineTemplate(inputOverride = null) {
  const satPWater = findBestTable({ mode: "sat-P", fluidRegex: /water/i, unitSystem: "SI" });
  const superWater = findBestTable({ mode: "PT", fluidRegex: /water/i, unitSystem: "SI", sheetRegex: /superheated/i });

  if (!satPWater || !superWater) {
    throw new Error("Missing SI water tables for Ideal Rankine template.");
  }

  const cfg = mergeCycleInputs("rankine-ideal", inputOverride);
  const pLow = cfg.pLow;
  const pHigh = cfg.pHigh;
  const etaT = normalizedEfficiency(cfg.etaT, "Turbine efficiency");
  const etaP = normalizedEfficiency(cfg.etaP, "Pump efficiency");
  if (!(pHigh > pLow)) {
    throw new Error("For Rankine, P_high must be greater than P_low.");
  }

  const st1 = satStateAtPressure(satPWater, pLow, ["T", "vf", "hf", "sf"]);
  const t3 = clampTemperatureForPressure(superWater, pHigh, cfg.t3);
  const st3 = interpolatePT(superWater, t3, pHigh, ["h", "s", "u", "v"]).values;

  const h1 = st1.hf;
  const h2s = h1 + (st1.vf || 0.001) * (pHigh - pLow);
  const h2 = h1 + (h2s - h1) / etaP;
  const t2 = approximateCompressedLiquidTemperature(st1.T, h1, h2);
  const st4s = solveStateAtPressureAndEntropyWithSat(satPWater, superWater, pLow, st3.s);
  const h4 = st3.h - etaT * (st3.h - st4s.h);
  const st4 = solveStateAtPressureAndEnthalpyWithSat(satPWater, superWater, pLow, h4, st4s.T);

  const points = [
    { point: "1", label: "Condenser outlet", T: st1.T, P: pLow, h: h1, s: st1.sf },
    { point: "2", label: "Pump outlet", T: t2, P: pHigh, h: h2, s: st1.sf },
    { point: "3", label: "Turbine inlet", T: t3, P: pHigh, h: st3.h, s: st3.s },
    { point: "4", label: "Turbine outlet", T: st4.T, P: pLow, h: st4.h, s: st4.s, x: st4.x },
  ];

  const wt = points[2].h - points[3].h;
  const wp = points[1].h - points[0].h;
  const wnet = wt - wp;
  const qin = points[2].h - points[1].h;
  const qout = points[3].h - points[0].h;

  const metrics = [
    { key: "wt", label: "Turbine work", value: wt, unit: "kJ/kg" },
    { key: "wp", label: "Pump work", value: wp, unit: "kJ/kg" },
    { key: "wnet", label: "Net work", value: wnet, unit: "kJ/kg" },
    { key: "qin", label: "Heat input", value: qin, unit: "kJ/kg" },
    { key: "qout", label: "Heat rejected", value: qout, unit: "kJ/kg" },
    { key: "eta_th", label: "Thermal efficiency", value: safeRatio(wnet, qin), unit: "-" },
    { key: "bwr", label: "Back work ratio", value: safeRatio(wp, wt), unit: "-" },
  ];
  if (Number.isFinite(st4.x)) {
    metrics.push({ key: "x4", label: "Turbine exit quality", value: st4.x, unit: "-" });
  }
  metrics.push({ key: "eta_t", label: "eta_t used", value: etaT, unit: "-" });
  metrics.push({ key: "eta_p", label: "eta_p used", value: etaP, unit: "-" });

  const warnings = cycleSanityWarnings("rankine-ideal", points, metrics);
  return { points, metrics, warnings, fluid: superWater.fluid || "Water" };
}

function buildRankineReheatTemplate(inputOverride = null) {
  const satPWater = findBestTable({ mode: "sat-P", fluidRegex: /water/i, unitSystem: "SI" });
  const superWater = findBestTable({ mode: "PT", fluidRegex: /water/i, unitSystem: "SI", sheetRegex: /superheated/i });

  if (!satPWater || !superWater) {
    throw new Error("Missing SI water tables for Rankine reheat template.");
  }

  const cfg = mergeCycleInputs("rankine-reheat", inputOverride);
  const pLow = cfg.pLow;
  const pMid = cfg.pMid;
  const pHigh = cfg.pHigh;
  const etaTHP = normalizedEfficiency(cfg.etaTHP, "HP turbine efficiency");
  const etaTLP = normalizedEfficiency(cfg.etaTLP, "LP turbine efficiency");
  const etaP = normalizedEfficiency(cfg.etaP, "Pump efficiency");

  if (!(pHigh > pMid && pMid > pLow)) {
    throw new Error("For reheat Rankine, pressures must satisfy P_high > P_mid > P_low.");
  }

  const st1 = satStateAtPressure(satPWater, pLow, ["T", "vf", "hf", "sf"]);
  const h2s = st1.hf + (st1.vf || 0.001) * (pHigh - pLow);
  const h2 = st1.hf + (h2s - st1.hf) / etaP;
  const t2 = approximateCompressedLiquidTemperature(st1.T, st1.hf, h2);

  const t3 = clampTemperatureForPressure(superWater, pHigh, cfg.t3);
  const st3 = interpolatePT(superWater, t3, pHigh, ["h", "s", "u", "v"]).values;
  const st4s = solveStateAtPressureAndEntropyWithSat(satPWater, superWater, pMid, st3.s);
  const h4 = st3.h - etaTHP * (st3.h - st4s.h);
  const st4 = solveStateAtPressureAndEnthalpyWithSat(satPWater, superWater, pMid, h4, st4s.T);

  const t5 = clampTemperatureForPressure(superWater, pMid, cfg.t5);
  const st5 = interpolatePT(superWater, t5, pMid, ["h", "s", "u", "v"]).values;
  const st6s = solveStateAtPressureAndEntropyWithSat(satPWater, superWater, pLow, st5.s);
  const h6 = st5.h - etaTLP * (st5.h - st6s.h);
  const st6 = solveStateAtPressureAndEnthalpyWithSat(satPWater, superWater, pLow, h6, st6s.T);

  const points = [
    { point: "1", label: "Condenser outlet", T: st1.T, P: pLow, h: st1.hf, s: st1.sf },
    { point: "2", label: "Pump outlet", T: t2, P: pHigh, h: h2, s: st1.sf },
    { point: "3", label: "HP turbine inlet", T: t3, P: pHigh, h: st3.h, s: st3.s },
    { point: "4", label: "After HP expansion", T: st4.T, P: pMid, h: st4.h, s: st4.s, x: st4.x },
    { point: "5", label: "After reheat", T: t5, P: pMid, h: st5.h, s: st5.s },
    { point: "6", label: "LP turbine outlet", T: st6.T, P: pLow, h: st6.h, s: st6.s, x: st6.x },
  ];

  const wt = (points[2].h - points[3].h) + (points[4].h - points[5].h);
  const wp = points[1].h - points[0].h;
  const qin = (points[2].h - points[1].h) + (points[4].h - points[3].h);
  const wnet = wt - wp;
  const qout = points[5].h - points[0].h;

  const metrics = [
    { key: "wt", label: "Turbine work", value: wt, unit: "kJ/kg" },
    { key: "wp", label: "Pump work", value: wp, unit: "kJ/kg" },
    { key: "wnet", label: "Net work", value: wnet, unit: "kJ/kg" },
    { key: "qin", label: "Heat input", value: qin, unit: "kJ/kg" },
    { key: "qout", label: "Heat rejected", value: qout, unit: "kJ/kg" },
    { key: "eta_th", label: "Thermal efficiency", value: safeRatio(wnet, qin), unit: "-" },
    { key: "bwr", label: "Back work ratio", value: safeRatio(wp, wt), unit: "-" },
  ];
  if (Number.isFinite(st6.x)) {
    metrics.push({ key: "x6", label: "LP turbine exit quality", value: st6.x, unit: "-" });
  }
  metrics.push({ key: "eta_t_hp", label: "eta_t,HP used", value: etaTHP, unit: "-" });
  metrics.push({ key: "eta_t_lp", label: "eta_t,LP used", value: etaTLP, unit: "-" });
  metrics.push({ key: "eta_p", label: "eta_p used", value: etaP, unit: "-" });

  const warnings = cycleSanityWarnings("rankine-reheat", points, metrics);
  return { points, metrics, warnings, fluid: superWater.fluid || "Water" };
}

function buildVcrTemplate(inputOverride = null) {
  const satR = findBestTable({ mode: "sat-T", fluidRegex: /r[\s-]*134a/i, unitSystem: "SI" });
  const superR = findBestTable({ mode: "PT", fluidRegex: /r[\s-]*134a/i, unitSystem: "SI" });

  if (!satR || !superR) {
    throw new Error("Missing SI R-134a tables for refrigeration template.");
  }

  const cfg = mergeCycleInputs("vcr", inputOverride);
  const pLow = cfg.pLow;
  const pHigh = cfg.pHigh;
  const etaC = normalizedEfficiency(cfg.etaC, "Compressor efficiency");
  const superheat = Number.isFinite(cfg.superheat) ? cfg.superheat : 0;
  if (!(pHigh > pLow)) {
    throw new Error("For VCR, condenser pressure must be greater than evaporator pressure.");
  }

  const lowSat = interpolate1D(satR.rows, "P", pLow, ["T", "hf", "hfg", "hg", "sf", "sfg", "sg", "vf", "vfg"]).values;
  const highSat = interpolate1D(satR.rows, "P", pHigh, ["T", "hf", "hg", "sf", "sg"]).values;

  let st1 = {
    T: lowSat.T,
    P: pLow,
    h: lowSat.hg,
    s: lowSat.sg,
  };
  if (superheat > 1e-9) {
    const t1 = clampTemperatureForPressure(superR, pLow, lowSat.T + superheat);
    st1 = interpolatePT(superR, t1, pLow, ["T", "P", "h", "s", "u", "v"]).values;
  }

  const st2s = solveIsentropicPtStateAtPressure(superR, pHigh, st1.s, lowSat.T + Math.max(12, superheat));
  const h2 = st1.h + (st2s.h - st1.h) / etaC;
  const st2 = solveStateAtPressureAndEnthalpyWithSat(satR, superR, pHigh, h2, st2s.T);

  const h3 = highSat.hf;
  const h4 = h3;
  const quality4 = Number.isFinite(lowSat.hfg) && Math.abs(lowSat.hfg) > 1e-12 ? (h4 - lowSat.hf) / lowSat.hfg : null;
  const s4 = Number.isFinite(quality4) && Number.isFinite(lowSat.sfg) ? lowSat.sf + quality4 * lowSat.sfg : lowSat.sf;

  const points = [
    { point: "1", label: "Evaporator outlet", T: st1.T, P: pLow, h: st1.h, s: st1.s },
    { point: "2", label: "Compressor outlet", T: st2.T, P: pHigh, h: st2.h, s: st2.s },
    { point: "3", label: "Condenser outlet", T: highSat.T, P: pHigh, h: highSat.hf, s: highSat.sf },
    { point: "4", label: "Valve outlet", T: lowSat.T, P: pLow, h: h4, s: s4, x: quality4 },
  ];

  const compressorWork = points[1].h - points[0].h;
  const refrigeratingEffect = points[0].h - points[3].h;
  const heatRejected = points[1].h - points[2].h;

  const metrics = [
    { key: "wcomp", label: "Compressor work", value: compressorWork, unit: "kJ/kg" },
    { key: "qL", label: "Refrigerating effect", value: refrigeratingEffect, unit: "kJ/kg" },
    { key: "qH", label: "Heat rejected", value: heatRejected, unit: "kJ/kg" },
    { key: "cop", label: "COP", value: safeRatio(refrigeratingEffect, compressorWork), unit: "-" },
    { key: "eta_c", label: "eta_c used", value: etaC, unit: "-" },
  ];
  if (Number.isFinite(quality4)) {
    metrics.push({ key: "x4", label: "Valve exit quality", value: quality4, unit: "-" });
  }

  const warnings = cycleSanityWarnings("vcr", points, metrics);
  return { points, metrics, warnings, fluid: satR.fluid };
}

function buildBraytonTemplate(inputOverride = null) {
  const nitrogen = findBestTable({ mode: "PT", fluidRegex: /nitrogen/i, unitSystem: "SI" });
  if (!nitrogen) {
    throw new Error("Missing SI Nitrogen PT table for Brayton template.");
  }

  const cfg = mergeCycleInputs("brayton", inputOverride);
  const pLow = cfg.pLow;
  const pHigh = cfg.pHigh;
  const etaC = normalizedEfficiency(cfg.etaC, "Compressor efficiency");
  const etaT = normalizedEfficiency(cfg.etaT, "Turbine efficiency");
  if (!(pHigh > pLow)) {
    throw new Error("For Brayton, P_high must be greater than P_low.");
  }

  const t1 = clampTemperatureForPressure(nitrogen, pLow, cfg.t1);
  const st1 = interpolatePT(nitrogen, t1, pLow, ["h", "s", "u", "v"]).values;
  const st2s = solveIsentropicPtStateAtPressure(nitrogen, pHigh, st1.s, 500);
  const h2 = st1.h + (st2s.h - st1.h) / etaC;
  const st2Actual = solvePtStateAtPressureAndEnthalpy(nitrogen, pHigh, h2, st2s.T);
  const t3 = clampTemperatureForPressure(nitrogen, pHigh, cfg.t3);
  const st3 = interpolatePT(nitrogen, t3, pHigh, ["h", "s", "u", "v"]).values;
  const st4s = solveIsentropicPtStateAtPressure(nitrogen, pLow, st3.s, 650);
  const h4 = st3.h - etaT * (st3.h - st4s.h);
  const st4 = solvePtStateAtPressureAndEnthalpy(nitrogen, pLow, h4, st4s.T);

  const points = [
    { point: "1", label: "Compressor inlet", T: t1, P: pLow, h: st1.h, s: st1.s },
    { point: "2", label: "Compressor outlet", T: st2Actual.T, P: pHigh, h: st2Actual.h, s: st2Actual.s },
    { point: "3", label: "Turbine inlet", T: t3, P: pHigh, h: st3.h, s: st3.s },
    { point: "4", label: "Turbine outlet", T: st4.T, P: pLow, h: st4.h, s: st4.s },
  ];

  const compressorWork = points[1].h - points[0].h;
  const turbineWork = points[2].h - points[3].h;
  const netWork = turbineWork - compressorWork;
  const qIn = points[2].h - points[1].h;

  const metrics = [
    { key: "wcomp", label: "Compressor work", value: compressorWork, unit: "kJ/kg" },
    { key: "wt", label: "Turbine work", value: turbineWork, unit: "kJ/kg" },
    { key: "wnet", label: "Net work", value: netWork, unit: "kJ/kg" },
    { key: "pressure_ratio", label: "Pressure ratio", value: safeRatio(pHigh, pLow), unit: "-" },
    { key: "eta_th", label: "Thermal efficiency", value: safeRatio(netWork, qIn), unit: "-" },
    { key: "eta_c", label: "eta_c used", value: etaC, unit: "-" },
    { key: "eta_t", label: "eta_t used", value: etaT, unit: "-" },
  ];

  const warnings = cycleSanityWarnings("brayton", points, metrics);
  return { points, metrics, warnings, fluid: nitrogen.fluid };
}

function buildSteamLoopTemplate(inputOverride = null) {
  const satPWater = findBestTable({ mode: "sat-P", fluidRegex: /water/i, unitSystem: "SI" });
  const superWater = findBestTable({ mode: "PT", fluidRegex: /water/i, unitSystem: "SI", sheetRegex: /superheated/i });

  if (!satPWater || !superWater) {
    throw new Error("Missing SI water tables for steam loop template.");
  }

  const cfg = mergeCycleInputs("steam-loop", inputOverride);
  const pLow = cfg.pLow;
  const pHigh = cfg.pHigh;
  const etaT = normalizedEfficiency(cfg.etaT, "Expansion efficiency");
  const etaP = normalizedEfficiency(cfg.etaP, "Pump efficiency");
  if (!(pHigh > pLow)) {
    throw new Error("For steam loop, P_high must be greater than P_low.");
  }

  const st1 = satStateAtPressure(satPWater, pLow, ["T", "vf", "hf", "sf"]);
  const h2s = st1.hf + (st1.vf || 0.001) * (pHigh - pLow);
  const h2 = st1.hf + (h2s - st1.hf) / etaP;
  const t2 = approximateCompressedLiquidTemperature(st1.T, st1.hf, h2);

  const t3 = clampTemperatureForPressure(superWater, pHigh, cfg.t3);
  const st3 = interpolatePT(superWater, t3, pHigh, ["h", "s", "u", "v"]).values;
  const st4s = solveStateAtPressureAndEntropyWithSat(satPWater, superWater, pLow, st3.s);
  const h4 = st3.h - etaT * (st3.h - st4s.h);
  const st4 = solveStateAtPressureAndEnthalpyWithSat(satPWater, superWater, pLow, h4, st4s.T);

  const points = [
    { point: "1", label: "Feedwater", T: st1.T, P: pLow, h: st1.hf, s: st1.sf },
    { point: "2", label: "After pump", T: t2, P: pHigh, h: h2, s: st1.sf },
    { point: "3", label: "Heated vapor", T: t3, P: pHigh, h: st3.h, s: st3.s },
    { point: "4", label: "Expansion outlet", T: st4.T, P: pLow, h: st4.h, s: st4.s, x: st4.x },
  ];

  const wt = points[2].h - points[3].h;
  const wp = points[1].h - points[0].h;
  const wnet = wt - wp;
  const qin = points[2].h - points[1].h;
  const qout = points[3].h - points[0].h;

  const metrics = [
    { key: "wt", label: "Turbine-side work", value: wt, unit: "kJ/kg" },
    { key: "wp", label: "Pump-side work", value: wp, unit: "kJ/kg" },
    { key: "wnet", label: "Net specific work", value: wnet, unit: "kJ/kg" },
    { key: "qin", label: "Heat input", value: qin, unit: "kJ/kg" },
    { key: "qout", label: "Heat rejected", value: qout, unit: "kJ/kg" },
    { key: "eta_th", label: "Thermal efficiency", value: safeRatio(wnet, qin), unit: "-" },
  ];
  if (Number.isFinite(st4.x)) {
    metrics.push({ key: "x4", label: "Expansion exit quality", value: st4.x, unit: "-" });
  }
  metrics.push({ key: "eta_t", label: "eta_t used", value: etaT, unit: "-" });
  metrics.push({ key: "eta_p", label: "eta_p used", value: etaP, unit: "-" });

  const warnings = cycleSanityWarnings("steam-loop", points, metrics);
  return { points, metrics, warnings, fluid: superWater.fluid || "Water" };
}
function populateCycleTemplateSelect() {
  el.cycleTemplateSelect.innerHTML = "";
  for (const template of CYCLE_TEMPLATES) {
    const option = document.createElement("option");
    option.value = template.id;
    option.textContent = template.label;
    el.cycleTemplateSelect.appendChild(option);
  }
  const exists = CYCLE_TEMPLATES.some((template) => template.id === state.cycle.templateId);
  state.cycle.templateId = exists ? state.cycle.templateId : CYCLE_TEMPLATES[0].id;
  el.cycleTemplateSelect.value = state.cycle.templateId;
}

function renderCycleMetrics() {
  el.cycleMetrics.innerHTML = "";
  if (!state.cycle.metrics.length) {
    el.cycleMetrics.innerHTML = "<li>No cycle metrics yet.</li>";
    return;
  }

  for (const metric of state.cycle.metrics) {
    const li = document.createElement("li");
    const suffix = metric.unit && metric.unit !== "-" ? ` ${metric.unit}` : "";
    li.textContent = `${metric.label}: ${formatNumber(metric.value)}${suffix}`;
    el.cycleMetrics.appendChild(li);
  }
}

function renderCycleWarnings() {
  if (!el.cycleWarnings) {
    return;
  }

  el.cycleWarnings.innerHTML = "";
  if (!state.cycle.warnings.length) {
    el.cycleWarnings.innerHTML = "<li>No warnings.</li>";
    return;
  }

  for (const warning of state.cycle.warnings) {
    const li = document.createElement("li");
    li.textContent = warning;
    el.cycleWarnings.appendChild(li);
  }
}

function getCombinedCyclePoints() {
  return [...state.cycle.templatePoints, ...state.cycle.manualPoints];
}

function renderCyclePointsTable() {
  el.cyclePointsBody.innerHTML = "";
  const points = getCombinedCyclePoints();

  if (points.length === 0) {
    el.cyclePointsBody.innerHTML = '<tr><td colspan="5" class="empty-cell">No state points loaded.</td></tr>';
    return;
  }

  for (const point of points) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${point.point} ${point.label ? `- ${point.label}` : ""}</td>
      <td>${formatNumber(point.T)}</td>
      <td>${formatNumber(point.P)}</td>
      <td>${formatNumber(point.h)}</td>
      <td>${formatNumber(point.s)}</td>
    `;
    el.cyclePointsBody.appendChild(row);
  }
}

function mapPointToDiagram(point, diagram) {
  if (diagram === "Ts") {
    if (!Number.isFinite(point.s) || !Number.isFinite(point.T)) {
      return null;
    }
    return { x: point.s, y: point.T, label: point.point };
  }
  if (diagram === "Ph") {
    if (!Number.isFinite(point.h) || !Number.isFinite(point.P) || point.P <= 0) {
      return null;
    }
    return { x: point.h, y: point.P, label: point.point };
  }
  if (!Number.isFinite(point.s) || !Number.isFinite(point.h)) {
    return null;
  }
  return { x: point.s, y: point.h, label: point.point };
}

function getSaturationDome(diagram, fluidName = "Water") {
  const exactFluidRegex = new RegExp(`^${escapeRegex(fluidName)}$`, "i");
  let satTable = findBestTable({ mode: "sat-T", fluidRegex: exactFluidRegex, unitSystem: "SI" });
  if (!satTable) {
    satTable = findBestTable({ mode: "sat-T", fluidRegex: /water/i, unitSystem: "SI", sheetRegex: /saturated water/i });
  }
  if (!satTable) {
    return { liquid: [], vapor: [] };
  }

  const sortedRows = sortRowsByKey(satTable.rows, "T");
  const liquid = [];
  const vapor = [];

  for (const row of sortedRows) {
    if (diagram === "Ts") {
      if (Number.isFinite(row.sf) && Number.isFinite(row.T)) {
        liquid.push({ x: row.sf, y: row.T });
      }
      if (Number.isFinite(row.sg) && Number.isFinite(row.T)) {
        vapor.push({ x: row.sg, y: row.T });
      }
    } else if (diagram === "Ph") {
      if (Number.isFinite(row.hf) && Number.isFinite(row.P) && row.P > 0) {
        liquid.push({ x: row.hf, y: row.P });
      }
      if (Number.isFinite(row.hg) && Number.isFinite(row.P) && row.P > 0) {
        vapor.push({ x: row.hg, y: row.P });
      }
    } else {
      if (Number.isFinite(row.sf) && Number.isFinite(row.hf)) {
        liquid.push({ x: row.sf, y: row.hf });
      }
      if (Number.isFinite(row.sg) && Number.isFinite(row.hg)) {
        vapor.push({ x: row.sg, y: row.hg });
      }
    }
  }

  return { liquid, vapor };
}

function getIsobarCurves(diagram, fluidName = "Water") {
  const exactFluidRegex = new RegExp(`^${escapeRegex(fluidName)}$`, "i");
  let ptTable = findBestTable({ mode: "PT", fluidRegex: exactFluidRegex, unitSystem: "SI" });
  if (!ptTable) {
    ptTable = findBestTable({ mode: "PT", fluidRegex: /water/i, unitSystem: "SI", sheetRegex: /superheated/i });
  }
  if (!ptTable) {
    return [];
  }

  const groups = buildPressureGroups(ptTable.rows);
  if (groups.length === 0) {
    return [];
  }

  const desiredCount = 6;
  const step = Math.max(1, Math.floor(groups.length / desiredCount));
  const selected = groups.filter((_, idx) => idx % step === 0).slice(0, desiredCount);

  const curves = [];
  for (const group of selected) {
    const points = [];
    for (const row of group.rows) {
      if (diagram === "Ts") {
        if (Number.isFinite(row.s) && Number.isFinite(row.T)) {
          points.push({ x: row.s, y: row.T });
        }
      } else if (diagram === "Ph") {
        if (Number.isFinite(row.h) && Number.isFinite(row.P) && row.P > 0) {
          points.push({ x: row.h, y: row.P });
        }
      } else if (Number.isFinite(row.s) && Number.isFinite(row.h)) {
        points.push({ x: row.s, y: row.h });
      }
    }
    if (points.length >= 2) {
      curves.push({ pressure: group.pressure, points });
    }
  }

  return curves;
}

function renderCyclePlot() {
  const canvas = el.cycleCanvas;
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  const diagram = state.cycle.diagram;
  const isPh = diagram === "Ph";
  const referenceFluid = state.cycle.workingFluid || "Water";

  const dome = state.cycle.domeVisible ? getSaturationDome(diagram, referenceFluid) : { liquid: [], vapor: [] };
  const isobars = state.cycle.isobarsVisible ? getIsobarCurves(diagram, referenceFluid) : [];

  const templateMapped = state.cycle.templatePoints
    .map((point) => mapPointToDiagram(point, diagram))
    .filter(Boolean)
    .map((point) => ({ ...point, source: "template" }));
  const manualMapped = state.cycle.manualPoints
    .map((point) => mapPointToDiagram(point, diagram))
    .filter(Boolean)
    .map((point) => ({ ...point, source: "manual" }));

  const domePoints = [...dome.liquid, ...dome.vapor];
  const isobarPoints = isobars.flatMap((curve) => curve.points);
  const allPoints = [...domePoints, ...isobarPoints, ...templateMapped, ...manualMapped];
  const transformY = (value) => (isPh ? Math.log10(value) : value);
  const inverseY = (value) => (isPh ? 10 ** value : value);

  if (allPoints.length === 0) {
    ctx.fillStyle = "#6b7280";
    ctx.font = "16px Space Grotesk";
    ctx.fillText("No plot data available for this view.", 36, 60);
    return;
  }

  const primaryPoints = [...templateMapped, ...manualMapped];
  let boundsPoints = primaryPoints.length > 0 ? [...primaryPoints] : [...allPoints];

  if (primaryPoints.length > 0 && domePoints.length > 0) {
    const px = primaryPoints.map((point) => point.x).filter(Number.isFinite);
    const py = primaryPoints.map((point) => transformY(point.y)).filter(Number.isFinite);
    if (px.length > 0 && py.length > 0) {
      const pxMin = Math.min(...px);
      const pxMax = Math.max(...px);
      const pyMin = Math.min(...py);
      const pyMax = Math.max(...py);
      const spanX = Math.max(pxMax - pxMin, 1e-9);
      const spanY = Math.max(pyMax - pyMin, 1e-9);

      for (const point of domePoints) {
        const pointY = transformY(point.y);
        if (!Number.isFinite(point.x) || !Number.isFinite(pointY)) {
          continue;
        }
        const insideX = point.x >= pxMin - 0.7 * spanX && point.x <= pxMax + 0.7 * spanX;
        const insideY = pointY >= pyMin - 0.8 * spanY && pointY <= pyMax + 0.8 * spanY;
        if (insideX && insideY) {
          boundsPoints.push(point);
        }
      }
    }
  }

  const xValues = boundsPoints.map((p) => p.x).filter(Number.isFinite);
  const yValues = boundsPoints.map((p) => p.y).filter(Number.isFinite);
  const yValuesTransformed = yValues.map(transformY).filter(Number.isFinite);

  let xMin = Math.min(...xValues);
  let xMax = Math.max(...xValues);
  let yMin = Math.min(...yValuesTransformed);
  let yMax = Math.max(...yValuesTransformed);

  if (Math.abs(xMax - xMin) < 1e-9) {
    xMin -= 1;
    xMax += 1;
  }
  if (Math.abs(yMax - yMin) < 1e-9) {
    yMin -= 1;
    yMax += 1;
  }

  const xPad = (xMax - xMin) * 0.08;
  const yPad = (yMax - yMin) * 0.1;
  xMin -= xPad;
  xMax += xPad;
  yMin -= yPad;
  yMax += yPad;

  const margin = { left: 74, right: 24, top: 26, bottom: 58 };
  const plotW = width - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;

  const toCanvas = (x, y) => {
    const cx = margin.left + ((x - xMin) / (xMax - xMin)) * plotW;
    const cy = margin.top + (1 - (transformY(y) - yMin) / (yMax - yMin)) * plotH;
    return { x: cx, y: cy };
  };

  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 1;
  const gridLines = 6;

  for (let i = 0; i <= gridLines; i += 1) {
    const gx = margin.left + (i / gridLines) * plotW;
    const gy = margin.top + (i / gridLines) * plotH;

    ctx.beginPath();
    ctx.moveTo(gx, margin.top);
    ctx.lineTo(gx, margin.top + plotH);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(margin.left, gy);
    ctx.lineTo(margin.left + plotW, gy);
    ctx.stroke();
  }

  ctx.strokeStyle = "#cfd4dc";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(margin.left, margin.top);
  ctx.lineTo(margin.left, margin.top + plotH);
  ctx.lineTo(margin.left + plotW, margin.top + plotH);
  ctx.stroke();

  ctx.fillStyle = "#6b7280";
  ctx.font = "11px JetBrains Mono";

  for (let i = 0; i <= gridLines; i += 1) {
    const xValue = xMin + (i / gridLines) * (xMax - xMin);
    const cx = margin.left + (i / gridLines) * plotW;
    ctx.fillText(formatNumber(xValue), cx - 16, margin.top + plotH + 20);

    const yValueTransformed = yMin + (1 - i / gridLines) * (yMax - yMin);
    const yValue = inverseY(yValueTransformed);
    const cy = margin.top + (i / gridLines) * plotH;
    ctx.fillText(formatNumber(yValue), 8, cy + 3);
  }

  const xLabel = diagram === "Ts" ? "s" : diagram === "Ph" ? "h" : "s";
  const yLabel = diagram === "Ts" ? "T" : diagram === "Ph" ? "P (log)" : "h";
  ctx.fillStyle = "#374151";
  ctx.font = "12px JetBrains Mono";
  ctx.fillText(`X: ${xLabel}`, margin.left + plotW / 2 - 22, height - 16);
  ctx.save();
  ctx.translate(16, margin.top + plotH / 2 + 20);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(`Y: ${yLabel}`, 0, 0);
  ctx.restore();

  const drawPolyline = (points, color, widthPx) => {
    if (points.length < 2) {
      return;
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = widthPx;
    ctx.beginPath();
    const start = toCanvas(points[0].x, points[0].y);
    ctx.moveTo(start.x, start.y);
    for (let i = 1; i < points.length; i += 1) {
      const pt = toCanvas(points[i].x, points[i].y);
      ctx.lineTo(pt.x, pt.y);
    }
    ctx.stroke();
  };

  if (state.cycle.domeVisible) {
    drawPolyline(dome.liquid, "#22b8cf", 2.2);
    drawPolyline(dome.vapor, "#22b8cf", 2.2);
  }

  if (state.cycle.isobarsVisible) {
    for (const curve of isobars) {
      drawPolyline(curve.points, "rgba(15, 138, 106, 0.28)", 1.1);
    }
  }

  if (templateMapped.length >= 2) {
    ctx.strokeStyle = "#10a37f";
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    const first = toCanvas(templateMapped[0].x, templateMapped[0].y);
    ctx.moveTo(first.x, first.y);
    for (let i = 1; i < templateMapped.length; i += 1) {
      const pt = toCanvas(templateMapped[i].x, templateMapped[i].y);
      ctx.lineTo(pt.x, pt.y);
    }
    ctx.closePath();
    ctx.stroke();

    const shortSegThreshold = 28;
    for (let i = 0; i < templateMapped.length; i += 1) {
      const from = templateMapped[i];
      const to = templateMapped[(i + 1) % templateMapped.length];
      const fromPx = toCanvas(from.x, from.y);
      const toPx = toCanvas(to.x, to.y);
      const dx = toPx.x - fromPx.x;
      const dy = toPx.y - fromPx.y;
      const dist = Math.hypot(dx, dy);

      if (dist >= shortSegThreshold) {
        continue;
      }

      const nx = dist > 1e-6 ? -dy / dist : 0;
      const ny = dist > 1e-6 ? dx / dist : -1;
      const bump = Math.max(14, 34 - dist);
      const cx = (fromPx.x + toPx.x) / 2 + nx * bump;
      const cy = (fromPx.y + toPx.y) / 2 + ny * bump;

      ctx.save();
      ctx.strokeStyle = "rgba(16, 163, 127, 0.95)";
      ctx.lineWidth = 3.3;
      ctx.beginPath();
      ctx.moveTo(fromPx.x, fromPx.y);
      ctx.quadraticCurveTo(cx, cy, toPx.x, toPx.y);
      ctx.stroke();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(fromPx.x, fromPx.y);
      ctx.quadraticCurveTo(cx, cy, toPx.x, toPx.y);
      ctx.stroke();
      ctx.fillStyle = "#0f8a6a";
      ctx.font = "10px JetBrains Mono";
      ctx.fillText(`${from.label}-${to.label}`, cx + 3, cy - 4);
      ctx.restore();
    }
  }

  const markerInputs = [
    ...templateMapped.map((point) => ({ ...point, markerSource: "template" })),
    ...manualMapped.map((point) => ({ ...point, markerSource: "manual" })),
  ];

  const markerOffsets = [
    { x: 0, y: 0 },
    { x: 12, y: -10 },
    { x: -12, y: -10 },
    { x: 12, y: 10 },
    { x: -12, y: 10 },
    { x: 16, y: 0 },
    { x: -16, y: 0 },
    { x: 0, y: 16 },
    { x: 0, y: -16 },
  ];

  const placed = [];
  const markerLayout = markerInputs.map((point) => {
    const anchor = toCanvas(point.x, point.y);
    let drawPos = { ...anchor };
    const minGap = 18;

    for (const offset of markerOffsets) {
      const candidate = { x: anchor.x + offset.x, y: anchor.y + offset.y };
      const overlaps = placed.some((pos) => Math.hypot(candidate.x - pos.x, candidate.y - pos.y) < minGap);
      if (!overlaps) {
        drawPos = candidate;
        break;
      }
    }

    placed.push(drawPos);
    return { ...point, anchorX: anchor.x, anchorY: anchor.y, drawX: drawPos.x, drawY: drawPos.y };
  });

  const templateMarkers = markerLayout.filter((point) => point.markerSource === "template");
  const manualMarkers = markerLayout.filter((point) => point.markerSource === "manual");

  const drawPoint = (point, fillStyle, strokeStyle) => {
    if (Math.hypot(point.drawX - point.anchorX, point.drawY - point.anchorY) > 1) {
      ctx.strokeStyle = "rgba(107, 114, 128, 0.6)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(point.anchorX, point.anchorY);
      ctx.lineTo(point.drawX, point.drawY);
      ctx.stroke();
    }

    ctx.fillStyle = fillStyle;
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(point.drawX, point.drawY, 4.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#1a1d21";
    ctx.font = "11px JetBrains Mono";
    ctx.fillText(point.label || "", point.drawX + 6, point.drawY - 6);
  };

  for (const point of templateMarkers) {
    drawPoint(point, "#10a37f", "#5bc9ab");
  }

  for (const point of manualMarkers) {
    drawPoint(point, "#64748b", "#cbd5e1");
  }

  ctx.fillStyle = "#6b7280";
  ctx.font = "11px JetBrains Mono";
  ctx.fillText(`Diagram: ${diagram} | Fluid: ${referenceFluid}`, margin.left, margin.top - 8);
}

function renderCyclePanel() {
  renderCycleMetrics();
  renderCycleWarnings();
  renderCyclePointsTable();
  renderCyclePlot();
}

function loadCycleTemplate(templateId, inputOverride = null) {
  const builder = findTemplateBuilder(templateId);
  if (!builder) {
    setCycleStatus("Unknown cycle template.", "error");
    return;
  }

  try {
    const resolvedInputs = mergeCycleInputs(templateId, inputOverride || state.cycle.templateInputs[templateId] || null);
    const built = builder(resolvedInputs);
    state.cycle.templateId = templateId;
    state.cycle.templateInputs[templateId] = resolvedInputs;
    state.cycle.templatePoints = built.points;
    state.cycle.metrics = built.metrics;
    state.cycle.warnings = built.warnings || [];
    state.cycle.workingFluid = built.fluid || null;
    setCycleStatus(`Loaded template: ${CYCLE_TEMPLATES.find((t) => t.id === templateId)?.label || templateId}.`, "ok");
    setCycleInputMessage("Cycle solved from current inputs.", "ok");
  } catch (error) {
    state.cycle.templatePoints = [];
    state.cycle.metrics = [];
    state.cycle.warnings = [];
    state.cycle.workingFluid = null;
    setCycleStatus(error.message, "error");
    setCycleInputMessage(error.message, "error");
  }

  renderCyclePanel();
}

function addManualPoint() {
  const T = Number(el.manualT.value);
  const P = Number(el.manualP.value);
  const h = Number(el.manualH.value);
  const s = Number(el.manualS.value);

  if (![T, P, h, s].some(Number.isFinite)) {
    setCycleStatus("Enter at least one numeric property to add a manual point.", "warn");
    return;
  }

  const label = el.manualLabel.value.trim() || `M${state.cycle.manualPoints.length + 1}`;
  const point = {
    point: label,
    label: "manual",
    T: Number.isFinite(T) ? T : null,
    P: Number.isFinite(P) ? P : null,
    h: Number.isFinite(h) ? h : null,
    s: Number.isFinite(s) ? s : null,
  };

  state.cycle.manualPoints.push(point);
  setCycleStatus(`Added manual point ${label}.`, "ok");

  el.manualLabel.value = "";
  el.manualT.value = "";
  el.manualP.value = "";
  el.manualH.value = "";
  el.manualS.value = "";

  renderCyclePanel();
}

function clearManualPoints() {
  state.cycle.manualPoints = [];
  setCycleStatus("Manual points cleared.");
  renderCyclePanel();
}

function solveCycleFromForm() {
  const templateId = state.cycle.templateId;
  const schema = cycleInputSchema(templateId);
  if (schema.length === 0) {
    loadCycleTemplate(templateId);
    return;
  }

  try {
    const inputs = readCycleInputsFromForm(templateId);
    state.cycle.templateInputs[templateId] = mergeCycleInputs(templateId, inputs);
    loadCycleTemplate(templateId, state.cycle.templateInputs[templateId]);
    renderCycleInverseControls(templateId);
  } catch (error) {
    setCycleInputMessage(error.message, "error");
    setCycleStatus(error.message, "warn");
  }
}

function solveCycleUnknownFromForm() {
  const templateId = state.cycle.templateId;
  const fields = cycleInputSchema(templateId);
  const metrics = cycleMetricSchema(templateId);
  if (fields.length === 0 || metrics.length === 0) {
    setCycleInverseMessage("Unknown solver is unavailable for this template.", "warn");
    return;
  }

  try {
    const unknownKey1 = el.cycleUnknownSelect.value;
    const unknownKey2 = el.cycleUnknownSelect2?.value || "none";
    const targetKey1 = el.cycleTargetMetricSelect.value;
    const targetKey2 = el.cycleTargetMetricSelect2?.value || "none";

    if (!unknownKey1) {
      throw new Error("Select an unknown input.");
    }
    if (!targetKey1) {
      throw new Error("Select a target metric.");
    }

    const targetValue1 = parseOptionalCycleNumber(el.cycleTargetValue.value, "Target value #1");
    const targetValue2 = parseOptionalCycleNumber(el.cycleTargetValue2?.value, "Target value #2");

    if (!Number.isFinite(targetValue1)) {
      throw new Error("Target value #1 is required.");
    }

    const unknownKeys = [unknownKey1];
    if (unknownKey2 && unknownKey2 !== "none") {
      unknownKeys.push(unknownKey2);
    }

    const targetSpecs = [{ key: targetKey1, value: targetValue1 }];
    const secondTargetRequested = (targetKey2 && targetKey2 !== "none") || Number.isFinite(targetValue2);
    if (secondTargetRequested) {
      if (!targetKey2 || targetKey2 === "none") {
        throw new Error("Select target metric #2 when using a second target value.");
      }
      if (!Number.isFinite(targetValue2)) {
        throw new Error("Target value #2 is required for a second equation.");
      }
      targetSpecs.push({ key: targetKey2, value: targetValue2 });
    }

    if (new Set(unknownKeys).size !== unknownKeys.length) {
      throw new Error("Unknown inputs must be different.");
    }
    if (new Set(targetSpecs.map((target) => target.key)).size !== targetSpecs.length) {
      throw new Error("Target metrics must be different.");
    }

    const dofUnknowns = unknownKeys.length;
    const dofEquations = targetSpecs.length;
    if (dofUnknowns !== dofEquations) {
      throw new Error(
        `DOF mismatch: ${dofUnknowns} unknown input(s) selected, but ${dofEquations} target equation(s) provided. Match unknown count to target count.`,
      );
    }

    const minValue1 = parseOptionalCycleNumber(el.cycleSolveMin.value, "Search min #1");
    const maxValue1 = parseOptionalCycleNumber(el.cycleSolveMax.value, "Search max #1");
    const minValue2 = parseOptionalCycleNumber(el.cycleSolveMin2?.value, "Search min #2");
    const maxValue2 = parseOptionalCycleNumber(el.cycleSolveMax2?.value, "Search max #2");

    const knownInputs = readCycleInputsFromFormExcludingKeys(templateId, unknownKeys);
    for (const unknownKey of unknownKeys) {
      const unknownGuessRaw = document.getElementById(`cycleInput_${unknownKey}`)?.value;
      const unknownGuess = parseOptionalCycleNumber(unknownGuessRaw, `Unknown guess (${unknownKey})`);
      if (Number.isFinite(unknownGuess)) {
        knownInputs[unknownKey] = unknownGuess;
      }
    }

    const inverseConfig = cycleInverseInputsForTemplate(templateId);
    inverseConfig.unknownKey = unknownKey1;
    inverseConfig.targetKey = targetKey1;
    inverseConfig.targetValue = targetValue1;
    inverseConfig.min = Number.isFinite(minValue1) ? minValue1 : "";
    inverseConfig.max = Number.isFinite(maxValue1) ? maxValue1 : "";
    inverseConfig.unknownKey2 = unknownKey2 || "none";
    inverseConfig.targetKey2 = targetKey2 || "none";
    inverseConfig.targetValue2 = Number.isFinite(targetValue2) ? targetValue2 : "";
    inverseConfig.min2 = Number.isFinite(minValue2) ? minValue2 : "";
    inverseConfig.max2 = Number.isFinite(maxValue2) ? maxValue2 : "";

    if (unknownKeys.length === 1) {
      const solved = solveUnknownByTarget(
        templateId,
        unknownKey1,
        targetKey1,
        targetValue1,
        knownInputs,
        minValue1,
        maxValue1,
      );

      state.cycle.templateInputs[templateId] = solved.inputs;
      renderCycleInputFields(templateId);
      renderCycleInverseControls(templateId);
      loadCycleTemplate(templateId, solved.inputs);

      const fieldLabel = fields.find((field) => field.key === unknownKey1)?.label || unknownKey1;
      const metricLabel = metrics.find((metric) => metric.key === targetKey1)?.label || targetKey1;
      const residualAbs = Math.abs(solved.residual);
      const solveKind = residualAbs <= Math.max(1e-6, Math.abs(targetValue1) * 1e-5) ? "ok" : "warn";
      setCycleInverseMessage(
        `Solved ${fieldLabel}: ${formatNumber(solved.unknownValue)} | ${metricLabel}=${formatNumber(solved.metricValue)} (target ${formatNumber(targetValue1)}).`,
        solveKind,
      );
      setCycleStatus(`Unknown solver completed in ${solved.iterations} iterations.`, "ok");
      return;
    }

    const twoUnknownSolved = solveTwoUnknownsByTargets({
      templateId,
      unknownKeys: [unknownKey1, unknownKey2],
      targetKeys: [targetKey1, targetKey2],
      targetValues: [targetValue1, targetValue2],
      knownInputs,
      bounds: [
        { min: minValue1, max: maxValue1 },
        { min: minValue2, max: maxValue2 },
      ],
    });

    state.cycle.templateInputs[templateId] = twoUnknownSolved.inputs;
    renderCycleInputFields(templateId);
    renderCycleInverseControls(templateId);
    loadCycleTemplate(templateId, twoUnknownSolved.inputs);

    const fieldLabel1 = fields.find((field) => field.key === unknownKey1)?.label || unknownKey1;
    const fieldLabel2 = fields.find((field) => field.key === unknownKey2)?.label || unknownKey2;
    const metricLabel1 = metrics.find((metric) => metric.key === targetKey1)?.label || targetKey1;
    const metricLabel2 = metrics.find((metric) => metric.key === targetKey2)?.label || targetKey2;
    const summary = `${fieldLabel1}=${formatNumber(twoUnknownSolved.unknownValues[unknownKey1])}, ${fieldLabel2}=${formatNumber(twoUnknownSolved.unknownValues[unknownKey2])}`;
    const residualSummary = `${metricLabel1} residual=${formatNumber(twoUnknownSolved.residuals[targetKey1])}, ${metricLabel2} residual=${formatNumber(twoUnknownSolved.residuals[targetKey2])}`;
    setCycleInverseMessage(
      `2-unknown solve: ${summary}. ${residualSummary}.`,
      twoUnknownSolved.converged ? "ok" : "warn",
    );
    setCycleStatus(
      `2-unknown solver completed in ${twoUnknownSolved.iterations} iterations (${twoUnknownSolved.evaluations} evaluations).`,
      twoUnknownSolved.converged ? "ok" : "warn",
    );
  } catch (error) {
    setCycleInverseMessage(error.message, "error");
    setCycleStatus(error.message, "warn");
  }
}

function wireLookupEvents() {
  el.fluidFilter.addEventListener("change", applyTableFilters);
  el.modeFilter.addEventListener("change", applyTableFilters);
  el.tableSearch.addEventListener("input", applyTableFilters);
  el.tableSelect.addEventListener("change", () => {
    updateSelectedTable(el.tableSelect.value);
  });
  el.queryForm.addEventListener("submit", handleLookupSubmit);
}

function wireCycleEvents() {
  el.cycleDiagramSelect.addEventListener("change", () => {
    state.cycle.diagram = el.cycleDiagramSelect.value;
    renderCyclePlot();
  });

  el.cycleTemplateSelect.addEventListener("change", () => {
    state.cycle.templateId = el.cycleTemplateSelect.value;
    if (!state.cycle.templateInputs[state.cycle.templateId]) {
      state.cycle.templateInputs[state.cycle.templateId] = defaultCycleInputs(state.cycle.templateId);
    }
    cycleInverseInputsForTemplate(state.cycle.templateId);
    renderCycleInputFields(state.cycle.templateId);
    renderCycleInverseControls(state.cycle.templateId);
    loadCycleTemplate(state.cycle.templateId, state.cycle.templateInputs[state.cycle.templateId]);
  });

  el.loadTemplateBtn.addEventListener("click", () => {
    const templateId = el.cycleTemplateSelect.value;
    const defaults = defaultCycleInputs(templateId);
    state.cycle.templateInputs[templateId] = defaults;
    renderCycleInputFields(templateId);
    renderCycleInverseControls(templateId);
    loadCycleTemplate(templateId, defaults);
  });

  if (el.cycleInputForm) {
    el.cycleInputForm.addEventListener("submit", (event) => {
      event.preventDefault();
      solveCycleFromForm();
    });
  }

  if (el.cycleInverseForm) {
    el.cycleInverseForm.addEventListener("submit", (event) => {
      event.preventDefault();
      solveCycleUnknownFromForm();
    });
  }

  if (el.cycleUnknownSelect) {
    el.cycleUnknownSelect.addEventListener("change", () => {
      const config = cycleInverseInputsForTemplate(state.cycle.templateId);
      config.unknownKey = el.cycleUnknownSelect.value;
      refreshCycleDofStatus(true);
    });
  }

  if (el.cycleTargetMetricSelect) {
    el.cycleTargetMetricSelect.addEventListener("change", () => {
      const config = cycleInverseInputsForTemplate(state.cycle.templateId);
      config.targetKey = el.cycleTargetMetricSelect.value;
      refreshCycleDofStatus(true);
    });
  }

  if (el.cycleUnknownSelect2) {
    el.cycleUnknownSelect2.addEventListener("change", () => {
      const config = cycleInverseInputsForTemplate(state.cycle.templateId);
      config.unknownKey2 = el.cycleUnknownSelect2.value || "none";
      refreshCycleDofStatus(true);
    });
  }

  if (el.cycleTargetMetricSelect2) {
    el.cycleTargetMetricSelect2.addEventListener("change", () => {
      const config = cycleInverseInputsForTemplate(state.cycle.templateId);
      config.targetKey2 = el.cycleTargetMetricSelect2.value || "none";
      refreshCycleDofStatus(true);
    });
  }

  if (el.cycleTargetValue) {
    el.cycleTargetValue.addEventListener("input", () => {
      const config = cycleInverseInputsForTemplate(state.cycle.templateId);
      if (el.cycleTargetValue.value.trim() === "") {
        config.targetValue = "";
      } else {
        const value = Number(el.cycleTargetValue.value);
        config.targetValue = Number.isFinite(value) ? value : "";
      }
      refreshCycleDofStatus(true);
    });
  }

  if (el.cycleSolveMin) {
    el.cycleSolveMin.addEventListener("input", () => {
      const config = cycleInverseInputsForTemplate(state.cycle.templateId);
      if (el.cycleSolveMin.value.trim() === "") {
        config.min = "";
      } else {
        const value = Number(el.cycleSolveMin.value);
        config.min = Number.isFinite(value) ? value : "";
      }
      refreshCycleDofStatus(true);
    });
  }

  if (el.cycleSolveMax) {
    el.cycleSolveMax.addEventListener("input", () => {
      const config = cycleInverseInputsForTemplate(state.cycle.templateId);
      if (el.cycleSolveMax.value.trim() === "") {
        config.max = "";
      } else {
        const value = Number(el.cycleSolveMax.value);
        config.max = Number.isFinite(value) ? value : "";
      }
      refreshCycleDofStatus(true);
    });
  }

  if (el.cycleTargetValue2) {
    el.cycleTargetValue2.addEventListener("input", () => {
      const config = cycleInverseInputsForTemplate(state.cycle.templateId);
      if (el.cycleTargetValue2.value.trim() === "") {
        config.targetValue2 = "";
      } else {
        const value = Number(el.cycleTargetValue2.value);
        config.targetValue2 = Number.isFinite(value) ? value : "";
      }
      refreshCycleDofStatus(true);
    });
  }

  if (el.cycleSolveMin2) {
    el.cycleSolveMin2.addEventListener("input", () => {
      const config = cycleInverseInputsForTemplate(state.cycle.templateId);
      if (el.cycleSolveMin2.value.trim() === "") {
        config.min2 = "";
      } else {
        const value = Number(el.cycleSolveMin2.value);
        config.min2 = Number.isFinite(value) ? value : "";
      }
      refreshCycleDofStatus(true);
    });
  }

  if (el.cycleSolveMax2) {
    el.cycleSolveMax2.addEventListener("input", () => {
      const config = cycleInverseInputsForTemplate(state.cycle.templateId);
      if (el.cycleSolveMax2.value.trim() === "") {
        config.max2 = "";
      } else {
        const value = Number(el.cycleSolveMax2.value);
        config.max2 = Number.isFinite(value) ? value : "";
      }
      refreshCycleDofStatus(true);
    });
  }

  el.toggleDome.addEventListener("change", () => {
    state.cycle.domeVisible = el.toggleDome.checked;
    renderCyclePlot();
  });

  el.toggleIsobars.addEventListener("change", () => {
    state.cycle.isobarsVisible = el.toggleIsobars.checked;
    renderCyclePlot();
  });

  el.addManualPointBtn.addEventListener("click", addManualPoint);
  el.clearManualPointsBtn.addEventListener("click", clearManualPoints);
}

async function loadDataset() {
  setLookupLoading(true);
  setStatus("Loading dataset...");

  try {
    const response = await fetch("data/thermo_tables.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Dataset request failed with ${response.status}.`);
    }

    const dataset = await response.json();
    state.dataset = dataset;
    state.tables = dataset.tables || [];
    state.filteredTables = [...state.tables];

    el.datasetMeta.textContent = `${dataset.table_count} tables loaded`;
    populateFluidFilter();
    applyTableFilters();

    populateWorkflowTypeSelect();
    refreshWorkflowControls();
    clearWorkflowResults();
    setWorkflowStatus(`Workflow ready: ${workflowTypeLabel(state.workflow.type)}.`);

    populateCycleTemplateSelect();
    if (!state.cycle.templateInputs[state.cycle.templateId]) {
      state.cycle.templateInputs[state.cycle.templateId] = defaultCycleInputs(state.cycle.templateId);
    }
    cycleInverseInputsForTemplate(state.cycle.templateId);
    renderCycleInputFields(state.cycle.templateId);
    renderCycleInverseControls(state.cycle.templateId);
    loadCycleTemplate(state.cycle.templateId, state.cycle.templateInputs[state.cycle.templateId]);

    renderSessionStats();
    renderHistoryTable();
    renderCompareTable();

    setStatus("Dataset loaded. Lookup is ready.");
  } catch (error) {
    el.datasetMeta.textContent = "Dataset unavailable";
    setStatus(
      `Could not load dataset. Run from a local server (for example: python -m http.server 8080). ${error.message}`,
      "error",
    );
    setWorkflowStatus("Workflow panel unavailable until dataset is loaded.", "error");
    setCycleInputMessage("Cycle inputs unavailable until dataset is loaded.", "error");
    setCycleInverseMessage("Unknown solver unavailable until dataset is loaded.", "error");
    setCycleDofMessage("DOF check unavailable until dataset is loaded.", "error");
    setCycleStatus("Cycle plotter unavailable until dataset is loaded.", "error");
  } finally {
    setLookupLoading(false);
  }
}

function init() {
  wireTabs();
  wireLookupEvents();
  wireWorkflowEvents();
  wireCycleEvents();

  el.modeFilter.value = "all";
  el.cycleDiagramSelect.value = state.cycle.diagram;
  el.toggleDome.checked = state.cycle.domeVisible;
  el.toggleIsobars.checked = state.cycle.isobarsVisible;

  loadDataset();
}

init();
