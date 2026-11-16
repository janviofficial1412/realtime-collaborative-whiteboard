const express = require("express");
const router = express.Router();
const pool = require("./db");
const crypto = require("crypto");
const { authenticateToken } = require("./middleware/authMiddleware");

router.use(authenticateToken);

router.post("/:boardId/share", async (req, res) => {
    try {
        const boardId = Number(req.params.boardId);
        const { permission } = req.body;

        // Validate board ID
        if (!Number.isInteger(boardId) || boardId < 1) {
            return res.status(400).json({
                message: "Invalid board ID"
            });
        }

        // Validate permission
        if (!["VIEW", "EDIT"].includes(permission)) {
            return res.status(400).json({
                message: "Permission must be VIEW or EDIT"
            });
        }

        // Check whether the authenticated user owns this board
        const board = await pool.query(
            "SELECT id FROM boards WHERE id = $1 AND owner_id = $2",
            [boardId, req.user.id]
        );

        if (board.rows.length === 0) {
            return res.status(404).json({
                message: "Board not found"
            });
        }

        // Generate a secure random sharing token
        const token = crypto.randomBytes(32).toString("hex");

        // Hash the token before storing it
        const tokenHash = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        // Store the sharing link
        const result = await pool.query(
            `INSERT INTO board_share_links
            (board_id, token_hash, permission, created_by)
            VALUES ($1, $2, $3, $4)
            RETURNING id, board_id, permission, created_at`,
            [boardId, tokenHash, permission, req.user.id]
        );

        res.status(201).json({
            message: "Sharing link generated successfully",
            share: result.rows[0],
            sharePath: `/share/${token}`
        });

    } catch (error) {
        console.error("Error generating sharing link:", error.message);

        res.status(500).json({
            message: "Failed to generate sharing link"
        });
    }
});

router.get("/:boardId/shares", async (req, res) => {
    try {
        const boardId = Number(req.params.boardId);

        if (!Number.isInteger(boardId) || boardId < 1) {
            return res.status(400).json({
                message: "Invalid board ID"
            });
        }

        const board = await pool.query(
            "SELECT id FROM boards WHERE id = $1 AND owner_id = $2",
            [boardId, req.user.id]
        );

        if (board.rows.length === 0) {
            return res.status(404).json({
                message: "Board not found"
            });
        }

        const result = await pool.query(
            `SELECT id, board_id, permission, created_at,
                    expires_at, revoked_at
             FROM board_share_links
             WHERE board_id = $1
             ORDER BY created_at DESC`,
            [boardId]
        );

        res.status(200).json({
            message: "Sharing links retrieved successfully",
            shares: result.rows
        });

    } catch (error) {
        console.error("Error retrieving sharing links:", error.message);

        res.status(500).json({
            message: "Failed to retrieve sharing links"
        });
    }
});

router.delete("/:boardId/shares/:shareId", async (req, res) => {
    try {
        const boardId = Number(req.params.boardId);
        const shareId = Number(req.params.shareId);

        if (
            !Number.isInteger(boardId) || boardId < 1 ||
            !Number.isInteger(shareId) || shareId < 1
        ) {
            return res.status(400).json({
                message: "Invalid board ID or share ID"
            });
        }

        const board = await pool.query(
            "SELECT id FROM boards WHERE id = $1 AND owner_id = $2",
            [boardId, req.user.id]
        );

        if (board.rows.length === 0) {
            return res.status(404).json({
                message: "Board not found"
            });
        }

        const result = await pool.query(
            `UPDATE board_share_links
             SET revoked_at = CURRENT_TIMESTAMP
             WHERE id = $1
             AND board_id = $2
             AND revoked_at IS NULL
             RETURNING id, board_id, permission, revoked_at`,
            [shareId, boardId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Sharing link not found or already revoked"
            });
        }

        res.status(200).json({
            message: "Sharing link revoked successfully",
            share: result.rows[0]
        });

    } catch (error) {
        console.error("Error revoking sharing link:", error.message);

        res.status(500).json({
            message: "Failed to revoke sharing link"
        });
    }
});

router.post("/", async (req, res) => {
    try {
        const { name } = req.body;


        const result = await pool.query(
            `INSERT INTO boards (board_name, owner_id)
            VALUES ($1, $2)
            RETURNING *`,
            [name || "Untitled Board", req.user.id]
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
            "SELECT * FROM boards WHERE owner_id = $1 ORDER BY id",
            [req.user.id]
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
            "SELECT * FROM boards WHERE id = $1 AND owner_id = $2",
            [id, req.user.id]
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

router.get("/share/:token", async (req, res) => {
    try {
        const { token } = req.params;

        // Validate token format
        if (!/^[a-f0-9]{64}$/i.test(token)) {
            return res.status(400).json({
                message: "Invalid sharing token"
            });
        }

        // Hash the received token
        const tokenHash = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        // Find an active sharing link and its board
        const result = await pool.query(
            `SELECT
                b.id AS board_id,
                b.board_name,
                b.drawing_data,
                s.permission
             FROM board_share_links s
             JOIN boards b ON b.id = s.board_id
             WHERE s.token_hash = $1
             AND s.revoked_at IS NULL
             AND (s.expires_at IS NULL OR s.expires_at > CURRENT_TIMESTAMP)`,
            [tokenHash]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Sharing link is invalid, expired, or revoked"
            });
        }

        res.status(200).json({
            message: "Board access granted",
            board: result.rows[0]
        });

    } catch (error) {
        console.error("Error validating sharing link:", error.message);

        res.status(500).json({
            message: "Failed to validate sharing link"
        });
    }
});

router.patch("/:id/name", async (req, res) => {
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
             SET board_name = $1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $2 AND owner_id = $3
             RETURNING *`,
            [name.trim(), id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Board not found" });
        }

        res.json(result.rows[0]);

    } catch (error) {
        console.error("Error renaming board:", error.message);
        res.status(500).json({ message: "Failed to rename board" });
    }
});

router.put("/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { name, drawing_data, shareToken } = req.body;

        if (!Number.isInteger(id) || id < 1) {
            return res.status(400).json({ message: "Invalid board ID" });
        }

        if (drawing_data === undefined) {
            return res.status(400).json({
                message: "Drawing data is required"
            });
        }

        // Check whether the user owns the board.
        const ownerResult = await pool.query(
            `SELECT id FROM boards
             WHERE id = $1 AND owner_id = $2`,
            [id, req.user.id]
        );

        if (ownerResult.rows.length > 0) {

            // Only the owner can change the board name.
            if (typeof name !== "string" || !name.trim()) {
                return res.status(400).json({
                    message: "A valid board name is required"
                });
            }

            const result = await pool.query(
                `UPDATE boards
                 SET board_name = $1,
                     drawing_data = $2,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = $3
                 RETURNING *`,
                [name.trim(), JSON.stringify(drawing_data), id]
            );

            return res.json(result.rows[0]);
        }

        // Non-owners must provide a valid EDIT sharing token.
        if (!shareToken || !/^[a-f0-9]{64}$/i.test(shareToken)) {
            return res.status(403).json({
                message: "You do not have editing permission"
            });
        }

        const tokenHash = crypto
            .createHash("sha256")
            .update(shareToken)
            .digest("hex");

        const shareResult = await pool.query(
            `SELECT id FROM board_share_links
             WHERE board_id = $1
             AND token_hash = $2
             AND permission = 'EDIT'
             AND revoked_at IS NULL
             AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)`,
            [id, tokenHash]
        );

        if (shareResult.rows.length === 0) {
            return res.status(403).json({
                message: "Invalid or insufficient sharing permission"
            });
        }

        // EDIT collaborators can update drawing data, not the board name.
        const result = await pool.query(
            `UPDATE boards
             SET drawing_data = $1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $2
             RETURNING *`,
            [JSON.stringify(drawing_data), id]
        );

        res.json(result.rows[0]);

    } catch (error) {
        console.error("Error updating board:", error.message);
        res.status(500).json({
            message: "Failed to update board"
        });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id < 1) {
            return res.status(400).json({ message: "Invalid board ID" });
        }

        const result = await pool.query(
            `DELETE FROM boards
            WHERE id = $1 AND owner_id = $2
            RETURNING *`,
            [id, req.user.id]
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