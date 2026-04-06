/**
 * Error utility functions for consistent error handling
 * Path: src/api/v1/utils/errorUtils.ts
 */

/**
 * Extracts error message from unknown error types
 * @param error - The error object
 * @returns The error message as a string
 */
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

/**
 * Extracts error code from Firebase or other errors
 * @param error - The error object
 * @returns The error code as a string
 */
export const getErrorCode = (error: unknown): string => {
  if (error instanceof Error) {
    const firebaseError = error as any;
    return firebaseError.code || "UNKNOWN_ERROR";
  }
  return "UNKNOWN_ERROR";
};

/**
 * Logs error with appropriate level
 * @param error - The error to log
 * @param context - Additional context about where error occurred
 */
export const logError = (error: unknown, context?: string): void => {
  const timestamp = new Date().toISOString();
  const message = getErrorMessage(error);
  const code = getErrorCode(error);

  console.error(
    `[${timestamp}] ERROR${context ? ` (${context})` : ""}: ${message} [${code}]`
  );

  if (process.env.NODE_ENV !== "production") {
    if (error instanceof Error) {
      console.error(error.stack);
    }
  }
};