const express = require("express");
const router = express.Router();
const pool = require("./db");


router.post("/", async (req, res) => {
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

router.get("/", async (req, res) => {
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

router.get("/:id", async (req, res) => {
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

router.put("/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { name,drawing_data } = req.body;


        if (!Number.isInteger(id) || id < 1) {
            return res.status(400).json({ message: "Invalid board ID" });
        }

        if (typeof name !== "string" || !name.trim()) {
            return res.status(400).json({ message: "A valid board name is required" });
        }

        const result = await pool.query(
            `UPDATE boards
         SET board_name = $1,
         drawing_data =  $2,
         updated_at = CURRENT_TIMESTAMP
         WHERE id = $3
         RETURNING *`,
            [name.trim(),JSON.stringify(drawing_data ?? []), id]
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

router.delete("/:id", async (req, res) => {
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

module.exports = router;