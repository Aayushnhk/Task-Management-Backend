// src/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

const ACCESS_SECRET = process.env.JWT_SECRET_ACCESS as string;

interface CustomRequest extends Request {
    userId: string;
}

export const protect = (req: Request, res: Response, next: NextFunction) => {
    // 1. Check for Token in Headers
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        // HTTP 401 Unauthorized
        return res.status(401).json({ message: 'Unauthorized. No access token provided.' });
    }

    try {
        // 2. Verify Access Token
        const decoded = jwt.verify(token, ACCESS_SECRET) as JwtPayload;

        // 3. Attach User ID to Request
        (req as CustomRequest).userId = decoded.id; 

        // 4. Continue to the protected route
        next();

    } catch (error) {
        // If jwt.verify fails (e.g., token expired, invalid signature)
        console.error('Access token verification failed:', error);
        // HTTP 401 Unauthorized
        return res.status(401).json({ message: 'Unauthorized. Access token invalid or expired.' });
    }
};