export type ChatMessageRole = "USER" | "ASSISTANT"

export interface ChatMessage {
  readonly id: string
  readonly role: ChatMessageRole
  readonly content: string
  readonly createdAt?: string
}

export interface AssistantChatSummary {
  readonly id: string
  readonly vehicleId: string | null
  readonly preview: string
  readonly createdAt: string
  readonly updatedAt: string
}

export interface ActiveChatResponse {
  readonly chatId: string
  readonly messages: ChatMessage[]
}

export interface ChatsListResponse {
  readonly chats: AssistantChatSummary[]
}

export interface SendMessageParams {
  readonly question: string
  readonly chatId?: string
  readonly vehicleId?: string
}
