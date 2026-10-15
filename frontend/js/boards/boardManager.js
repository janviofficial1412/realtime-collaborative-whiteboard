import {
getBoards,
getBoard,
createBoard,
renameBoard,
deleteBoard
} from "../api/boardApi.js";

const boardSelect = document.querySelector("#board-select");
const boardNameInput = document.querySelector("#board-name-input");

const createBoardBtn = document.querySelector("#create-board-btn");
const renameBoardBtn = document.querySelector("#rename-board-btn");
const deleteBoardBtn = document.querySelector("#delete-board-btn");

const boardStatus = document.querySelector("#board-status");

let selectedBoardId = null;

function showBoardStatus(message) {
boardStatus.textContent = message;
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

// Rename a board
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


loadBoards();
