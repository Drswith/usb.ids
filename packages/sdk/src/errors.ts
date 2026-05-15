export const ERROR_CODES = {
  DATA_NOT_FOUND: "DATA_NOT_FOUND",
  NETWORK_ERROR: "NETWORK_ERROR",
  INVALID_PARAMETER: "INVALID_PARAMETER",
} as const;

export class UsbApiError extends Error {
  readonly code: string;
  constructor(message: string, code: string, cause?: Error) {
    super(message, cause ? { cause } : undefined);
    this.name = "UsbApiError";
    this.code = code;
  }
}
