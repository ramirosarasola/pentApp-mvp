/**
 * Punto de entrada del módulo OBD para React Native.
 * Implementación sobre Bluetooth Classic SPP (react-native-bluetooth-classic).
 */

export { ObdClient } from "./obd-client"
export type { ObdClientOptions } from "./obd-client"

export { SppTransport } from "./spp-transport"
export { Elm327, AT } from "./elm327"
export type { Elm327Info, Elm327Protocol } from "./elm327"

export {
  OBD_COMMANDS,
  DASHBOARD_PIDS,
  DIAGNOSTIC_PIDS,
  buildObdRequest,
  parseObdResponse,
  parseDtcResponse,
} from "./pids"
export type { ObdCommandKey, Mode01CommandKey } from "./pids"

export type {
  ObdCommand,
  ObdResponse,
  ObdValue,
  ObdConnectionStatus,
  LiveTelemetry,
  DiagnosticCode,
  SppTransportConfig,
  Unit,
} from "./types"

export {
  OBD_POLL_FAST_MS,
  OBD_POLL_FAST_MS_RECORDING,
  OBD_POLL_SLOW_MS,
} from "./live-session-config"
