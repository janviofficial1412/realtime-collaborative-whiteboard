import {
    loginUser,
    registerUser,
    refreshAccessToken,
    logoutUser
} from "./api/authApi.js";
import socket from "./socket.js";


const pathParts = window.location.pathname.split("/");
const sharedBoardToken =
    pathParts[1] === "share" ? pathParts[2] : null;

const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");

if (loginForm && signupForm) {

    document.getElementById("show-signup-btn").addEventListener("click", () => {
        loginForm.hidden = true;
        signupForm.hidden = false;
    });

    document.getElementById("show-login-btn").addEventListener("click", () => {
        signupForm.hidden = true;
        loginForm.hidden = false;
    });

    // Login
    document.getElementById("login-btn").addEventListener("click", async () => {
        const email = document.getElementById("login-email").value.trim();
        const password = document.getElementById("login-password").value;
        const status = document.getElementById("auth-status");

        try {
            const data = await loginUser(email, password);

            status.textContent = data.message;

            window.location.href = sharedBoardToken
                ? `/whiteboard.html?shareToken=${encodeURIComponent(sharedBoardToken)}`
                : "/board-management.html";

        } catch (error) {
            status.textContent = error.message;
        }
    });

    // Signup
    document.getElementById("signup-btn").addEventListener("click", async () => {
        const username = document.getElementById("signup-username").value.trim();
        const email = document.getElementById("signup-email").value.trim();
        const password = document.getElementById("signup-password").value;
        const status = document.getElementById("auth-status");

        try {
            const data = await registerUser(username, email, password);

            status.textContent = data.message;

            signupForm.hidden = true;
            loginForm.hidden = false;

            document.getElementById("login-email").value = email;

        } catch (error) {
            status.textContent = error.message;
        }
    });
}

// Logout
const logoutBtn = document.getElementById("logout-btn");

if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
        try {
            await logoutUser();

            socket.disconnect();

            window.location.href = "/index.html";

        } catch (error) {
            const status =
                document.getElementById("auth-status") ||
                document.getElementById("board-status");

            if (status) {
                status.textContent = error.message;
            }
        }
    });
}

export async function restoreSession() {
    const userId = localStorage.getItem("activeUserId");
    const currentPage = document.body.dataset.page;

    if (!userId) {
        if (currentPage !== "auth") {
            window.location.href = "/index.html";
        }
        return false;
    }

    try {
        await refreshAccessToken();

        if (currentPage === "auth") {
            window.location.href = sharedBoardToken
                ? `/whiteboard.html?shareToken=${encodeURIComponent(sharedBoardToken)}`
                : "/board-management.html";

            return false;
        }

        return true;

    } catch (error) {
        sessionStorage.removeItem("activeUserId");

        if (currentPage !== "auth") {
            window.location.href = "/index.html";
        }

        return false;
    }
}