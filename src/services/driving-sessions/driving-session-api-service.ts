import type { HttpClient } from "@/src/services/api/http-client"
import type {
  CreateDrivingSessionInput,
  DrivingSession,
  DrivingSessionActionResponse,
  StopDrivingSessionInput,
} from "@/src/services/driving-sessions/driving-session"

interface DrivingSessionApiServiceDeps {
  readonly httpClient: HttpClient
}

export class DrivingSessionApiService {
  private readonly httpClient: HttpClient

  public constructor(deps: DrivingSessionApiServiceDeps) {
    this.httpClient = deps.httpClient
  }

  /**
   * Crea una nueva sesión de conducción en el servidor.
   * Debe llamarse al conectar el scanner y tener un vehicleId disponible.
   */
  public async executeCreateSession(input: CreateDrivingSessionInput): Promise<DrivingSession> {
    return this.httpClient.executeRequest<DrivingSession>({
      method: "POST",
      path: "/driving-sessions",
      body: {
        vehicleId: input.vehicleId,
        title: input.title,
      },
    })
  }

  /**
   * Finaliza la sesión y sube el CSV con los datos grabados.
   * Envía actionType SESSION_STOPPED + completeSession: true.
   */
  public async executeStopSession(input: StopDrivingSessionInput): Promise<DrivingSessionActionResponse> {
    return this.httpClient.executeRequest<DrivingSessionActionResponse>({
      method: "POST",
      path: `/driving-sessions/${input.sessionId}/actions`,
      body: {
        actionType: "SESSION_STOPPED",
        description: "Recording stopped from mobile app",
        csvContent: input.csvContent,
        csvFileName: input.csvFileName,
        completeSession: true,
      },
    })
  }
}
