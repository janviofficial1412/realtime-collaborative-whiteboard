import socket from "../socket.js";

let textBoxLayer = null;
let activeTextBox = null;

let getDrawingHistory = null;
let setDrawingHistory = null;
let getCurrentBoardId = null;
let getSelectedColor = null;
let getBrushWidth = null;
let onDrawingComplete = null;
let redrawCanvas = null;

export function initializeTextBox(config) {
    textBoxLayer = config.textBoxLayer;

    getDrawingHistory = config.getDrawingHistory;
    setDrawingHistory = config.setDrawingHistory;
    getCurrentBoardId = config.getCurrentBoardId;
    getSelectedColor = config.getSelectedColor;
    getBrushWidth = config.getBrushWidth;
    onDrawingComplete = config.onDrawingComplete;
    redrawCanvas = config.redrawCanvas;
}

export function startTextBoxResize(e, box, position) {
    e.preventDefault();

    const startX = e.clientX;
    const startY = e.clientY;

    const startWidth = box.offsetWidth;
    const startHeight = box.offsetHeight;
    const startLeft = box.offsetLeft;
    const startTop = box.offsetTop;
    const input = box.querySelector(".text-box-input");
    const startFontSize = parseFloat(getComputedStyle(input).fontSize);

    const aspectRatio = startWidth / startHeight;

    function handleMouseMove(moveEvent) {
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;

        let widthDelta;

        if (position.startsWith("middle")) {
            widthDelta = position.includes("right") ? dx : -dx;
        } else {
            const horizontalDelta = position.includes("right") ? dx : -dx;
            const verticalDelta = position.includes("bottom") ? dy : -dy;

            widthDelta = Math.abs(horizontalDelta) > Math.abs(verticalDelta)
                ? horizontalDelta
                : verticalDelta;
        }

        const newWidth = Math.max(80, startWidth + widthDelta);
        const newHeight = position.startsWith("middle")
            ? startHeight
            : newWidth / aspectRatio;

        const newLeft = position.includes("left")
            ? startLeft + startWidth - newWidth
            : startLeft;

        const newTop = position.includes("top")
            ? startTop + startHeight - newHeight
            : startTop;

        box.style.width = `${newWidth}px`;
        box.style.height = `${newHeight}px`;
        box.style.left = `${newLeft}px`;
        box.style.top = `${newTop}px`;

        input.style.fontSize =
            `${Math.max(10, startFontSize * newWidth / startWidth)}px`;

        const operationId = box.dataset.operationId;
        if (!operationId) return;

        const boardId = getCurrentBoardId();

        if (boardId !== null) {
            socket.emit("drawing-operation", {
                id: operationId,
                type: "text",
                x: box.offsetLeft,
                y: box.offsetTop,
                width: box.offsetWidth,
                height: box.offsetHeight,
                text: input.value,
                fontSize: parseFloat(input.style.fontSize) || 18,
                color: input.style.color,
                boardId
            });
        }
    }

    function handleMouseUp() {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);

        const operationId = box.dataset.operationId;
        if (!operationId) return;

        const history = getDrawingHistory();

        const existingOperation = history.find(
            (item) => item.id === operationId
        );

        if (!existingOperation) return;

        const updatedOperation = {
            ...existingOperation,
            x: box.offsetLeft,
            y: box.offsetTop,
            width: box.offsetWidth,
            height: box.offsetHeight,
            fontSize: parseFloat(input.style.fontSize) || 18
        };

        const updatedHistory = history.map((item) =>
            item.id === operationId ? updatedOperation : item
        );

        setDrawingHistory(updatedHistory);
        onDrawingComplete(updatedHistory);
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
}

function startTextBoxDrag(e, box) {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;

    const initialLeft = box.offsetLeft;
    const initialTop = box.offsetTop;

    function onMouseMove(e) {
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        box.style.left = `${initialLeft + deltaX}px`;
        box.style.top = `${initialTop + deltaY}px`;

        const operationId = box.dataset.operationId;
        if (!operationId) return;

        const boardId = getCurrentBoardId();

        if (boardId !== null) {
            socket.emit("drawing-operation", {
                id: operationId,
                type: "text",
                x: box.offsetLeft,
                y: box.offsetTop,
                width: box.offsetWidth,
                height: box.offsetHeight,
                text: box.querySelector(".text-box-input").value,
                fontSize: parseFloat(
                    box.querySelector(".text-box-input").style.fontSize
                ) || 18,
                color: box.querySelector(".text-box-input").style.color,
                boardId
            });
        }
    }

    function onMouseUp() {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);

        const operationId = box.dataset.operationId;
        if (!operationId) return;

        const input = box.querySelector(".text-box-input");
        const history = getDrawingHistory();

        const existingOperation = history.find(
            (item) => item.id === operationId
        );

        const operation = {
            ...(existingOperation || {}),
            id: operationId,
            type: "text",
            x: box.offsetLeft,
            y: box.offsetTop,
            width: box.offsetWidth,
            height: box.offsetHeight,
            text: input.value,
            fontSize: parseFloat(input.style.fontSize) || 18,
            color: input.style.color
        };

        const updatedHistory = existingOperation
            ? history.map((item) =>
                item.id === operationId ? operation : item
            )
            : [...history, operation];

        setDrawingHistory(updatedHistory);
        onDrawingComplete(updatedHistory);

        const boardId = getCurrentBoardId();

        if (boardId !== null) {
            socket.emit("drawing-operation", {
                ...operation,
                boardId
            });
        }
    }
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
}

export function createTextBox(x, y, existingOperation = null, isRestoring = false) {
    const box = document.createElement("div");
    box.className = "text-box";

    box.style.left = `${x}px`;
    box.style.top = `${y}px`;

    const input = document.createElement("textarea");
    input.addEventListener("input", () => {
        if (!activeTextBox || activeTextBox.input !== input) return;

        // Assign an ID when the user first types.
        if (!activeTextBox.operationId) {
            activeTextBox.operationId = crypto.randomUUID();
            box.dataset.operationId = activeTextBox.operationId;
        }

        const operation = {
            id: activeTextBox.operationId,
            type: "text",
            x: box.offsetLeft,
            y: box.offsetTop,
            width: box.offsetWidth,
            height: box.offsetHeight,
            text: input.value,
            fontSize: parseFloat(input.style.fontSize) || 18,
            color: input.style.color
        };

        const boardId = getCurrentBoardId
            ? getCurrentBoardId()
            : null;

        if (boardId !== null) {
            socket.emit("drawing-operation", {
                ...operation,
                boardId
            });
        }
    });
    input.className = "text-box-input";
    input.placeholder = "Type here...";
    input.style.color = getSelectedColor();
    const initialFontSize = Math.max(10, getBrushWidth() * 3);

    input.style.fontSize = `${initialFontSize}px`;

    if (!existingOperation) {
        box.style.width = `${initialFontSize * 8}px`;
        box.style.height = `${initialFontSize * 3}px`;
    }

    if (existingOperation) {
        input.value = existingOperation.text;
        input.style.fontSize = `${existingOperation.fontSize}px`;
        input.style.color = existingOperation.color || getSelectedColor();

        box.style.left = `${existingOperation.x}px`;
        box.style.top = `${existingOperation.y}px`;
        box.style.width = `${existingOperation.width}px`;
        box.style.height = `${existingOperation.height}px`;

        box.dataset.operationId = existingOperation.id;
    }

    box.appendChild(input);
    const handlePositions = [
        "top-left",
        "top-right",
        "bottom-left",
        "bottom-right",
        "middle-left",
        "middle-right"
    ];

    handlePositions.forEach((position) => {
        const handle = document.createElement("div");
        handle.className = `text-box-handle ${position}`;

        box.addEventListener("mousedown", (e) => {
            if (e.target.classList.contains("text-box-handle")) {
                return;
            }

            if (e.target === input) {
                startTextBoxDrag(e, box);
            }
        });

        handle.addEventListener("mousedown", (e) => {
            e.stopPropagation();
            startTextBoxResize(e, box, position);
        });

        box.appendChild(handle);
    });

    box.addEventListener("mousedown", () => {
        // Finish editing another text box first.
        if (activeTextBox && activeTextBox.element !== box) {
            finalizeTextBox();
        }

        const operationId = box.dataset.operationId || null;

        activeTextBox = {
            element: box,
            input: input,
            operationId: operationId
        };

        input.readOnly = false;
        box.style.border = "1px dashed #3498db";

        box.querySelectorAll(".text-box-handle").forEach((handle) => {
            handle.style.display = "block";
        });

        input.focus();
    });

    textBoxLayer.appendChild(box);

    if (!isRestoring) {
        activeTextBox = {
            element: box,
            input: input,
            operationId: existingOperation ? existingOperation.id : null
        };

        input.focus();
    } else {
        input.readOnly = true;
        input.placeholder = "";
        box.style.border = "none";

        box.querySelectorAll(".text-box-handle").forEach((handle) => {
            handle.style.display = "none";
        });
    }
}

export function renderTextOperation(operation) {
    // Prevent duplicate text boxes when history is redrawn.
    const existingBox = textBoxLayer.querySelector(
        `[data-operation-id="${operation.id}"]`
    );

    if (existingBox) return;

    createTextBox(
        operation.x,
        operation.y,
        operation,
        true
    );
}

export function finalizeTextBox() {
    if (!activeTextBox) return;

    const { element, input } = activeTextBox;
    const text = input.value.trim();

    if (!text) {
        const operationId = activeTextBox.operationId;

        element.remove();
        activeTextBox = null;

        if (operationId) {
            setDrawingHistory(
                getDrawingHistory().filter(
                    operation => operation.id !== operationId
                )
            );

            const boardId = getCurrentBoardId
                ? getCurrentBoardId()
                : null;

            if (boardId !== null) {
                socket.emit("delete-text-operation", {
                    boardId,
                    operationId
                });
            }

            if (onDrawingComplete) {
                onDrawingComplete(getDrawingHistory());
            }
        }

        return;
    }

    const operation = {
        id: activeTextBox.operationId || crypto.randomUUID(),
        type: "text",
        x: element.offsetLeft,
        y: element.offsetTop,
        width: element.offsetWidth,
        height: element.offsetHeight,
        text: text,
        fontSize: parseFloat(input.style.fontSize) || 18,
        color: getSelectedColor()
    };

    element.dataset.operationId = operation.id;

    input.readOnly = true;
    input.placeholder = "";

    element.style.border = "none";

    element.querySelectorAll(".text-box-handle").forEach((handle) => {
        handle.style.display = "none";
    });

    activeTextBox = null;

    const history = getDrawingHistory();

    const existingIndex = history.findIndex(
        item => item.id === operation.id
    );

    if (existingIndex !== -1) {
        history[existingIndex] = operation;
        setDrawingHistory(history);
    } else {
        history.push(operation);
        setDrawingHistory(history);
    }

    redrawCanvas();

    const boardId = getCurrentBoardId
        ? getCurrentBoardId()
        : null;

    if (boardId !== null) {
        socket.emit("drawing-operation", {
            ...operation,
            boardId
        });
    }

    if (onDrawingComplete) {
        onDrawingComplete(getDrawingHistory());
    }
}

export function hasActiveTextBox() {
    return activeTextBox !== null;
}

export function getActiveTextBoxElement() {
    return activeTextBox?.element || null;
}

export function clearTextBoxes() {
    activeTextBox = null;
    textBoxLayer.replaceChildren();
}

export function clearActiveTextBoxIfId(operationId) {
    if (activeTextBox?.operationId === operationId) {
        activeTextBox = null;
    }
}