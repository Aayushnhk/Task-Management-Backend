// src/index.ts
import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors'; 
import authRoutes from './routes/authRoutes'; 
import taskRoutes from './routes/taskRoutes'; 

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: 'http://localhost:3001', 
    credentials: true, // Allow cookies (needed for Refresh Token)
}));

// 2. Body and Cookie Parsers
app.use(express.json()); 
app.use(cookieParser());

// Routes
app.use('/auth', authRoutes); 
app.use('/tasks', taskRoutes); 

app.get('/', (_req, res) => {
    res.send('Task Management Backend API is running.');
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});