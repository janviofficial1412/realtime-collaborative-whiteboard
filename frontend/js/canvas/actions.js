import { canvas, ctx, setCanvasBackground } from "./canvas.js";

const clearCanvasBtn = document.querySelector(".clear-canvas");
const saveImgBtn = document.querySelector(".save-img");

if (clearCanvasBtn) {
    clearCanvasBtn.addEventListener("click", () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

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