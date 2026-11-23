const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const pool = require("./db");
const crypto = require("crypto");

const express = require("express");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
        return next(new Error("Access token is required."));
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.ACCESS_TOKEN_SECRET
        );

        if (!decoded.userId) {
            return next(new Error("Invalid access token."));
        }

        socket.userId = decoded.userId;

        next();

    } catch (error) {
        next(new Error("Invalid or expired access token."));
    }
});

const cookieParser = require("cookie-parser");

const boardRoutes = require("./boardRoutes");
const userRoutes = require("./routes/userRoutes");

app.use(express.json());
app.use(cookieParser());

app.use("/api/boards", boardRoutes);
app.use("/api/users", userRoutes);

app.use(express.static(path.join(__dirname, "..", "frontend")));
app.get("/share/:token", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "frontend", "index.html"));
});


io.on("connection", (socket) => {
    socket.on("test-message", (message) => {
        console.log("Message from frontend:", message);
    });
    console.log("A user connected:", socket.id);

    const accessCheckInterval = setInterval(async () => {
        const access = socket.data.boardAccess;

        // Owners don't depend on sharing links.
        if (!access || !access.shareId) {
            return;
        }

        try {
            const result = await pool.query(
                `SELECT id
             FROM board_share_links
             WHERE id = $1
             AND board_id = $2
             AND revoked_at IS NULL
             AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)`,
                [access.shareId, access.boardId]
            );

            // Sharing link is revoked, expired, or deleted.
            if (result.rows.length === 0) {
                socket.leave(`board-${access.boardId}`);

                socket.emit("board-access-revoked", {
                    message: "Your access to this board has been revoked."
                });

                delete socket.data.boardAccess;
            }

        } catch (error) {
            console.error("Access validation error:", error);
        }
    }, 5000);

    socket.on("join-board", async ({ boardId, shareToken } = {}) => {
        const previousAccess = socket.data.boardAccess;

        if (previousAccess) {
            socket.leave(`board-${previousAccess.boardId}`);
            delete socket.data.boardAccess;
        }
        try {
            if (!Number.isInteger(Number(boardId)) || Number(boardId) < 1) {
                return socket.emit("board-access-denied", {
                    message: "Invalid board ID."
                });
            }

            boardId = Number(boardId);

            const ownerResult = await pool.query(
                `SELECT id
             FROM boards
             WHERE id = $1 AND owner_id = $2`,
                [boardId, socket.userId]
            );

            let permission;
            let shareId = null;

            if (ownerResult.rows.length > 0) {
                permission = "EDIT";
            } else {
                if (!shareToken || !/^[a-f0-9]{64}$/i.test(shareToken)) {
                    return socket.emit("board-access-denied", {
                        message: "You do not have access to this board."
                    });
                }

                const tokenHash = crypto
                    .createHash("sha256")
                    .update(shareToken)
                    .digest("hex");

                const shareResult = await pool.query(
                    `SELECT id, permission
                 FROM board_share_links
                 WHERE board_id = $1
                 AND token_hash = $2
                 AND revoked_at IS NULL
                 AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)`,
                    [boardId, tokenHash]
                );

                if (shareResult.rows.length === 0) {
                    return socket.emit("board-access-denied", {
                        message: "Sharing link is invalid, expired, or revoked."
                    });
                }

                permission = shareResult.rows[0].permission;
                shareId = shareResult.rows[0].id;
            }

            const userResult = await pool.query(
                "SELECT username FROM users WHERE id = $1",
                [socket.userId]
            );

            socket.data.username = userResult.rows[0].username;

            socket.data.boardAccess = {
                boardId,
                permission,
                shareId
            };

            const roomName = `board-${boardId}`;

            socket.join(roomName);

            socket.emit("board-access-granted", {
                boardId,
                permission
            });

            console.log(
                `${socket.userId} joined ${roomName} with ${permission} permission`
            );

        } catch (error) {
            console.error("Board access error:", error);

            socket.emit("board-access-denied", {
                message: "Unable to access board."
            });
        }
    });

    socket.on("drawing-operation", (operation) => {
        const access = socket.data.boardAccess;

        if (!access || Number(operation?.boardId) !== access.boardId) {
            return socket.emit("board-access-denied", {
                message: "You are not authorized for this board."
            });
        }

        if (access.permission !== "EDIT") {
            return socket.emit("permission-denied", {
                message: "You have VIEW-only access."
            });
        }

        const roomName = `board-${access.boardId}`;

        socket.to(roomName).emit("drawing-operation", operation);
    });

    socket.on("clear-board", ({ boardId } = {}) => {
        const access = socket.data.boardAccess;

        // Check whether the user has joined this board.
        if (!access || Number(boardId) !== access.boardId) {
            return socket.emit("board-access-denied", {
                message: "You are not authorized for this board."
            });
        }

        // Only EDIT users can clear the board.
        if (access.permission !== "EDIT") {
            return socket.emit("permission-denied", {
                message: "You have VIEW-only access."
            });
        }

        const roomName = `board-${access.boardId}`;

        socket.to(roomName).emit("clear-board");
    });

    socket.on("drawing-preview", (operation) => {
        const access = socket.data.boardAccess;

        // Verify board access.
        if (!access || Number(operation?.boardId) !== access.boardId) {
            return socket.emit("board-access-denied", {
                message: "You are not authorized for this board."
            });
        }

        // Only EDIT users can send drawing previews.
        if (access.permission !== "EDIT") {
            return socket.emit("permission-denied", {
                message: "You have VIEW-only access."
            });
        }

        const roomName = `board-${access.boardId}`;

        socket.to(roomName).emit("drawing-preview", operation);
    });

    socket.on("cursor-move", async (cursorData) => {
        console.log("Cursor event sender:", {
            socketId: socket.id,
            userId: socket.userId,
            username: socket.data.username
        });
        const access = socket.data.boardAccess;

        // Verify board access.
        if (!access || Number(cursorData?.boardId) !== access.boardId) {
            return socket.emit("board-access-denied", {
                message: "You are not authorized for this board."
            });
        }

        const roomName = `board-${access.boardId}`;

        console.log("Cursor broadcast:", {
            senderSocket: socket.id,
            senderUser: socket.userId,
            boardAccess: socket.data.boardAccess,
            roomName,
            roomMembers: await io.in(roomName).fetchSockets().then(
                sockets => sockets.map(s => ({
                    socketId: s.id,
                    userId: s.userId
                }))
            )
        });

        socket.to(roomName).emit("cursor-update", {
            userId: socket.userId,
            username: socket.data.username,
            x: cursorData.x,
            y: cursorData.y
        });
    });

    socket.on("cursor-leave", ({ boardId } = {}) => {
        const access = socket.data.boardAccess;

        // Verify board access.
        if (!access || Number(boardId) !== access.boardId) {
            return socket.emit("board-access-denied", {
                message: "You are not authorized for this board."
            });
        }

        const roomName = `board-${access.boardId}`;

        socket.to(roomName).emit("cursor-hide", {
            userId: socket.userId
        });
    });

    socket.on("disconnect", () => {
        console.log("A user disconnected:", socket.id);
        clearInterval(accessCheckInterval);

        for (const roomName of socket.rooms) {
            if (roomName.startsWith("board-")) {
                socket.to(roomName).emit("collaborator-disconnected", {
                    userId: socket.userId
                });
            }
        }
    });
});

server.listen(3000, () => {
    console.log("App listening at http://localhost:3000");
});


