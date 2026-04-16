## Plan: Build a Simple React Banking App

This plan outlines the steps to build a full-stack banking application with a React frontend, Node.js backend, and a PostgreSQL database hosted on Neon, using Asgardeo for authentication.

**Tech Stack**
*   **Frontend**: React, TypeScript
*   **Backend**: Node.js, Express, TypeScript
*   **Database**: PostgreSQL on Neon
*   **Authentication**: Asgardeo
*   **Hosting**: Render (for backend/frontend)

---

### Phase 1: Backend Foundation & User Authentication

**Focus**: Set up the backend server, database on Neon, and integrate Asgardeo for user authentication.

**Steps**
1.  **Initialize Backend Project**:
    *   Set up `package.json`, install `express`, `pg`, `cors`, `dotenv`.
    *   Install dev dependencies: `typescript`, `ts-node`, `nodemon`, `@types/*`.
    *   Configure `tsconfig.json`.
2.  **Set Up Database (Neon)**:
    *   Create the PostgreSQL database on Neon.
    *   Define `Users`, `Accounts`, `Transactions`, and `Transfers` tables.
    *   Create a database connection module (`backend/src/db.ts`).
3.  **Integrate Asgardeo for Authentication**:
    *   Configure your application in the Asgardeo console.
    *   Implement backend logic to handle Asgardeo's authentication flow (e.g., OIDC). This will replace the manual `/auth/register` and `/auth/login` routes.
    *   Create middleware to verify Asgardeo tokens and protect routes. This middleware will also check for user roles ('user' vs. 'admin').

**Relevant files**
*   `backend/package.json`
*   `backend/tsconfig.json`
*   `backend/src/index.ts` (Express server setup)
*   `backend/src/db.ts` (Database connection)
*   `backend/src/middleware/auth.ts` (Asgardeo token verification)

---

### Phase 2: Core Account & Transaction Features (Backend)

**Focus**: Implement the backend logic for managing accounts and transactions.

**Steps**
1.  **Implement User Routes**:
    *   `GET /users/me`: Get the profile of the currently logged-in user.
    *   `PUT /users/me`: Allow a user to update their own information (e.g., name, email).
2.  **Implement Account Routes**:
    *   `GET /accounts`: Get all accounts for the logged-in user.
    *   `POST /accounts`: Create a new checking or savings account.
    *   `DELETE /accounts/:id`: Delete one of the user's own accounts.
3.  **Implement Transaction Routes**:
    *   `POST /transactions/deposit`
    *   `POST /transactions/withdraw`
    *   `POST /transactions/transfer`
4.  **Apply Authentication Middleware**: Protect all routes from this phase.

**Relevant files**
*   `backend/src/routes/users.ts`
*   `backend/src/routes/accounts.ts`
*   `backend/src/routes/transactions.ts`

---

### Phase 3: Frontend Implementation (User)

**Focus**: Build the React user interface for account holders.

**Steps**
1.  **Set Up Routing**: Use `react-router-dom` for Dashboard, Profile, and Account Details pages.
2.  **Integrate Asgardeo**: Implement the frontend logic to initiate the Asgardeo login flow and handle redirects.
3.  **Create Dashboard Page**: Display a summary of the user's accounts and balances.
4.  **Create Profile Page**: Build a form for users to view and update their profile information (`PUT /users/me`).
5.  **Create Account Management Components**:
    *   Build forms for creating accounts, depositing, withdrawing, and transferring funds.
    *   Display transaction history for an account.
6.  **Connect Frontend to Backend**: Use a library like `axios` to make authenticated API calls.

**Relevant files**
*   `frontend/src/pages/Dashboard.tsx`
*   `frontend/src/pages/Profile.tsx`
*   `frontend/src/services/api.ts` (Centralized API calls)

---

### Phase 4: Admin Functionality

**Focus**: Add features for the admin role.

**Steps**
1.  **Create Admin Middleware (Backend)**: Enhance the auth middleware to check for the 'admin' role from the Asgardeo token.
2.  **Implement Admin Routes (Backend)**:
    *   `GET /admin/users`: Get a list of all users.
    *   `DELETE /admin/users/:id`: Delete a user.
    *   `GET /admin/accounts`: Get a list of all accounts in the system.
    *   `PUT /admin/accounts/:id`: Allow an admin to update account information.
3.  **Create Admin Dashboard (Frontend)**: Create a separate section of the UI accessible only to admin users.
4.  **Implement Admin Features (Frontend)**: Display lists of users and accounts with options for management.

**Relevant files**
*   `backend/src/routes/admin.ts`
*   `frontend/src/pages/AdminDashboard.tsx`

---

### Phase 5: Finalization & Deployment

**Focus**: Polish and deploy the application.

**Steps**
1.  **Refine UI/UX**: Clean up the interface and improve error handling.
2.  **Final Testing**: Conduct end-to-end testing.
3.  **Prepare for Deployment**:
    *   Create a production build of the React frontend.
    *   Configure the Express server to serve the frontend's static files.
4.  **Deploy**:
    *   Push code to your GitHub repository.
    *   Deploy the backend to Render, connecting it to your GitHub repo and configuring it to use the Neon database.