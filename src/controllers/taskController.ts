// src/controllers/taskController.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CustomRequest extends Request {
    userId: string;
}


// GET /tasks - Fetch all tasks (with pagination, filtering, searching)
export const getTasks = async (req: CustomRequest, res: Response) => { // <-- CHANGED TYPE
    const userId = req.userId; // Retrieved from the 'protect' middleware
    
    // Extract query parameters for dynamic filtering/pagination
    const { 
        status, 
        search, 
        page = '1', 
        limit = '10' 
    } = req.query;

    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);
    const skip = (pageNumber - 1) * limitNumber;

    // Build the dynamic 'where' clause
    const where: any = {
        userId: userId, // Tasks must belong to the logged-in user
    };

    // 1. Filtering by Status
    if (status && typeof status === 'string') {
        where.status = status;
    }

    // 2. Searching by Title
    if (search && typeof search === 'string' && search.trim() !== '') {
        where.title = {
            contains: search,
            mode: 'insensitive',
        };
    }

    try {
        const totalTasks = await prisma.task.count({ where });

        const tasks = await prisma.task.findMany({
            where: where,
            take: limitNumber,
            skip: skip,
            orderBy: {
                createdAt: 'desc',
            },
        });

        const totalPages = Math.ceil(totalTasks / limitNumber);

        // HTTP 200 OK
        return res.status(200).json({
            tasks: tasks,
            metadata: {
                totalTasks,
                totalPages,
                currentPage: pageNumber,
                limit: limitNumber,
            },
        });

    } catch (error) {
        console.error('Error fetching tasks:', error);
        // HTTP 500 Server Error
        return res.status(500).json({ message: 'Internal server error.' });
    }
};

// POST /tasks - Create a new task
export const createTask = async (req: CustomRequest, res: Response) => { 
    const { title, description } = req.body;
    const userId = req.userId; // Retrieved from the 'protect' middleware

    // Basic Validation: Title is mandatory
    if (!title) {
        return res.status(400).json({ message: 'Task title is required.' }); // HTTP 400 Bad Request
    }

    try {
        const task = await prisma.task.create({
            data: {
                title,
                description,
                userId: userId, // Tasks must belong to the logged-in user
            },
        });

        // HTTP 201 Created
        return res.status(201).json(task);

    } catch (error) {
        console.error('Error creating task:', error);
        return res.status(500).json({ message: 'Internal server error.' }); // HTTP 500 Server Error
    }
};

// GET /tasks/:id - Fetch a single task
export const getTaskById = async (req: CustomRequest, res: Response) => { 
    const { id } = req.params;
    const userId = req.userId;
    
    try {
        const task = await prisma.task.findUnique({
            where: {
                id: id,
                userId: userId, // Ensure task belongs to the user
            },
        });

        if (!task) {
            return res.status(404).json({ message: 'Task not found.' }); // HTTP 404 Not Found
        }

        // HTTP 200 OK
        return res.status(200).json(task);

    } catch (error) {
        console.error('Error fetching task:', error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
};

// PATCH /tasks/:id - Update a task
export const updateTask = async (req: CustomRequest, res: Response) => { 
    const { id } = req.params;
    const userId = req.userId;
    const { title, description, status } = req.body;
    
    // Ensure at least one field is provided for update
    if (!title && !description && !status) {
        return res.status(400).json({ message: 'At least one field (title, description, or status) is required for update.' }); // HTTP 400 Bad Request
    }

    try {
        // 1. Check if the task exists and belongs to the user
        const existingTask = await prisma.task.findFirst({
            where: {
                id: id,
                userId: userId, // Ensure task belongs to the user
            },
        });

        if (!existingTask) {
            return res.status(404).json({ message: 'Task not found.' }); // HTTP 404 Not Found
        }

        // 2. Perform Update
        const updatedTask = await prisma.task.update({
            where: {
                id: id,
            },
            data: {
                title: title ?? existingTask.title, // Only update if provided
                description: description ?? existingTask.description,
                status: status ?? existingTask.status,
            },
        });

        // HTTP 200 OK
        return res.status(200).json(updatedTask);

    } catch (error) {
        console.error('Error updating task:', error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
};

// DELETE /tasks/:id - Delete a task
export const deleteTask = async (req: CustomRequest, res: Response) => { 
    const { id } = req.params;
    const userId = req.userId;

    try {
        // 1. Check if the task exists and belongs to the user
        const existingTask = await prisma.task.findFirst({
            where: {
                id: id,
                userId: userId, // Ensure task belongs to the user
            },
        });

        if (!existingTask) {
            return res.status(404).json({ message: 'Task not found.' }); // HTTP 404 Not Found
        }
        
        // 2. Perform Deletion
        await prisma.task.delete({
            where: {
                id: id,
            },
        });

        // HTTP 204 No Content (Standard for successful deletion)
        return res.status(204).send();

    } catch (error) {
        console.error('Error deleting task:', error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
};

// PATCH /tasks/:id/toggle - Toggle task status
export const toggleTaskStatus = async (req: CustomRequest, res: Response) => { 
    const { id } = req.params;
    const userId = req.userId;

    try {
        // 1. Check if the task exists and belongs to the user
        const task = await prisma.task.findFirst({
            where: {
                id: id,
                userId: userId, // Ensure task belongs to the user
            },
        });

        if (!task) {
            return res.status(404).json({ message: 'Task not found.' }); // HTTP 404 Not Found
        }

        // 2. Determine the new status
        // Toggle logic: If status is 'pending', set to 'completed'; otherwise, set to 'pending'.
        const newStatus = task.status === 'pending' ? 'completed' : 'pending';

        // 3. Perform Update
        const updatedTask = await prisma.task.update({
            where: {
                id: id,
            },
            data: {
                status: newStatus,
            },
        });

        // HTTP 200 OK
        return res.status(200).json(updatedTask);

    } catch (error) {
        console.error('Error toggling task status:', error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
};