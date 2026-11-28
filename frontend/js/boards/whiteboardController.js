import {
    getBoard,
    getSharedBoard,
    saveDrawingData
} from "../api/boardApi.js";

import { resizeCanvas } from "../canvas/canvas.js";

import {
    loadDrawingHistory,
    setDrawingSaveCallback,
    setCurrentBoardIdCallback,
    setCanEdit
} from "../canvas/drawing.js";

import socket from "../socket.js";

const params = new URLSearchParams(window.location.search);

const boardId = params.get("boardId");
const shareToken = params.get("shareToken");
let hasJoinedBoard = false;
let activeBoardId = null;
let activeShareToken = null;

function requestBoardAccess(boardId, shareToken = null) {
    return new Promise((resolve, reject) => {
        let connectHandler;

        const timeout = setTimeout(() => {
            cleanup();
            reject(new Error("Board access request timed out."));
        }, 10000);

        function cleanup() {
            clearTimeout(timeout);

            socket.off("board-access-granted", handleGranted);
            socket.off("board-access-denied", handleDenied);

            if (connectHandler) {
                socket.off("connect", connectHandler);
            }
        }

        function handleGranted(data) {
            if (Number(data.boardId) !== Number(boardId)) return;

            cleanup();
            resolve(data);
        }

        function handleDenied(data) {
            cleanup();
            reject(new Error(data.message || "Board access denied."));
        }

        function emitJoinRequest() {
            if (connectHandler) {
                socket.off("connect", connectHandler);
                connectHandler = null;
            }

            socket.emit("join-board", { boardId, shareToken });
        }

        socket.on("board-access-granted", handleGranted);
        socket.on("board-access-denied", handleDenied);

        if (socket.connected) {
            emitJoinRequest();
        } else {
            connectHandler = emitJoinRequest;
            socket.once("connect", connectHandler);
        }
    });
}

socket.on("connect", async () => {
    if (!hasJoinedBoard || !activeBoardId) return;

    try {
        const access = await requestBoardAccess(
            activeBoardId,
            activeShareToken
        );

        setCanEdit(access.permission);

        console.log("Successfully rejoined board:", activeBoardId);

    } catch (error) {
        console.error("Failed to rejoin board:", error.message);
    }
});

async function openBoard() {
    try {
        if (!boardId && !shareToken) {
            throw new Error("No board selected.");
        }

        // Fetch the board details.
        const board = shareToken
            ? await getSharedBoard(shareToken)
            : await getBoard(boardId);

        const id = board.id ?? board.board_id;

        // Ask the backend for permission.
        const access = await requestBoardAccess(id, shareToken);
        activeBoardId = id;
        activeShareToken = shareToken;
        hasJoinedBoard = true;

        // Store the active board ID for drawing operations.
        setCurrentBoardIdCallback(() => id);

        // Apply the user's editing permission.
        setCanEdit(access.permission);
        if (access.permission === "VIEW") {
            alert("You have view-only permission for this board. Editing is disabled.");
        }

        // Initialize the canvas and load saved drawings.
        resizeCanvas();
        loadDrawingHistory(board.drawing_data);

        // Save drawing changes to the database.
        setDrawingSaveCallback(async (history) => {
            await saveDrawingData(
                id,
                board.board_name,
                history,
                shareToken
            );
        });

    } catch (error) {
        console.error("Unable to open board:", error);
        alert(error.message || "Unable to open this board.");
        window.location.href = "/board-management.html";
    }
}

const backToBoardsBtn = document.getElementById("back-to-boards-btn");

if (backToBoardsBtn) {
    backToBoardsBtn.addEventListener("click", () => {
        window.location.href = "/board-management.html";
    });
}

window.addEventListener("user-logged-in", () => {
    openBoard();
});