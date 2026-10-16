# Real-Time Collaborative Whiteboard

A browser-based whiteboard application built with **HTML, CSS, JavaScript, and HTML5 Canvas**.

This project is being developed progressively into a **real-time collaborative whiteboard**. Phase 1 focuses on building the core canvas-based drawing experience that will serve as the foundation for future real-time collaboration.

## 🚀 Phase 1 — Canvas Whiteboard

### Features

* Freehand drawing using the mouse
* Multiple drawing colors
* Adjustable brush size
* Eraser tool
* Basic drawing shapes
* Fill color support
* Clear canvas functionality
* Save drawing as an image
* Interactive drawing toolbar
* Desktop-focused drawing interface

## 🛠️ Technologies Used

* **HTML5** — Structure
* **CSS3** — Styling and layout
* **JavaScript** — Application logic and interactions
* **HTML5 Canvas API** — Drawing and rendering

## 📂 Project Structure
```text
realtime-collaborative-whiteboard/
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
│   ├── server.js
│   ├── db.js
│   ├── database/
│   │   └── schema.sql
│   ├── package.json
│   └── package-lock.json
│
├── .gitignore
└── README.md
```


## ▶️ How to Run

No installation or dependencies are required.

Clone the repository:

```bash
git clone https://github.com/janviofficial1412/realtime-collaborative-whiteboard.git
```

Then open `index.html` in a modern desktop web browser.

## 🗺️ Project Roadmap

This project will be developed in multiple phases:

* [x] Phase 1 — Canvas-based drawing application
* [x] Phase 2 — Node.js + Express backend
* [x] Phase 3 — PostgreSQL integration
* [ ] Phase 4 — Real-time collaboration with Socket.IO
* [ ] Phase 5 — Authentication, rooms and permissions
* [ ] Phase 6 — Responsive design, deployment and production improvements

> **Current Status:** Phase 1 completed. Backend APIs and PostgreSQL integration implemented; development and testing are ongoing.
