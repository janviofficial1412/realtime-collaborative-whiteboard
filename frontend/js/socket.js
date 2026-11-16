import { getAccessToken } from "./api/authApi.js";

const socket = io({
    autoConnect: false
});

socket.on("connect", () => {
    console.log("Connected to Socket.IO:", socket.id);
});

socket.on("connect_error", (error) => {
    console.error("Socket connection failed:", error.message);
});

socket.on("board-access-granted", (data) => {
    console.log("Board access granted:", data);
});

socket.on("board-access-denied", (data) => {
    console.error("Board access denied:", data.message);
    alert(data.message);
});

socket.on("permission-denied", (data) => {
    alert(data.message);
});

socket.on("board-access-revoked", (data) => {
    alert(data.message);
    socket.disconnect();
});

socket.on("disconnect", () => {
    console.log("Disconnected from Socket.IO:", socket.id);
});

// Connect only after successful login.
window.addEventListener("user-logged-in", () => {
    socket.auth = {
        token: getAccessToken()
    };

    socket.connect();
});

export default socket;