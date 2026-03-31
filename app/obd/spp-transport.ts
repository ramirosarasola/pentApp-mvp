/**
 * Transporte Bluetooth Classic SPP/RFCOMM para ELM327.
 *
 * Reemplaza al BleTransport del proyecto Next.js adaptándose a la API de
 * react-native-bluetooth-classic, que usa sockets RFCOMM seriales en lugar
 * de características GATT.
 *
 * El ELM327 termina cada respuesta con el prompt '>'.
 * Los comandos se serializan en cola para evitar lecturas entrelazadas.
 */

import type { BluetoothDevice } from "react-native-bluetooth-classic"
import type { SppTransportConfig } from "./types"
import obdDebug from "./debug"

const DEFAULT_COMMAND_TIMEOUT_MS = 3000
const DEFAULT_READ_POLL_INTERVAL_MS = 30

interface PendingCommand {
  resolve: (response: string) => void
  reject: (error: Error) => void
  timeoutId: ReturnType<typeof setTimeout>
}

export class SppTransport {
  private readonly device: BluetoothDevice
  private readonly config: Required<SppTransportConfig>
  private buffer: string = ""
  private pendingCommands: PendingCommand[] = []
  private commandQueue: Promise<void> = Promise.resolve()
  private dataSubscription: { remove: () => void } | null = null

  constructor(device: BluetoothDevice, config: SppTransportConfig = {}) {
    this.device = device
    this.config = {
      commandTimeoutMs: config.commandTimeoutMs ?? DEFAULT_COMMAND_TIMEOUT_MS,
      readPollIntervalMs: config.readPollIntervalMs ?? DEFAULT_READ_POLL_INTERVAL_MS,
    }
    this.setupDataListener()
  }

  /**
   * Envía un comando AT u OBD y espera la respuesta completa (hasta '>').
   * Los comandos se encolan — nunca se envían en paralelo.
   */
  async sendCommand(command: string, timeoutMs?: number): Promise<string> {
    return this.enqueueCommand(async () => {
      return new Promise<string>((resolve, reject) => {
        const commandTimeoutMs = timeoutMs ?? this.config.commandTimeoutMs
        obdDebug.log("SPP", `TX -> ${command}`)
        const timeoutId = setTimeout(() => {
          this.pendingCommands.shift()
          obdDebug.warn("SPP", `Timeout en comando: ${command}`)
          reject(new Error(`Timeout esperando respuesta para: ${command}`))
        }, commandTimeoutMs)
        this.pendingCommands.push({ resolve, reject, timeoutId })
        this.executeWrite(`${command}\r`).catch((err: unknown) => {
          clearTimeout(timeoutId)
          this.pendingCommands.shift()
          const error = err instanceof Error ? err : new Error(String(err))
          obdDebug.error("SPP", `Error escribiendo comando: ${command}`, error)
          reject(error)
        })
      })
    })
  }

  /**
   * Libera el listener de datos. Llamar al desconectar la sesión OBD.
   */
  dispose(): void {
    this.dataSubscription?.remove()
    this.dataSubscription = null
    this.rejectAllPending(new Error("SPP transport disposed"))
    this.buffer = ""
    obdDebug.log("SPP", "Transporte SPP liberado")
  }

  private setupDataListener(): void {
    try {
      this.dataSubscription = this.device.onDataReceived((event) => {
        const chunk: string = event.data ?? ""
        obdDebug.log("SPP", "RX chunk", chunk)
        this.buffer += chunk
        this.processBuffer()
      })
      obdDebug.log("SPP", "Listener de datos SPP activado")
    } catch (err) {
      obdDebug.warn("SPP", "No se pudo registrar onDataReceived — se usará polling", err)
    }
  }

  private processBuffer(): void {
    if (!this.buffer.includes(">")) return
    const rawResponse = this.buffer.trim()
    this.buffer = ""
    const pending = this.pendingCommands.shift()
    if (!pending) return
    clearTimeout(pending.timeoutId)
    obdDebug.log("SPP", "RX complete", rawResponse)
    pending.resolve(rawResponse)
  }

  private rejectAllPending(error: Error): void {
    for (const pending of this.pendingCommands) {
      clearTimeout(pending.timeoutId)
      pending.reject(error)
    }
    this.pendingCommands = []
  }

  private async enqueueCommand<T>(task: () => Promise<T>): Promise<T> {
    const runTask = this.commandQueue.then(task, task)
    this.commandQueue = runTask.then(
      () => undefined,
      () => undefined
    )
    return runTask
  }

  private async executeWrite(data: string): Promise<void> {
    await this.device.write(data)
  }
}
