/**
 * Hook que gestiona el ciclo completo de una sesión OBD en tiempo real.
 *
 * Responsabilidades:
 * - Instanciar ObdClient con el dispositivo Bluetooth conectado
 * - Inicializar ELM327 (secuencia AT)
 * - Sondear PIDs del dashboard y diagnóstico en loops independientes
 * - Exponer el estado de telemetría y conexión a la UI
 */

import { getConnectedScannerDevice } from "@/app/services/scanner-connection"
import { ObdClient } from "@/app/obd/obd-client"
import { DASHBOARD_PIDS, DIAGNOSTIC_PIDS, OBD_COMMANDS } from "@/app/obd/pids"
import { OBD_POLL_FAST_MS, OBD_POLL_SLOW_MS } from "@/app/obd/live-session-config"
import type { DiagnosticCode, LiveTelemetry, ObdConnectionStatus, ObdResponse } from "@/app/obd/types"
import type { Elm327Info } from "@/app/obd/elm327"
import type { Mode01CommandKey } from "@/app/obd/pids"
import { useCallback, useEffect, useRef, useState } from "react"

// ─── Tipos públicos ───────────────────────────────────────────────────────────

export interface ObdPidSnapshot {
  readonly key: string
  readonly name: string
  readonly value: number | string | null
  readonly unit: string
  readonly updatedAt: number
  readonly isNull: boolean
}

export interface UseObdSessionResult {
  /** Estado de conexión OBD */
  connectionStatus: ObdConnectionStatus
  /** Información del chip ELM327 (versión, protocolo, voltaje) */
  elm327Info: Elm327Info | null
  /** Telemetría rápida en tiempo real */
  telemetry: LiveTelemetry
  /** Snapshot de todos los PIDs con metadatos para la pantalla dev */
  pidSnapshots: ObdPidSnapshot[]
  /** DTCs activos leídos durante la sesión */
  dtcs: DiagnosticCode[]
  /** Mensaje de error si lo hay */
  error: string | null
  /** Inicia la sesión OBD (inicializa ELM327 y arranca el polling) */
  startSession: () => Promise<void>
  /** Detiene el polling y desconecta el cliente OBD */
  stopSession: () => void
}

// ─── Valores iniciales ────────────────────────────────────────────────────────

const EMPTY_TELEMETRY: LiveTelemetry = {
  rpm: null,
  speed: null,
  engineTemp: null,
  throttle: null,
  engineLoad: null,
  intakeTemp: null,
  maf: null,
  timingAdvance: null,
  fuelPressure: null,
  shortFuelTrim: null,
  longFuelTrim: null,
  oilTemp: null,
  voltage: null,
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useObdSession(): UseObdSessionResult {
  const [connectionStatus, setConnectionStatus] = useState<ObdConnectionStatus>("not_connected")
  const [elm327Info, setElm327Info] = useState<Elm327Info | null>(null)
  const [telemetry, setTelemetry] = useState<LiveTelemetry>(EMPTY_TELEMETRY)
  const [pidSnapshots, setPidSnapshots] = useState<ObdPidSnapshot[]>([])
  const [dtcs, setDtcs] = useState<DiagnosticCode[]>([])
  const [error, setError] = useState<string | null>(null)

  const clientRef = useRef<ObdClient | null>(null)
  const fastTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const slowTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isMountedRef = useRef(true)
  const isFastPollingRef = useRef(false)

  const clearTimers = useCallback((): void => {
    if (fastTimerRef.current !== null) {
      clearInterval(fastTimerRef.current)
      fastTimerRef.current = null
    }
    if (slowTimerRef.current !== null) {
      clearInterval(slowTimerRef.current)
      slowTimerRef.current = null
    }
  }, [])

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      clearTimers()
      clientRef.current?.disconnect()
      clientRef.current = null
    }
  }, [clearTimers])

  const applyResponse = useCallback((response: ObdResponse): void => {
    if (!isMountedRef.current) return
    const snapshot: ObdPidSnapshot = {
      key: response.command.name,
      name: response.command.description,
      value: response.value?.value ?? null,
      unit: response.value?.unit ?? response.command.unit,
      updatedAt: response.time,
      isNull: response.isNull,
    }
    setPidSnapshots((prev) => {
      const index = prev.findIndex((s) => s.key === snapshot.key)
      if (index === -1) return [...prev, snapshot]
      const next = [...prev]
      next[index] = snapshot
      return next
    })
  }, [])

  const pollFastPids = useCallback(async (): Promise<void> => {
    const client = clientRef.current
    if (!client || isFastPollingRef.current) return
    isFastPollingRef.current = true
    try {
      const updates: Partial<LiveTelemetry> = {}
      for (const key of DASHBOARD_PIDS) {
        if (!isMountedRef.current) break
        const command = OBD_COMMANDS[key]
        const response = await client.query(command)
        applyResponse(response)
        if (!response.isNull && response.value && typeof response.value.value === "number") {
          mapValueToTelemetry(key, response.value.value, updates)
        }
      }
      if (isMountedRef.current && Object.keys(updates).length > 0) {
        setTelemetry((prev) => ({ ...prev, ...updates }))
      }
    } finally {
      isFastPollingRef.current = false
    }
  }, [applyResponse])

  const pollSlowPids = useCallback(async (): Promise<void> => {
    const client = clientRef.current
    if (!client) return
    for (const key of DIAGNOSTIC_PIDS) {
      if (!isMountedRef.current) break
      const command = OBD_COMMANDS[key]
      const response = await client.query(command)
      applyResponse(response)
    }
    try {
      const codes = await client.getDtcs()
      if (isMountedRef.current) setDtcs(codes)
    } catch {
      // DTCs no son críticos para el loop de polling
    }
  }, [applyResponse])

  const stopSession = useCallback((): void => {
    clearTimers()
    clientRef.current?.disconnect()
    clientRef.current = null
    if (isMountedRef.current) {
      setConnectionStatus("not_connected")
      setElm327Info(null)
    }
  }, [clearTimers])

  const startSession = useCallback(async (): Promise<void> => {
    const device = getConnectedScannerDevice()
    if (!device) {
      setError("No hay dispositivo conectado. Conecta un escáner OBD en la pestaña Connect.")
      return
    }
    clearTimers()
    clientRef.current?.disconnect()
    clientRef.current = null
    setError(null)
    setTelemetry(EMPTY_TELEMETRY)
    setPidSnapshots([])
    setDtcs([])
    setConnectionStatus("initializing")
    const client = new ObdClient(device)
    clientRef.current = client
    try {
      await client.connect()
      if (!isMountedRef.current) {
        client.disconnect()
        return
      }
      setElm327Info(client.elm327Info)
      setConnectionStatus("connected")
      fastTimerRef.current = setInterval(() => {
        void pollFastPids()
      }, OBD_POLL_FAST_MS)
      slowTimerRef.current = setInterval(() => {
        void pollSlowPids()
      }, OBD_POLL_SLOW_MS)
    } catch (err) {
      if (!isMountedRef.current) return
      const message = err instanceof Error ? err.message : "Error iniciando sesión OBD."
      setError(message)
      setConnectionStatus("error")
      clientRef.current = null
    }
  }, [clearTimers, pollFastPids, pollSlowPids])

  return {
    connectionStatus,
    elm327Info,
    telemetry,
    pidSnapshots,
    dtcs,
    error,
    startSession,
    stopSession,
  }
}

// ─── Helper: mapea un PID key a su campo en LiveTelemetry ────────────────────

function mapValueToTelemetry(
  key: Mode01CommandKey,
  value: number,
  updates: Partial<LiveTelemetry>
): void {
  switch (key) {
    case "RPM": updates.rpm = value; break
    case "SPEED": updates.speed = value; break
    case "COOLANT_TEMP": updates.engineTemp = value; break
    case "THROTTLE_POS": updates.throttle = value; break
    case "ENGINE_LOAD": updates.engineLoad = value; break
    case "INTAKE_TEMP": updates.intakeTemp = value; break
    case "MAF": updates.maf = value; break
    case "TIMING_ADVANCE": updates.timingAdvance = value; break
    case "FUEL_PRESSURE": updates.fuelPressure = value; break
    case "SHORT_FUEL_TRIM_1": updates.shortFuelTrim = value; break
    case "LONG_FUEL_TRIM_1": updates.longFuelTrim = value; break
    case "OIL_TEMP": updates.oilTemp = value; break
    case "CONTROL_MODULE_VOLTAGE": updates.voltage = value; break
    default: break
  }
}
