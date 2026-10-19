const API_URL = "/api/boards";


export async function getBoards() {
const response = await fetch(API_URL);
const data = await response.json();


if (!response.ok) {
    throw new Error(data.message || "Failed to fetch boards.");
}

return data;


}


export async function getBoard(id) {
const response = await fetch(`${API_URL}/${id}`);
const data = await response.json();


if (!response.ok) {
    throw new Error(data.message || "Failed to fetch board.");
}

return data;


}

export async function createBoard(name) {
const response = await fetch(API_URL, {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({ name })
});


const data = await response.json();

if (!response.ok) {
    throw new Error(data.message || "Failed to create board.");
}

return data;


}


export async function renameBoard(id, name) {
const response = await fetch(`${API_URL}/${id}`, {
method: "PUT",
headers: { "Content-Type": "application/json" },
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
method: "DELETE"
});


const data = await response.json();

if (!response.ok) {
    throw new Error(data.message || "Failed to delete board.");
}

return data;

}

export async function saveDrawingData(id, name, drawingHistory) {
    const response = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name,
            drawing_data: drawingHistory
        })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Failed to save drawing.");
    }

    return data;
}


