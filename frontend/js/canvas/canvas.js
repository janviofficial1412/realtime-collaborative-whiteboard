export const canvas = document.querySelector("canvas");

export const ctx = canvas.getContext("2d");

export function setCanvasBackground() {
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

export function resizeCanvas() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    if (width === 0 || height === 0) {
        console.error("Canvas is not visible or has no dimensions.");
        return false;
    }

    canvas.width = width;
    canvas.height = height;

    setCanvasBackground();

    return true;
}