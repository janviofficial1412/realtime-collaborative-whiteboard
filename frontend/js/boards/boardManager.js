import {
getBoards,
getBoard,
createBoard,
renameBoard,
deleteBoard,
saveDrawingData
} from "../api/boardApi.js";
import { resizeCanvas } from "../canvas/canvas.js";
import { loadDrawingHistory ,setDrawingSaveCallback, setCurrentBoardIdCallback} from "../canvas/drawing.js";
import socket from "../socket.js";

const boardSelect = document.querySelector("#board-select");
const boardNameInput = document.querySelector("#board-name-input");

const createBoardBtn = document.querySelector("#create-board-btn");
const renameBoardBtn = document.querySelector("#rename-board-btn");
const deleteBoardBtn = document.querySelector("#delete-board-btn");

const boardStatus = document.querySelector("#board-status");
const boardManagement = document.querySelector("#board-management");
const whiteboardScreen = document.querySelector("#whiteboard-screen");

const openBoardBtn = document.querySelector("#open-board-btn");
const backToBoardsBtn = document.querySelector("#back-to-boards-btn");

let selectedBoardId = null;
setCurrentBoardIdCallback(() => selectedBoardId);

function showBoardStatus(message, isError = false) {
    const boardStatus = document.querySelector("#board-status");

    if (!boardStatus) {
        console.error("Board status element not found.");
        return;
    }

    boardStatus.textContent = message;
    boardStatus.style.color = isError ? "red" : "green";
}


async function loadBoards() {
try {
showBoardStatus("Loading boards...");


    const boards = await getBoards();

    boardSelect.replaceChildren();

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Select a board";
    boardSelect.appendChild(placeholder);

    boards.forEach((board) => {
        const option = document.createElement("option");
        option.value = board.id;
        option.textContent = board.board_name;
        boardSelect.appendChild(option);
    });

    const selectedBoardExists = boards.some(
        (board) => String(board.id) === String(selectedBoardId)
    );

    if (selectedBoardExists) {
        boardSelect.value = String(selectedBoardId);
    } else {
        selectedBoardId = null;
        boardSelect.value = "";
    }

    showBoardStatus(`${boards.length} board(s) found.`);
} catch (error) {
    console.error(error);
    showBoardStatus(error.message);
}


}

export async function saveCurrentBoard(drawingHistory) {
    if (!selectedBoardId) {
        throw new Error("Please open a board first.");
    }

    const name = boardNameInput.value.trim();

    return await saveDrawingData(
        selectedBoardId,
        name,
        drawingHistory
    );
}

setDrawingSaveCallback(async (history) => {
    try {
        await saveCurrentBoard(history);
        showBoardStatus("Drawing saved successfully.");
    } catch (error) {
        console.error("Error saving drawing:", error);
        showBoardStatus(error.message, true);
    }
});


boardSelect.addEventListener("change", async () => {
const id = boardSelect.value;


if (!id) {
    selectedBoardId = null;
    showBoardStatus("No board selected.");
    return;
}

try {
    const board = await getBoard(id);

    selectedBoardId = board.id;
    boardNameInput.value = board.board_name;

    showBoardStatus(`Selected: ${board.board_name}`);
} catch (error) {
    console.error(error);
    showBoardStatus(error.message);
}


});


createBoardBtn.addEventListener("click", async () => {
const name = boardNameInput.value.trim();


if (!name) {
    showBoardStatus("Please enter a board name.");
    return;
}

try {
    const board = await createBoard(name);

    selectedBoardId = board.id;

    await loadBoards();

    boardSelect.value = String(board.id);
    boardNameInput.value = board.board_name;

    showBoardStatus(`Created board: ${board.board_name}`);
} catch (error) {
    console.error(error);
    showBoardStatus(error.message);
}


});

 
renameBoardBtn.addEventListener("click", async () => {
if (!selectedBoardId) {
showBoardStatus("Please select a board first.");
return;
}


const name = boardNameInput.value.trim();

if (!name) {
    showBoardStatus("Please enter a board name.");
    return;
}

try {
    const board = await renameBoard(selectedBoardId, name);

    await loadBoards();

    boardSelect.value = String(board.id);
    boardNameInput.value = board.board_name;

    showBoardStatus(`Renamed board to: ${board.board_name}`);
} catch (error) {
    console.error(error);
    showBoardStatus(error.message);
}


});


deleteBoardBtn.addEventListener("click", async () => {
if (!selectedBoardId) {
showBoardStatus("Please select a board first.");
return;
}


if (!confirm("Are you sure you want to delete this board?")) {
    return;
}

try {
    await deleteBoard(selectedBoardId);

    selectedBoardId = null;
    boardNameInput.value = "";

    await loadBoards();

    showBoardStatus("Board deleted successfully.");
} catch (error) {
    console.error(error);
    showBoardStatus(error.message);
}


});


function showBoardManagement() {
    boardManagement.hidden = false;
    whiteboardScreen.hidden = true;
}

function showWhiteboard() {
    boardManagement.hidden = true;
    whiteboardScreen.hidden = false;
}

openBoardBtn.addEventListener("click", async () => {
    const boardId = boardSelect.value;

    if (!boardId) {
        showBoardStatus("Please select a board first.", true);
        return;
    }

    try {
        const board = await getBoard(boardId);
        socket.emit("join-board", board.id);

        boardManagement.hidden = true;
        whiteboardScreen.hidden = false;

        requestAnimationFrame(() => {
        const resized = resizeCanvas();

        if (resized) {
            showBoardStatus("Board opened successfully.");
        } else {
            showBoardStatus("Canvas dimensions could not be initialized.", true);
        }
        loadDrawingHistory(board.drawing_data);
        showWhiteboard();
    });
        } catch (error) {
            console.error("Error opening board:", error);
            showBoardStatus("Unable to open this board.", true);
        }
});

backToBoardsBtn.addEventListener("click", () => {
    showBoardManagement();
});


loadBoards();
