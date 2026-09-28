import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth.utils';

// We need to extend the Express Request interface to include our user data
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        role: string;
        departmentId: number;
      };
    }
  }
}

/**
 * Middleware to verify the JWT token from the Authorization header
 */
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. Get the token from the header (Format: "Bearer <token>")
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    // 2. Extract the token string
    const token = authHeader.split(' ')[1];

    // 3. Verify the token using our utility function
    const decodedPayload = verifyToken(token);

    // 4. Attach the decoded user data to the Request object
    // This allows the next functions (Controllers) to know exactly who is making the request
    req.user = decodedPayload;

    // 5. Move to the next middleware or controller
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

/**
 * Middleware to check if the user has the required role(s)
 * @param allowedRoles - Array of roles allowed to access the route
 */
export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    
    // 1. Check if user exists (authenticate middleware should have run first)
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not authenticated.' });
    }

    // 2. Check if the user's role is in the list of allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Access forbidden. Requires one of the following roles: ${allowedRoles.join(', ')}` 
      });
    }

    // 3. Move to the next middleware or controller
    next();
  };
};