import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// FIX: Read JWT_SECRET from environment variables.
// If it doesn't exist (e.g., in local dev before setup), use a secure fallback.
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_do_not_use_in_production';
const JWT_EXPIRES_IN: jwt.SignOptions['expiresIn'] =
  (process.env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn']) || '24h';

/**
 * Hash a plain text password using bcrypt
 * @param password - The plain text password
 * @returns The hashed password
 */
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10; // 10 is the industry standard for security vs performance
  return await bcrypt.hash(password, saltRounds);
};

/**
 * Compare a plain text password with a hashed password
 * @param password - The plain text password entered by the user
 * @param hash - The hashed password from the database
 * @returns boolean indicating if they match
 */
export const comparePasswords = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

/**
 * Generate a JWT token for a user
 * @param payload - The data to store in the token (e.g., userId, role)
 * @returns The signed JWT string
 */
export const generateToken = (payload: {
  id: number;
  role: string;
  departmentId: number;
}): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as any });
};

/**
 * Verify and decode a JWT token
 * @param token - The JWT string
 * @returns The decoded payload if valid
 */
export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    // If token is expired or invalid, jwt.verify throws an error
    throw new Error('Invalid or expired token');
  }
};
