/**
 * Tipos centrales del módulo OBD.
 * Espejo TypeScript de los tipos de python-obd.
 * Referencia: https://python-obd.readthedocs.io/en/latest/
 */

// ─── Unidades ────────────────────────────────────────────────────────────────

export type Unit =
  | "rpm"
  | "km/h"
  | "mph"
  | "°C"
  | "°F"
  | "kPa"
  | "psi"
  | "%"
  | "g/s"
  | "° before TDC"
  | "V"
  | "mA"
  | "L/h"
  | "s"
  | "min"
  | "km"
  | "Pa"
  | "ratio"
  | "count"
  | "°"
  | "bitfield"
  | "none"

// ─── Valor tipado con unidad (equivalente a pint.Quantity en python-obd) ─────

export interface ObdValue<T = number | string | null> {
  value: T
  unit: Unit
  metadata?: Readonly<Record<string, number | string | boolean>>
}

// ─── Modos OBD (SAE J1979) ────────────────────────────────────────────────────

export type ObdMode =
  | "01" // Current data
  | "02" // Freeze frame data
  | "03" // Diagnostic trouble codes
  | "04" // Clear trouble codes
  | "05" // Oxygen sensor test results
  | "06" // On-board monitoring test results
  | "07" // Pending trouble codes
  | "09" // Vehicle information
  | "0A" // Permanent trouble codes

// ─── Definición de un comando OBD (espejo de obd.OBDCommand) ─────────────────

export interface ObdCommand {
  /** Nombre legible, ej: "RPM" */
  name: string
  /** Descripción larga */
  description: string
  /** Modo OBD */
  mode: ObdMode
  /** PID en hexadecimal, ej: "0C" */
  pid: string
  /** Número de bytes de datos esperados */
  bytes: number
  /** Función que decodifica los bytes raw y retorna ObdValue */
  decoder: (data: number[]) => ObdValue
  /** Unidad de la respuesta */
  unit: Unit
  /**
   * Mode 02 (freeze frame): índice de frame 0–255 como hex de 2 caracteres (p. ej. "00").
   * Se concatena al request OBD tras el PID: `02` + PID + frame.
   */
  freezeFrameIndex?: string
}

// ─── Respuesta OBD (espejo de obd.OBDResponse) ────────────────────────────────

export interface ObdResponse<T = number | string | null> {
  command: ObdCommand
  value: ObdValue<T> | null
  /** Mensaje hexadecimal raw recibido del ELM327 */
  rawMessage: string
  isNull: boolean
  time: number
}

// ─── DTCs (Diagnostic Trouble Codes) ─────────────────────────────────────────

export interface DiagnosticCode {
  /** Código estándar, ej: "P0300" */
  code: string
  /** Descripción si está disponible */
  description?: string
}

/** Par clave-valor para la vista GET_FREEZE_FRAME */
export interface ObdFreezeFrameEntry {
  readonly key: string
  readonly value: string
}

// ─── Estado de la conexión OBD ────────────────────────────────────────────────

export type ObdConnectionStatus =
  | "not_connected"
  | "initializing"
  | "connected"
  | "error"

// ─── Datos de telemetría en tiempo real ──────────────────────────────────────

export interface LiveTelemetry {
  rpm: number | null
  speed: number | null
  engineTemp: number | null
  throttle: number | null
  engineLoad: number | null
  intakeTemp: number | null
  maf: number | null
  timingAdvance: number | null
  fuelPressure: number | null
  shortFuelTrim: number | null
  longFuelTrim: number | null
  oilTemp: number | null
  voltage: number | null
}

// ─── Configuración del transporte SPP ────────────────────────────────────────

export interface SppTransportConfig {
  /** Timeout en ms para cada comando AT/OBD (default: 3000) */
  commandTimeoutMs?: number
  /** Intervalo de polling en ms al leer chunks (default: 30) */
  readPollIntervalMs?: number
}
