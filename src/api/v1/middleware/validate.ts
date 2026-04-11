/**
 * Request validation middleware using Joi
 * Path: src/api/v1/middleware/validate.ts
 */

import { Request, Response, NextFunction } from "express";
import { ObjectSchema } from "joi";
import { HTTP_STATUS } from "../../../constants/httpConstants";

interface RequestSchemas {
  body?: ObjectSchema;
  params?: ObjectSchema;
  query?: ObjectSchema;
}

interface ValidationOptions {
  stripBody?: boolean;
  stripQuery?: boolean;
  stripParams?: boolean;
}

/**
 * Creates Express middleware that validates request parts against Joi schemas
 * 
 * @param schemas - Object with separate schemas for body, params, query
 * @param options - Validation options for stripping unknown fields
 * @returns Express middleware function
 */
export const validateRequest = (
  schemas: RequestSchemas,
  options: ValidationOptions = {}
) => {
  const defaultOptions = {
    stripBody: true,
    stripQuery: true,
    stripParams: false,
    ...options,
  };

  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors: string[] = [];

      const validatePart = (
        schema: ObjectSchema,
        data: any,
        partName: string,
        shouldStrip: boolean
      ) => {
        const { error, value } = schema.validate(data, {
          abortEarly: false,
          stripUnknown: shouldStrip,
        });

        if (error) {
          errors.push(
            ...error.details.map(
              (detail) => `${partName}: ${detail.message}`
            )
          );
        } else if (shouldStrip) {
          return value;
        }
        return data;
      };

      // Validate each request part
      if (schemas.body) {
        req.body = validatePart(
          schemas.body,
          req.body,
          "Body",
          defaultOptions.stripBody
        );
      }

      if (schemas.params) {
        req.params = validatePart(
          schemas.params,
          req.params,
          "Params",
          defaultOptions.stripParams
        );
      }

      if (schemas.query) {
        const validatedQuery = validatePart(
          schemas.query,
          req.query,
          "Query",
          defaultOptions.stripQuery
        );

        // Express 5 exposes req.query via getter-only property, so mutate in place.
        if (defaultOptions.stripQuery) {
          const currentQuery = req.query as Record<string, unknown>;
          const sanitizedQuery = validatedQuery as Record<string, unknown>;

          for (const key of Object.keys(currentQuery)) {
            if (!(key in sanitizedQuery)) {
              delete currentQuery[key];
            }
          }

          Object.assign(currentQuery, sanitizedQuery);
        }
      }

      // Return validation errors if any
      if (errors.length > 0) {
        return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
          status: "error",
          error: {
            message: `Validation failed: ${errors.join(", ")}`,
            code: "VALIDATION_ERROR",
          },
          timestamp: new Date().toISOString(),
        });
      }

      next();
    } catch (error: unknown) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        status: "error",
        error: {
          message: (error as Error).message,
          code: "BAD_REQUEST",
        },
        timestamp: new Date().toISOString(),
      });
    }
  };
};