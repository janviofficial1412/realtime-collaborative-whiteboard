import { canvas, ctx, setCanvasBackground } from "./canvas.js";
import {
    clearDrawingHistory,
    getActiveBoardId
} from "./drawing.js";
import socket from "../socket.js";
import { toPng } from "https://cdn.jsdelivr.net/npm/html-to-image@1.11.13/+esm";

const clearCanvasBtn = document.querySelector(".clear-canvas");
const saveImgBtn = document.querySelector(".save-img");

if (clearCanvasBtn) {
clearCanvasBtn.addEventListener("click", () => {
const confirmed = confirm(
"Are you sure you want to clear the entire canvas? This will affect everyone on this board."
);
        if (!confirmed) return;

        clearDrawingHistory();
        setCanvasBackground();

        const boardId = getActiveBoardId();

        if (boardId !== null) {
            socket.emit("clear-board", { boardId });    
        }
    });

}


if (saveImgBtn) {
    saveImgBtn.addEventListener("click", async () => {
        const board = document.querySelector(".drawing-board");

        try {
            const image = await toPng(board, {
                cacheBust: true,
                pixelRatio: window.devicePixelRatio || 1,
                filter: (node) =>
                    !node.classList?.contains("collaborator-cursors") &&
                    !node.classList?.contains("text-box-handle")
            });

            const link = document.createElement("a");
            link.download = `${Date.now()}.png`;
            link.href = image;
            link.click();

        } catch (error) {
            console.error("Image export failed:", error);
            alert("Unable to export the whiteboard.");
        }
    });
}