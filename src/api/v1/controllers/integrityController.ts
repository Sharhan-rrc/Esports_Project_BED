/**
 * Integrity controller - AI-powered violation detection endpoints
 * Path: src/api/v1/controllers/integrityController.ts
 */

import { Request, Response, NextFunction } from "express";
import * as integrityService from "../services/integrityService";
import { successResponse } from "../models/responseModel";
import { HTTP_STATUS } from "../../../constants/httpConstants";

/**
 * POST /integrity/scan/:playerId - Scan player for violations
 */
export const scanPlayer = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const playerId = req.params.playerId as string;
    const userId = res.locals.uid;

    const integrityCase = await integrityService.scanPlayerForViolations(
      playerId,
      userId
    );

    res.status(HTTP_STATUS.CREATED).json(
      successResponse(
        {
          caseId: integrityCase.id,
          playerId: integrityCase.playerId,
          riskScore: integrityCase.riskScore,
          riskLevel: integrityCase.riskLevel,
          flags: integrityCase.flags.map((f) => ({
            flag: f.flag,
            severity: f.severity,
            reason: f.reason,
          })),
          aiAnalysis: integrityCase.aiAnalysis,
          recommendedAction: integrityCase.recommendedAction,
          status: integrityCase.status,
        },
        "Player integrity scan completed"
      )
    );
  } catch (error: unknown) {
    next(error);
  }
};

/**
 * GET /integrity/cases - Get all integrity cases with optional filtering
 */
export const getCases = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status } = req.query;

    const cases = await integrityService.getAllIntegrityCases(
      status as "open" | "investigating" | "resolved" | "false_positive" | undefined
    );

    const formattedCases = cases.map((c) => ({
      id: c.id,
      playerId: c.playerId,
      playerUsername: c.playerUsername,
      playerEmail: c.playerEmail,
      riskScore: c.riskScore,
      riskLevel: c.riskLevel,
      flagCount: c.flags.length,
      status: c.status,
      recommendedAction: c.recommendedAction,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));

    res.status(HTTP_STATUS.OK).json(
      successResponse(
        {
          cases: formattedCases,
          total: formattedCases.length,
        },
        "Integrity cases retrieved successfully"
      )
    );
  } catch (error: unknown) {
    next(error);
  }
};

/**
 * GET /integrity/cases/:caseId - Get detailed case information
 */
export const getCaseDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { caseId } = req.params;
    const cases = await integrityService.getAllIntegrityCases();
    const caseData = cases.find((c) => c.id === caseId);

    if (!caseData) {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        error: {
          code: "CASE_NOT_FOUND",
          message: "Case not found",
        },
      });
      return;
    }

    res.status(HTTP_STATUS.OK).json(
      successResponse(caseData, "Case details retrieved successfully")
    );
  } catch (error: unknown) {
    next(error);
  }
};

/**
 * PATCH /integrity/cases/:caseId - Update case status and notes (admin only)
 */
export const updateCase = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const caseId = req.params.caseId as string;
    const { status, adminNotes } = req.body;
    const userId = res.locals.uid;

    const updatedCase = await integrityService.updateIntegrityCase(
      caseId,
      status,
      adminNotes,
      userId
    );

    res.status(HTTP_STATUS.OK).json(
      successResponse(
        {
          id: updatedCase.id,
          status: updatedCase.status,
          adminNotes: updatedCase.adminNotes,
          updatedAt: updatedCase.updatedAt,
        },
        "Case updated successfully"
      )
    );
  } catch (error: unknown) {
    next(error);
  }
};
