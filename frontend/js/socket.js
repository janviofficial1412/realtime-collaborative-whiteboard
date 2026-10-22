const socket = io()

socket.on("connect", () => {
    console.log("connected to Socket.IO: ",socket.id);
})

socket.on("disconnect", () => {
    console.log("Disconnected from Socket.IO: ",socket.id);
})

socket.emit("test-message", "Hello from the whiteboard!");

export default socket;