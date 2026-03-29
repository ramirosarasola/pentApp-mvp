import { ApiError } from "@/app/services/api/api-error";

type TokenProvider = () => Promise<string | null>;

interface RequestOptions {
  readonly method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  readonly path: string;
  readonly body?: unknown;
  readonly headers?: Record<string, string>;
}

export class HttpClient {
  private readonly baseUrl: string;
  private readonly tokenProvider: TokenProvider;

  public constructor(params: { baseUrl: string; tokenProvider: TokenProvider }) {
    this.baseUrl = params.baseUrl.replace(/\/+$/, "");
    this.tokenProvider = params.tokenProvider;
  }

  public async executeRequest<TResponse>(options: RequestOptions): Promise<TResponse> {
    const token: string | null = await this.tokenProvider();
    const url: string = `${this.baseUrl}${options.path.startsWith("/") ? options.path : `/${options.path}`}`;
    const headers: Record<string, string> = {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    };
    const response: Response = await fetch(url, {
      method: options.method,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const responseBody: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const fallbackMessage: string = `Request failed with status ${response.status}`;
      const message: string = this.extractMessage(responseBody) ?? fallbackMessage;
      throw new ApiError({
        message,
        statusCode: response.status,
        responseBody,
      });
    }
    return responseBody as TResponse;
  }

  private extractMessage(responseBody: unknown): string | null {
    if (!responseBody || typeof responseBody !== "object") {
      return null;
    }
    if (!("message" in responseBody)) {
      return null;
    }
    const value: unknown = (responseBody as { message?: unknown }).message;
    return typeof value === "string" ? value : null;
  }
}
