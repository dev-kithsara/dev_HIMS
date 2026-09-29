import { Request, Response, NextFunction } from 'express';

/**
 * A utility function to wrap async Express route handlers.
 * It automatically catches any errors thrown inside the controller
 * and passes them to the Express Global Error Handler using next(error).
 *
 * @param fn - The async controller function
 * @returns A new function that Express can execute safely
 */
export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Execute the controller function.
    // If it resolves (success), great!
    // If it rejects (throws an error), catch it and send to next()
    Promise.resolve(fn(req, res, next)).catch((err) => next(err));
  };
};
