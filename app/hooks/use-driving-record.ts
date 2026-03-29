/**
 * Hook que gestiona el ciclo de grabación de una sesión de conducción.
 *
 * Responsabilidades:
 * - Crear la sesión en el servidor tan pronto como OBD se conecta
 * - Acumular muestras de telemetría en buffer cuando isRecording === true
 * - Al detener la grabación, generar el CSV y enviarlo al servidor
 */

import { ApiError } from "@/app/services/api/api-error"
import { HttpClient } from "@/app/services/api/http-client"
import { DrivingSessionApiService } from "@/app/services/driving-sessions/driving-session-api-service"
import { buildDrivingCsv, type TelemetryCsvSample } from "@/app/telemetry/build-driving-csv"
import type { DiagnosticCode, LiveTelemetry, ObdConnectionStatus } from "@/app/obd/types"
import { useAuth } from "@clerk/expo"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

// ─── Constantes ───────────────────────────────────────────────────────────────

const SAMPLE_INTERVAL_MS = 1000
const FALLBACK_API_BASE_URL = "https://pentapp-mvp.vercel.app/api"

// ─── Tipos públicos ───────────────────────────────────────────────────────────

export interface UseDrivingRecordParams {
  readonly obdConnectionStatus: ObdConnectionStatus
  readonly telemetry: LiveTelemetry
  readonly dtcs: DiagnosticCode[]
  readonly vehicleId: string | null
}

export interface UseDrivingRecordResult {
  /** ID de la sesión creada en el servidor */
  readonly serverSessionId: string | null
  /** true cuando el servidor confirmó la creación de la sesión */
  readonly isServerSessionReady: boolean
  /** true mientras se están acumulando muestras */
  readonly isRecording: boolean
  /** true mientras se envía el CSV al servidor */
  readonly isSubmitting: boolean
  /** Mensaje de error si algo falló */
  readonly submitError: string | null
  /** Cantidad de muestras acumuladas en el buffer */
  readonly sampleCount: number
  /** Inicia la grabación (acumula muestras) */
  readonly executeStartRecording: () => void
  /** Detiene la grabación, genera el CSV y lo envía */
  readonly executeStopRecording: () => Promise<void>
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDrivingRecord(params: UseDrivingRecordParams): UseDrivingRecordResult {
  const { getToken } = useAuth()
  const getTokenRef = useRef(getToken)

  useEffect(() => {
    getTokenRef.current = getToken
  }, [getToken])

  const apiBaseUrl = process.env["EXPO_PUBLIC_API_BASE_URL"] ?? FALLBACK_API_BASE_URL

  const httpClient = useMemo(
    () =>
      new HttpClient({
        baseUrl: apiBaseUrl,
        tokenProvider: () => getTokenRef.current(),
      }),
    [apiBaseUrl]
  )

  const service = useMemo(() => new DrivingSessionApiService({ httpClient }), [httpClient])

  const [serverSessionId, setServerSessionId] = useState<string | null>(null)
  const [isServerSessionReady, setIsServerSessionReady] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [sampleCount, setSampleCount] = useState(0)

  const sampleBufferRef = useRef<TelemetryCsvSample[]>([])
  const sampleIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const telemetryRef = useRef(params.telemetry)
  const dtcsRef = useRef(params.dtcs)
  const isRecordingRef = useRef(false)
  const serverSessionIdRef = useRef<string | null>(null)
  const isMountedRef = useRef(true)
  const previousObdStatusRef = useRef<ObdConnectionStatus>("not_connected")

  useEffect(() => {
    telemetryRef.current = params.telemetry
  }, [params.telemetry])

  useEffect(() => {
    dtcsRef.current = params.dtcs
  }, [params.dtcs])

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      if (sampleIntervalRef.current) clearInterval(sampleIntervalRef.current)
    }
  }, [])

  const executeResetSessionState = useCallback((): void => {
    setServerSessionId(null)
    serverSessionIdRef.current = null
    setIsServerSessionReady(false)
    setIsRecording(false)
    isRecordingRef.current = false
    setSampleCount(0)
    sampleBufferRef.current = []
    if (sampleIntervalRef.current) {
      clearInterval(sampleIntervalRef.current)
      sampleIntervalRef.current = null
    }
  }, [])

  const executeCreateServerSession = useCallback(
    async (vehicleId: string): Promise<void> => {
      setIsServerSessionReady(false)
      setSubmitError(null)
      try {
        const session = await service.executeCreateSession({
          vehicleId,
          title: `Mobile Session ${new Date().toISOString()}`,
        })
        if (!isMountedRef.current) return
        setServerSessionId(session.sessionId)
        serverSessionIdRef.current = session.sessionId
        setIsServerSessionReady(true)
      } catch (err) {
        if (!isMountedRef.current) return
        const message = err instanceof ApiError ? err.message : "No se pudo crear la sesión en el servidor."
        setSubmitError(message)
      }
    },
    [service]
  )

  // Detecta transiciones del estado OBD para crear/limpiar la sesión del servidor
  useEffect(() => {
    const previous = previousObdStatusRef.current
    previousObdStatusRef.current = params.obdConnectionStatus

    if (params.obdConnectionStatus === "connected" && previous !== "connected" && params.vehicleId) {
      void executeCreateServerSession(params.vehicleId)
    }

    if (params.obdConnectionStatus === "not_connected" && previous !== "not_connected") {
      executeResetSessionState()
    }
  }, [params.obdConnectionStatus, params.vehicleId, executeCreateServerSession, executeResetSessionState])

  const executeCaptureSample = useCallback((): void => {
    const t = telemetryRef.current
    const dtcString = dtcsRef.current.map((d) => d.code).join(";")
    const sample: TelemetryCsvSample = {
      timestamp: new Date().toISOString(),
      rpm: t.rpm,
      speed: t.speed,
      engineTemp: t.engineTemp,
      throttle: t.throttle,
      engineLoad: t.engineLoad,
      intakeTemp: t.intakeTemp,
      maf: t.maf,
      timingAdvance: t.timingAdvance,
      fuelPressure: t.fuelPressure,
      shortFuelTrim: t.shortFuelTrim,
      longFuelTrim: t.longFuelTrim,
      oilTemp: t.oilTemp,
      voltage: t.voltage,
      GET_DTC: dtcString,
      STATUS: "",
      FREEZE_DTC: "",
      FUEL_STATUS: "",
      AIR_STATUS: "",
      O2_SENSORS: "",
      O2_SENSORS_ALT: "",
      AUX_INPUT_STATUS: "",
    }
    sampleBufferRef.current.push(sample)
    setSampleCount(sampleBufferRef.current.length)
  }, [])

  const executeStartRecording = useCallback((): void => {
    if (isRecordingRef.current) return
    sampleBufferRef.current = []
    setSampleCount(0)
    setSubmitError(null)
    isRecordingRef.current = true
    setIsRecording(true)
    sampleIntervalRef.current = setInterval(() => {
      if (isRecordingRef.current) executeCaptureSample()
    }, SAMPLE_INTERVAL_MS)
  }, [executeCaptureSample])

  const executeStopRecording = useCallback(async (): Promise<void> => {
    if (!isRecordingRef.current) return
    isRecordingRef.current = false
    setIsRecording(false)
    if (sampleIntervalRef.current) {
      clearInterval(sampleIntervalRef.current)
      sampleIntervalRef.current = null
    }
    const samples = [...sampleBufferRef.current]
    sampleBufferRef.current = []
    setSampleCount(0)

    const sessionId = serverSessionIdRef.current
    if (!sessionId || samples.length === 0) return

    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const csvContent = buildDrivingCsv(samples)
      const csvFileName = `mobile-session-${sessionId}-${Date.now()}.csv`
      await service.executeStopSession({ sessionId, csvContent, csvFileName })
      if (!isMountedRef.current) return
      setServerSessionId(null)
      serverSessionIdRef.current = null
      setIsServerSessionReady(false)
    } catch (err) {
      if (!isMountedRef.current) return
      const message = err instanceof ApiError ? err.message : "Error al enviar la grabación."
      setSubmitError(message)
    } finally {
      if (isMountedRef.current) setIsSubmitting(false)
    }
  }, [service])

  return {
    serverSessionId,
    isServerSessionReady,
    isRecording,
    isSubmitting,
    submitError,
    sampleCount,
    executeStartRecording,
    executeStopRecording,
  }
}
