import {
    getBoards,
    getBoard,
    createBoard,
    renameBoard,
    deleteBoard,
    createShareLink,
    getShareLinks,
    revokeShareLink
} from "../api/boardApi.js";

const boardSelect = document.querySelector("#board-select");
const boardNameInput = document.querySelector("#board-name-input");

const createBoardBtn = document.querySelector("#create-board-btn");
const renameBoardBtn = document.querySelector("#rename-board-btn");
const deleteBoardBtn = document.querySelector("#delete-board-btn");

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
let currentUsername = localStorage.getItem("activeUsername");

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

const openBoardBtn = document.getElementById("open-board-btn");

openBoardBtn.addEventListener("click", () => {
    if (!selectedBoardId) {
        showBoardStatus("Please select a board first.", true);
        return;
    }

    window.location.href = `/whiteboard.html?boardId=${selectedBoardId}`;
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

        currentUsername = currentUsername || localStorage.getItem("activeUsername");

        shareLinkLabel.textContent = `${currentUsername || "User"} / ${boardNameInput.value} / ${permission}`;


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


window.addEventListener("user-logged-in", () => {
    currentUsername = localStorage.getItem("activeUsername");

    const params = new URLSearchParams(window.location.search);
    const shareToken = params.get("shareToken");

    if (shareToken) {
        window.location.href =
            `/whiteboard.html?shareToken=${encodeURIComponent(shareToken)}`;
        return;
    }

    loadBoards();
});