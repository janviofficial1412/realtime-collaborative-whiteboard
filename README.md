# Real-Time Collaborative Whiteboard

A full-stack web application that allows users to create whiteboards, draw together in real time, and share boards with controlled access permissions.

<p align="center">
  <a href="https://realtime-collaborative-whiteboard-f-five.vercel.app/">
    <strong>🚀 Open the Live Application</strong>
  </a>
</p>

> **Best experienced on a laptop or desktop.** The whiteboard is designed primarily for larger screens and mouse-based drawing. Mobile is not the intended device for the full drawing experience.

---

## Overview

This project began as a simple JavaScript Paint application. While building it, I explored a question: what if multiple users could draw on the same canvas at the same time?

That idea grew into a full-stack collaborative whiteboard with real-time synchronization, persistent storage, authentication, and permission-based sharing.

## Features

### 🎨 Interactive Whiteboard
- Freehand drawing with adjustable brush size and color.
- Eraser and fill-color tools.
- Rectangle, circle, triangle, and arrow tools.
- Text boxes with editing, dragging, and resizing.
- Clear canvas with confirmation.
- Export the board as an image.
- Restore saved drawing content when reopening a board.

### 📋 Board Management
- Create and manage multiple whiteboards.
- Rename and delete boards.
- Persist board content in PostgreSQL.
- Restrict board-management actions to the board owner.

### 🤝 Real-Time Collaboration
- Synchronize drawing operations using Socket.IO.
- Show live drawing previews.
- Display collaborators' live cursors and identifying labels.
- Synchronize text creation, editing, movement, resizing, and deletion.
- Synchronize canvas-clearing actions.
- Load existing board content for collaborators who join an active board.

### 🔗 Sharing and Permissions
- Generate unique links for individual boards.
- **VIEW permission:** collaborators can view the board and receive live updates, but cannot edit.
- **EDIT permission:** collaborators can draw and modify board content.
- Revoke sharing links.
- Apply permission checks to protected REST API and Socket.IO operations.
- Switch connected collaborators to read-only access when their share link is revoked.

### 🔐 Authentication and Security
- User registration and login.
- Password hashing with bcrypt.
- Input validation and duplicate-email prevention.
- JWT-based access-token authentication.
- Refresh-token rotation and revocation.
- Hashed refresh-token storage and reuse detection.
- Protected backend routes and authenticated Socket.IO connections.

## 🚀 Try the Application

**Live application:**  
https://realtime-collaborative-whiteboard-f-five.vercel.app/

For the intended experience, open the application on a **laptop or desktop**. A larger screen and mouse make drawing and using the whiteboard tools more comfortable.

## Technology Stack

| Technology | Purpose |
|---|---|
| HTML5 | Frontend structure |
| CSS3 | Styling and layout |
| JavaScript | Frontend application logic |
| HTML5 Canvas API | Drawing and rendering |
| Node.js | Backend runtime |
| Express.js | REST API and server |
| PostgreSQL | Persistent relational storage |
| JSONB | Storing board drawing data |
| Socket.IO | Real-time collaboration |
| bcrypt | Password hashing |
| JSON Web Tokens (JWT) | Access-token authentication |
| Refresh tokens | Session renewal and revocation |
| Vercel | Frontend deployment |
| Render | Backend deployment |
| Neon | Hosted PostgreSQL database |

## Architecture

The application follows a client-server architecture:

1. **Frontend:** HTML, CSS, and JavaScript provide the user interface and canvas tools. The frontend communicates with the backend through REST APIs and Socket.IO.
2. **Backend:** Node.js and Express.js handle authentication, board management, authorization, and API requests. Socket.IO manages real-time collaboration.
3. **Database:** PostgreSQL stores users, boards, authentication records, sharing records, and persistent drawing data. Drawing content is stored using JSONB.

### Deployment

| Component | Platform |
|---|---|
| Frontend | Vercel |
| Backend and Socket.IO server | Render |
| PostgreSQL database | Neon |

## Run Locally

### Prerequisites
- Node.js and npm
- PostgreSQL
- Git

### 1. Clone the repository

```bash
git clone https://github.com/janviofficial1412/realtime-collaborative-whiteboard.git
cd realtime-collaborative-whiteboard
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Configure environment variables

Create a `.env` file in the `backend` directory. Configure the database connection, authentication secrets, frontend origin, and any other variables required by the backend.

Example database settings:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=whiteboard_db
DB_USER=your_postgres_username
DB_PASSWORD=your_postgres_password
```

Use the exact environment-variable names expected by the backend configuration. Never commit your `.env` file, database credentials, token secrets, or other sensitive values.

### 4. Create the database

Create a PostgreSQL database named `whiteboard_db` (or use the database name configured in your environment):

```sql
CREATE DATABASE whiteboard_db;
```

Apply the database migration files included in the backend project in their intended order and ensure the backend is configured to connect to this database.

### 5. Start the backend

From the `backend` directory, run the start script defined in `package.json`:

```bash
npm start
```

### 6. Open the frontend

Open the frontend entry page using a local development server. Configure the frontend API and Socket.IO connection settings to point to your local backend.

The local backend is configured to run at:

```text
http://localhost:3000
```

## Access Permission Matrix

| Action | Board Owner | EDIT Collaborator | VIEW Collaborator |
|---|:---:|:---:|:---:|
| View board | Yes | Yes | Yes |
| Receive real-time updates | Yes | Yes | Yes |
| Draw on canvas | Yes | Yes | No |
| Create or edit text | Yes | Yes | No |
| Move or resize text | Yes | Yes | No |
| Clear canvas | Yes | Yes | No |
| Rename board | Yes | No | No |
| Delete board | Yes | No | No |
| Manage sharing links | Yes | No | No |

Permission-sensitive operations are checked on the backend; disabling frontend controls is not the only access-control mechanism.

## Project Structure

The repository is organized into separate frontend and backend applications.

```text
realtime-collaborative-whiteboard/
├── frontend/
│   ├── index.html
│   ├── board-management.html
│   ├── whiteboard.html
│   ├── css/
│   └── js/
├── backend/
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   ├── database/
│   │   └── migrations/
│   ├── server.js
│   ├── db.js
│   └── package.json
├── .gitignore
└── README.md
```

This is a high-level overview; additional modules and files are present in the repository.

## Key Engineering Challenges

### 1. Real-Time Synchronization and Data Persistence

Drawing operations need to appear immediately for collaborators and remain available after a board is reopened. Socket.IO handles live synchronization, while PostgreSQL stores the board's drawing data. This required coordinating real-time events with persistent state.

### 2. Permission-Based Sharing and Access Revocation

Sharing a board requires more than generating a URL. The backend must distinguish between viewers and editors, validate protected operations, and handle access changes while a collaborator is connected. The application supports VIEW and EDIT permissions and real-time revocation of active sharing access.

## What I Learned

Building this project gave me practical experience with:

- Structuring and developing a full-stack application.
- Designing and integrating REST APIs.
- Working with PostgreSQL and persistent JSONB data.
- Implementing authentication and refresh-token flows.
- Applying backend authorization and permission checks.
- Building real-time features with Socket.IO.
- Debugging frontend, backend, and database integration issues.
- Deploying a full-stack application.

## Author

**Janvi Desai**

- GitHub: https://github.com/janviofficial1412
- Project repository: https://github.com/janviofficial1412/realtime-collaborative-whiteboard

---

If you try the project, open the live application on a laptop or desktop for the best drawing experience.
