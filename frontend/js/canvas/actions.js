import { canvas, ctx, setCanvasBackground } from "./canvas.js";
import { clearDrawingHistory } from "./drawing.js";

const clearCanvasBtn = document.querySelector(".clear-canvas");
const saveImgBtn = document.querySelector(".save-img");

if (clearCanvasBtn) {
    clearCanvasBtn.addEventListener("click", () => {
        clearDrawingHistory();
        setCanvasBackground();
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