export interface DrivingSession {
  readonly sessionId: string
  readonly status: string
  readonly startedAt: string
}

export interface CreateDrivingSessionInput {
  readonly vehicleId: string
  readonly title?: string
}

export interface StopDrivingSessionInput {
  readonly sessionId: string
  readonly csvContent: string
  readonly csvFileName: string
}

export interface DrivingSessionActionResponse {
  readonly sessionId: string
  readonly actionId: string
  readonly uploadedFile: { readonly id: string; readonly publicUrl: string } | null
  readonly completed: boolean
}
