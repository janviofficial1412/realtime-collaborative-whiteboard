import { getAccessToken } from "./api/authApi.js";

const socket = io({
    autoConnect: false
});

socket.on("connect", () => {
    console.log("SOCKET CONNECTED:", socket.id);
});

socket.on("connect_error", (error) => {
    console.error("Socket connection failed:", error.message);
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
    console.log("SOCKET DISCONNECTED:", socket.id);
});

// Connect only after successful login.
window.addEventListener("user-logged-in", () => {
    if (socket.connected) return;

    socket.auth = {
        token: getAccessToken()
    };

    socket.connect();
});

export default socket;