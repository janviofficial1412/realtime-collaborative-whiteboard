const pool = require("./db");
const express = require("express");
const path = require("path");

const app = express();

app.use(express.json());

app.use(express.static(path.join(__dirname, "..")));

// CREATE a new board
app.post("/api/boards", async (req, res) => {
    try {
        const { name } = req.body;


        const result = await pool.query(
            "INSERT INTO boards (board_name) VALUES ($1) RETURNING *",
            [name || "Untitled Board"]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Error creating board:", error.message);
        res.status(500).json({ message: "Failed to create board" });
    }


});

// READ all boards
app.get("/api/boards", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM boards ORDER BY id"
        );


        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching boards:", error.message);
        res.status(500).json({ message: "Failed to fetch boards" });
    }

});

// READ one board by ID
app.get("/api/boards/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id < 1) {
            return res.status(400).json({ message: "Invalid board ID" });
        }

        const result = await pool.query(
            "SELECT * FROM boards WHERE id = $1",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Board not found" });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error fetching board:", error.message);
        res.status(500).json({ message: "Failed to fetch board" });
    }


});

// UPDATE a board's name
app.put("/api/boards/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { name } = req.body;


        if (!Number.isInteger(id) || id < 1) {
            return res.status(400).json({ message: "Invalid board ID" });
        }

        if (typeof name !== "string" || !name.trim()) {
            return res.status(400).json({ message: "A valid board name is required" });
        }

        const result = await pool.query(
            `UPDATE boards
         SET board_name = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING *`,
            [name.trim(), id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Board not found" });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error updating board:", error.message);
        res.status(500).json({ message: "Failed to update board" });
    }


});

// DELETE a board
app.delete("/api/boards/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id < 1) {
            return res.status(400).json({ message: "Invalid board ID" });
        }

        const result = await pool.query(
            "DELETE FROM boards WHERE id = $1 RETURNING *",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Board not found" });
        }

        res.json({
            message: "Board deleted successfully",
            board: result.rows[0]
        });
    } catch (error) {
        console.error("Error deleting board:", error.message);
        res.status(500).json({ message: "Failed to delete board" });
    }

});

app.listen(3000, () => {
    console.log("App listening at http://localhost:3000");
});

