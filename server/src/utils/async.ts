import { RequestHandler, NextFunction, Response } from "express";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function asyncHandler(fn: (req: any, res: Response, next: NextFunction) => Promise<void>): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
