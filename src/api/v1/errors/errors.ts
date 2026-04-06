/**
 * Custom Error Classes for standardized error handling
 * Path: src/api/v1/errors/errors.ts
 */

import { HTTP_STATUS } from "../../../constants/httpConstants";

/**
 * Base error class for application errors.
 * Extends the built-in Error class to include an error code and status code.
 */
export class AppError extends Error {
  constructor(
    public message: string,
    public code: string,
    public statusCode: number
  ) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Repository error for database operations
 */
export class RepositoryError extends AppError {
  constructor(
    message: string,
    code: string,
    statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR
  ) {
    super(message, code, statusCode);
  }
}

/**
 * Service error for business logic failures
 */
export class ServiceError extends AppError {
  constructor(
    message: string,
    code: string = "SERVICE_ERROR",
    statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR
  ) {
    super(message, code, statusCode);
  }
}

/**
 * Authentication error for token/auth failures
 */
export class AuthenticationError extends AppError {
  constructor(
    message: string,
    code: string = "AUTHENTICATION_ERROR",
    statusCode: number = HTTP_STATUS.UNAUTHORIZED
  ) {
    super(message, code, statusCode);
  }
}

/**
 * Authorization error for permission/role failures
 */
export class AuthorizationError extends AppError {
  constructor(
    message: string,
    code: string = "AUTHORIZATION_ERROR",
    statusCode: number = HTTP_STATUS.FORBIDDEN
  ) {
    super(message, code, statusCode);
  }
}

/**
 * Validation error for input validation failures
 */
export class ValidationError extends AppError {
  constructor(
    message: string,
    code: string = "VALIDATION_ERROR",
    statusCode: number = HTTP_STATUS.UNPROCESSABLE_ENTITY
  ) {
    super(message, code, statusCode);
  }
}