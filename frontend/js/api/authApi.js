let accessToken = null;

export function getAccessToken() {
    return accessToken;
}

export async function loginUser(email, password) {
    const response = await fetch("/api/users/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Login failed.");
    }

    accessToken = data.accessToken;
    localStorage.setItem("activeUserId", String(data.user.id));
    localStorage.setItem("activeUsername", data.user.username);

    console.log("Stored username:", localStorage.getItem("activeUsername"));

    return data;
}

export async function refreshAccessToken() {
    const userId = localStorage.getItem("activeUserId");

    if (!userId) {
        throw new Error("No active account found.");
    }

    const response = await fetch("/api/users/refresh", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({ userId })
    });

    const data = await response.json();


    if (!response.ok) {
        throw new Error(data.message || "Session expired.");
    }

    accessToken = data.accessToken;

    return data;
}

export async function logoutUser() {
    const userId = localStorage.getItem("activeUserId");

    if (!userId) {
        throw new Error("No active account found.");
    }

    const response = await fetch("/api/users/logout", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({ userId })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Logout failed.");
    }

    accessToken = null;
    localStorage.removeItem("activeUserId");

    return data;
}

export async function registerUser(username, email, password) {
    const response = await fetch("/api/users/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, email, password })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Registration failed.");
    }

    return data;
}