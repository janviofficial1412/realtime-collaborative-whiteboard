const API_BASE_URL =
    window.location.hostname === "localhost"
        ? ""
        : "https://whiteboard-backend-8wsl.onrender.com";

export default API_BASE_URL;