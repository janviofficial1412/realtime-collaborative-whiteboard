export const canvas = document.querySelector("canvas");

export const ctx = canvas.getContext("2d");

export function setCanvasBackground() {
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = selectedColor;
}