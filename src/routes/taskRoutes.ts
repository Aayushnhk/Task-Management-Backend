// src/routes/taskRoutes.ts
import { Router } from 'express'; 
import { protect } from '../middleware/authMiddleware';

import { 
    getTasks as getTasksController, 
    createTask as createTaskController, 
    getTaskById as getTaskByIdController, 
    updateTask as updateTaskController, 
    deleteTask as deleteTaskController, 
    toggleTaskStatus as toggleTaskStatusController
} from '../controllers/taskController'; 

const getTasks = getTasksController as any;
const createTask = createTaskController as any;
const getTaskById = getTaskByIdController as any;
const updateTask = updateTaskController as any;
const deleteTask = deleteTaskController as any;
const toggleTaskStatus = toggleTaskStatusController as any;


const router = Router();

// Apply the 'protect' middleware to ALL routes in this router.
router.use(protect); 

router.route('/')
    .get(getTasks)
    .post(createTask);

router.route('/:id')
    .get(getTaskById)
    .patch(updateTask)
    .delete(deleteTask);

router.patch('/:id/toggle', toggleTaskStatus);


export default router;