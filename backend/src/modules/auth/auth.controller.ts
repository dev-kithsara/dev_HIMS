import { Request, Response } from 'express';
import { z } from 'zod';
import { authService } from './auth.service';
import { loginSchema } from './auth.validator';


export const login =  async (req: Request, res: Response) => {
    try {
        // 1. Validate the Request Body using Zod
        const validatedData = loginSchema.parse({ body: req.body });
        const { email, password } = validatedData.body;

        // 2. Call the Auth Service to perform login
        const result = await authService.login(email, password);

        // 3. Send the successful response with the Token and User data
        return res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user: result.user,
                token: result.token
            }
        });
    }
    catch (error: any) {
        console.error(" LOGIN ERROR DETAILS:", error);
        // 4. Error Handling
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: error.issues?.map(e => e.message) || ["Invalid input data"],
            });
        }
    
    
    // If it's our custom "Invalid email or password" error, send a 401
    if (error.message === 'Invalid email or password') {
        return res.status(401).json({
            success: false,
            message: error.message,
        });
    }

    if (error.message === 'Account is inactive') {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }


    // For any other unexpected server errors
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred during login.",
    });
  }
};
