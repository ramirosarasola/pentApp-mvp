/**
 * Cliente OBD de alto nivel para React Native.
 * Espejo de la clase obd.OBD de python-obd.
 * Referencia: https://python-obd.readthedocs.io/en/latest/
 *
 * Usa SppTransport (Bluetooth Classic) en lugar de BleTransport (GATT).
 */

import type { BluetoothDevice } from "react-native-bluetooth-classic"
import { SppTransport } from "./spp-transport"
import { Elm327 } from "./elm327"
import type { Elm327Info } from "./elm327"
import type {
  DiagnosticCode,
  LiveTelemetry,
  ObdCommand,
  ObdConnectionStatus,
  ObdFreezeFrameEntry,
  ObdResponse,
  SppTransportConfig,
} from "./types"
import {
  MODE02_COMMANDS,
  OBD_COMMANDS,
  buildFreezeFrameSnapshotPidList,
  buildObdRequest,
  parseDtcResponse,
  parseObdResponse,
} from "./pids"
import obdDebug from "./debug"

// ─── Opciones de conexión ─────────────────────────────────────────────────────

export interface ObdClientOptions {
  transportConfig?: SppTransportConfig
  /** Reintentos automáticos al fallar un PID (default: 2) */
  retries?: number
}

// ─── Clase principal ──────────────────────────────────────────────────────────

export class ObdClient {
  private readonly device: BluetoothDevice
  private transport: SppTransport | null = null
  private elm327: Elm327 | null = null
  private readonly options: Required<ObdClientOptions>

  public status: ObdConnectionStatus = "not_connected"
  public elm327Info: Elm327Info | null = null

  constructor(device: BluetoothDevice, options: ObdClientOptions = {}) {
    this.device = device
    this.options = {
      transportConfig: {},
      retries: 2,
      ...options,
    }
  }

  /**
   * Conecta al adaptador ELM327 e inicializa el protocolo.
   * Equivalente a obd.OBD() en python-obd.
   */
  async connect(): Promise<void> {
    this.status = "initializing"
    obdDebug.log("CLIENT", "Conectando ObdClient")
    try {
      this.transport = new SppTransport(this.device, this.options.transportConfig)
      this.elm327 = new Elm327(this.transport)
      this.elm327Info = await this.elm327.initialize()
      this.status = "connected"
      obdDebug.log("CLIENT", "ObdClient conectado", this.elm327Info)
    } catch (err) {
      this.status = "error"
      this.transport?.dispose()
      obdDebug.error("CLIENT", "Error conectando ObdClient", err)
      throw err
    }
  }

  /**
   * Consulta un PID y retorna la respuesta decodificada.
   * Equivalente a connection.query(cmd) en python-obd.
   */
  async query(command: ObdCommand): Promise<ObdResponse> {
    this.assertConnected()
    obdDebug.log("CLIENT", `Query PID ${command.name}`, { mode: command.mode, pid: command.pid })

    const request = buildObdRequest(command)
    const timeMs = Date.now()
    let rawMessage = ""
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= this.options.retries; attempt++) {
      try {
        rawMessage = await this.elm327!.sendRaw(request)
        obdDebug.log("CLIENT", `Respuesta raw ${command.name}`, rawMessage)
        break
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err))
        if (attempt < this.options.retries) {
          obdDebug.warn("CLIENT", `Reintentando ${command.name}`, {
            attempt: attempt + 1,
            retries: this.options.retries,
          })
          await this.delay(200 * (attempt + 1))
        }
      }
    }

    if (lastError && !rawMessage) {
      obdDebug.warn("CLIENT", `Sin respuesta ${command.name}`)
      return this.buildNullResponse(command, "", timeMs)
    }

    const cleanedHex = rawMessage
      .replace(/\s+/g, "")
      .replace(/>/g, "")
      .toUpperCase()

    if (
      cleanedHex.includes("NODATA") ||
      cleanedHex.includes("ERROR") ||
      cleanedHex.includes("UNABLE") ||
      cleanedHex.length === 0
    ) {
      obdDebug.warn("CLIENT", `Respuesta nula ${command.name}`, cleanedHex)
      return this.buildNullResponse(command, rawMessage, timeMs)
    }

    const dataBytes = parseObdResponse(rawMessage, command)
    if (!dataBytes) {
      obdDebug.warn("CLIENT", `No se pudo parsear ${command.name}`, rawMessage)
      return this.buildNullResponse(command, rawMessage, timeMs)
    }

    const obdValue = command.decoder(dataBytes)
    obdDebug.log("CLIENT", `Valor ${command.name}`, { bytes: dataBytes, value: obdValue })

    return { command, value: obdValue, rawMessage, isNull: false, time: timeMs }
  }

  /**
   * Consulta múltiples PIDs secuencialmente.
   */
  async queryMany(commands: ObdCommand[]): Promise<Map<string, ObdResponse>> {
    const results = new Map<string, ObdResponse>()
    for (const command of commands) {
      const response = await this.query(command)
      results.set(command.name, response)
    }
    return results
  }

  /**
   * Lee los PIDs del dashboard y retorna un objeto LiveTelemetry.
   */
  async readLiveTelemetry(): Promise<LiveTelemetry> {
    const fast = await this.readFastTelemetry()
    const slow = await this.readSlowTelemetry()
    const telemetry: LiveTelemetry = {
      rpm: fast.rpm ?? null,
      speed: fast.speed ?? null,
      engineTemp: fast.engineTemp ?? null,
      throttle: fast.throttle ?? null,
      engineLoad: fast.engineLoad ?? null,
      intakeTemp: slow.intakeTemp ?? null,
      maf: slow.maf ?? null,
      timingAdvance: slow.timingAdvance ?? null,
      oilTemp: slow.oilTemp ?? null,
      voltage: slow.voltage ?? null,
      fuelPressure: slow.fuelPressure ?? null,
      shortFuelTrim: slow.shortFuelTrim ?? null,
      longFuelTrim: slow.longFuelTrim ?? null,
    }
    obdDebug.log("CLIENT", "Snapshot telemetria", telemetry)
    return telemetry
  }

  /**
   * Grupo de PIDs rápidos para sensación de tiempo real (~120ms).
   */
  async readFastTelemetry(): Promise<Partial<LiveTelemetry>> {
    const rpm = await this.safeQueryValue(OBD_COMMANDS.RPM)
    const speed = await this.safeQueryValue(OBD_COMMANDS.SPEED)
    const throttle = await this.safeQueryValue(OBD_COMMANDS.THROTTLE_POS)
    const engineLoad = await this.safeQueryValue(OBD_COMMANDS.ENGINE_LOAD)
    const engineTemp = await this.safeQueryValue(OBD_COMMANDS.COOLANT_TEMP)
    const fastTelemetry: Partial<LiveTelemetry> = { rpm, speed, throttle, engineLoad, engineTemp }
    obdDebug.log("CLIENT", "Fast telemetry", fastTelemetry)
    return fastTelemetry
  }

  /**
   * Grupo de PIDs lentos para diagnóstico extendido (~1000ms).
   */
  async readSlowTelemetry(): Promise<Partial<LiveTelemetry>> {
    const intakeTemp = await this.safeQueryValue(OBD_COMMANDS.INTAKE_TEMP)
    const maf = await this.safeQueryValue(OBD_COMMANDS.MAF)
    const timingAdvance = await this.safeQueryValue(OBD_COMMANDS.TIMING_ADVANCE)
    const oilTemp = await this.safeQueryValue(OBD_COMMANDS.OIL_TEMP)
    const voltage = await this.safeQueryValue(OBD_COMMANDS.CONTROL_MODULE_VOLTAGE)
    const fuelPressure = await this.safeQueryValue(OBD_COMMANDS.FUEL_PRESSURE)
    const shortFuelTrim = await this.safeQueryValue(OBD_COMMANDS.SHORT_FUEL_TRIM_1)
    const longFuelTrim = await this.safeQueryValue(OBD_COMMANDS.LONG_FUEL_TRIM_1)
    const slowTelemetry: Partial<LiveTelemetry> = {
      intakeTemp, maf, timingAdvance, oilTemp, voltage, fuelPressure, shortFuelTrim, longFuelTrim,
    }
    obdDebug.log("CLIENT", "Slow telemetry", slowTelemetry)
    return slowTelemetry
  }

  /**
   * Lee los Diagnostic Trouble Codes (DTCs).
   * Equivalente a obd.commands.GET_DTC en python-obd.
   */
  async getDtcs(): Promise<DiagnosticCode[]> {
    this.assertConnected()
    const raw = await this.elm327!.sendRaw("03")
    const codes = parseDtcResponse(raw)
    return codes.map((code) => ({ code }))
  }

  /**
   * Borra los DTCs almacenados en la ECU.
   * Equivalente a Mode 04 en python-obd.
   */
  async clearDtcs(): Promise<boolean> {
    this.assertConnected()
    const response = await this.elm327!.sendRaw("04")
    return response.replace(/\s+/g, "").toUpperCase().includes("44")
  }

  /**
   * Una pasada: DTCs actuales (Mode 03) + todos los PIDs freeze frame (Mode 02).
   */
  async getFreezeFrameSnapshot(frameIndex = 0): Promise<readonly ObdFreezeFrameEntry[]> {
    this.assertConnected()
    const frameHex = frameIndex.toString(16).padStart(2, "0").toUpperCase()
    const entries: ObdFreezeFrameEntry[] = []
    const dtcs = await this.getDtcs()
    entries.push({ key: "GET_DTC", value: dtcs.map((d) => d.code).join(";") })
    const pidList = buildFreezeFrameSnapshotPidList()
    for (const mode01Key of pidList) {
      const mode02Name = `DTC_${mode01Key}` as keyof typeof MODE02_COMMANDS
      const cmdBase = MODE02_COMMANDS[mode02Name]
      if (!cmdBase) continue
      const cmd: ObdCommand = { ...cmdBase, freezeFrameIndex: frameHex }
      const response = await this.query(cmd)
      const valueText = this.formatResponseForDisplay(response)
      entries.push({ key: mode02Name, value: valueText })
    }
    return entries
  }

  /**
   * Verifica si el vehículo responde al bus OBD.
   */
  async isVehicleResponding(): Promise<boolean> {
    if (this.status !== "connected" || !this.elm327) return false
    return this.elm327.isVehicleConnected()
  }

  /**
   * Lee el voltaje de la batería directamente del ELM327.
   */
  async getBatteryVoltage(): Promise<number | null> {
    if (this.status !== "connected" || !this.elm327) return null
    return this.elm327.readVoltage()
  }

  /**
   * Intenta detectar VIN usando Mode 09 PID 02.
   */
  async getVehicleVin(): Promise<string | null> {
    this.assertConnected()
    try {
      const rawResponse = await this.elm327!.sendRaw("0902")
      return this.parseVinFromMode09(rawResponse)
    } catch {
      return null
    }
  }

  /**
   * Desconecta y limpia recursos.
   */
  disconnect(): void {
    this.transport?.dispose()
    this.transport = null
    this.elm327 = null
    this.status = "not_connected"
    this.elm327Info = null
    obdDebug.log("CLIENT", "ObdClient desconectado")
  }

  private buildNullResponse(
    command: ObdCommand,
    rawMessage: string,
    time: number
  ): ObdResponse {
    return { command, value: null, rawMessage, isNull: true, time }
  }

  private assertConnected(): void {
    if (this.status !== "connected" || !this.elm327) {
      throw new Error("ObdClient no está conectado. Llama a connect() primero.")
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  private async safeQueryValue(command: ObdCommand): Promise<number | null> {
    try {
      const response = await this.query(command)
      if (response.isNull || !response.value) return null
      const raw = response.value.value
      if (raw === null || raw === undefined) return null
      if (typeof raw === "number") return raw
      return null
    } catch {
      return null
    }
  }

  private formatResponseForDisplay(response: ObdResponse): string {
    if (!response.isNull && response.value) {
      const decoded = response.value
      if (decoded.value !== null && decoded.value !== undefined) {
        if (typeof decoded.value === "string") return decoded.value
        let text = String(decoded.value)
        if (decoded.unit && decoded.unit !== "none" && decoded.unit !== "bitfield") {
          text = `${text} ${decoded.unit}`
        }
        return text
      }
    }
    const cleaned = response.rawMessage.replace(/\s+/g, "").replace(/>/g, "")
    return cleaned.length > 0 ? cleaned.toUpperCase() : ""
  }

  private parseVinFromMode09(rawResponse: string): string | null {
    const hexBytes = (rawResponse.toUpperCase().match(/[A-F0-9]{2}/g) ?? []).map((value) =>
      parseInt(value, 16)
    )
    if (hexBytes.length < 5) return null
    for (let index = 0; index < hexBytes.length - 2; index += 1) {
      if (hexBytes[index] !== 0x49 || hexBytes[index + 1] !== 0x02) continue
      const vinCharacters: string[] = []
      for (let cursor = index + 3; cursor < hexBytes.length; cursor += 1) {
        const currentByte = hexBytes[cursor]
        if (currentByte < 0x20 || currentByte > 0x7e) continue
        const currentCharacter = String.fromCharCode(currentByte)
        if (!/[A-HJ-NPR-Z0-9]/.test(currentCharacter)) continue
        vinCharacters.push(currentCharacter)
        if (vinCharacters.length === 17) break
      }
      if (vinCharacters.length === 17) return vinCharacters.join("")
    }
    return null
  }
}
