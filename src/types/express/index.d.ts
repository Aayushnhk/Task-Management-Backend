// src/types/express/index.d.ts
// This file extends the Express Request interface
declare namespace Express {
    export interface Request {
        userId: string; // Adds a property 'userId' to the Request object
    }
}