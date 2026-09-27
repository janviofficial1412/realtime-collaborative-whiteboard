const express = require("express");
const path = require("path");

const app = express();

app.use(express.json());

app.use(express.static(path.join(__dirname, "..")));

let boards = [];


app.post("/api/boards", (req, res) => {
    const board = {
        id: boards.length + 1,
        name: req.body.name
    };

    boards.push(board);

    res.status(201).json(board);
});


app.get("/api/boards", (req, res) => {
    res.json(boards);
});


app.get("/api/boards/:id", (req, res) => {
    const id = Number(req.params.id);

    const board = boards.find((board) => board.id === id);

    if (!board) {
        return res.status(404).json({ message: "Board not found" });
    }

    res.json(board);
});


app.put("/api/boards/:id", (req, res) => {
    const id = Number(req.params.id);

    const board = boards.find((board) => board.id === id);

    if (!board) {
        return res.status(404).json({ message: "Board not found" });
    }

    board.name = req.body.name;

    res.json(board);
});


app.delete("/api/boards/:id", (req, res) => {
    const id = Number(req.params.id);

    const board = boards.find((board) => board.id === id);

    if (!board) {
        return res.status(404).json({ message: "Board not found" });
    }

    boards = boards.filter((board) => board.id !== id);

    res.json(board);
});


app.listen(3000, () => {
    console.log("app listening at http://localhost:3000");
});
