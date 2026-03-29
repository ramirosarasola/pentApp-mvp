/**
 * Protocolo ELM327 — AT commands e inicialización.
 * El ELM327 actúa como interfaz entre el puerto OBD-II del vehículo
 * y el adaptador Bluetooth Classic (SPP).
 *
 * Secuencia de inicialización requerida antes de enviar PIDs.
 */

import type { SppTransport } from "./spp-transport"
import obdDebug from "./debug"

// ─── Comandos AT del ELM327 ───────────────────────────────────────────────────

export const AT = {
  RESET: "ATZ",
  ECHO_OFF: "ATE0",
  LINEFEEDS_OFF: "ATL0",
  SPACES_OFF: "ATS0",
  HEADERS_OFF: "ATH0",
  AUTO_PROTOCOL: "ATSP0",
  PROTOCOL_1: "ATSP1",
  PROTOCOL_2: "ATSP2",
  PROTOCOL_3: "ATSP3",
  PROTOCOL_4: "ATSP4",
  PROTOCOL_5: "ATSP5",
  PROTOCOL_6: "ATSP6",
  PROTOCOL_7: "ATSP7",
  PROTOCOL_8: "ATSP8",
  PROTOCOL_9: "ATSP9",
  DESCRIBE_PROTOCOL: "ATDP",
  DESCRIBE_PROTOCOL_NUMBER: "ATDPN",
  READ_VOLTAGE: "ATRV",
  WARM_START: "ATWS",
  ADAPTIVE_TIMING_OFF: "ATAT0",
  ADAPTIVE_TIMING_1: "ATAT1",
  ADAPTIVE_TIMING_2: "ATAT2",
  SET_TIMEOUT: (ms: number) => `ATST${Math.min(255, Math.floor(ms / 4)).toString(16).padStart(2, "0")}`,
  MEMORY_OFF: "ATM0",
} as const

// ─── Protocolos OBD-II ────────────────────────────────────────────────────────

export type Elm327Protocol =
  | "AUTO"
  | "SAE_J1850_PWM"
  | "SAE_J1850_VPW"
  | "ISO_9141_2"
  | "ISO_14230_4_KWP_SLOW"
  | "ISO_14230_4_KWP_FAST"
  | "ISO_15765_4_CAN_11_500"
  | "ISO_15765_4_CAN_29_500"
  | "ISO_15765_4_CAN_11_250"
  | "ISO_15765_4_CAN_29_250"

export const PROTOCOL_DESCRIPTIONS: Record<string, Elm327Protocol> = {
  "AUTO": "AUTO",
  "SAE J1850 PWM": "SAE_J1850_PWM",
  "SAE J1850 VPW": "SAE_J1850_VPW",
  "ISO 9141-2": "ISO_9141_2",
  "ISO 14230-4 (KWP SLOW)": "ISO_14230_4_KWP_SLOW",
  "ISO 14230-4 (KWP FAST)": "ISO_14230_4_KWP_FAST",
  "ISO 15765-4 (CAN 11/500)": "ISO_15765_4_CAN_11_500",
  "ISO 15765-4 (CAN 29/500)": "ISO_15765_4_CAN_29_500",
  "ISO 15765-4 (CAN 11/250)": "ISO_15765_4_CAN_11_250",
  "ISO 15765-4 (CAN 29/250)": "ISO_15765_4_CAN_29_250",
}

// ─── Interfaz ELM327 ─────────────────────────────────────────────────────────

export interface Elm327Info {
  version: string
  voltage: string | null
  protocol: string | null
}

export class Elm327 {
  private readonly transport: SppTransport

  constructor(transport: SppTransport) {
    this.transport = transport
  }

  /**
   * Inicializa el ELM327 con la secuencia estándar de configuración.
   * Equivalente al proceso de init de python-obd al conectar.
   */
  async initialize(): Promise<Elm327Info> {
    obdDebug.log("ELM327", "Iniciando secuencia de inicializacion")
    const resetResponse = await this.transport.sendCommand(AT.RESET)
    await this.delay(1000)

    const version = this.extractVersion(resetResponse)
    obdDebug.log("ELM327", "Version detectada", version)

    await this.transport.sendCommand(AT.ECHO_OFF)
    await this.transport.sendCommand(AT.LINEFEEDS_OFF)
    await this.transport.sendCommand(AT.SPACES_OFF)
    await this.transport.sendCommand(AT.HEADERS_OFF)
    await this.transport.sendCommand(AT.ADAPTIVE_TIMING_1)
    await this.transport.sendCommand(AT.AUTO_PROTOCOL)

    let voltage: string | null = null
    try {
      const voltResponse = await this.transport.sendCommand(AT.READ_VOLTAGE)
      voltage = this.cleanResponse(voltResponse)
      obdDebug.log("ELM327", "Voltaje leido", voltage)
    } catch {
      voltage = null
      obdDebug.warn("ELM327", "No se pudo leer voltaje")
    }

    let protocol: string | null = null
    try {
      const protoResponse = await this.transport.sendCommand(AT.DESCRIBE_PROTOCOL)
      protocol = this.cleanResponse(protoResponse)
      obdDebug.log("ELM327", "Protocolo detectado", protocol)
    } catch {
      protocol = null
      obdDebug.warn("ELM327", "No se pudo detectar protocolo")
    }

    obdDebug.log("ELM327", "Inicializacion completada", { version, voltage, protocol })
    return { version, voltage, protocol }
  }

  /**
   * Envía un comando OBD raw (ej: "010C") y retorna la respuesta cruda.
   */
  async sendRaw(command: string): Promise<string> {
    obdDebug.log("ELM327", `OBD request ${command}`)
    return this.transport.sendCommand(command)
  }

  /**
   * Lee el voltaje de la batería del vehículo.
   */
  async readVoltage(): Promise<number | null> {
    try {
      const response = await this.transport.sendCommand(AT.READ_VOLTAGE)
      const cleaned = this.cleanResponse(response)
      const voltage = parseFloat(cleaned.replace("V", ""))
      return isNaN(voltage) ? null : voltage
    } catch {
      return null
    }
  }

  /**
   * Verifica si el vehículo responde al handshake OBD básico (PID 0100).
   */
  async isVehicleConnected(): Promise<boolean> {
    try {
      const response = await this.transport.sendCommand("0100")
      const cleaned = this.cleanResponse(response)
      return cleaned.startsWith("41") && !cleaned.includes("NO DATA")
    } catch {
      return false
    }
  }

  private extractVersion(resetResponse: string): string {
    const match = resetResponse.match(/ELM327\s+v[\d.]+/i)
    return match ? match[0] : "ELM327 (versión desconocida)"
  }

  private cleanResponse(raw: string): string {
    return raw
      .replace(/>/g, "")
      .replace(/\r/g, " ")
      .trim()
      .split("\n")
      .filter((line) => !line.includes("ATZ") && !line.includes("OK"))
      .join(" ")
      .trim()
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
