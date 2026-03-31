export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly responseBody: unknown;

  public constructor(params: { message: string; statusCode: number; responseBody: unknown }) {
    super(params.message);
    this.name = "ApiError";
    this.statusCode = params.statusCode;
    this.responseBody = params.responseBody;
  }
}
