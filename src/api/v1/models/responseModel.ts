/**
 * Response models for consistent API responses
 * Path: src/api/v1/models/responseModel.ts
 */

/**
 * Interface representing a standard API response
 * @template T - The type of the data property
 */
export interface ApiResponse<T = any> {
  status: "success" | "error";
  data?: T;
  message?: string;
  error?: {
    message: string;
    code: string;
  };
  timestamp: string;
}

/**
 * Creates a success response object
 * @template T - The type of the data property
 * @param data - The data to include in the response
 * @param message - A message providing additional information
 * @returns The success response object
 */
export const successResponse = <T = any>(
  data?: T,
  message?: string
): ApiResponse<T> => ({
  status: "success",
  data,
  message,
  timestamp: new Date().toISOString(),
});

/**
 * Creates an error response object
 * @param message - The error message to display to the client
 * @param code - The error code for programmatic handling
 * @returns A formatted error response object
 */
export const errorResponse = (
  message: string,
  code: string
): ApiResponse => ({
  status: "error",
  error: {
    message,
    code,
  },
  timestamp: new Date().toISOString(),
});