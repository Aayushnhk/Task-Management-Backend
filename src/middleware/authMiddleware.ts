import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

const ACCESS_SECRET = process.env.JWT_SECRET_ACCESS!;

interface AuthRequest extends Request {
  userId: string;
}

export const protect = (req: Request, res: Response, next: NextFunction): void => {
  let token: string | undefined;

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401).json({ message: 'Unauthorized. No access token provided.' });
    return;                                    // ← explicit return
  }

  try {
    const decoded = jwt.verify(token, ACCESS_SECRET) as JwtPayload & { id: string };

    (req as AuthRequest).userId = decoded.id;
    next();                                    // success path – no return needed
  } catch (error) {
    res.status(401).json({ message: 'Unauthorized. Access token invalid or expired.' });
    return;                                    // ← explicit return
  }
};