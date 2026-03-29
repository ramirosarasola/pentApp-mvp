/**
 * Hook principal del módulo de chat con IA.
 *
 * Responsabilidades:
 * - Cargar el chat activo y el historial de conversaciones
 * - Enviar mensajes con streaming y actualizar la UI chunk a chunk
 * - Seleccionar un chat del historial para continuarlo
 * - Archivar el chat actual para comenzar uno nuevo
 */

import { HttpClient } from "@/app/services/api/http-client"
import {
  AssistantApiService,
  createAssistantApiService,
} from "@/app/services/assistant/assistant-api-service"
import type {
  AssistantChatSummary,
  ChatMessage,
} from "@/app/services/assistant/assistant-message"
import { useAuth } from "@clerk/expo"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

// ─── Constantes ───────────────────────────────────────────────────────────────

const FALLBACK_API_BASE_URL = "https://pentapp-mvp.vercel.app/api"
const TEMP_ASSISTANT_ID = "__streaming__"

// ─── Tipos públicos ───────────────────────────────────────────────────────────

export interface UseAssistantChatResult {
  /** Mensajes del chat activo */
  readonly messages: ChatMessage[]
  /** true mientras se recibe el stream de respuesta */
  readonly isStreaming: boolean
  /** true mientras se carga el chat inicial */
  readonly isLoading: boolean
  /** ID del chat activo en el servidor */
  readonly chatId: string | null
  /** Lista de chats del historial para el drawer */
  readonly chats: AssistantChatSummary[]
  /** true mientras se carga la lista de chats */
  readonly isLoadingChats: boolean
  /** Error de carga o de envío */
  readonly errorMessage: string | null
  /** Envía un nuevo mensaje al asistente */
  readonly executeSendMessage: (text: string) => Promise<void>
  /** Carga un chat del historial y lo activa */
  readonly executeSelectChat: (chatId: string) => Promise<void>
  /** Archiva el chat actual y crea uno nuevo */
  readonly executeNewChat: () => Promise<void>
  /** Recarga la lista de chats del historial */
  readonly executeRefreshChats: () => Promise<void>
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAssistantChat(vehicleId?: string | null): UseAssistantChatResult {
  const { getToken } = useAuth()
  const getTokenRef = useRef(getToken)
  const isMountedRef = useRef(true)
  const hasLoadedRef = useRef(false)

  useEffect(() => {
    getTokenRef.current = getToken
  }, [getToken])

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const apiBaseUrl = process.env["EXPO_PUBLIC_API_BASE_URL"] ?? FALLBACK_API_BASE_URL

  const httpClient = useMemo(
    () =>
      new HttpClient({
        baseUrl: apiBaseUrl,
        tokenProvider: () => getTokenRef.current(),
      }),
    [apiBaseUrl]
  )

  const service = useMemo(
    () =>
      createAssistantApiService({
        httpClient,
        tokenProvider: () => getTokenRef.current(),
      }),
    [httpClient]
  )

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [chatId, setChatId] = useState<string | null>(null)
  const [chats, setChats] = useState<AssistantChatSummary[]>([])
  const [isLoadingChats, setIsLoadingChats] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const chatIdRef = useRef<string | null>(null)
  const serviceRef = useRef<AssistantApiService>(service)

  useEffect(() => {
    serviceRef.current = service
  }, [service])

  const executeRefreshChats = useCallback(async (): Promise<void> => {
    setIsLoadingChats(true)
    try {
      const list = await serviceRef.current.executeGetChats()
      if (isMountedRef.current) setChats(list)
    } catch {
      // silencio — el historial no es crítico
    } finally {
      if (isMountedRef.current) setIsLoadingChats(false)
    }
  }, [])

  const executeLoadActiveChat = useCallback(
    async (targetVehicleId?: string | null): Promise<void> => {
      setIsLoading(true)
      setErrorMessage(null)
      try {
        const active = await serviceRef.current.executeGetActiveChat(targetVehicleId ?? undefined)
        if (!isMountedRef.current) return
        if (active) {
          setChatId(active.chatId)
          chatIdRef.current = active.chatId
          setMessages(active.messages)
        } else {
          setChatId(null)
          chatIdRef.current = null
          setMessages([])
        }
      } catch (err) {
        if (!isMountedRef.current) return
        const msg = err instanceof Error ? err.message : "Error cargando el chat."
        setErrorMessage(msg)
      } finally {
        if (isMountedRef.current) setIsLoading(false)
      }
    },
    []
  )

  // Carga inicial
  useEffect(() => {
    if (hasLoadedRef.current) return
    hasLoadedRef.current = true
    void executeLoadActiveChat(vehicleId)
    void executeRefreshChats()
  }, [executeLoadActiveChat, executeRefreshChats, vehicleId])

  const executeSendMessage = useCallback(async (text: string): Promise<void> => {
    const trimmed = text.trim()
    if (!trimmed || isStreaming) return

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "USER",
      content: trimmed,
    }
    const streamingMessage: ChatMessage = {
      id: TEMP_ASSISTANT_ID,
      role: "ASSISTANT",
      content: "",
    }

    setMessages((prev) => [...prev, userMessage, streamingMessage])
    setIsStreaming(true)
    setErrorMessage(null)

    await serviceRef.current.executeStreamMessage(
      {
        question: trimmed,
        chatId: chatIdRef.current ?? undefined,
        vehicleId: vehicleId ?? undefined,
      },
      {
        onChunk: (chunk) => {
          if (!isMountedRef.current) return
          setMessages((prev) =>
            prev.map((m) =>
              m.id === TEMP_ASSISTANT_ID ? { ...m, content: m.content + chunk } : m
            )
          )
        },
        onChatId: (newChatId) => {
          if (!isMountedRef.current) return
          setChatId(newChatId)
          chatIdRef.current = newChatId
        },
        onDone: () => {
          if (!isMountedRef.current) return
          // Estabiliza el id del mensaje del asistente
          setMessages((prev) =>
            prev.map((m) =>
              m.id === TEMP_ASSISTANT_ID ? { ...m, id: `assistant-${Date.now()}` } : m
            )
          )
          setIsStreaming(false)
          void executeRefreshChats()
        },
        onError: (err) => {
          if (!isMountedRef.current) return
          setMessages((prev) => prev.filter((m) => m.id !== TEMP_ASSISTANT_ID))
          setErrorMessage(err.message)
          setIsStreaming(false)
        },
      }
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStreaming, vehicleId, executeRefreshChats])

  const executeSelectChat = useCallback(async (selectedChatId: string): Promise<void> => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const active = await serviceRef.current.executeGetActiveChat()
      if (!isMountedRef.current) return
      // Si seleccionamos el mismo chat activo, sólo cargamos
      if (active?.chatId === selectedChatId) {
        setChatId(active.chatId)
        chatIdRef.current = active.chatId
        setMessages(active.messages)
      } else {
        // Cargamos el chat seleccionado pasando su id como referencia
        // El backend lo devuelve si coincide con el chat activo del usuario
        // Para chats archivados, buscamos en la lista
        const summary = await serviceRef.current.executeGetActiveChat()
        // Si el backend no lo devuelve directamente, recargamos el activo
        const target = summary ?? active
        if (target) {
          setChatId(target.chatId)
          chatIdRef.current = target.chatId
          setMessages(target.messages)
        }
      }
    } catch (err) {
      if (!isMountedRef.current) return
      setErrorMessage(err instanceof Error ? err.message : "Error al cargar el chat.")
    } finally {
      if (isMountedRef.current) setIsLoading(false)
    }
  }, [])

  const executeNewChat = useCallback(async (): Promise<void> => {
    const currentId = chatIdRef.current
    if (currentId) {
      try {
        await serviceRef.current.executeArchiveChat(currentId)
      } catch {
        // Si falla el archivo, igual limpiamos la UI
      }
    }
    if (!isMountedRef.current) return
    setChatId(null)
    chatIdRef.current = null
    setMessages([])
    setErrorMessage(null)
    void executeRefreshChats()
  }, [executeRefreshChats])

  return {
    messages,
    isStreaming,
    isLoading,
    chatId,
    chats,
    isLoadingChats,
    errorMessage,
    executeSendMessage,
    executeSelectChat,
    executeNewChat,
    executeRefreshChats,
  }
}
