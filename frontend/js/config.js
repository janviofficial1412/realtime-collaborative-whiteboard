const API_BASE_URL =
    window.location.hostname === "localhost"
        ? ""
        : "https://YOUR-BACKEND-URL.onrender.com";

export default API_BASE_URL;