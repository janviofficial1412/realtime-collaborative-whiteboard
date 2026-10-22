import { canvas, ctx, setCanvasBackground } from "./canvas.js";
import {
    clearDrawingHistory,
    getActiveBoardId
} from "./drawing.js";
import socket from "../socket.js";

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
    saveImgBtn.addEventListener("click", () => {
        const link = document.createElement("a");

        link.download = `${Date.now()}.jpg`;
        link.href = canvas.toDataURL();

        link.click();
    });
}