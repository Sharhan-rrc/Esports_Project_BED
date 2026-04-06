/**
 * Global error handling middleware
 * Path: src/api/v1/middleware/errorHandler.ts
 */

import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/errors";
import { HTTP_STATUS } from "../../../constants/httpConstants";
import { errorResponse } from "../models/responseModel";

/**
 * Global error handling middleware for Express application
 * Catches all errors and formats consistent response
 * 
 * @param err - The error object
 * @param req - Express request object
 * @param res - Express response object
 * @param _next - Express next function (unused)
 */
const errorHandler = (
  err: Error | null,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (!err) {
    console.error("Error: null or undefined error received");
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      errorResponse("An unexpected error occurred", "UNKNOWN_ERROR")
    );
    return;
  }

  // Log the error
  console.error(`Error: ${err.message}`);

  // Log stack trace in non-production
  if (process.env.NODE_ENV !== "production") {
    console.error(`Stack: ${err.stack}`);
  }

  // Handle custom AppError instances
  if (err instanceof AppError) {
    res.status(err.statusCode).json(errorResponse(err.message, err.code));
  } else {
    // Handle unexpected errors
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      errorResponse("An unexpected error occurred", "UNKNOWN_ERROR")
    );
  }
};

export default errorHandler;