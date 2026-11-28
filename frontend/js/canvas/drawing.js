import { canvas, ctx } from "./canvas.js";
import socket from "../socket.js";
import {
    initializeTextBox,
    createTextBox as createTextBoxFromModule,
    renderTextOperation as renderTextOperationFromModule,
    hasActiveTextBox,
    finalizeTextBox as finalizeTextBoxFromModule,
    getActiveTextBoxElement,
    clearTextBoxes,
    clearActiveTextBoxIfId
} from "./textBox.js";

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
let canEdit = true;
const textBoxLayer = document.querySelector("#text-box-layer");

export function setCanEdit(permission) {
    canEdit = permission === "EDIT";

    const editingControls = document.querySelectorAll(
        ".tools-board .tool, #fill-color, #size-slider, #color-picker, .clear-canvas"
    );

    editingControls.forEach((control) => {
        control.style.pointerEvents = canEdit ? "auto" : "none";
        control.style.opacity = canEdit ? "1" : "0.5";
    });
}

export function setCurrentBoardIdCallback(callback) {
    getCurrentBoardId = callback;
}

export function getActiveBoardId() {
    return getCurrentBoardId ? getCurrentBoardId() : null;
}

export let brushWidth = 5;
export let selectedColor = "#fff";
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

initializeTextBox({
    textBoxLayer,

    getDrawingHistory: () => drawingHistory,
    setDrawingHistory: (history) => {
        drawingHistory = history;
    },

    getCurrentBoardId: () => getCurrentBoardId?.(),
    getSelectedColor: () => selectedColor,
    getBrushWidth: () => brushWidth,

    onDrawingComplete: (history) => {
        if (onDrawingComplete) {
            onDrawingComplete(history);
        }
    },

    redrawCanvas: () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawfromHistory();
    }
});

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


function drawArrow(startX, startY, endX, endY) {
    const headLength = Math.max(10, ctx.lineWidth * 4);
    const angle = Math.atan2(endY - startY, endX - startX);

    // Draw the main arrow line.
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Calculate the two arrowhead endpoints.
    const angle1 = angle - Math.PI / 6;
    const angle2 = angle + Math.PI / 6;

    ctx.beginPath();

    ctx.moveTo(endX, endY);
    ctx.lineTo(
        endX - headLength * Math.cos(angle1),
        endY - headLength * Math.sin(angle1)
    );

    ctx.moveTo(endX, endY);
    ctx.lineTo(
        endX - headLength * Math.cos(angle2),
        endY - headLength * Math.sin(angle2)
    );

    ctx.stroke();
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
    if (!canEdit) return;
    if (selectedTool === "text") return;

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
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = selectedColor;

        if (selectedTool === "eraser") {
            ctx.globalCompositeOperation = "destination-out";
        }

        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();

        ctx.globalCompositeOperation = "source-over";
    } else if (selectedTool === "rectangle") {
        drawRect(e);
    } else if (selectedTool === "circle") {
        drawCircle(e);
    } else if (selectedTool === "arrow") {
        drawArrow(prevMouseX, prevMouseY, e.offsetX, e.offsetY);
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

canvas.addEventListener("mousedown", (e) => {
    if (!canEdit || selectedTool !== "text") return;

    if (hasActiveTextBox()) return;

    const rect = canvas.getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    e.stopPropagation();
    createTextBoxFromModule(x, y);
});

document.addEventListener("mousedown", (e) => {
    if (!hasActiveTextBox()) return;

    const activeElement = getActiveTextBoxElement();

    if (activeElement?.contains(e.target)) return;

    finalizeTextBoxFromModule();
});

canvas.addEventListener("mouseup", (e) => {
    if (!currentOperation) return;

    // Ignore clicks that did not create an actual brush/eraser stroke.
    if (
        (currentOperation.type === "brush" ||
            currentOperation.type === "eraser") &&
        currentOperation.points.length < 2
    ) {
        currentOperation = null;
        isDrawing = false;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawfromHistory();
        return;
    }

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
        if (
            (currentOperation.type === "brush" ||
                currentOperation.type === "eraser") &&
            currentOperation.points.length < 2
        ) {
            currentOperation = null;
            isDrawing = false;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawfromHistory();
            return;
        }
        currentOperation.endX = lastMouseX;
        currentOperation.endY = lastMouseY;

        drawingHistory.push(currentOperation);

        const boardId = getCurrentBoardId
            ? getCurrentBoardId()
            : null;

        if (boardId !== null) {
            socket.emit("drawing-operation", {
                ...currentOperation,
                boardId
            });
        }

        currentOperation = null;

        if (onDrawingComplete) {
            onDrawingComplete(drawingHistory);
        }
    }

    isDrawing = false;
});

document.querySelector(".drawing-board").addEventListener("mousemove", (e) => {
    const boardId = getCurrentBoardId
        ? getCurrentBoardId()
        : null;

    if (boardId === null) return;

    socket.emit("cursor-move", {
        boardId: boardId,
        x: e.clientX - canvas.getBoundingClientRect().left,
        y: e.clientY - canvas.getBoundingClientRect().top
    });
});

canvas.addEventListener("mouseleave", () => {
    const boardId = getCurrentBoardId
        ? getCurrentBoardId()
        : null;

    if (boardId === null) return;

    socket.emit("cursor-leave", {
        boardId: boardId
    });
});

function drawOperation(operation) {
    const points = operation.points;

    if (operation.type === "brush") {
        ctx.beginPath();
        ctx.lineWidth = operation.brushSize;
        ctx.strokeStyle = operation.color;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        if (points.length === 1) {
            ctx.arc(points[0].x, points[0].y, operation.brushSize / 2, 0, 2 * Math.PI);
            ctx.fill();
        } else {
            ctx.moveTo(points[0].x, points[0].y);

            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
            ctx.stroke();
        }
    } else if (operation.type === "eraser") {
        ctx.save();

        ctx.globalCompositeOperation = "destination-out";
        ctx.beginPath();
        ctx.lineWidth = operation.brushSize;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        ctx.moveTo(points[0].x, points[0].y);

        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }

        ctx.stroke();
        ctx.restore();
    }

    else if (operation.type === "rectangle") {
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

    else if (operation.type === "arrow") {
        ctx.beginPath();

        ctx.lineWidth = operation.brushSize;
        ctx.strokeStyle = operation.color;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        drawArrow(
            operation.startX,
            operation.startY,
            operation.endX,
            operation.endY
        );
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

    console.log("Loaded drawing history:", history);
    console.log(
        "Text operations:",
        drawingHistory.filter(operation => operation.type === "text")
    );

    // Reset the previous board's text-box elements.
    clearTextBoxes();

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawfromHistory();
    drawingHistory.forEach(operation => {
        if (operation.type === "text") {
            renderTextOperationFromModule(operation);
        }
    });
}

export function clearDrawingHistory() {
    clearTextBoxes();
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

    if (operation.type === "text") {

        // Find the existing text operation.
        const existingIndex = drawingHistory.findIndex(
            item => item.id === operation.id
        );

        // Update its history entry instead of creating duplicates.
        if (existingIndex !== -1) {
            drawingHistory[existingIndex] = operation;
        } else {
            drawingHistory.push(operation);
        }

        // Find the existing HTML text box.
        const existingBox = textBoxLayer.querySelector(
            `[data-operation-id="${operation.id}"]`
        );

        if (existingBox) {
            const input = existingBox.querySelector(".text-box-input");

            // Update the existing box with the latest content.
            input.value = operation.text;
            input.style.fontSize = `${operation.fontSize}px`;
            input.style.color = operation.color;

            existingBox.style.left = `${operation.x}px`;
            existingBox.style.top = `${operation.y}px`;
            existingBox.style.width = `${operation.width}px`;
            existingBox.style.height = `${operation.height}px`;

        } else {
            // Create the box only when it doesn't exist.
            renderTextOperationFromModule(operation);
        }

    } else {
        drawingHistory.push(operation);
    }

    remotePreview = null;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawfromHistory();
});

socket.on("delete-text-operation", ({ operationId }) => {
    // Remove the deleted text from drawing history.
    drawingHistory = drawingHistory.filter(
        operation => operation.id !== operationId
    );

    // Remove the corresponding text box from the screen.
    const box = textBoxLayer.querySelector(
        `[data-operation-id="${operationId}"]`
    );

    if (box) {
        box.remove();
    }

    // Close the editor if this was the currently active text box.
    clearActiveTextBoxIfId(operationId);

    // Redraw the remaining canvas operations.
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawfromHistory();
});

socket.on("clear-board", () => {
    clearDrawingHistory();
    setCanvasBackground();
});

const cursorContainer = document.querySelector(".collaborator-cursors");

const collaboratorCursors = new Map();

const cursorColors = [
    "#e74c3c",
    "#3498db",
    "#2ecc71",
    "#9b59b6",
    "#f39c12",
    "#1abc9c",
    "#e84393"
];

function getCursorColor(userId) {
    return cursorColors[Math.abs(Number(userId)) % cursorColors.length];
}

socket.on("cursor-update", (data) => {
    if (!cursorContainer) return;

    let cursor = collaboratorCursors.get(data.userId);

    if (!cursor) {
        cursor = document.createElement("div");
        cursor.className = "collaborator-cursor";

        const arrow = document.createElement("span");
        arrow.className = "collaborator-cursor-arrow";

        const username = document.createElement("span");
        username.className = "collaborator-cursor-name";

        cursor.appendChild(arrow);
        cursor.appendChild(username);

        cursorContainer.appendChild(cursor);

        collaboratorCursors.set(data.userId, cursor);
    }

    const color = getCursorColor(data.userId);

    cursor.style.left = `${data.x}px`;
    cursor.style.top = `${data.y}px`;
    cursor.style.setProperty("--cursor-color", color);

    cursor.querySelector(".collaborator-cursor-name").textContent =
        data.username;

});

function removeCollaboratorCursor(userId) {
    const cursor = collaboratorCursors.get(userId);

    if (cursor) {
        cursor.remove();
        collaboratorCursors.delete(userId);
    }
}

socket.on("cursor-hide", ({ userId }) => {
    removeCollaboratorCursor(userId);
});

socket.on("collaborator-disconnected", ({ userId }) => {
    removeCollaboratorCursor(userId);
});

