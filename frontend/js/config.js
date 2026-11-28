const API_BASE_URL = "";

export const SOCKET_URL =
    window.location.hostname === "localhost"
        ? window.location.origin
        : "https://whiteboard-backend-8wsl.onrender.com";

export default API_BASE_URL;