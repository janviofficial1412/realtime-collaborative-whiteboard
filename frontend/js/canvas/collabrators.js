import socket from "../socket.js";

const cursorContainer = document.querySelector(".collaborator-cursors");

const collaboratorCursors = new Map();

socket.on("cursor-update", (cursorData) => {
    let cursor = collaboratorCursors.get(cursorData.userId);

    if (!cursor) {
        cursor = document.createElement("div");
        cursor.classList.add("collaborator-cursor");

        cursorContainer.appendChild(cursor);
        collaboratorCursors.set(cursorData.userId, cursor);
    }

    cursor.style.left = `${cursorData.x}px`;
    cursor.style.top = `${cursorData.y}px`;

    cursor.style.display = "block";
});

socket.on("cursor-hide", ({ userId }) => {
    const cursor = collaboratorCursors.get(userId);

    if (cursor) {
        cursor.style.display = "none";
    }
});

socket.on("collaborator-disconnected", ({ userId }) => {
    const cursor = collaboratorCursors.get(userId);

    if (cursor) {
        cursor.remove();
        collaboratorCursors.delete(userId);
    }
});