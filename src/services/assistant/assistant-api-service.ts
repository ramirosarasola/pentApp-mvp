import type { HttpClient } from "@/src/services/api/http-client"
import type {
  ActiveChatResponse,
  AssistantChatSummary,
  ChatsListResponse,
  SendMessageParams,
} from "@/src/services/assistant/assistant-message"

type TokenProvider = () => Promise<string | null>

interface AssistantApiServiceDeps {
  readonly httpClient: HttpClient
  readonly baseUrl: string
  readonly tokenProvider: TokenProvider
}

interface StreamCallbacks {
  readonly onChunk: (chunk: string) => void
  readonly onChatId: (chatId: string) => void
  readonly onDone: () => void
  readonly onError: (error: Error) => void
}

const FALLBACK_API_BASE_URL = "https://pentapp-mvp.vercel.app/api"

export class AssistantApiService {
  private readonly httpClient: HttpClient
  private readonly baseUrl: string
  private readonly tokenProvider: TokenProvider

  public constructor(deps: AssistantApiServiceDeps) {
    this.httpClient = deps.httpClient
    this.baseUrl = deps.baseUrl.replace(/\/+$/, "")
    this.tokenProvider = deps.tokenProvider
  }

  /** Lista los chats recientes del usuario (sin archivar). */
  public async executeGetChats(): Promise<AssistantChatSummary[]> {
    const response = await this.httpClient.executeRequest<ChatsListResponse>({
      method: "GET",
      path: "/assistant/chats",
    })
    return response.chats
  }

  /** Obtiene el chat activo con sus mensajes. */
  public async executeGetActiveChat(vehicleId?: string): Promise<ActiveChatResponse | null> {
    const path = vehicleId
      ? `/assistant/chats/active?vehicleId=${encodeURIComponent(vehicleId)}`
      : "/assistant/chats/active"
    try {
      return await this.httpClient.executeRequest<ActiveChatResponse>({
        method: "GET",
        path,
      })
    } catch {
      return null
    }
  }

  /** Archiva un chat para comenzar uno nuevo. */
  public async executeArchiveChat(chatId: string): Promise<void> {
    await this.httpClient.executeRequest({
      method: "PATCH",
      path: `/assistant/chats/${chatId}/archive`,
    })
  }

  /**
   * Envía un mensaje al asistente y consume el stream chunk a chunk.
   * Hace fetch directamente (no usa HttpClient.executeRequest) para poder leer
   * el ReadableStream antes de que se cierre.
   */
  public async executeStreamMessage(
    params: SendMessageParams,
    callbacks: StreamCallbacks
  ): Promise<void> {
    const token = await this.tokenProvider()
    const url = `${this.baseUrl}/assistant/messages`
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "text/plain",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
    let response: Response
    try {
      response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({
          question: params.question,
          chatId: params.chatId,
          vehicleId: params.vehicleId,
        }),
      })
    } catch (err) {
      callbacks.onError(err instanceof Error ? err : new Error("Network error"))
      return
    }
    if (!response.ok) {
      const body = await response.text().catch(() => "")
      callbacks.onError(new Error(`Request failed (${response.status}): ${body}`))
      return
    }
    const chatIdHeader = response.headers.get("X-Assistant-Chat-Id")
    if (chatIdHeader) {
      callbacks.onChatId(chatIdHeader)
    }
    if (!response.body) {
      const text = await response.text().catch(() => "")
      callbacks.onChunk(text)
      callbacks.onDone()
      return
    }
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        if (chunk) callbacks.onChunk(chunk)
      }
      callbacks.onDone()
    } catch (err) {
      callbacks.onError(err instanceof Error ? err : new Error("Stream read error"))
    } finally {
      reader.releaseLock()
    }
  }
}

export function createAssistantApiService(params: {
  httpClient: HttpClient
  tokenProvider: TokenProvider
}): AssistantApiService {
  const baseUrl = process.env["EXPO_PUBLIC_API_BASE_URL"] ?? FALLBACK_API_BASE_URL
  return new AssistantApiService({
    httpClient: params.httpClient,
    baseUrl,
    tokenProvider: params.tokenProvider,
  })
}
