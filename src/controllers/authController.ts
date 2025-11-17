// src/controllers/authController.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt, { JwtPayload } from 'jsonwebtoken';

const prisma = new PrismaClient();
const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS || '10'); 

// Define the required password pattern:
// 1. At least 8 characters long (.{8,})
// 2. Contains at least one uppercase letter (?=.*[A-Z])
// 3. Contains at least one lowercase letter (?=.*[a-z])
// 4. Contains at least one number (?=.*\d)
// 5. Contains at least one special character (?=.*[!@#$%^&*])
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
const PASSWORD_REQUIREMENTS = 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (!@#$%^&*).';

// Get JWT Secrets from .env 
const ACCESS_SECRET = process.env.JWT_SECRET_ACCESS as string;
const REFRESH_SECRET = process.env.JWT_SECRET_REFRESH as string;

/**
 * Generates both Access and Refresh tokens for a given user ID.
 * @param userId 
 * @returns { accessToken: string, refreshToken: string }
 */
const generateTokens = (userId: string) => {
    // Access Token: short-lived for accessing protected routes
    const accessToken = jwt.sign({ id: userId }, ACCESS_SECRET, { expiresIn: '15m' });

    // Refresh Token: long-lived to get a new Access Token
    const refreshToken = jwt.sign({ id: userId }, REFRESH_SECRET, { expiresIn: '7d' });

    return { accessToken, refreshToken };
};


export const registerUser = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    // 1. Validation and Error Handling (HTTP 400 Bad Request)
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' }); 
    }
    
    // NEW: Check password strength using RegEx
    if (!PASSWORD_REGEX.test(password)) {
        return res.status(400).json({ message: PASSWORD_REQUIREMENTS });
    }

    try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            // HTTP 409 Conflict
            return res.status(409).json({ message: 'User with this email already exists.' }); 
        }

        // 2. Hash Password 
        // Hash passwords using berypt before storing them
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS); // <-- Accesses global SALT_ROUNDS

        // 3. Create User
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
            },
            // Select only safe fields to return
            select: { id: true, email: true }, 
        });

        // 4. Return Success (HTTP 201 Created)
        return res.status(201).json({ 
            message: 'User registered successfully. Please log in.',
            user: user
        }); 

    } catch (error) {
        console.error('Registration error:', error);
        // HTTP 500 Server Error
        return res.status(500).json({ message: 'Internal server error.' });
    }
};


export const loginUser = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    // 1. Validation and Error Handling
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' }); // HTTP 400 Bad Request
    }

    try {
        // 2. Find User
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials.' }); // HTTP 401 Unauthorized
        }

        // 3. Compare Password
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' }); // HTTP 401 Unauthorized
        }

        // 4. Generate & Store Tokens
        const { accessToken, refreshToken } = generateTokens(user.id);
        
        // Store the refresh token securely in the database
        await prisma.user.update({
            where: { id: user.id },
            data: { refreshToken: refreshToken },
        });

        // 5. Send Tokens (Refresh Token in secure HTTP-only cookie is recommended)
        res.cookie('refreshToken', refreshToken, {
             httpOnly: true, 
             maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days (matching token expiry)
             secure: process.env.NODE_ENV === 'production' 
        });

        return res.status(200).json({
            message: 'Login successful.',
            accessToken,
            user: { id: user.id, email: user.email }
        });

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
};


export const refreshToken = async (req: Request, res: Response) => {
    // 1. Get Refresh Token from cookie
    const refreshToken = req.cookies.refreshToken;
    
    if (!refreshToken) {
        // HTTP 401 Unauthorized
        return res.status(401).json({ message: 'Unauthorized. No refresh token provided.' });
    }

    try {
        // 2. Verify Refresh Token
        // This checks if the token is valid and not expired
        const decoded = jwt.verify(refreshToken, REFRESH_SECRET) as JwtPayload;

        const userId = decoded.id;

        // 3. Check if token matches stored token in the database
        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user || user.refreshToken !== refreshToken) {
            // If the token is valid but doesn't match the one stored (e.g., used after logout)
            return res.status(403).json({ message: 'Forbidden. Invalid refresh token.' }); // HTTP 403 Forbidden
        }

        // 4. Generate a NEW Access Token
        const newAccessToken = jwt.sign({ id: user.id }, ACCESS_SECRET, { expiresIn: '15m' });

        // 5. Return the new Access Token
        return res.status(200).json({ 
            message: 'Access token refreshed successfully.',
            accessToken: newAccessToken 
        });

    } catch (error) {
        // If jwt.verify fails (e.g., token expired, invalid signature)
        console.error('Token refresh failed:', error);
        return res.status(403).json({ message: 'Forbidden. Refresh token invalid or expired.' }); // HTTP 403 Forbidden
    }
};

export const logoutUser = async (_req: Request, res: Response) => {
    // 1. Get Refresh Token from cookie (We need the token to find the user in DB)
    const refreshToken = _req.cookies.refreshToken;

    // Clear the cookie immediately, whether the token is valid or not
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
    });

    if (!refreshToken) {
        // If there's no token, the user is already logged out from the client's perspective.
        return res.status(204).json({ message: 'Logged out successfully.' }); // HTTP 204 No Content
    }

    try {
        // 2. Find User by the stored refresh token
        // Safely decode the token to get the user ID
        const decoded = jwt.verify(refreshToken, REFRESH_SECRET) as JwtPayload;
        const userId = decoded.id;

        // 3. Remove Refresh Token from the database
        await prisma.user.updateMany({
            where: {
                id: userId,
                // Ensures we only clear it if it matches the one presented
                refreshToken: refreshToken 
            },
            data: { refreshToken: null },
        });
        
        // 4. Return Success
        return res.status(204).json({ message: 'Logged out successfully.' }); // HTTP 204 No Content

    } catch (error) {
        // If the refresh token is invalid/expired, we still clear the cookie 
        // and tell the client they are logged out.
        console.error('Logout error (Invalid token during cleanup):', error);
        return res.status(204).json({ message: 'Logged out successfully.' }); // HTTP 204 No Content
    }
};