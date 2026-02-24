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

const WORKFLOW_TYPES = [
  { id: "phase-check", label: "Phase Determination" },
  { id: "two-phase", label: "Two-Phase Mixture" },
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
    templatePoints: [],
    manualPoints: [],
    metrics: [],
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
  return ["PT"];
}

function workflowFluidsForType(workflowType) {
  const modes = workflowRequiredModes(workflowType);
  const fluids = new Set();
  for (const table of state.tables) {
    if (modes.includes(table.mode)) {
      fluids.add(table.fluid);
    }
  }
  return [...fluids].sort((a, b) => a.localeCompare(b));
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
  }

  return {
    items,
    steps,
    status: `Phase workflow solved for ${fluid}.`,
  };
}

function solveTwoPhaseWorkflow({ fluid, unitSystem, basis, basisValue, qualityMode, xInput, qualityProperty, qualityPropertyValue }) {
  const satTable = getWorkflowSatTable(fluid, unitSystem);
  if (!satTable) {
    throw new Error(`No saturated table found for ${fluid} (${unitSystem}).`);
  }

  const satProps = ["T", "P", "vf", "vfg", "vg", "uf", "ufg", "ug", "hf", "hfg", "hg", "sf", "sfg", "sg"];
  const satLookup = interpolate1D(satTable.rows, basis, basisValue, satProps);
  const sat = satLookup.values;
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

  return {
    items,
    steps,
    status: `Two-phase workflow solved for ${fluid}.`,
  };
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
  }

  return {
    items,
    steps,
    status: `Isentropic ${isTurbine ? "turbine" : "compressor"} workflow solved for ${fluid}.`,
  };
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
  const modes = workflowRequiredModes(state.workflow.type);
  el.workflowUnitSelect.innerHTML = "";

  if (!fluid) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "No compatible units";
    el.workflowUnitSelect.appendChild(option);
    el.workflowUnitSelect.value = "";
    return;
  }

  const units = [...new Set(state.tables.filter((table) => table.fluid === fluid && modes.includes(table.mode)).map((table) => table.unit_system))]
    .sort((a, b) => a.localeCompare(b));

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

function buildIdealRankineTemplate() {
  const satPWater = findBestTable({ mode: "sat-P", fluidRegex: /water/i, unitSystem: "SI" });
  const superWater = findBestTable({ mode: "PT", fluidRegex: /water/i, unitSystem: "SI", sheetRegex: /superheated/i });

  if (!satPWater || !superWater) {
    throw new Error("Missing SI water tables for Ideal Rankine template.");
  }

  const pLow = 10;
  const pHigh = 8000;

  const st1 = satStateAtPressure(satPWater, pLow, ["T", "vf", "hf", "sf"]);
  const t3 = clampTemperatureForPressure(superWater, pHigh, 480);
  const st3 = interpolatePT(superWater, t3, pHigh, ["h", "s"]).values;

  const t4 = clampTemperatureForPressure(superWater, pLow, 220);
  const st4 = interpolatePT(superWater, t4, pLow, ["h", "s"]).values;

  const h1 = st1.hf;
  const h2 = h1 + (st1.vf || 0.001) * (pHigh - pLow);

  const points = [
    { point: "1", label: "Condenser outlet", T: st1.T, P: pLow, h: h1, s: st1.sf },
    { point: "2", label: "Pump outlet", T: st1.T + 3, P: pHigh, h: h2, s: st1.sf },
    { point: "3", label: "Turbine inlet", T: t3, P: pHigh, h: st3.h, s: st3.s },
    { point: "4", label: "Turbine outlet", T: t4, P: pLow, h: st4.h, s: st4.s },
  ];

  const wt = points[2].h - points[3].h;
  const wp = points[1].h - points[0].h;
  const wnet = wt - wp;
  const qin = points[2].h - points[1].h;

  const metrics = [
    { label: "Turbine work", value: wt, unit: "kJ/kg" },
    { label: "Pump work", value: wp, unit: "kJ/kg" },
    { label: "Net work", value: wnet, unit: "kJ/kg" },
    { label: "Thermal efficiency", value: safeRatio(wnet, qin), unit: "-" },
    { label: "Back work ratio", value: safeRatio(wp, wt), unit: "-" },
  ];

  return { points, metrics };
}

function buildRankineReheatTemplate() {
  const satPWater = findBestTable({ mode: "sat-P", fluidRegex: /water/i, unitSystem: "SI" });
  const superWater = findBestTable({ mode: "PT", fluidRegex: /water/i, unitSystem: "SI", sheetRegex: /superheated/i });

  if (!satPWater || !superWater) {
    throw new Error("Missing SI water tables for Rankine reheat template.");
  }

  const pLow = 10;
  const pMid = 2500;
  const pHigh = 12000;

  const st1 = satStateAtPressure(satPWater, pLow, ["T", "vf", "hf", "sf"]);
  const h2 = st1.hf + (st1.vf || 0.001) * (pHigh - pLow);

  const t3 = clampTemperatureForPressure(superWater, pHigh, 520);
  const st3 = interpolatePT(superWater, t3, pHigh, ["h", "s"]).values;

  const t4 = clampTemperatureForPressure(superWater, pMid, 360);
  const st4 = interpolatePT(superWater, t4, pMid, ["h", "s"]).values;

  const t5 = clampTemperatureForPressure(superWater, pMid, 520);
  const st5 = interpolatePT(superWater, t5, pMid, ["h", "s"]).values;

  const t6 = clampTemperatureForPressure(superWater, pLow, 240);
  const st6 = interpolatePT(superWater, t6, pLow, ["h", "s"]).values;

  const points = [
    { point: "1", label: "Condenser outlet", T: st1.T, P: pLow, h: st1.hf, s: st1.sf },
    { point: "2", label: "Pump outlet", T: st1.T + 4, P: pHigh, h: h2, s: st1.sf },
    { point: "3", label: "HP turbine inlet", T: t3, P: pHigh, h: st3.h, s: st3.s },
    { point: "4", label: "After HP expansion", T: t4, P: pMid, h: st4.h, s: st4.s },
    { point: "5", label: "After reheat", T: t5, P: pMid, h: st5.h, s: st5.s },
    { point: "6", label: "LP turbine outlet", T: t6, P: pLow, h: st6.h, s: st6.s },
  ];

  const wt = (points[2].h - points[3].h) + (points[4].h - points[5].h);
  const wp = points[1].h - points[0].h;
  const qin = (points[2].h - points[1].h) + (points[4].h - points[3].h);
  const wnet = wt - wp;

  const metrics = [
    { label: "Turbine work", value: wt, unit: "kJ/kg" },
    { label: "Pump work", value: wp, unit: "kJ/kg" },
    { label: "Net work", value: wnet, unit: "kJ/kg" },
    { label: "Thermal efficiency", value: safeRatio(wnet, qin), unit: "-" },
    { label: "Back work ratio", value: safeRatio(wp, wt), unit: "-" },
  ];

  return { points, metrics };
}

function buildVcrTemplate() {
  const satR = findBestTable({ mode: "sat-T", fluidRegex: /r 134a/i, unitSystem: "SI" });
  const superR = findBestTable({ mode: "PT", fluidRegex: /r 134a/i, unitSystem: "SI" });

  if (!satR || !superR) {
    throw new Error("Missing SI R-134a tables for refrigeration template.");
  }

  const pLow = 220;
  const pHigh = 900;

  const lowSat = interpolate1D(satR.rows, "P", pLow, ["T", "hf", "hfg", "hg", "sf", "sfg", "sg"]).values;
  const highSat = interpolate1D(satR.rows, "P", pHigh, ["T", "hf", "hg", "sf", "sg"]).values;

  const t2 = clampTemperatureForPressure(superR, pHigh, 60);
  const st2 = interpolatePT(superR, t2, pHigh, ["h", "s"]).values;

  const h4 = highSat.hf;
  const quality4 = Number.isFinite(lowSat.hfg) && Math.abs(lowSat.hfg) > 1e-12 ? clamp((h4 - lowSat.hf) / lowSat.hfg, 0, 1) : 0;
  const s4 = Number.isFinite(lowSat.sfg) ? lowSat.sf + quality4 * lowSat.sfg : lowSat.sf;

  const points = [
    { point: "1", label: "Evaporator outlet", T: lowSat.T, P: pLow, h: lowSat.hg, s: lowSat.sg },
    { point: "2", label: "Compressor outlet", T: t2, P: pHigh, h: st2.h, s: st2.s },
    { point: "3", label: "Condenser outlet", T: highSat.T, P: pHigh, h: highSat.hf, s: highSat.sf },
    { point: "4", label: "Valve outlet", T: lowSat.T, P: pLow, h: h4, s: s4 },
  ];

  const compressorWork = points[1].h - points[0].h;
  const refrigeratingEffect = points[0].h - points[3].h;
  const heatRejected = points[1].h - points[2].h;

  const metrics = [
    { label: "Compressor work", value: compressorWork, unit: "kJ/kg" },
    { label: "Refrigerating effect", value: refrigeratingEffect, unit: "kJ/kg" },
    { label: "Heat rejected", value: heatRejected, unit: "kJ/kg" },
    { label: "COP", value: safeRatio(refrigeratingEffect, compressorWork), unit: "-" },
  ];

  return { points, metrics };
}

function buildBraytonTemplate() {
  const nitrogen = findBestTable({ mode: "PT", fluidRegex: /nitrogen/i, unitSystem: "SI" });
  if (!nitrogen) {
    throw new Error("Missing SI Nitrogen PT table for Brayton template.");
  }

  const pLow = 100;
  const pHigh = 1000;

  const t1 = clampTemperatureForPressure(nitrogen, pLow, 300);
  const t2 = clampTemperatureForPressure(nitrogen, pHigh, 500);
  const t3 = clampTemperatureForPressure(nitrogen, pHigh, 950);
  const t4 = clampTemperatureForPressure(nitrogen, pLow, 650);

  const st1 = interpolatePT(nitrogen, t1, pLow, ["h", "s"]).values;
  const st2 = interpolatePT(nitrogen, t2, pHigh, ["h", "s"]).values;
  const st3 = interpolatePT(nitrogen, t3, pHigh, ["h", "s"]).values;
  const st4 = interpolatePT(nitrogen, t4, pLow, ["h", "s"]).values;

  const points = [
    { point: "1", label: "Compressor inlet", T: t1, P: pLow, h: st1.h, s: st1.s },
    { point: "2", label: "Compressor outlet", T: t2, P: pHigh, h: st2.h, s: st2.s },
    { point: "3", label: "Turbine inlet", T: t3, P: pHigh, h: st3.h, s: st3.s },
    { point: "4", label: "Turbine outlet", T: t4, P: pLow, h: st4.h, s: st4.s },
  ];

  const compressorWork = points[1].h - points[0].h;
  const turbineWork = points[2].h - points[3].h;
  const netWork = turbineWork - compressorWork;
  const qIn = points[2].h - points[1].h;

  const metrics = [
    { label: "Compressor work", value: compressorWork, unit: "kJ/kg" },
    { label: "Turbine work", value: turbineWork, unit: "kJ/kg" },
    { label: "Net work", value: netWork, unit: "kJ/kg" },
    { label: "Thermal efficiency", value: safeRatio(netWork, qIn), unit: "-" },
  ];

  return { points, metrics };
}

function buildSteamLoopTemplate() {
  const satPWater = findBestTable({ mode: "sat-P", fluidRegex: /water/i, unitSystem: "SI" });
  const superWater = findBestTable({ mode: "PT", fluidRegex: /water/i, unitSystem: "SI", sheetRegex: /superheated/i });

  if (!satPWater || !superWater) {
    throw new Error("Missing SI water tables for steam loop template.");
  }

  const pLow = 500;
  const pHigh = 5000;

  const st1 = satStateAtPressure(satPWater, pLow, ["T", "vf", "hf", "sf"]);
  const h2 = st1.hf + (st1.vf || 0.001) * (pHigh - pLow);

  const t3 = clampTemperatureForPressure(superWater, pHigh, 420);
  const st3 = interpolatePT(superWater, t3, pHigh, ["h", "s"]).values;

  const t4 = clampTemperatureForPressure(superWater, pLow, 260);
  const st4 = interpolatePT(superWater, t4, pLow, ["h", "s"]).values;

  const points = [
    { point: "1", label: "Feedwater", T: st1.T, P: pLow, h: st1.hf, s: st1.sf },
    { point: "2", label: "After pump", T: st1.T + 4, P: pHigh, h: h2, s: st1.sf },
    { point: "3", label: "Heated vapor", T: t3, P: pHigh, h: st3.h, s: st3.s },
    { point: "4", label: "Expansion outlet", T: t4, P: pLow, h: st4.h, s: st4.s },
  ];

  const wt = points[2].h - points[3].h;
  const wp = points[1].h - points[0].h;
  const wnet = wt - wp;
  const qin = points[2].h - points[1].h;

  const metrics = [
    { label: "Turbine-side work", value: wt, unit: "kJ/kg" },
    { label: "Pump-side work", value: wp, unit: "kJ/kg" },
    { label: "Net specific work", value: wnet, unit: "kJ/kg" },
    { label: "Thermal efficiency", value: safeRatio(wnet, qin), unit: "-" },
  ];

  return { points, metrics };
}
function populateCycleTemplateSelect() {
  el.cycleTemplateSelect.innerHTML = "";
  for (const template of CYCLE_TEMPLATES) {
    const option = document.createElement("option");
    option.value = template.id;
    option.textContent = template.label;
    el.cycleTemplateSelect.appendChild(option);
  }
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

function getSaturationDome(diagram) {
  const satWater = findBestTable({ mode: "sat-T", fluidRegex: /water/i, unitSystem: "SI", sheetRegex: /saturated water/i });
  if (!satWater) {
    return { liquid: [], vapor: [] };
  }

  const sortedRows = sortRowsByKey(satWater.rows, "T");
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

function getIsobarCurves(diagram) {
  const superWater = findBestTable({ mode: "PT", fluidRegex: /water/i, unitSystem: "SI", sheetRegex: /superheated/i });
  if (!superWater) {
    return [];
  }

  const groups = buildPressureGroups(superWater.rows);
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
  ctx.fillStyle = "#0a1019";
  ctx.fillRect(0, 0, width, height);

  const diagram = state.cycle.diagram;
  const isPh = diagram === "Ph";

  const dome = state.cycle.domeVisible ? getSaturationDome(diagram) : { liquid: [], vapor: [] };
  const isobars = state.cycle.isobarsVisible ? getIsobarCurves(diagram) : [];

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

  if (allPoints.length === 0) {
    ctx.fillStyle = "#8ea2b9";
    ctx.font = "16px Space Grotesk";
    ctx.fillText("No plot data available for this view.", 36, 60);
    return;
  }

  const transformY = (value) => (isPh ? Math.log10(value) : value);
  const inverseY = (value) => (isPh ? 10 ** value : value);

  const xValues = allPoints.map((p) => p.x).filter(Number.isFinite);
  const yValues = allPoints.map((p) => p.y).filter(Number.isFinite);
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

  ctx.strokeStyle = "#213349";
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

  ctx.strokeStyle = "#4b6a8f";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(margin.left, margin.top);
  ctx.lineTo(margin.left, margin.top + plotH);
  ctx.lineTo(margin.left + plotW, margin.top + plotH);
  ctx.stroke();

  ctx.fillStyle = "#8ea2b9";
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
  ctx.fillStyle = "#c2d2e3";
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
    drawPolyline(dome.liquid, "#39d1ff", 2.2);
    drawPolyline(dome.vapor, "#39d1ff", 2.2);
  }

  if (state.cycle.isobarsVisible) {
    for (const curve of isobars) {
      drawPolyline(curve.points, "rgba(255, 209, 102, 0.45)", 1.1);
    }
  }

  if (templateMapped.length >= 2) {
    ctx.strokeStyle = "#ff8f2b";
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
  }

  const drawPoint = (point, fillStyle, strokeStyle) => {
    const pos = toCanvas(point.x, point.y);
    ctx.fillStyle = fillStyle;
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 4.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#e8eef7";
    ctx.font = "11px JetBrains Mono";
    ctx.fillText(point.label || "", pos.x + 6, pos.y - 6);
  };

  for (const point of templateMapped) {
    drawPoint(point, "#ff8f2b", "#ffd7a9");
  }

  for (const point of manualMapped) {
    drawPoint(point, "#ff4f9a", "#ffc7e0");
  }

  ctx.fillStyle = "#8ea2b9";
  ctx.font = "11px JetBrains Mono";
  ctx.fillText(`Diagram: ${diagram}`, margin.left, margin.top - 8);
}

function renderCyclePanel() {
  renderCycleMetrics();
  renderCyclePointsTable();
  renderCyclePlot();
}

function loadCycleTemplate(templateId) {
  const builder = findTemplateBuilder(templateId);
  if (!builder) {
    setCycleStatus("Unknown cycle template.", "error");
    return;
  }

  try {
    const built = builder();
    state.cycle.templateId = templateId;
    state.cycle.templatePoints = built.points;
    state.cycle.metrics = built.metrics;
    setCycleStatus(`Loaded template: ${CYCLE_TEMPLATES.find((t) => t.id === templateId)?.label || templateId}.`, "ok");
  } catch (error) {
    state.cycle.templatePoints = [];
    state.cycle.metrics = [];
    setCycleStatus(error.message, "error");
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
  });

  el.loadTemplateBtn.addEventListener("click", () => {
    loadCycleTemplate(el.cycleTemplateSelect.value);
  });

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
    loadCycleTemplate(state.cycle.templateId);

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
