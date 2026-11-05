const bcrypt = require("bcrypt");
const pool = require("../db");


const registerUser = async (req, res) => {
    try {
        if (!req.body) {
            return res.status(400).json({
                message: "Request body is required."
            });
        }

        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                message: "Username, email and password are required."
            });
        }

        if (
            typeof username !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string"
        ) {
            return res.status(400).json({
                message: "Username, email and password must be strings."
            });
        }

        const normalizedUsername = username.trim(); 
        const normalizedEmail = email.trim().toLowerCase();

        if (normalizedUsername.length < 3 || normalizedUsername.length > 50) {
            return res.status(400).json({
                message: "Username must be between 3 and 50 characters."
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(normalizedEmail)) {
            return res.status(400).json({
                message: "Please provide a valid email address."
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: "Password must contain at least 6 characters."
            });
        }

        const existingUser = await pool.query(
            "SELECT id FROM users WHERE LOWER(email) = $1",
            [normalizedEmail]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                message: "An account with this email already exists."
            });
        }

        const saltRounds = 12;

        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const result = await pool.query(
            `INSERT INTO users (username, email, password_hash)
             VALUES ($1, $2, $3)
             RETURNING id, username, email, created_at`,
            [normalizedUsername, normalizedEmail, hashedPassword]
        );

        return res.status(201).json({
            message: "User registered successfully.",
            user: result.rows[0]
        });
    } catch (error) {
        console.error("Registration error:", error);

        if (error.code === "23505") {
            return res.status(409).json({
                message: "An account with this email already exists."
            });
        }

        return res.status(500).json({
            message: "Internal server error."
        });
    }
};


module.exports = { registerUser };