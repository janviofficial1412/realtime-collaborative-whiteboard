import { getAccessToken } from "./authApi.js";

const API_URL = "/api/boards";

function getAuthHeaders() {
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAccessToken()}`
    };
}


export async function getBoards() {
    const response = await fetch(API_URL, {
        headers: getAuthHeaders()
    });
    const data = await response.json();


    if (!response.ok) {
        throw new Error(data.message || "Failed to fetch boards.");
    }

    return data;
}

export async function getSharedBoard(shareToken) {
    const response = await fetch(
        `${API_URL}/share/${shareToken}`,
        {
            headers: getAuthHeaders()
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Unable to access shared board.");
    }

    return data.board;
}


export async function getBoard(id) {
    const response = await fetch(`${API_URL}/${id}`, {
        headers: getAuthHeaders()
    });
    const data = await response.json();


    if (!response.ok) {
        throw new Error(data.message || "Failed to fetch board.");
    }

    return data;


}

export async function createBoard(name) {
    const response = await fetch(API_URL, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ name })
    });


    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Failed to create board.");
    }

    return data;


}

export async function renameBoard(id, name) {
    const response = await fetch(`${API_URL}/${id}/name`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ name })
    });


    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Failed to rename board.");
    }

    return data;


}

// Delete a board
export async function deleteBoard(id) {
    const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders()
    });


    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Failed to delete board.");
    }

    return data;

}

export async function saveDrawingData(id, name, drawingHistory, shareToken = null) {
    const response = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
            name,
            drawing_data: drawingHistory,
            shareToken
        })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Failed to save drawing.");
    }

    return data;
}

// Generate a sharing link
export async function createShareLink(boardId, permission) {
    const response = await fetch(`${API_URL}/${boardId}/share`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ permission })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Failed to generate sharing link.");
    }

    return data;
}


// Get all sharing links for a board
export async function getShareLinks(boardId) {
    const response = await fetch(`${API_URL}/${boardId}/shares`, {
        headers: getAuthHeaders()
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Failed to fetch sharing links.");
    }

    return data;
}


// Revoke a sharing link
export async function revokeShareLink(boardId, shareId) {
    const response = await fetch(
        `${API_URL}/${boardId}/shares/${shareId}`,
        {
            method: "DELETE",
            headers: getAuthHeaders()
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Failed to revoke sharing link.");
    }

    return data;
}