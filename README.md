# Real-Time Collaborative Whiteboard

A browser-based collaborative whiteboard application built using **HTML, CSS, JavaScript, Node.js, Express.js, PostgreSQL, and Socket.IO**.

The application allows users to create and manage boards, draw using an interactive canvas, and collaborate in real time. It is progressively being developed with a focus on secure authentication, board access management, and reliable real-time communication.

## 🚀 Features

### 1. Interactive Whiteboard

* Freehand drawing using HTML5 Canvas.
* Multiple drawing colors.
* Adjustable brush size.
* Eraser tool.
* Basic drawing shapes.
* Fill color support.
* Clear canvas functionality.
* Save drawings as images.
* Interactive drawing toolbar.

### 2. Backend and Database

* RESTful APIs using Node.js and Express.js.
* PostgreSQL database integration.
* Create, retrieve, update, and delete boards.
* Persistent drawing data using PostgreSQL JSONB.
* Modular backend architecture using routes and controllers.

### 3. Real-Time Collaboration

* Real-time drawing synchronization using Socket.IO.
* Board-based communication rooms.
* Live drawing previews.
* Real-time cursor movement.
* Collaborator connection and disconnection events.
* Synchronized canvas clearing.

### 4. User Authentication — In Progress

* User registration.
* Password hashing using bcrypt.
* Input validation.
* Duplicate email prevention.
* JWT-based authentication and refresh-token management planned.

## 🛠️ Technologies Used

| Technology            | Purpose                      |
| --------------------- | ---------------------------- |
| HTML5                 | Application structure        |
| CSS3                  | Styling and layout           |
| JavaScript            | Frontend logic               |
| HTML5 Canvas API      | Drawing and rendering        |
| Node.js               | Backend runtime              |
| Express.js            | REST API development         |
| PostgreSQL            | Relational database          |
| Socket.IO             | Real-time communication      |
| bcrypt                | Password hashing             |
| JSON Web Tokens (JWT) | Authentication (in progress) |

## 📂 Project Structure

```text
realtime-collaborative-whiteboard/
│
├── frontend/
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── main.js
│       ├── api/
│       │   └── boardApi.js
│       ├── boards/
│       │   └── boardManager.js
│       └── canvas/
│           ├── canvas.js
│           ├── drawing.js
│           ├── tools.js
│           └── actions.js
│
├── backend/
│   ├── controllers/
│   │   └── userController.js
│   ├── routes/
│   │   └── userRoutes.js
│   ├── database/
│   │   ├── migrations/
│   │   │   └── 001_create_users.sql
│   │   └── schema.sql
│   ├── server.js
│   ├── db.js
│   ├── package.json
│   └── package-lock.json
│
├── .gitignore
└── README.md
```

*The structure above highlights the main project files; additional files may exist.*

## ⚙️ Setup and Installation

### Prerequisites

* Node.js
* PostgreSQL
* npm
* Git

### 1. Clone the Repository

```bash
git clone https://github.com/janviofficial1412/realtime-collaborative-whiteboard.git
```

```bash
cd realtime-collaborative-whiteboard
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Configure Environment Variables

Create a `.env` file inside the backend directory:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=whiteboard_db
DB_USER=your_postgres_username
DB_PASSWORD=your_postgres_password
```

Use your own PostgreSQL credentials. Never commit the `.env` file.

### 4. Set Up the Database

Create a PostgreSQL database named:

```sql
CREATE DATABASE whiteboard_db;
```

Run the required SQL schema and migrations against this database.

### 5. Start the Backend

From the backend directory, run the development command configured in `package.json`.

The application is served at:

```text
http://localhost:3000
```

## 🗺️ Development Roadmap

* [x] Phase 1 — Canvas-based drawing application
* [x] Phase 2 — Node.js and Express.js backend
* [x] Phase 3 — PostgreSQL integration and board CRUD APIs
* [x] Phase 4 — Real-time collaboration using Socket.IO
* [x] Phase 5A — User registration and password hashing
* [ ] Phase 5B — Login and JWT authentication
* [ ] Phase 5C — Access-token and refresh-token management
* [ ] Phase 5D — Protected boards, ownership and permissions
* [ ] Phase 5E — Secure Socket.IO authentication and authorization
* [ ] Phase 5F — Board invitations and collaborator management
* [ ] Phase 6 — Frontend authentication integration
* [ ] Phase 7 — Responsive design, deployment and production improvements

## 📌 Current Project Status

The core canvas drawing functionality, backend REST APIs, PostgreSQL integration, and Socket.IO-based real-time collaboration have been implemented.

User registration with password hashing and validation has also been implemented and tested using Postman.

**Current Focus:** Building secure user authentication, private board access, and authorized real-time collaboration.

---

**Developed as a progressive full-stack project to explore real-time web applications, backend development, database management, and secure authentication.**

