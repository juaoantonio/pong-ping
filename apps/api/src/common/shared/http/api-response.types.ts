export interface ApiSuccessResponse<T = unknown> {
  ok: true;
  data: T;
  meta: {
    requestId?: string;
    timestamp: string;
  };
}

export interface ApiErrorResponse {
  ok: false;
  error: {
    status: number;
    code: string;
    message: string;
    details: unknown[];
    path: string;
    method: string;
    requestId?: string;
    timestamp: string;
  };
}
