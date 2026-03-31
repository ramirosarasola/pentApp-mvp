/**
 * Generador de CSV de telemetría OBD.
 * Puerto directo de lib/telemetry/build-driving-csv.ts en mvp-next-js.
 */

export interface TelemetryCsvSample {
  readonly timestamp: string
  readonly rpm: number | null
  readonly speed: number | null
  readonly engineTemp: number | null
  readonly throttle: number | null
  readonly engineLoad: number | null
  readonly intakeTemp: number | null
  readonly maf: number | null
  readonly timingAdvance: number | null
  readonly fuelPressure: number | null
  readonly shortFuelTrim: number | null
  readonly longFuelTrim: number | null
  readonly oilTemp: number | null
  readonly voltage: number | null
  readonly GET_DTC: string
  readonly STATUS: string
  readonly FREEZE_DTC: string
  readonly FUEL_STATUS: string
  readonly AIR_STATUS: string
  readonly O2_SENSORS: string
  readonly O2_SENSORS_ALT: string
  readonly AUX_INPUT_STATUS: string
}

const CSV_HEADER = [
  "timestamp",
  "rpm",
  "speed",
  "engineTemp",
  "throttle",
  "engineLoad",
  "intakeTemp",
  "maf",
  "timingAdvance",
  "fuelPressure",
  "shortFuelTrim",
  "longFuelTrim",
  "oilTemp",
  "voltage",
  "GET_DTC",
  "STATUS",
  "FREEZE_DTC",
  "FUEL_STATUS",
  "AIR_STATUS",
  "O2_SENSORS",
  "O2_SENSORS_ALT",
  "AUX_INPUT_STATUS",
] as const

function buildRow(sample: TelemetryCsvSample): string {
  return [
    sample.timestamp,
    sample.rpm ?? "",
    sample.speed ?? "",
    sample.engineTemp ?? "",
    sample.throttle ?? "",
    sample.engineLoad ?? "",
    sample.intakeTemp ?? "",
    sample.maf ?? "",
    sample.timingAdvance ?? "",
    sample.fuelPressure ?? "",
    sample.shortFuelTrim ?? "",
    sample.longFuelTrim ?? "",
    sample.oilTemp ?? "",
    sample.voltage ?? "",
    sample.GET_DTC,
    sample.STATUS,
    sample.FREEZE_DTC,
    sample.FUEL_STATUS,
    sample.AIR_STATUS,
    sample.O2_SENSORS,
    sample.O2_SENSORS_ALT,
    sample.AUX_INPUT_STATUS,
  ].join(",")
}

export function buildDrivingCsv(samples: TelemetryCsvSample[]): string {
  const rows = samples.map(buildRow)
  return [CSV_HEADER.join(","), ...rows].join("\n")
}
