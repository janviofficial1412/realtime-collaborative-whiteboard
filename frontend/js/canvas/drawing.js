import { canvas, ctx } from "./canvas.js";
import socket from "../socket.js";

let prevMouseX;
let prevMouseY;
let snapshot;
let isDrawing = false;
let currentOperation = null;
export let drawingHistory = [];
let remotePreview = null;
let lastMouseX;
let lastMouseY;
let onDrawingComplete = null;
let getCurrentBoardId = null;

export function setCurrentBoardIdCallback(callback) {
    getCurrentBoardId = callback;
}

export function getActiveBoardId() {
    return getCurrentBoardId ? getCurrentBoardId() : null;
}

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

export function setDrawingSaveCallback(callback) {
    onDrawingComplete = callback;
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
    const lastPoint = currentOperation.points.at(-1);

    if (lastPoint?.x === e.offsetX && lastPoint?.y === e.offsetY) {
        return;
    }

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

    lastMouseX = e.offsetX;
    lastMouseY = e.offsetY;

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

    const boardId = getCurrentBoardId
    ? getCurrentBoardId()
    : null;

    if (boardId !== null) {
        socket.emit("drawing-preview", {
            ...currentOperation,
            endX: e.offsetX,
            endY: e.offsetY,
            boardId: boardId
        });
    }
}

canvas.addEventListener("mousedown", startDraw);
canvas.addEventListener("mousemove", drawing);

canvas.addEventListener("mouseup", (e) => {
    if (!currentOperation) return;

    currentOperation.endX = e.offsetX;
    currentOperation.endY = e.offsetY;
    isDrawing = false;

    if (selectedTool === "brush" || selectedTool === "eraser") {
        storeCoordinates(e);
    }

    drawingHistory.push(currentOperation);

    const boardId = getCurrentBoardId
    ? getCurrentBoardId()
    : null;

    if (boardId !== null) {
        socket.emit("drawing-operation", {
            ...currentOperation,
            boardId: boardId
        });
    }

    currentOperation = null;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawfromHistory();
    if (onDrawingComplete) {
        onDrawingComplete(drawingHistory);
    }
});

canvas.addEventListener("mouseleave", () => {
    if (currentOperation) {
        currentOperation.endX = lastMouseX;
        currentOperation.endY = lastMouseY;
        drawingHistory.push(currentOperation);
        console.log("Drawing history:", drawingHistory);
        currentOperation = null;
        if (onDrawingComplete) {
            onDrawingComplete(drawingHistory);
        }
    }

    isDrawing = false;
});

function drawOperation(operation){
    const points = operation.points;

        if (operation.type === "brush") {
            ctx.beginPath();
            ctx.lineWidth = operation.brushSize;
            ctx.strokeStyle = operation.color;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";

            if (points.length === 1) {
                ctx.arc( points[0].x, points[0].y, operation.brushSize / 2, 0, 2 * Math.PI ); 
                ctx.fill();
            }else{
                ctx.moveTo(points[0].x, points[0].y);

                for (let i = 1; i < points.length; i++) {
                    ctx.lineTo(points[i].x, points[i].y);
                }
                ctx.stroke();
            }
        } else if (operation.type === "eraser") {
            ctx.beginPath();
            ctx.lineWidth = operation.brushSize;
            ctx.strokeStyle = "#fff";
            ctx.lineCap = "round";
            ctx.lineJoin = "round";

            ctx.moveTo(points[0].x, points[0].y);

            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }

            ctx.stroke();
        } else if (operation.type === "rectangle") {
            ctx.beginPath();
            ctx.lineWidth = operation.brushSize;
            ctx.strokeStyle = operation.color;
            ctx.fillStyle = operation.color;

            const x = Math.min(operation.startX, operation.endX);
            const y = Math.min(operation.startY, operation.endY);
            const width = Math.abs(operation.endX - operation.startX);
            const height = Math.abs(operation.endY - operation.startY);

            if (operation.filled) {
                ctx.fillRect(x, y, width, height);
            } else {
                ctx.strokeRect(x, y, width, height);
            }
        } else if (operation.type === "circle") {
            ctx.beginPath();

            ctx.lineWidth = operation.brushSize;
            ctx.strokeStyle = operation.color;
            ctx.fillStyle = operation.color;

            const radius = Math.sqrt(
                Math.pow(operation.endX - operation.startX, 2) +
                Math.pow(operation.endY - operation.startY, 2)
            );

            ctx.arc(
                operation.startX,
                operation.startY,
                radius,
                0,
                2 * Math.PI
            );

            if (operation.filled) {
                ctx.fill();
            } else {
                ctx.stroke();
            }
        } else if (operation.type === "triangle") {

            ctx.beginPath();

            ctx.lineWidth = operation.brushSize;
            ctx.strokeStyle = operation.color;
            ctx.fillStyle = operation.color;

            ctx.moveTo(operation.startX, operation.startY);
            ctx.lineTo(operation.endX, operation.endY);

            ctx.lineTo(
                operation.startX * 2 - operation.endX,
                operation.endY
            );

            ctx.closePath();

            if (operation.filled) {
                ctx.fill();
            } else {
                ctx.stroke();
            }


        }
}


function drawfromHistory() {
    if (drawingHistory.length === 0) {
        return;
    }
    for (const operation of drawingHistory) {
            drawOperation(operation);
        }


    }

export function loadDrawingHistory(history) {
    drawingHistory = Array.isArray(history) ? history : [];

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawfromHistory();
}

export function clearDrawingHistory() {
    drawingHistory = [];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawfromHistory();

    if (onDrawingComplete) {
        onDrawingComplete(drawingHistory);
    }
}

socket.on("drawing-preview", (operation) => {
    remotePreview = operation;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawfromHistory();

    drawOperation(remotePreview);
});

socket.on("drawing-operation", (operation) => {
    drawingHistory.push(operation);

    remotePreview = null;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawfromHistory();
});

socket.on("clear-board", () => {
clearDrawingHistory();
setCanvasBackground();
});
