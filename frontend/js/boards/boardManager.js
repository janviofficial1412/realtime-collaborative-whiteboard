import {
    getBoards,
    getBoard,
    getSharedBoard,
    createBoard,
    renameBoard,
    deleteBoard,
    saveDrawingData,
    createShareLink,
    getShareLinks,
    revokeShareLink
} from "../api/boardApi.js";
import { resizeCanvas } from "../canvas/canvas.js";
import {
    loadDrawingHistory,
    setDrawingSaveCallback,
    setCurrentBoardIdCallback,
    setCanEdit
} from "../canvas/drawing.js";
import socket from "../socket.js";

const boardSelect = document.querySelector("#board-select");
const boardNameInput = document.querySelector("#board-name-input");

const createBoardBtn = document.querySelector("#create-board-btn");
const renameBoardBtn = document.querySelector("#rename-board-btn");
const deleteBoardBtn = document.querySelector("#delete-board-btn");

const boardManagement = document.querySelector("#board-management");
const whiteboardScreen = document.querySelector("#whiteboard-screen");

const openBoardBtn = document.querySelector("#open-board-btn");
const backToBoardsBtn = document.querySelector("#back-to-boards-btn");
const shareBoardBtn = document.getElementById("share-board-btn");
const sharingControls = document.getElementById("sharing-controls");
const generateShareLinkBtn = document.getElementById("generate-share-link-btn");
const sharePermission = document.getElementById("share-permission");
const shareLinkInput = document.getElementById("share-link-input");
const shareLinkLabel = document.getElementById("share-link-label");
const shareLinkAnchor = document.getElementById("share-link-anchor");
const shareStatus = document.getElementById("share-status");
const existingShareLinks = document.getElementById("existing-share-links");

let selectedBoardId = null;
let currentShareToken = null;
let currentUsername = null;
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

async function loadShareLinks() {
    try {
        if (!selectedBoardId) {
            throw new Error("No board selected.");
        }

        existingShareLinks.replaceChildren();

        const data = await getShareLinks(selectedBoardId);

        const shares = Array.isArray(data)
            ? data
            : data.shares || [];

        const activeShares = shares.filter(
            share => !share.revoked_at
        );

        if (shares.length === 0) {
            existingShareLinks.textContent = "No sharing links found.";
            return;
        }

        activeShares.forEach((share) => {
            const item = document.createElement("div");

            const permission = document.createElement("span");
            permission.textContent = `${share.permission} permission`;


            item.append(permission);

            if (!share.revoked_at) {
                const revokeBtn = document.createElement("button");
                revokeBtn.textContent = "Revoke";

                revokeBtn.addEventListener("click", async () => {
                    try {
                        await revokeShareLink(selectedBoardId, share.id);

                        item.remove();

                        if (!existingShareLinks.children.length) {
                            existingShareLinks.textContent = "No active sharing links.";
                        }

                        shareStatus.textContent = "Sharing link revoked successfully.";

                    } catch (error) {
                        shareStatus.textContent = error.message;
                    }
                });

                item.appendChild(revokeBtn);
            }

            existingShareLinks.appendChild(item);
        });

    } catch (error) {
        shareStatus.textContent = error.message;
    }
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
        drawingHistory,
        currentShareToken
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

shareBoardBtn.addEventListener("click", () => {
    sharingControls.hidden = !sharingControls.hidden;

    if (!sharingControls.hidden) {
        loadShareLinks();
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

function requestBoardAccess(boardId, shareToken = null) {
    console.log("requestBoardAccess called:", {
        boardId,
        shareToken,
        time: Date.now()
    });
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            cleanup();
            reject(new Error("Board access request timed out."));
        }, 10000);

        function cleanup() {
            clearTimeout(timeout);
            socket.off("board-access-granted", handleGranted);
            socket.off("board-access-denied", handleDenied);
        }

        function handleGranted(data) {
            if (Number(data.boardId) !== Number(boardId)) return;

            cleanup();
            resolve(data);
        }

        function handleDenied(data) {
            cleanup();
            reject(new Error(data.message || "Board access denied."));
        }

        socket.on("board-access-granted", handleGranted);
        socket.on("board-access-denied", handleDenied);

        socket.emit("join-board", { boardId, shareToken });
    });
}

openBoardBtn.addEventListener("click", async () => {
    const boardId = boardSelect.value;

    if (!boardId) {
        showBoardStatus("Please select a board first.", true);
        return;
    }

    try {
        currentShareToken = null;

        const board = await getBoard(boardId);
        const access = await requestBoardAccess(board.id);
        setCanEdit(access.permission);

        shareBoardBtn.hidden = false;
        sharingControls.hidden = true;

        console.log("Board permission:", access.permission);

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
    currentShareToken = null;
    selectedBoardId = null;
    boardNameInput.value = "";

    setCanEdit("EDIT");
    showBoardManagement();
    loadBoards();
});

generateShareLinkBtn.addEventListener("click", async () => {
    try {
        if (!selectedBoardId) {
            throw new Error("No board selected.");
        }

        shareStatus.textContent = "Generating link...";

        const permission = sharePermission.value;

        const data = await createShareLink(selectedBoardId, permission);

        shareLinkInput.value = new URL(data.sharePath, window.location.origin).href;

        shareLinkAnchor.href = shareLinkInput.value;
        shareLinkAnchor.hidden = false;

        shareLinkLabel.textContent = `${currentUsername} / ${boardNameInput.value} / ${permission}`;


        shareStatus.textContent = `${permission} sharing link generated successfully.`;

    } catch (error) {
        shareStatus.textContent = error.message;
    }
});

const copyShareLinkBtn = document.getElementById("copy-share-link-btn");

copyShareLinkBtn.addEventListener("click", async () => {
    try {
        if (!shareLinkInput.value) {
            throw new Error("Generate a sharing link first.");
        }

        await navigator.clipboard.writeText(shareLinkInput.value);

        shareStatus.textContent = "Sharing link copied successfully.";

    } catch (error) {
        shareStatus.textContent = error.message;
    }
});


window.addEventListener("user-logged-in", async (event) => {
    const shareToken = event.detail?.shareToken;
    currentUsername = event.detail?.username;

    if (!shareToken) {
        loadBoards();
        return;
    }

    try {
        showBoardStatus("Opening shared board...");

        const board = await getSharedBoard(shareToken);
        const boardId = board.id ?? board.board_id;

        const access = await requestBoardAccess(boardId, shareToken);

        selectedBoardId = boardId;
        currentShareToken = shareToken;

        boardNameInput.value = board.board_name;
        setCanEdit(access.permission);

        shareBoardBtn.hidden = true;
        sharingControls.hidden = true;

        showWhiteboard();

        requestAnimationFrame(() => {
            resizeCanvas();
            loadDrawingHistory(board.drawing_data);
        });

    } catch (error) {
        console.error("Shared board access failed:", error);
        currentShareToken = null;
        showBoardManagement();
        showBoardStatus(error.message, true);
        loadBoards();
    }
});