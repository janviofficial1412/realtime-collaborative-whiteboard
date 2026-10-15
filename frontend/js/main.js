import { canvas, setCanvasBackground } from "./canvas/canvas.js";
import "./canvas/drawing.js";
import "./canvas/tools.js";
import "./boards/boardManager.js";

window.addEventListener("load", () => {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    setCanvasBackground();
});