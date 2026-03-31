/**
 * Tabla completa de PIDs OBD-II modos 01, 02, 03, 04, 07.
 * Traducción directa de python-obd commands + decoders.
 * Referencia: https://python-obd.readthedocs.io/en/latest/Command%20Tables/
 * Referencia SAE J1979: https://en.wikipedia.org/wiki/OBD-II_PIDs
 */

import type { ObdCommand, ObdValue } from "./types"

// ─── Funciones decoder ────────────────────────────────────────────────────────

function decodePercent(data: number[]): ObdValue {
  return { value: Math.round((data[0] / 255) * 100 * 10) / 10, unit: "%" }
}

function decodePercentCentered(data: number[]): ObdValue {
  const value = Math.round(((data[0] - 128) / 128) * 100 * 10) / 10
  return { value, unit: "%" }
}

function decodeTempCelsius(data: number[]): ObdValue {
  return { value: data[0] - 40, unit: "°C" }
}

function decodeRpm(data: number[]): ObdValue {
  const raw = (data[0] * 256 + data[1]) / 4
  return { value: Math.round(raw), unit: "rpm" }
}

function decodeSpeed(data: number[]): ObdValue {
  return { value: data[0], unit: "km/h" }
}

function decodePressureKpa(data: number[]): ObdValue {
  return { value: data[0], unit: "kPa" }
}

function decodeFuelPressure(data: number[]): ObdValue {
  return { value: data[0] * 3, unit: "kPa" }
}

/** Fuel Rail Pressure relative to manifold vacuum: kPa = A*0.079 */
function decodeFuelPressureVac(data: number[]): ObdValue {
  const value = Math.round((data[0] * 256 + data[1]) * 0.079 * 100) / 100
  return { value, unit: "kPa" }
}

/** Fuel Rail Pressure (direct inject / gauge): kPa = (A*256+B) * 10 */
function decodeFuelPressureDirect(data: number[]): ObdValue {
  return { value: (data[0] * 256 + data[1]) * 10, unit: "kPa" }
}

function decodeFuelTrim(data: number[]): ObdValue {
  const value = Math.round(((data[0] - 128) / 128) * 100 * 10) / 10
  return { value, unit: "%" }
}

function decodeMaf(data: number[]): ObdValue {
  const value = Math.round(((data[0] * 256 + data[1]) / 100) * 100) / 100
  return { value, unit: "g/s" }
}

function decodeTimingAdvance(data: number[]): ObdValue {
  const value = Math.round((data[0] / 2 - 64) * 10) / 10
  return { value, unit: "° before TDC" }
}

function decodeVoltage(data: number[]): ObdValue {
  const raw = (data[0] * 256 + data[1]) / 1000
  return { value: Math.round(raw * 100) / 100, unit: "V" }
}

function decodeFuelRate(data: number[]): ObdValue {
  const value = Math.round(((data[0] * 256 + data[1]) / 20) * 100) / 100
  return { value, unit: "L/h" }
}

/** Lambda ratio wideband (WR voltage PIDs 24–2B): ratio = (A*256+B) / 32768 */
function decodeLambda(data: number[]): ObdValue {
  const value = Math.round(((data[0] * 256 + data[1]) / 32768) * 1000) / 1000
  return { value, unit: "ratio" }
}

/** WR sensor voltage (bytes C,D de PIDs 24–2B): V = (C*256+D) / 8192 */
function decodeSensorVoltage(data: number[]): ObdValue {
  const value = Math.round(((data[0] * 256 + data[1]) / 200) * 1000) / 1000
  return { value, unit: "V" }
}

/**
 * WR Lambda Current (PIDs 34–3B):
 * bytes A,B = lambda ratio; bytes C,D = current en mA
 */
function decodeCurrentCentered(data: number[]): ObdValue {
  const ratio = Math.round(((data[0] * 256 + data[1]) / 32768) * 1000) / 1000
  const current = Math.round(((data[2] * 256 + data[3]) / 256 - 128) * 100) / 100
  return { value: current, unit: "mA", metadata: { lambda: ratio } }
}

function decodeAbsLoad(data: number[]): ObdValue {
  const value = Math.round(((data[0] * 256 + data[1]) / 255) * 100 * 10) / 10
  return { value, unit: "%" }
}

function decodeRuntime(data: number[]): ObdValue {
  return { value: data[0] * 256 + data[1], unit: "s" }
}

function decodeMinutes(data: number[]): ObdValue {
  return { value: data[0] * 256 + data[1], unit: "min" }
}

function decodeDistance(data: number[]): ObdValue {
  return { value: data[0] * 256 + data[1], unit: "km" }
}

function decodePressurePa(data: number[]): ObdValue {
  const raw = data[0] * 256 + data[1]
  return { value: raw - 32767, unit: "Pa" }
}

function decodeAbsEvapPressure(data: number[]): ObdValue {
  const value = Math.round(((data[0] * 256 + data[1]) / 200) * 100) / 100
  return { value, unit: "kPa" }
}

function decodeEvapPressureAlt(data: number[]): ObdValue {
  const raw = data[0] * 256 + data[1]
  return { value: raw - 32767, unit: "Pa" }
}

function decodeBoostPressure(data: number[]): ObdValue {
  const value = Math.round(((data[0] * 256 + data[1]) / 200 - 101.3) * 10) / 10
  return { value, unit: "kPa" }
}

/** Catalyst temperature: °C = (A*256+B) / 10 - 40 */
function decodeCatalystTemp(data: number[]): ObdValue {
  const value = Math.round(((data[0] * 256 + data[1]) / 10 - 40) * 10) / 10
  return { value, unit: "°C" }
}

/** Fuel injection timing: ° = (A*256+B) / 128 - 210 */
function decodeInjectTiming(data: number[]): ObdValue {
  const value = Math.round(((data[0] * 256 + data[1]) / 128 - 210) * 100) / 100
  return { value, unit: "°" }
}

/** Max MAF: g/s = A * 10 (bytes B,C,D reserved) */
function decodeMaxMaf(data: number[]): ObdValue {
  return { value: data[0] * 10, unit: "g/s" }
}

/** Command equivalence ratio: ratio = (A*256+B) / 32768 */
function decodeEquivRatio(data: number[]): ObdValue {
  const value = Math.round(((data[0] * 256 + data[1]) / 32768) * 1000) / 1000
  return { value, unit: "ratio" }
}

/** Count (1 byte) */
function decodeCount(data: number[]): ObdValue {
  return { value: data[0], unit: "count" }
}

/** Fuel type — SAE J1979 Table A-7 */
const FUEL_TYPE_MAP: Record<number, string> = {
  0: "Not available",
  1: "Gasoline",
  2: "Methanol",
  3: "Ethanol",
  4: "Diesel",
  5: "LPG",
  6: "CNG",
  7: "Propane",
  8: "Electric",
  9: "Bifuel running Gasoline",
  10: "Bifuel running Methanol",
  11: "Bifuel running Ethanol",
  12: "Bifuel running LPG",
  13: "Bifuel running CNG",
  14: "Bifuel running Propane",
  15: "Bifuel running Electric",
  16: "Bifuel running Electric + Combustion",
  17: "Hybrid Gasoline",
  18: "Hybrid Ethanol",
  19: "Hybrid Diesel",
  20: "Hybrid Electric",
  21: "Hybrid running Electric + Combustion",
  22: "Hybrid Regenerative",
  23: "Bifuel running Diesel",
}

function decodeFuelType(data: number[]): ObdValue {
  return { value: FUEL_TYPE_MAP[data[0]] ?? `Unknown (${data[0]})`, unit: "none" }
}

/** Secondary Air Status */
const AIR_STATUS_MAP: Record<number, string> = {
  1: "Upstream",
  2: "Downstream",
  4: "Atmosphere / Off",
  8: "Pump on for diagnostics",
}

function decodeAirStatus(data: number[]): ObdValue {
  return { value: AIR_STATUS_MAP[data[0]] ?? `Unknown (${data[0]})`, unit: "none" }
}

/** OBD Compliance — SAE J1979 Table A-6 */
const OBD_COMPLIANCE_MAP: Record<number, string> = {
  1: "OBD-II (CARB)",
  2: "OBD (EPA)",
  3: "OBD and OBD-II",
  4: "OBD-I",
  5: "Not OBD compliant",
  6: "EOBD",
  7: "EOBD and OBD-II",
  8: "EOBD and OBD",
  9: "EOBD, OBD and OBD-II",
  10: "JOBD",
  11: "JOBD and OBD-II",
  12: "JOBD and EOBD",
  13: "JOBD, EOBD and OBD-II",
  17: "EMD",
  18: "EMD+",
  19: "HD OBD-C",
  20: "HD OBD",
  21: "WWH OBD",
  23: "HD EOBD-I",
  24: "HD EOBD-I N",
  25: "HD EOBD-II",
  26: "HD EOBD-II N",
  28: "OBDBr-1",
  29: "OBDBr-2",
  30: "KOBD",
  31: "IOBD I",
  32: "IOBD II",
  33: "HD EOBD-IV",
}

function decodeObdCompliance(data: number[]): ObdValue {
  return { value: OBD_COMPLIANCE_MAP[data[0]] ?? `Unknown (${data[0]})`, unit: "none" }
}

/** No-op decoder (comando sin datos útiles para parsear) */
function decodeNoop(data: number[]): ObdValue {
  void data
  return { value: null, unit: "none" }
}

// ─── Tabla Mode 01 ────────────────────────────────────────────────────────────

export const MODE01_COMMANDS = {

  PIDS_A: {
    name: "PIDS_A",
    description: "PIDs soportados [01-20]",
    mode: "01", pid: "00", bytes: 4,
    decoder: decodeNoop, unit: "bitfield",
  },

  STATUS: {
    name: "STATUS",
    description: "Estado desde que se borraron los DTCs",
    mode: "01", pid: "01", bytes: 4,
    decoder: decodeNoop, unit: "bitfield",
  },

  FREEZE_DTC: {
    name: "FREEZE_DTC",
    description: "DTC que disparó el freeze frame",
    mode: "01", pid: "02", bytes: 2,
    decoder: decodeNoop, unit: "none",
  },

  FUEL_STATUS: {
    name: "FUEL_STATUS",
    description: "Estado del sistema de combustible",
    mode: "01", pid: "03", bytes: 2,
    decoder: decodeNoop, unit: "none",
  },

  ENGINE_LOAD: {
    name: "ENGINE_LOAD",
    description: "Carga calculada del motor",
    mode: "01", pid: "04", bytes: 1,
    decoder: decodePercent, unit: "%",
  },

  COOLANT_TEMP: {
    name: "COOLANT_TEMP",
    description: "Temperatura del refrigerante del motor",
    mode: "01", pid: "05", bytes: 1,
    decoder: decodeTempCelsius, unit: "°C",
  },

  SHORT_FUEL_TRIM_1: {
    name: "SHORT_FUEL_TRIM_1",
    description: "Corrección corta de combustible — Banco 1",
    mode: "01", pid: "06", bytes: 1,
    decoder: decodeFuelTrim, unit: "%",
  },

  LONG_FUEL_TRIM_1: {
    name: "LONG_FUEL_TRIM_1",
    description: "Corrección larga de combustible — Banco 1",
    mode: "01", pid: "07", bytes: 1,
    decoder: decodeFuelTrim, unit: "%",
  },

  SHORT_FUEL_TRIM_2: {
    name: "SHORT_FUEL_TRIM_2",
    description: "Corrección corta de combustible — Banco 2",
    mode: "01", pid: "08", bytes: 1,
    decoder: decodeFuelTrim, unit: "%",
  },

  LONG_FUEL_TRIM_2: {
    name: "LONG_FUEL_TRIM_2",
    description: "Corrección larga de combustible — Banco 2",
    mode: "01", pid: "09", bytes: 1,
    decoder: decodeFuelTrim, unit: "%",
  },

  FUEL_PRESSURE: {
    name: "FUEL_PRESSURE",
    description: "Presión del combustible (relativa al vacío)",
    mode: "01", pid: "0A", bytes: 1,
    decoder: decodeFuelPressure, unit: "kPa",
  },

  INTAKE_PRESSURE: {
    name: "INTAKE_PRESSURE",
    description: "Presión absoluta del colector de admisión (MAP)",
    mode: "01", pid: "0B", bytes: 1,
    decoder: decodePressureKpa, unit: "kPa",
  },

  RPM: {
    name: "RPM",
    description: "Revoluciones por minuto del motor",
    mode: "01", pid: "0C", bytes: 2,
    decoder: decodeRpm, unit: "rpm",
  },

  SPEED: {
    name: "SPEED",
    description: "Velocidad del vehículo",
    mode: "01", pid: "0D", bytes: 1,
    decoder: decodeSpeed, unit: "km/h",
  },

  TIMING_ADVANCE: {
    name: "TIMING_ADVANCE",
    description: "Avance del encendido en el cilindro #1",
    mode: "01", pid: "0E", bytes: 1,
    decoder: decodeTimingAdvance, unit: "° before TDC",
  },

  INTAKE_TEMP: {
    name: "INTAKE_TEMP",
    description: "Temperatura del aire de admisión",
    mode: "01", pid: "0F", bytes: 1,
    decoder: decodeTempCelsius, unit: "°C",
  },

  MAF: {
    name: "MAF",
    description: "Caudal másico de aire (MAF)",
    mode: "01", pid: "10", bytes: 2,
    decoder: decodeMaf, unit: "g/s",
  },

  THROTTLE_POS: {
    name: "THROTTLE_POS",
    description: "Posición del acelerador",
    mode: "01", pid: "11", bytes: 1,
    decoder: decodePercent, unit: "%",
  },

  AIR_STATUS: {
    name: "AIR_STATUS",
    description: "Estado del aire secundario",
    mode: "01", pid: "12", bytes: 1,
    decoder: decodeAirStatus, unit: "none",
  },

  O2_SENSORS: {
    name: "O2_SENSORS",
    description: "Sensores O2 presentes",
    mode: "01", pid: "13", bytes: 1,
    decoder: decodeNoop, unit: "bitfield",
  },

  O2_B1S1: {
    name: "O2_B1S1",
    description: "O2 Banco 1 Sensor 1 — Voltaje",
    mode: "01", pid: "14", bytes: 2,
    decoder: (data: number[]) => decodeSensorVoltage(data), unit: "V",
  },

  O2_B1S2: {
    name: "O2_B1S2",
    description: "O2 Banco 1 Sensor 2 — Voltaje",
    mode: "01", pid: "15", bytes: 2,
    decoder: (data: number[]) => decodeSensorVoltage(data), unit: "V",
  },

  O2_B1S3: {
    name: "O2_B1S3",
    description: "O2 Banco 1 Sensor 3 — Voltaje",
    mode: "01", pid: "16", bytes: 2,
    decoder: (data: number[]) => decodeSensorVoltage(data), unit: "V",
  },

  O2_B1S4: {
    name: "O2_B1S4",
    description: "O2 Banco 1 Sensor 4 — Voltaje",
    mode: "01", pid: "17", bytes: 2,
    decoder: (data: number[]) => decodeSensorVoltage(data), unit: "V",
  },

  O2_B2S1: {
    name: "O2_B2S1",
    description: "O2 Banco 2 Sensor 1 — Voltaje",
    mode: "01", pid: "18", bytes: 2,
    decoder: (data: number[]) => decodeSensorVoltage(data), unit: "V",
  },

  O2_B2S2: {
    name: "O2_B2S2",
    description: "O2 Banco 2 Sensor 2 — Voltaje",
    mode: "01", pid: "19", bytes: 2,
    decoder: (data: number[]) => decodeSensorVoltage(data), unit: "V",
  },

  O2_B2S3: {
    name: "O2_B2S3",
    description: "O2 Banco 2 Sensor 3 — Voltaje",
    mode: "01", pid: "1A", bytes: 2,
    decoder: (data: number[]) => decodeSensorVoltage(data), unit: "V",
  },

  O2_B2S4: {
    name: "O2_B2S4",
    description: "O2 Banco 2 Sensor 4 — Voltaje",
    mode: "01", pid: "1B", bytes: 2,
    decoder: (data: number[]) => decodeSensorVoltage(data), unit: "V",
  },

  OBD_COMPLIANCE: {
    name: "OBD_COMPLIANCE",
    description: "Estándar OBD al que cumple el vehículo",
    mode: "01", pid: "1C", bytes: 1,
    decoder: decodeObdCompliance, unit: "none",
  },

  O2_SENSORS_ALT: {
    name: "O2_SENSORS_ALT",
    description: "Sensores O2 presentes (alternativo)",
    mode: "01", pid: "1D", bytes: 1,
    decoder: decodeNoop, unit: "bitfield",
  },

  AUX_INPUT_STATUS: {
    name: "AUX_INPUT_STATUS",
    description: "Estado de entrada auxiliar (Power Take Off)",
    mode: "01", pid: "1E", bytes: 1,
    decoder: decodeNoop, unit: "bitfield",
  },

  RUN_TIME: {
    name: "RUN_TIME",
    description: "Tiempo desde el arranque del motor",
    mode: "01", pid: "1F", bytes: 2,
    decoder: decodeRuntime, unit: "s",
  },

  PIDS_B: {
    name: "PIDS_B",
    description: "PIDs soportados [21-40]",
    mode: "01", pid: "20", bytes: 4,
    decoder: decodeNoop, unit: "bitfield",
  },

  DISTANCE_W_MIL: {
    name: "DISTANCE_W_MIL",
    description: "Distancia recorrida con MIL encendido",
    mode: "01", pid: "21", bytes: 2,
    decoder: decodeDistance, unit: "km",
  },

  FUEL_RAIL_PRESSURE_VAC: {
    name: "FUEL_RAIL_PRESSURE_VAC",
    description: "Presión del rail de combustible (relativa al vacío)",
    mode: "01", pid: "22", bytes: 2,
    decoder: decodeFuelPressureVac, unit: "kPa",
  },

  FUEL_RAIL_PRESSURE_DIRECT: {
    name: "FUEL_RAIL_PRESSURE_DIRECT",
    description: "Presión del rail de combustible (inyección directa)",
    mode: "01", pid: "23", bytes: 2,
    decoder: decodeFuelPressureDirect, unit: "kPa",
  },

  O2_S1_WR_VOLTAGE: {
    name: "O2_S1_WR_VOLTAGE",
    description: "O2 Sensor 1 — Lambda WR + Voltaje (wideband)",
    mode: "01", pid: "24", bytes: 4,
    decoder: (data: number[]) => decodeLambda(data.slice(0, 2)), unit: "ratio",
  },

  O2_S2_WR_VOLTAGE: {
    name: "O2_S2_WR_VOLTAGE",
    description: "O2 Sensor 2 — Lambda WR + Voltaje (wideband)",
    mode: "01", pid: "25", bytes: 4,
    decoder: (data: number[]) => decodeLambda(data.slice(0, 2)), unit: "ratio",
  },

  O2_S3_WR_VOLTAGE: {
    name: "O2_S3_WR_VOLTAGE",
    description: "O2 Sensor 3 — Lambda WR + Voltaje (wideband)",
    mode: "01", pid: "26", bytes: 4,
    decoder: (data: number[]) => decodeLambda(data.slice(0, 2)), unit: "ratio",
  },

  O2_S4_WR_VOLTAGE: {
    name: "O2_S4_WR_VOLTAGE",
    description: "O2 Sensor 4 — Lambda WR + Voltaje (wideband)",
    mode: "01", pid: "27", bytes: 4,
    decoder: (data: number[]) => decodeLambda(data.slice(0, 2)), unit: "ratio",
  },

  O2_S5_WR_VOLTAGE: {
    name: "O2_S5_WR_VOLTAGE",
    description: "O2 Sensor 5 — Lambda WR + Voltaje (wideband)",
    mode: "01", pid: "28", bytes: 4,
    decoder: (data: number[]) => decodeLambda(data.slice(0, 2)), unit: "ratio",
  },

  O2_S6_WR_VOLTAGE: {
    name: "O2_S6_WR_VOLTAGE",
    description: "O2 Sensor 6 — Lambda WR + Voltaje (wideband)",
    mode: "01", pid: "29", bytes: 4,
    decoder: (data: number[]) => decodeLambda(data.slice(0, 2)), unit: "ratio",
  },

  O2_S7_WR_VOLTAGE: {
    name: "O2_S7_WR_VOLTAGE",
    description: "O2 Sensor 7 — Lambda WR + Voltaje (wideband)",
    mode: "01", pid: "2A", bytes: 4,
    decoder: (data: number[]) => decodeLambda(data.slice(0, 2)), unit: "ratio",
  },

  O2_S8_WR_VOLTAGE: {
    name: "O2_S8_WR_VOLTAGE",
    description: "O2 Sensor 8 — Lambda WR + Voltaje (wideband)",
    mode: "01", pid: "2B", bytes: 4,
    decoder: (data: number[]) => decodeLambda(data.slice(0, 2)), unit: "ratio",
  },

  COMMANDED_EGR: {
    name: "COMMANDED_EGR",
    description: "EGR comandado",
    mode: "01", pid: "2C", bytes: 1,
    decoder: decodePercent, unit: "%",
  },

  EGR_ERROR: {
    name: "EGR_ERROR",
    description: "Error de EGR",
    mode: "01", pid: "2D", bytes: 1,
    decoder: decodePercentCentered, unit: "%",
  },

  EVAPORATIVE_PURGE: {
    name: "EVAPORATIVE_PURGE",
    description: "Purga evaporativa comandada",
    mode: "01", pid: "2E", bytes: 1,
    decoder: decodePercent, unit: "%",
  },

  FUEL_LEVEL: {
    name: "FUEL_LEVEL",
    description: "Nivel del depósito de combustible",
    mode: "01", pid: "2F", bytes: 1,
    decoder: decodePercent, unit: "%",
  },

  WARMUPS_SINCE_DTC_CLEAR: {
    name: "WARMUPS_SINCE_DTC_CLEAR",
    description: "Ciclos de calentamiento desde que se borraron los DTCs",
    mode: "01", pid: "30", bytes: 1,
    decoder: decodeCount, unit: "count",
  },

  DISTANCE_SINCE_DTC_CLEAR: {
    name: "DISTANCE_SINCE_DTC_CLEAR",
    description: "Distancia recorrida desde que se borraron los DTCs",
    mode: "01", pid: "31", bytes: 2,
    decoder: decodeDistance, unit: "km",
  },

  EVAP_VAPOR_PRESSURE: {
    name: "EVAP_VAPOR_PRESSURE",
    description: "Presión de vapor del sistema EVAP",
    mode: "01", pid: "32", bytes: 2,
    decoder: decodePressurePa, unit: "Pa",
  },

  BAROMETRIC_PRESSURE: {
    name: "BAROMETRIC_PRESSURE",
    description: "Presión barométrica",
    mode: "01", pid: "33", bytes: 1,
    decoder: decodePressureKpa, unit: "kPa",
  },

  O2_S1_WR_CURRENT: {
    name: "O2_S1_WR_CURRENT",
    description: "O2 Sensor 1 — Lambda WR + Corriente (wideband)",
    mode: "01", pid: "34", bytes: 4,
    decoder: decodeCurrentCentered, unit: "mA",
  },

  O2_S2_WR_CURRENT: {
    name: "O2_S2_WR_CURRENT",
    description: "O2 Sensor 2 — Lambda WR + Corriente (wideband)",
    mode: "01", pid: "35", bytes: 4,
    decoder: decodeCurrentCentered, unit: "mA",
  },

  O2_S3_WR_CURRENT: {
    name: "O2_S3_WR_CURRENT",
    description: "O2 Sensor 3 — Lambda WR + Corriente (wideband)",
    mode: "01", pid: "36", bytes: 4,
    decoder: decodeCurrentCentered, unit: "mA",
  },

  O2_S4_WR_CURRENT: {
    name: "O2_S4_WR_CURRENT",
    description: "O2 Sensor 4 — Lambda WR + Corriente (wideband)",
    mode: "01", pid: "37", bytes: 4,
    decoder: decodeCurrentCentered, unit: "mA",
  },

  O2_S5_WR_CURRENT: {
    name: "O2_S5_WR_CURRENT",
    description: "O2 Sensor 5 — Lambda WR + Corriente (wideband)",
    mode: "01", pid: "38", bytes: 4,
    decoder: decodeCurrentCentered, unit: "mA",
  },

  O2_S6_WR_CURRENT: {
    name: "O2_S6_WR_CURRENT",
    description: "O2 Sensor 6 — Lambda WR + Corriente (wideband)",
    mode: "01", pid: "39", bytes: 4,
    decoder: decodeCurrentCentered, unit: "mA",
  },

  O2_S7_WR_CURRENT: {
    name: "O2_S7_WR_CURRENT",
    description: "O2 Sensor 7 — Lambda WR + Corriente (wideband)",
    mode: "01", pid: "3A", bytes: 4,
    decoder: decodeCurrentCentered, unit: "mA",
  },

  O2_S8_WR_CURRENT: {
    name: "O2_S8_WR_CURRENT",
    description: "O2 Sensor 8 — Lambda WR + Corriente (wideband)",
    mode: "01", pid: "3B", bytes: 4,
    decoder: decodeCurrentCentered, unit: "mA",
  },

  CATALYST_TEMP_B1S1: {
    name: "CATALYST_TEMP_B1S1",
    description: "Temperatura del catalizador — Banco 1 Sensor 1",
    mode: "01", pid: "3C", bytes: 2,
    decoder: decodeCatalystTemp, unit: "°C",
  },

  CATALYST_TEMP_B2S1: {
    name: "CATALYST_TEMP_B2S1",
    description: "Temperatura del catalizador — Banco 2 Sensor 1",
    mode: "01", pid: "3D", bytes: 2,
    decoder: decodeCatalystTemp, unit: "°C",
  },

  CATALYST_TEMP_B1S2: {
    name: "CATALYST_TEMP_B1S2",
    description: "Temperatura del catalizador — Banco 1 Sensor 2",
    mode: "01", pid: "3E", bytes: 2,
    decoder: decodeCatalystTemp, unit: "°C",
  },

  CATALYST_TEMP_B2S2: {
    name: "CATALYST_TEMP_B2S2",
    description: "Temperatura del catalizador — Banco 2 Sensor 2",
    mode: "01", pid: "3F", bytes: 2,
    decoder: decodeCatalystTemp, unit: "°C",
  },

  PIDS_C: {
    name: "PIDS_C",
    description: "PIDs soportados [41-60]",
    mode: "01", pid: "40", bytes: 4,
    decoder: decodeNoop, unit: "bitfield",
  },

  STATUS_DRIVE_CYCLE: {
    name: "STATUS_DRIVE_CYCLE",
    description: "Estado del monitor en este ciclo de conducción",
    mode: "01", pid: "41", bytes: 4,
    decoder: decodeNoop, unit: "bitfield",
  },

  CONTROL_MODULE_VOLTAGE: {
    name: "CONTROL_MODULE_VOLTAGE",
    description: "Voltaje del módulo de control",
    mode: "01", pid: "42", bytes: 2,
    decoder: decodeVoltage, unit: "V",
  },

  ABSOLUTE_LOAD: {
    name: "ABSOLUTE_LOAD",
    description: "Valor de carga absoluta",
    mode: "01", pid: "43", bytes: 2,
    decoder: decodeAbsLoad, unit: "%",
  },

  COMMAND_EQUIV_RATIO: {
    name: "COMMAND_EQUIV_RATIO",
    description: "Relación de equivalencia comandada (lambda)",
    mode: "01", pid: "44", bytes: 2,
    decoder: decodeEquivRatio, unit: "ratio",
  },

  RELATIVE_THROTTLE_POS: {
    name: "RELATIVE_THROTTLE_POS",
    description: "Posición relativa del acelerador",
    mode: "01", pid: "45", bytes: 1,
    decoder: decodePercent, unit: "%",
  },

  AMBIANT_AIR_TEMP: {
    name: "AMBIANT_AIR_TEMP",
    description: "Temperatura del aire ambiente",
    mode: "01", pid: "46", bytes: 1,
    decoder: decodeTempCelsius, unit: "°C",
  },

  THROTTLE_POS_B: {
    name: "THROTTLE_POS_B",
    description: "Posición absoluta del acelerador B",
    mode: "01", pid: "47", bytes: 1,
    decoder: decodePercent, unit: "%",
  },

  THROTTLE_POS_C: {
    name: "THROTTLE_POS_C",
    description: "Posición absoluta del acelerador C",
    mode: "01", pid: "48", bytes: 1,
    decoder: decodePercent, unit: "%",
  },

  ACCELERATOR_POS_D: {
    name: "ACCELERATOR_POS_D",
    description: "Posición del pedal acelerador D",
    mode: "01", pid: "49", bytes: 1,
    decoder: decodePercent, unit: "%",
  },

  ACCELERATOR_POS_E: {
    name: "ACCELERATOR_POS_E",
    description: "Posición del pedal acelerador E",
    mode: "01", pid: "4A", bytes: 1,
    decoder: decodePercent, unit: "%",
  },

  ACCELERATOR_POS_F: {
    name: "ACCELERATOR_POS_F",
    description: "Posición del pedal acelerador F",
    mode: "01", pid: "4B", bytes: 1,
    decoder: decodePercent, unit: "%",
  },

  THROTTLE_ACTUATOR: {
    name: "THROTTLE_ACTUATOR",
    description: "Control del actuador del acelerador",
    mode: "01", pid: "4C", bytes: 1,
    decoder: decodePercent, unit: "%",
  },

  RUN_TIME_MIL: {
    name: "RUN_TIME_MIL",
    description: "Tiempo de marcha con MIL encendido",
    mode: "01", pid: "4D", bytes: 2,
    decoder: decodeMinutes, unit: "min",
  },

  TIME_SINCE_DTC_CLEARED: {
    name: "TIME_SINCE_DTC_CLEARED",
    description: "Tiempo desde que se borraron los DTCs",
    mode: "01", pid: "4E", bytes: 2,
    decoder: decodeMinutes, unit: "min",
  },

  MAX_VALUES: {
    name: "MAX_VALUES",
    description: "Valores máximos (lambda, voltaje O2, corriente O2, presión MAP)",
    mode: "01", pid: "4F", bytes: 4,
    decoder: decodeNoop, unit: "none",
  },

  MAX_MAF: {
    name: "MAX_MAF",
    description: "Valor máximo del sensor MAF",
    mode: "01", pid: "50", bytes: 4,
    decoder: (data: number[]) => decodeMaxMaf(data), unit: "g/s",
  },

  FUEL_TYPE: {
    name: "FUEL_TYPE",
    description: "Tipo de combustible",
    mode: "01", pid: "51", bytes: 1,
    decoder: decodeFuelType, unit: "none",
  },

  ETHANOL_PERCENT: {
    name: "ETHANOL_PERCENT",
    description: "Porcentaje de etanol en el combustible",
    mode: "01", pid: "52", bytes: 1,
    decoder: decodePercent, unit: "%",
  },

  EVAP_VAPOR_PRESSURE_ABS: {
    name: "EVAP_VAPOR_PRESSURE_ABS",
    description: "Presión de vapor EVAP (absoluta)",
    mode: "01", pid: "53", bytes: 2,
    decoder: decodeAbsEvapPressure, unit: "kPa",
  },

  EVAP_VAPOR_PRESSURE_ALT: {
    name: "EVAP_VAPOR_PRESSURE_ALT",
    description: "Presión de vapor EVAP (alternativa)",
    mode: "01", pid: "54", bytes: 2,
    decoder: decodeEvapPressureAlt, unit: "Pa",
  },

  SHORT_O2_TRIM_B1: {
    name: "SHORT_O2_TRIM_B1",
    description: "Corrección corta secundaria de O2 — Banco 1",
    mode: "01", pid: "55", bytes: 2,
    decoder: (data: number[]) => decodePercentCentered([data[0]]), unit: "%",
  },

  LONG_O2_TRIM_B1: {
    name: "LONG_O2_TRIM_B1",
    description: "Corrección larga secundaria de O2 — Banco 1",
    mode: "01", pid: "56", bytes: 2,
    decoder: (data: number[]) => decodePercentCentered([data[0]]), unit: "%",
  },

  SHORT_O2_TRIM_B2: {
    name: "SHORT_O2_TRIM_B2",
    description: "Corrección corta secundaria de O2 — Banco 2",
    mode: "01", pid: "57", bytes: 2,
    decoder: (data: number[]) => decodePercentCentered([data[0]]), unit: "%",
  },

  LONG_O2_TRIM_B2: {
    name: "LONG_O2_TRIM_B2",
    description: "Corrección larga secundaria de O2 — Banco 2",
    mode: "01", pid: "58", bytes: 2,
    decoder: (data: number[]) => decodePercentCentered([data[0]]), unit: "%",
  },

  FUEL_RAIL_PRESSURE_ABS: {
    name: "FUEL_RAIL_PRESSURE_ABS",
    description: "Presión del rail de combustible (absoluta)",
    mode: "01", pid: "59", bytes: 2,
    decoder: decodeFuelPressureDirect, unit: "kPa",
  },

  RELATIVE_ACCEL_POS: {
    name: "RELATIVE_ACCEL_POS",
    description: "Posición relativa del pedal acelerador",
    mode: "01", pid: "5A", bytes: 1,
    decoder: decodePercent, unit: "%",
  },

  HYBRID_BATTERY_REMAINING: {
    name: "HYBRID_BATTERY_REMAINING",
    description: "Vida restante de la batería híbrida",
    mode: "01", pid: "5B", bytes: 1,
    decoder: decodePercent, unit: "%",
  },

  OIL_TEMP: {
    name: "OIL_TEMP",
    description: "Temperatura del aceite del motor",
    mode: "01", pid: "5C", bytes: 1,
    decoder: decodeTempCelsius, unit: "°C",
  },

  FUEL_INJECT_TIMING: {
    name: "FUEL_INJECT_TIMING",
    description: "Timing de inyección de combustible",
    mode: "01", pid: "5D", bytes: 2,
    decoder: decodeInjectTiming, unit: "°",
  },

  FUEL_RATE: {
    name: "FUEL_RATE",
    description: "Tasa de consumo de combustible del motor",
    mode: "01", pid: "5E", bytes: 2,
    decoder: decodeFuelRate, unit: "L/h",
  },

  EMISSION_REQ: {
    name: "EMISSION_REQ",
    description: "Requisitos de emisión para los que está diseñado el vehículo",
    mode: "01", pid: "5F", bytes: 1,
    decoder: decodeNoop, unit: "none",
  },

  BOOST_PRESSURE: {
    name: "BOOST_PRESSURE",
    description: "Presión del turbocompresor",
    mode: "01", pid: "70", bytes: 4,
    decoder: decodeBoostPressure, unit: "kPa",
  },

} as const satisfies Record<string, ObdCommand>

// ─── Tabla Mode 02 (mirror de Mode 01 — datos del freeze frame) ───────────────

export const MODE02_COMMANDS = Object.fromEntries(
  Object.entries(MODE01_COMMANDS).map(([key, cmd]) => [
    `DTC_${key}`,
    {
      ...cmd,
      name: `DTC_${cmd.name}`,
      description: `[Freeze Frame] ${cmd.description}`,
      mode: "02",
    },
  ])
) as Record<string, ObdCommand>

// ─── Tabla Mode 03 ────────────────────────────────────────────────────────────

export const MODE03_COMMANDS = {
  GET_DTC: {
    name: "GET_DTC",
    description: "Obtener DTCs activos (códigos de falla almacenados)",
    mode: "03",
    pid: "",
    bytes: 0,
    decoder: decodeNoop,
    unit: "none",
  },
} as const satisfies Record<string, ObdCommand>

// ─── Tabla Mode 04 ────────────────────────────────────────────────────────────

export const MODE04_COMMANDS = {
  CLEAR_DTC: {
    name: "CLEAR_DTC",
    description: "Borrar DTCs y datos de freeze frame",
    mode: "04",
    pid: "",
    bytes: 0,
    decoder: decodeNoop,
    unit: "none",
  },
} as const satisfies Record<string, ObdCommand>

// ─── Tabla Mode 07 ────────────────────────────────────────────────────────────

export const MODE07_COMMANDS = {
  GET_CURRENT_DTC: {
    name: "GET_CURRENT_DTC",
    description: "Obtener DTCs pendientes del ciclo de conducción actual",
    mode: "07",
    pid: "",
    bytes: 0,
    decoder: decodeNoop,
    unit: "none",
  },
} as const satisfies Record<string, ObdCommand>

// ─── Índice unificado de todos los comandos ───────────────────────────────────

export const OBD_COMMANDS = {
  ...MODE01_COMMANDS,
  ...MODE02_COMMANDS,
  ...MODE03_COMMANDS,
  ...MODE04_COMMANDS,
  ...MODE07_COMMANDS,
}

export type ObdCommandKey = keyof typeof OBD_COMMANDS
export type Mode01CommandKey = keyof typeof MODE01_COMMANDS
export type Mode02CommandKey = keyof typeof MODE02_COMMANDS

// ─── Conjuntos de PIDs por propósito ─────────────────────────────────────────

/** PIDs prioritarios para el dashboard (polling frecuente ~120ms) */
export const DASHBOARD_PIDS: Mode01CommandKey[] = [
  "RPM",
  "SPEED",
  "COOLANT_TEMP",
  "THROTTLE_POS",
  "ENGINE_LOAD",
  "INTAKE_TEMP",
  "MAF",
  "TIMING_ADVANCE",
]

/** PIDs de diagnóstico (polling lento ~1s) */
export const DIAGNOSTIC_PIDS: Mode01CommandKey[] = [
  "FUEL_PRESSURE",
  "SHORT_FUEL_TRIM_1",
  "LONG_FUEL_TRIM_1",
  "SHORT_FUEL_TRIM_2",
  "LONG_FUEL_TRIM_2",
  "OIL_TEMP",
  "BAROMETRIC_PRESSURE",
  "FUEL_LEVEL",
  "CONTROL_MODULE_VOLTAGE",
  "RUN_TIME",
  "DISTANCE_W_MIL",
  "DISTANCE_SINCE_DTC_CLEAR",
  "AMBIANT_AIR_TEMP",
  "FUEL_RATE",
  "ETHANOL_PERCENT",
  "HYBRID_BATTERY_REMAINING",
]

/** PIDs de sensores O2 narrowband (voltaje simple) */
export const O2_NARROWBAND_PIDS: Mode01CommandKey[] = [
  "O2_B1S1", "O2_B1S2", "O2_B1S3", "O2_B1S4",
  "O2_B2S1", "O2_B2S2", "O2_B2S3", "O2_B2S4",
]

/** PIDs de sensores O2 wideband (lambda WR) */
export const O2_WIDEBAND_PIDS: Mode01CommandKey[] = [
  "O2_S1_WR_VOLTAGE", "O2_S2_WR_VOLTAGE", "O2_S3_WR_VOLTAGE", "O2_S4_WR_VOLTAGE",
  "O2_S5_WR_VOLTAGE", "O2_S6_WR_VOLTAGE", "O2_S7_WR_VOLTAGE", "O2_S8_WR_VOLTAGE",
  "O2_S1_WR_CURRENT", "O2_S2_WR_CURRENT", "O2_S3_WR_CURRENT", "O2_S4_WR_CURRENT",
  "O2_S5_WR_CURRENT", "O2_S6_WR_CURRENT", "O2_S7_WR_CURRENT", "O2_S8_WR_CURRENT",
]

/** PIDs de temperatura del catalizador */
export const CATALYST_PIDS: Mode01CommandKey[] = [
  "CATALYST_TEMP_B1S1", "CATALYST_TEMP_B2S1",
  "CATALYST_TEMP_B1S2", "CATALYST_TEMP_B2S2",
]

/** PIDs extra para CSV de sesión (Mode 01) y snapshot de freeze frame */
export const RECORDING_EXTRA_MODE01_KEYS = [
  "STATUS",
  "FREEZE_DTC",
  "FUEL_STATUS",
  "AIR_STATUS",
  "O2_SENSORS",
  "O2_SENSORS_ALT",
  "AUX_INPUT_STATUS",
] as const satisfies readonly Mode01CommandKey[]

/**
 * Lista única de PIDs Mode 01 para GET_FREEZE_FRAME: dashboard + diagnóstico + extras.
 */
export function buildFreezeFrameSnapshotPidList(): Mode01CommandKey[] {
  const uniqueKeys = new Set<Mode01CommandKey>([
    ...DASHBOARD_PIDS,
    ...DIAGNOSTIC_PIDS,
    ...RECORDING_EXTRA_MODE01_KEYS,
  ])
  return Array.from(uniqueKeys)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Construye el string AT para enviar al ELM327 */
export function buildObdRequest(command: ObdCommand): string {
  if (command.mode === "02") {
    const frame = (command.freezeFrameIndex ?? "00").toUpperCase()
    return `${command.mode}${command.pid}${frame}`.toUpperCase()
  }
  return `${command.mode}${command.pid}`.toUpperCase()
}

/**
 * Parsea la respuesta hexadecimal del ELM327 para un comando OBD Mode 01/02.
 * La respuesta OBD retorna (0x40 + mode) + PID + data.
 * Ejemplo: Mode 01 RPM → "41 0C 1A F8" donde 41=(0x40+0x01), 0C=PID
 */
export function parseObdResponse(
  rawHex: string,
  command: ObdCommand
): number[] | null {
  const cleaned = rawHex
    .replace(/\s+/g, "")
    .replace(/>/g, "")
    .toUpperCase()

  const responseMode = (parseInt(command.mode, 16) + 0x40)
    .toString(16)
    .padStart(2, "0")
    .toUpperCase()

  const pidUpper = command.pid.toUpperCase()
  const candidateHeaders: string[] = []
  if (command.mode === "02") {
    const frame = (command.freezeFrameIndex ?? "00").toUpperCase()
    candidateHeaders.push(`${responseMode}${frame}${pidUpper}`)
  }
  candidateHeaders.push(`${responseMode}${pidUpper}`)

  let dataStart = -1
  for (const header of candidateHeaders) {
    const index = cleaned.indexOf(header)
    if (index !== -1) {
      dataStart = index + header.length
      break
    }
  }
  if (dataStart === -1) return null

  const dataHex = cleaned.slice(dataStart)
  const bytes: number[] = []
  for (let i = 0; i < dataHex.length - 1; i += 2) {
    const byte = parseInt(dataHex.slice(i, i + 2), 16)
    if (!isNaN(byte)) bytes.push(byte)
    if (bytes.length >= command.bytes) break
  }

  return bytes.length >= command.bytes ? bytes : null
}

/**
 * Parsea la respuesta del ELM327 para Mode 03 y Mode 07 (lista de DTCs).
 *
 * Formato de respuesta:
 * - Mode 03 → "43 [byte pairs...]"
 * - Mode 07 → "47 [byte pairs...]"
 */
export function parseDtcResponse(rawHex: string): string[] {
  const cleaned = rawHex.replace(/\s+/g, "").replace(/>/g, "").toUpperCase()

  const isMode03 = cleaned.startsWith("43")
  const isMode07 = cleaned.startsWith("47")
  if (!isMode03 && !isMode07) return []

  const dtcSystemMap: Record<string, string> = {
    "0": "P0", "1": "P1", "2": "P2", "3": "P3",
    "4": "C0", "5": "C1", "6": "C2", "7": "C3",
    "8": "B0", "9": "B1", "A": "B2", "B": "B3",
    "C": "U0", "D": "U1", "E": "U2", "F": "U3",
  }

  const dtcs: string[] = []
  const data = cleaned.slice(2)

  for (let i = 0; i < data.length - 3; i += 4) {
    const firstNibble = data[i]
    const rest = data.slice(i + 1, i + 4)
    const prefix = dtcSystemMap[firstNibble]
    if (prefix && rest !== "000") {
      dtcs.push(`${prefix}${rest}`)
    }
  }

  return dtcs
}

/**
 * Verifica si la respuesta del ELM327 a Mode 04 (CLEAR_DTC) fue exitosa.
 */
export function parseClearDtcResponse(rawHex: string): boolean {
  const cleaned = rawHex.replace(/\s+/g, "").replace(/>/g, "").toUpperCase()
  return cleaned.includes("44")
}
