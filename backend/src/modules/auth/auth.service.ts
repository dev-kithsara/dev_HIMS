// backend/src/services/auth.service.ts

import { comparePasswords, generateToken } from '../../utils/auth.utils';
import prisma from '../../utils/prisma';
import { auditService } from '../../shared/audit/audit.service';

export class AuthService {
  
  /**
   * Authenticate a user and generate a JWT token
   * @param email - User's email
   * @param password - User's plain text password
   * @returns User object (without password) and JWT token
   */
  async login(email: string, password: string) {
    
    // 1. Check if the user exists in the database
    const user = await prisma.user.findUnique({
      where: { email: email }
    });

    // 2. If user is not found, throw an error
    if (!user) {
      await auditService.record({
        actorEmail: email,
        eventType: 'AUTHENTICATION',
        action: 'LOGIN_FAILED',
        entityType: 'USER',
        metadata: { reason: 'INVALID_CREDENTIALS' },
      });
      throw new Error('Invalid email or password');
    }

    if (!user.isActive) {
      await auditService.record({
        actorId: user.id,
        actorEmail: user.email,
        actorRole: user.role,
        eventType: 'AUTHENTICATION',
        action: 'LOGIN_BLOCKED',
        entityType: 'USER',
        entityId: user.id,
        departmentId: user.departmentId,
        metadata: { reason: 'ACCOUNT_INACTIVE' },
      });
      throw new Error('Account is inactive');
    }

    // 3. Compare the provided password with the hashed password in the database
    const isPasswordValid = await comparePasswords(password, user.password);

    // 4. If passwords do not match, throw an error
    if (!isPasswordValid) {
      await auditService.record({
        actorId: user.id,
        actorEmail: user.email,
        actorRole: user.role,
        eventType: 'AUTHENTICATION',
        action: 'LOGIN_FAILED',
        entityType: 'USER',
        entityId: user.id,
        departmentId: user.departmentId,
        metadata: { reason: 'INVALID_CREDENTIALS' },
      });
      throw new Error('Invalid email or password');
    }

    // 5. Generate JWT Token with user details
    const token = generateToken({
      id: user.id,
      role: user.role,
      departmentId: user.departmentId
    });

    // 6. Remove the password from the user object before returning it to the controller
    // We use object destructuring and the rest operator (...) for this
    const { password: _, ...userWithoutPassword } = user;

    await auditService.record({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      eventType: 'AUTHENTICATION',
      action: 'LOGIN_SUCCESS',
      entityType: 'USER',
      entityId: user.id,
      departmentId: user.departmentId,
    });

    return {
      user: userWithoutPassword,
      token
    };
  }
}

export const authService = new AuthService();
