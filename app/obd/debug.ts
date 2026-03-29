/**
 * Logging condicional para el módulo OBD.
 * Usa __DEV__ de React Native para detectar el entorno de desarrollo.
 */

type DebugLevel = "log" | "warn" | "error"

function isDebugEnabled(): boolean {
  return typeof __DEV__ !== "undefined" ? __DEV__ : false
}

function print(
  level: DebugLevel,
  scope: string,
  message: string,
  payload?: unknown
): void {
  if (!isDebugEnabled()) return
  const timestamp = new Date().toISOString()
  const prefix = `[OBD][${scope}][${timestamp}] ${message}`
  if (payload !== undefined) {
    console[level](prefix, payload)
    return
  }
  console[level](prefix)
}

const obdDebug = {
  log(scope: string, message: string, payload?: unknown): void {
    print("log", scope, message, payload)
  },
  warn(scope: string, message: string, payload?: unknown): void {
    print("warn", scope, message, payload)
  },
  error(scope: string, message: string, payload?: unknown): void {
    print("error", scope, message, payload)
  },
}

export default obdDebug
