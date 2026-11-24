# Real-Time Collaborative Whiteboard

A full-stack, browser-based collaborative whiteboard that enables users to create boards, draw, edit content, and collaborate with others in real time.

Built using **HTML5, CSS3, JavaScript, Node.js, Express.js, PostgreSQL, and Socket.IO**, the application combines interactive canvas-based drawing with secure authentication, persistent drawing history, and permission-controlled board sharing.

## 🚀 Features

### 1. Interactive Whiteboard

- Freehand drawing with customizable colors and brush sizes.
- Eraser functionality.
- Drawing tools for rectangles, circles, triangles, and arrows.
- Fill color support.
- Text boxes with editing, dragging, and resizing.
- Clear canvas functionality with confirmation.
- Save drawings as image files.
- Interactive drawing toolbar.
- Drawing history restoration when reopening a board.
- Persistent drawing operations stored in PostgreSQL.

### 2. User Authentication and Security

- User registration and login.
- Password hashing using bcrypt.
- Input validation and duplicate email prevention.
- JWT-based access-token authentication.
- Refresh-token management with token rotation.
- Secure refresh-token storage using hashing.
- Refresh-token reuse detection.
- Logout and refresh-token revocation.
- Protected backend API routes.
- Authenticated Socket.IO connections.

### 3. Board Management

- Create new boards.
- Retrieve and view existing boards.
- Rename boards.
- Delete boards.
- Board ownership management.
- Persistent board data using PostgreSQL JSONB.
- Protected board operations based on user permissions.

### 4. Real-Time Collaboration

- Real-time drawing synchronization using Socket.IO.
- Board-specific communication rooms.
- Live drawing previews.
- Real-time cursor tracking.
- Collaborator identification through cursor labels.
- Synchronized text creation, editing, movement, resizing, and deletion.
- Real-time canvas clearing.
- Collaborator connection and disconnection handling.
- Permission validation for collaborative operations.

### 5. Board Sharing and Access Management

- Generate unique sharing links for individual boards.
- Support for two permission levels:
  - **VIEW:** Allows collaborators to view the board and receive real-time updates without modifying its contents.
  - **EDIT:** Allows collaborators to draw, edit content, and clear the canvas.
- Login and registration required before accessing shared boards.
- Board owners retain full management permissions.
- Revoke active sharing links.
- Validate permissions for both REST API and Socket.IO operations.
- Share-link tokens are generated randomly and stored as hashes in the database.

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| HTML5 | Application structure |
| CSS3 | Styling and layout |
| JavaScript | Frontend application logic |
| HTML5 Canvas API | Drawing and rendering |
| Node.js | Backend runtime |
| Express.js | REST API development |
| PostgreSQL | Relational database |
| JSONB | Persistent drawing operations |
| Socket.IO | Real-time communication |
| bcrypt | Password hashing |
| JSON Web Tokens (JWT) | Access-token authentication |
| Refresh Tokens | Session renewal and management |

## 📂 Project Structure

```text
realtime-collaborative-whiteboard/
│
├── frontend/
│   ├── index.html
│   ├── css/
│   │   └── style.css
|   |   └──whiteboard.css
|   |   └──boardmanagement.css
│   └── js/
│       ├── main.js
│       ├── api/
│       │   └── boardApi.js
│       ├── boards/
│       │   └── boardManager.js
│       ├── canvas/
│       │   ├── canvas.js
│       │   ├── drawing.js
│       │   ├── textBox.js
│       │   ├── tools.js
│       │   └── actions.js
│       └── ...
│
├── backend/
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   ├── database/
│   │   ├── migrations/
│   │   └── schema.sql
│   ├── server.js
│   ├── db.js
│   ├── package.json
│   └── package-lock.json
│
├── .gitignore
└── README.md
```

*This is a representative structure. Additional modules and files may exist in the repository.*

## ⚙️ Setup and Installation

### Prerequisites

Install the following before running the application:

- [Node.js](https://nodejs.org/)
- [PostgreSQL](https://www.postgresql.org/)
- npm
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/janviofficial1412/realtime-collaborative-whiteboard.git
```

Navigate into the project directory:

```bash
cd realtime-collaborative-whiteboard
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Configure Environment Variables

Create a `.env` file inside the backend directory.

Configure your PostgreSQL connection details using the variable names expected by the backend configuration.

Example:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=whiteboard_db
DB_USER=your_postgres_username
DB_PASSWORD=your_postgres_password
```

Also configure the authentication secrets and other required environment variables according to the backend configuration.

**Never commit `.env` files, database credentials, JWT secrets, or other sensitive information to GitHub.**

### 4. Set Up PostgreSQL

Create a database named:

```sql
CREATE DATABASE whiteboard_db;
```

Run the database schema and migration SQL files in the required order.

Ensure that the required tables for users, boards, drawing data, refresh tokens, and sharing links are created.

### 5. Start the Backend

From the backend directory, run the start command configured in `package.json`.

For example:

```bash
npm start
```

If no start script is configured, run the server entry point directly:

```bash
node server.js
```

The application should be available at:

```text
http://localhost:3000
```

## 🔐 Access Permissions

The application uses permission-based board sharing.

| Operation | Owner | EDIT Collaborator | VIEW Collaborator |
|---|---|---|---|
| View board | Yes | Yes | Yes |
| Draw on canvas | Yes | Yes | No |
| Edit text | Yes | Yes | No |
| Move and resize text | Yes | Yes | No |
| Clear canvas | Yes | Yes | No |
| Receive real-time updates | Yes | Yes | Yes |
| Manage sharing links | Yes | No | No |
| Rename board | Yes | No | No |
| Delete board | Yes | No | No |

All protected operations are validated on the backend rather than relying exclusively on frontend restrictions.

## 🏗️ Architecture Overview

The application follows a client-server architecture.

**Frontend**
- Handles user interactions and canvas rendering.
- Communicates with backend REST APIs.
- Establishes authenticated Socket.IO connections.
- Updates the interface based on board permissions.

**Backend**
- Handles authentication and authorization.
- Provides REST APIs for board management.
- Validates board ownership and sharing permissions.
- Manages real-time collaboration through Socket.IO.
- Persists board and drawing data.

**Database**
- PostgreSQL stores user accounts, board information, authentication-related records, and sharing-link records.
- JSONB stores drawing operations for persistent canvas restoration.
- Refresh tokens and sharing tokens are stored securely as hashes.

## 🗺️ Project Development

- [x] Phase 1 — Interactive canvas-based drawing application.
- [x] Phase 2 — Node.js and Express.js backend.
- [x] Phase 3 — PostgreSQL integration and board CRUD APIs.
- [x] Phase 4 — Real-time collaboration using Socket.IO.
- [x] Phase 5 — User registration and login.
- [x] Phase 6 — Password hashing and input validation.
- [x] Phase 7 — JWT access-token authentication.
- [x] Phase 8 — Refresh-token rotation and revocation.
- [x] Phase 9 — Protected board access and ownership management.
- [x] Phase 10 — VIEW and EDIT collaborator permissions.
- [x] Phase 11 — Authenticated Socket.IO communication and authorization.
- [x] Phase 12 — Secure board-sharing links and revocation.
- [x] Phase 13 — Persistent drawing history.
- [x] Phase 14 — Real-time text editing, dragging, resizing, and deletion.
- [x] Phase 15 — Final integration and collaboration testing.

## 📌 Project Status

The core application functionality has been implemented, including:

- Interactive canvas-based drawing.
- Backend REST APIs and PostgreSQL integration.
- Persistent board and drawing data.
- Real-time multi-user collaboration.
- User authentication and refresh-token management.
- Protected board access and permission-based sharing.
- Secure sharing-link generation and revocation.
- Real-time synchronization of drawing and text operations.

The project demonstrates the integration of frontend development, backend engineering, relational database management, authentication, authorization, and real-time communication in a single full-stack application.

## 👩‍💻 Author

**Janvi Desai**

- GitHub: https://github.com/janviofficial1412

---

*Built to explore and implement full-stack development, secure authentication, database design, and real-time collaborative web applications.*
