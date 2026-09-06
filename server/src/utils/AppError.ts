export class AppError extends Error {
  constructor(
    message: string,
    public statusCode = 400,
    public code = "BAD_REQUEST",
    public errors?: Array<{ field: string; message: string }>,
  ) {
    super(message);
    this.name = "AppError";
  }
}
