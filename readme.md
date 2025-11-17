Technologies Used
•	Runtime: Node.js
•	Language: TypeScript
•	Framework: Express.js
•	Database: PostgreSQL (SQL Database)
•	ORM: Prisma
•	Authentication: JWT (JSON Web Tokens) with Access/Refresh Token system
•	Security: bcrypt for password hashing
Setup & Installation
1. Prerequisites
You must have Node.js (v18+) and a running PostgreSQL instance available.
2. Project Clone and Dependencies
Clone the repository: git clone https://github.com/Aayushnhk/Task-Management-Backend
cd task-management-backend
Install dependencies: npm install
3. Environment Configuration
Create a file named. env in the root directory and fill it with your database and JWT secrets.
Variable	Description	Example Value
DATABASE_URL	PostgreSQL connection string	postgresql://user:pass@localhost:5432/taskdb?schema=public
JWT_SECRET_ACCESS	Secret key for short-lived tokens	A_VERY_LONG_RANDOM_STRING_1
JWT_SECRET_REFRESH	Secret key for long-lived tokens	A_DIFFERENT_LONG_RANDOM_STRING_2
SALT_ROUNDS	Cost factor for bcrypt	10
PORT	API server port	3000
4. Database Setup & Migration
Run the following command to connect to your PostgreSQL database and create the User and Task tables using Prisma migrations:
npx prisma migrate dev --name init_models
5. Running the Server
Start the API server in development mode using ts-node and nodemon: npm run dev
The API will be available at http://localhost:3000.
API Endpoints
All protected endpoints require a valid Access Token in the Authorization: Bearer <token> header.
Feature	Method	Endpoint	Description
Registration	POST	/auth/register	Creates a new user (password is hashed).
Login	POST	/auth/login	Authenticates user; returns Access Token, sets Refresh Token cookie.
Refresh Token	POST	/auth/refresh	Uses Refresh Token (from cookie) to issue a new Access Token.
Logout	POST	/auth/logout	Clears the Refresh Token from the DB and cookie.
Task List	GET	/tasks	Fetches tasks. Supports ?page, ?limit, ?status, ?search.
Create Task	POST	/tasks	Creates a new task for the logged-in user.
Detail View	GET	/tasks/:id	Gets a single task.
Update Task	PATCH	/tasks/:id	Modifies title/description/status.
Delete Task	DELETE	/tasks/:id	Deletes a task.
Toggle Status	PATCH	/tasks/:id/toggle	Toggles status between pending/completed.
