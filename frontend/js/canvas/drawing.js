// drawing.js

import { canvas, ctx } from "./canvas.js";
import { setCanvasBackground } from "./canvas.js";

let prevMouseX;
let prevMouseY;
let snapshot;
let isDrawing = false;
let currentOperation = null;

export let brushWidth = 5;
export let selectedColor = "#000";
export let selectedTool = "brush";

let fillcolor = document.querySelector("#fill-color");

export function setBrushWidth(width) {
    brushWidth = Number(width);
}

export function setSelectedColor(color) {
    selectedColor = color;
}

export function setSelectedTool(tool) {
    selectedTool = tool;
}

function drawRect(e) {
    if (!fillcolor.checked) {
        return ctx.strokeRect(
            e.offsetX,
            e.offsetY,
            prevMouseX - e.offsetX,
            prevMouseY - e.offsetY
        );
    }

    ctx.fillRect(
        e.offsetX,
        e.offsetY,
        prevMouseX - e.offsetX,
        prevMouseY - e.offsetY
    );
}

function drawCircle(e) {
    ctx.beginPath();

    const radius = Math.sqrt(
        Math.pow(prevMouseX - e.offsetX, 2) +
        Math.pow(prevMouseY - e.offsetY, 2)
    );

    ctx.arc(prevMouseX, prevMouseY, radius, 0, 2 * Math.PI);

    fillcolor.checked ? ctx.fill() : ctx.stroke();
}

function drawTriangle(e) {
    ctx.beginPath();
    ctx.moveTo(prevMouseX, prevMouseY);
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.lineTo(prevMouseX * 2 - e.offsetX, e.offsetY);
    ctx.closePath();

    fillcolor.checked ? ctx.fill() : ctx.stroke();
}

function storeCoordinates(e) {
    currentOperation.points.push({
        x: e.offsetX,
        y: e.offsetY
    });
}

function startDraw(e) {
    isDrawing = true;

        currentOperation = {
        type: selectedTool,
        color: selectedColor,
        brushSize: brushWidth,
        startX: e.offsetX,
        startY: e.offsetY,
        points: [],
        filled: fillcolor.checked
    };

    storeCoordinates(e);
    prevMouseX = e.offsetX;
    prevMouseY = e.offsetY;

    ctx.beginPath();
    ctx.lineWidth = brushWidth;
    ctx.strokeStyle = selectedColor;
    ctx.fillStyle = selectedColor;

    snapshot = ctx.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
    );
}

function drawing(e) {
    if (!isDrawing) return;

    if (selectedTool === "brush" || selectedTool === "eraser") {
        storeCoordinates(e);
    }
    ctx.putImageData(snapshot, 0, 0);

    if (selectedTool === "brush" || selectedTool === "eraser") {
        ctx.strokeStyle = selectedTool === "eraser"
            ? "#fff"
            : selectedColor;

        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
    } else if (selectedTool === "rectangle") {
        drawRect(e);
    } else if (selectedTool === "circle") {
        drawCircle(e);
    } else {
        drawTriangle(e);
    }
}

canvas.addEventListener("mousedown", startDraw);
canvas.addEventListener("mousemove", drawing);

canvas.addEventListener("mouseup", (e) => {
     if (!currentOperation) return;

    currentOperation.endX = e.offsetX;
    currentOperation.endY = e.offsetY;
    isDrawing = false;

    console.log(currentOperation);
});

canvas.addEventListener("mouseleave", () => {
    isDrawing = false;
});

