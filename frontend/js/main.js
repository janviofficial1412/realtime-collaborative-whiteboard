import { restoreSession } from "./auth.js";

const page = document.body.dataset.page;

// Restore authentication before loading protected features.
const authenticated = await restoreSession();

// Stop if authentication failed or a redirect is happening.
if (page !== "auth" && !authenticated) {
    // restoreSession() handles the redirect.
} else if (page === "auth") {
    // Login and signup handlers are already initialized by auth.js.
} else {
    // Register the Socket.IO listener before dispatching the event.
    await import("./socket.js");

    if (page === "boards") {
        await import("./boards/boardManager.js");
    }

    if (page === "whiteboard") {
        await import("./canvas/canvas.js");
        await import("./canvas/drawing.js");
        await import("./canvas/tools.js");
        await import("./canvas/actions.js");
        await import("./canvas/collabrators.js");
        await import("./boards/whiteboardController.js");
    }

    // Notify loaded modules that authentication is ready.
    window.dispatchEvent(new CustomEvent("user-logged-in"));
}