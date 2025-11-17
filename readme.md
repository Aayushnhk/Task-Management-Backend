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

Variable	                            Description	                                       Example Value

DATABASE_URL	               PostgreSQL connection string	            postgresql://user:pass@localhost:5432/taskdb?schema=public

JWT_SECRET_ACCESS	         Secret key for short-lived tokens	                   A_VERY_LONG_RANDOM_STRING_1

JWT_SECRET_REFRESH	          Secret key for long-lived tokens	                 A_DIFFERENT_LONG_RANDOM_STRING_2

SALT_ROUNDS	                      Cost factor for bcrypt	                                       10

PORT	                             API server port	                                          3000

4. Database Setup & Migration

Run the following command to connect to your PostgreSQL database and create the User and Task tables using Prisma migrations:
npx prisma migrate dev --name init_models

5. Running the Server

Start the API server in development mode using ts-node and nodemon: npm run dev

The API will be available at http://localhost:3000.


________________________________________







