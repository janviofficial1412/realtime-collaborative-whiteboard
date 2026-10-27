const http = require("http");
const { Server } = require("socket.io");

const express = require("express");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const boardRoutes = require("./boardRoutes");

app.use(express.json());
app.use("/api/boards", boardRoutes);

app.use(express.static(path.join(__dirname, "..","frontend")));


io.on("connection", (socket) => {
    socket.on("test-message", (message) => {
        console.log("Message from frontend:", message);
    });
    console.log("A user connected:", socket.id);

    socket.on("join-board", (boardId) => {
        const roomName = `board-${boardId}`;

        socket.join(roomName);

        console.log(`${socket.id} joined ${roomName}`);
    });

    socket.on("drawing-operation", (operation) => {
        const roomName = `board-${operation.boardId}`;

        socket.to(roomName).emit("drawing-operation", operation);

        console.log("Drawing operation broadcast to:", roomName);
    });

    socket.on("clear-board", ({ boardId }) => {
        const roomName = `board-${boardId}`;

        console.log("Clear request received for board:", boardId);
        console.log("Broadcasting clear event to room:", roomName);

        socket.to(roomName).emit("clear-board");
    });

    socket.on("drawing-preview", (operation) => {
        const roomName = `board-${operation.boardId}`;

        socket.to(roomName).emit("drawing-preview", operation);
    });

    socket.on("cursor-move", (cursorData) => {
        const roomName = `board-${cursorData.boardId}`;

        socket.to(roomName).emit("cursor-update", {
            userId: socket.id,
            x: cursorData.x,
            y: cursorData.y
        });
    });

    socket.on("cursor-leave", ({ boardId }) => {
        const roomName = `board-${boardId}`;

        socket.to(roomName).emit("cursor-hide", {
            userId: socket.id
        });
    });

    socket.on("disconnect", () => {
        console.log("A user disconnected:", socket.id);

        for (const roomName of socket.rooms) {
            if (roomName.startsWith("board-")) {
                socket.to(roomName).emit("collaborator-disconnected", {
                    userId: socket.id
                });
            }
        }
    });
});

server.listen(3000, () => {
    console.log("App listening at http://localhost:3000");
});


