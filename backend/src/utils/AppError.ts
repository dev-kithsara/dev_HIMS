/**
 * Custom Error class to handle business logic errors with specific HTTP status codes.
 * This prevents all errors from defaulting to 500 Internal Server Error.
 */
export class AppError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    
    // Set the prototype explicitly (required when extending built-in classes in TS)
    Object.setPrototypeOf(this, AppError.prototype);
    
    // Capture the stack trace for debugging purposes
    Error.captureStackTrace(this, this.constructor);
  }
}