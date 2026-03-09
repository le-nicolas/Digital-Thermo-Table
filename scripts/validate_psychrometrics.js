"use strict";

const fs = require("fs");
const path = require("path");

const benchmarkPath = path.join(__dirname, "psychrometric_benchmarks.json");
const benchmarkData = JSON.parse(fs.readFileSync(benchmarkPath, "utf8"));

const SYSTEMS = {
  SI: {
    tempToInternal: (value) => value,
    tempFromInternal: (value) => value,
    pressureToInternal: (value) => value,
    pressureFromInternal: (value) => value,
    enthalpyToInternal: (value) => value,
    enthalpyFromInternal: (value) => value,
    volumeFromInternal: (value) => value,
  },
  IP: {
    tempToInternal: (value) => ((value - 32) * 5) / 9,
    tempFromInternal: (value) => (value * 9) / 5 + 32,
    pressureToInternal: (value) => value * 6.894757293168361,
    pressureFromInternal: (value) => value / 6.894757293168361,
    enthalpyToInternal: (value) => value * 2.326,
    enthalpyFromInternal: (value) => value / 2.326,
    volumeFromInternal: (value) => value * 16.018463,
  },
};

function psychSaturationPressure(tC) {
  if (!Number.isFinite(tC)) {
    return null;
  }
  if (tC >= 0) {
    return 0.61121 * Math.exp((18.678 - tC / 234.5) * (tC / (257.14 + tC)));
  }
  return 0.61115 * Math.exp((23.036 - tC / 333.7) * (tC / (279.82 + tC)));
}

function psychHumidityRatioFromPartialPressure(pw, pressure) {
  if (!Number.isFinite(pw) || !Number.isFinite(pressure) || pw < 0 || pw >= pressure) {
    return null;
  }
  if (pw === 0) {
    return 0;
  }
  return 0.621945 * pw / (pressure - pw);
}

function psychPartialPressureFromHumidityRatio(w, pressure) {
  if (!Number.isFinite(w) || !Number.isFinite(pressure) || w < 0) {
    return null;
  }
  return pressure * w / (0.621945 + w);
}

function psychSaturationHumidityRatio(tC, pressure) {
  const pws = psychSaturationPressure(tC);
  return psychHumidityRatioFromPartialPressure(pws, pressure);
}

function psychEnthalpy(tC, w) {
  if (!Number.isFinite(tC) || !Number.isFinite(w)) {
    return null;
  }
  return 1.006 * tC + w * (2501 + 1.86 * tC);
}

function psychSpecificVolume(tC, w, pressure) {
  if (!Number.isFinite(tC) || !Number.isFinite(w) || !Number.isFinite(pressure) || pressure <= 0) {
    return null;
  }
  return 0.287042 * (tC + 273.15) * (1 + 1.607858 * w) / pressure;
}

function psychDewPointFromPartialPressure(pw) {
  if (!Number.isFinite(pw) || pw <= 0) {
    return null;
  }
  let low = -60;
  let high = 100;
  for (let i = 0; i < 80; i += 1) {
    const mid = (low + high) / 2;
    const guess = psychSaturationPressure(mid);
    if (guess > pw) {
      high = mid;
    } else {
      low = mid;
    }
  }
  return (low + high) / 2;
}

function psychStateFromTdbAndW(tdb, w, pressure) {
  const pws = psychSaturationPressure(tdb);
  const ws = psychSaturationHumidityRatio(tdb, pressure);
  if (!Number.isFinite(pws) || !Number.isFinite(ws)) {
    throw new Error("Could not compute saturation properties.");
  }
  if (w < 0) {
    throw new Error("Humidity ratio must be non-negative.");
  }
  if (w > ws + 1e-6) {
    throw new Error("Selected point sits above the saturation curve.");
  }

  const pw = psychPartialPressureFromHumidityRatio(w, pressure);
  const rh = pws > 0 ? pw / pws : null;
  const h = psychEnthalpy(tdb, w);
  const v = psychSpecificVolume(tdb, w, pressure);
  const tdp = psychDewPointFromPartialPressure(pw);

  let low = -30;
  let high = tdb;
  for (let i = 0; i < 80; i += 1) {
    const mid = (low + high) / 2;
    const wsMid = psychSaturationHumidityRatio(mid, pressure);
    const hMid = psychEnthalpy(mid, wsMid);
    if (hMid > h) {
      high = mid;
    } else {
      low = mid;
    }
  }

  return {
    pressure,
    tdb,
    twb: (low + high) / 2,
    tdp,
    rh,
    w,
    h,
    v,
    pw,
    pws,
    ws,
  };
}

function psychDisplayEnthalpy(point, system) {
  const config = SYSTEMS[system];
  if (system === "IP") {
    const tdbDisplay = config.tempFromInternal(point.tdb);
    return 0.24 * tdbDisplay + point.w * (1061 + 0.444 * tdbDisplay);
  }
  return point.h;
}

function solvePsychrometrics({ tdb, secondType, secondValue, pressure, system }) {
  const config = SYSTEMS[system];
  const pressureInternal = config.pressureToInternal(pressure);
  const tdbInternal = config.tempToInternal(tdb);
  let w;

  if (secondType === "rh") {
    const rh = secondValue / 100;
    const pws = psychSaturationPressure(tdbInternal);
    const pw = rh * pws;
    w = psychHumidityRatioFromPartialPressure(pw, pressureInternal);
  } else if (secondType === "w") {
    w = secondValue;
  } else if (secondType === "tdp") {
    const pw = psychSaturationPressure(config.tempToInternal(secondValue));
    w = psychHumidityRatioFromPartialPressure(pw, pressureInternal);
  } else if (secondType === "h") {
    if (system === "IP") {
      w = (secondValue - 0.24 * tdb) / (1061 + 0.444 * tdb);
    } else {
      const hInternal = config.enthalpyToInternal(secondValue);
      w = (hInternal - 1.006 * tdbInternal) / (2501 + 1.86 * tdbInternal);
    }
  } else if (secondType === "twb") {
    const twbInternal = config.tempToInternal(secondValue);
    const wsTwb = psychSaturationHumidityRatio(twbInternal, pressureInternal);
    if (system === "IP") {
      const hSatTwb = 0.24 * secondValue + wsTwb * (1061 + 0.444 * secondValue);
      w = (hSatTwb - 0.24 * tdb) / (1061 + 0.444 * tdb);
    } else {
      const hSatTwb = psychEnthalpy(twbInternal, wsTwb);
      w = (hSatTwb - 1.006 * tdbInternal) / (2501 + 1.86 * tdbInternal);
    }
  } else {
    throw new Error(`Unsupported second type: ${secondType}`);
  }

  const point = psychStateFromTdbAndW(tdbInternal, w, pressureInternal);
  return {
    tdb: config.tempFromInternal(point.tdb),
    twb: config.tempFromInternal(point.twb),
    tdp: config.tempFromInternal(point.tdp),
    rh: point.rh * 100,
    w: point.w,
    h: psychDisplayEnthalpy(point, system),
    v: config.volumeFromInternal(point.v),
    pw: config.pressureFromInternal(point.pw),
    pws: config.pressureFromInternal(point.pws),
    ws: point.ws,
  };
}

function formatNumber(value) {
  return Number.isFinite(value) ? value.toFixed(4).replace(/\.?0+$/, "") : String(value);
}

function runExpectedChecks(result, testCase) {
  const failures = [];
  const expected = testCase.expected || {};
  const tolerance = testCase.tolerance || {};
  for (const [field, expectedValue] of Object.entries(expected)) {
    const actualValue = result[field];
    const allowed = tolerance[field] ?? 0;
    const delta = Math.abs(actualValue - expectedValue);
    if (!(delta <= allowed)) {
      failures.push(
        `${field}: expected ${formatNumber(expectedValue)} +/- ${formatNumber(allowed)}, got ${formatNumber(actualValue)}`,
      );
    }
  }
  return failures;
}

function runPhysicalChecks(result) {
  const failures = [];
  if (!(result.rh >= -0.1 && result.rh <= 100.1)) {
    failures.push(`RH out of range: ${formatNumber(result.rh)}%`);
  }
  if (!(result.w >= -1e-8 && result.w <= result.ws + 1e-6)) {
    failures.push(`W outside saturation envelope: ${formatNumber(result.w)} vs ws ${formatNumber(result.ws)}`);
  }
  if (!(result.twb <= result.tdb + 1e-6)) {
    failures.push(`Twb exceeds Tdb: ${formatNumber(result.twb)} > ${formatNumber(result.tdb)}`);
  }
  if (!(result.tdp <= result.tdb + 1e-6)) {
    failures.push(`Tdp exceeds Tdb: ${formatNumber(result.tdp)} > ${formatNumber(result.tdb)}`);
  }
  return failures;
}

function main() {
  let passed = 0;
  let failed = 0;
  const groupCounts = new Map();

  for (const testCase of benchmarkData.cases) {
    const result = solvePsychrometrics({ ...testCase.input, system: testCase.system });
    const failures = [...runExpectedChecks(result, testCase), ...runPhysicalChecks(result)];
    groupCounts.set(testCase.group, (groupCounts.get(testCase.group) || 0) + 1);
    if (failures.length) {
      failed += 1;
      console.log(`FAIL ${testCase.id} - ${testCase.label}`);
      for (const failure of failures) {
        console.log(`  ${failure}`);
      }
      continue;
    }
    passed += 1;
    console.log(`PASS ${testCase.id} - ${testCase.label}`);
  }

  console.log("");
  console.log(`Benchmarks: ${passed + failed}`);
  for (const [group, count] of groupCounts.entries()) {
    console.log(`  ${group}: ${count}`);
  }
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    process.exitCode = 1;
  }
}

main();
