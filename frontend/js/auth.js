import { loginUser, registerUser } from "./api/authApi.js";
const pathParts = window.location.pathname.split("/");
const sharedBoardToken =
    pathParts[1] === "share" ? pathParts[2] : null;

const authScreen = document.getElementById("auth-screen");
const boardManagement = document.getElementById("board-management");

const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");

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

        authScreen.hidden = true;
        boardManagement.hidden = false;

        // Load the user's boards.
        window.dispatchEvent(
            new CustomEvent("user-logged-in", {
                detail: { shareToken: sharedBoardToken }
            })
        );

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

// Initially show authentication.
authScreen.hidden = false;
boardManagement.hidden = true;