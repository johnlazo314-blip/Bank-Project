# Bank Project

This is a full-stack web application for a bank project. It includes a React frontend and a Node.js/Express backend.

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (which includes npm)
- [PostgreSQL](https://www.postgresql.org/download/)

## Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/johnlazo314-blip/Bank-Project.git
    cd Bank-Project
    ```

2.  **Set up the backend:**
    ```bash
    cd backend
    npm install
    ```

3.  **Set up the frontend:**
    ```bash
    cd ../frontend
    npm install
    ```

## Database Setup

This project uses PostgreSQL as the database.

1.  Make sure your PostgreSQL server is running.
2.  Create a new database for the project.
3.  In the `backend` directory, create a `.env` file.
4.  Add your PostgreSQL connection string to the `.env` file as `DATABASE_URL`. It should look like this:

    ```
    DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE_NAME"
    ```
    Replace `USER`, `PASSWORD`, `HOST`, `PORT`, and `DATABASE_NAME` with your database credentials.

## Running the Application for Development

You will need to run both the backend and frontend servers in separate terminals for local development.

1.  **Start the backend server:**
    Navigate to the `backend` directory and run:
    ```bash
    npm run dev
    ```
    The backend server will start on `http://localhost:3000` (or the port specified in your environment).

2.  **Start the frontend development server:**
    Navigate to the `frontend` directory and run:
    ```bash
    npm run dev
    ```
    The frontend application will be available at `http://localhost:5173` (or another port if 5173 is in use).

You can now access the application in your web browser.

## Building for Production

To create a production build, you can run the build commands for both the frontend and backend.

### Frontend
```bash
cd ../frontend
npm run build
```

### Backend
```bash
cd ../backend
npm run build
```
This will compile the TypeScript code into JavaScript in the `dist` directory.

## Deployment

When deploying the backend to a service like Render, use the following commands:

-   **Build Command:** `npm install && npm run build`
-   **Start Command:** `npm start`

The `npm start` command will execute `node dist/index.js` to run the compiled application.
