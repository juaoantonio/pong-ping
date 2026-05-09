export class ApiClientError extends Error {
  public readonly code: string;
  public readonly details: unknown[];
  public readonly status: number;

  public constructor(message: string, options: { code: string; details?: unknown[]; status: number }) {
    super(message);
    this.name = "ApiClientError";
    this.code = options.code;
    this.details = options.details ?? [];
    this.status = options.status;
  }
}

export class ApiParseError extends Error {
  public constructor(message = "A resposta da API nao esta no formato esperado.") {
    super(message);
    this.name = "ApiParseError";
  }
}
