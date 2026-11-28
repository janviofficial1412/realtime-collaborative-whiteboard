const bcrypt = require("bcrypt");
const pool = require("../db");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");


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

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body || {};

        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required."
            });
        }

        // Validate input types
        if (
            typeof email !== "string" ||
            typeof password !== "string"
        ) {
            return res.status(400).json({
                message: "Email and password must be strings."
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Find user in database
        const result = await pool.query(
            `SELECT id, username, email, password_hash
             FROM users
             WHERE LOWER(email) = $1`,
            [normalizedEmail]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        const user = result.rows[0];

        // Verify password
        const isPasswordValid = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        const tokenFamilyId = crypto.randomUUID();

        const accessToken = jwt.sign(
            { userId: user.id },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: "15m" }
        );

        const refreshToken = jwt.sign(
            {
                userId: user.id,
                tokenFamilyId
            },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: "7d" }
        );

        const tokenHash = crypto
            .createHash("sha256")
            .update(refreshToken)
            .digest("hex");

        const expiresAt = new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
        );

        await pool.query(
            `INSERT INTO refresh_tokens
            (user_id, token_hash, token_family_id, expires_at)
            VALUES ($1, $2, $3, $4)`,
            [user.id, tokenHash, tokenFamilyId, expiresAt]
        );

        const refreshCookieName = `refreshToken_${user.id}`;

        res.cookie(refreshCookieName, refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: "/api/users"
        });

        return res.status(200).json({
            message: "Login successful.",
            accessToken,
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });

    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            message: "Internal server error."
        });
    }
};

const refreshAccessToken = async (req, res) => {
    const requestedUserId = Number(req.body?.userId);

    if (!Number.isSafeInteger(requestedUserId) || requestedUserId < 1) {
        return res.status(400).json({
            message: "Valid user ID is required."
        });
    }

    const refreshCookieName = `refreshToken_${requestedUserId}`;
    const refreshToken = req.cookies?.[refreshCookieName];

    if (!refreshToken) {
        return res.status(401).json({
            message: "Refresh token is required."
        });
    }

    let decoded;

    try {
        decoded = jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );
    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired refresh token."
        });
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const tokenHash = crypto
            .createHash("sha256")
            .update(refreshToken)
            .digest("hex");

        const result = await client.query(
            `SELECT *
             FROM refresh_tokens
             WHERE token_hash = $1
             FOR UPDATE`,
            [tokenHash]
        );

        if (result.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(401).json({
                message: "Refresh token not recognized."
            });
        }

        const storedToken = result.rows[0];

        if (storedToken.revoked_at) {
            await client.query(
                `UPDATE refresh_tokens
                 SET revoked_at = CURRENT_TIMESTAMP
                 WHERE token_family_id = $1
                 AND revoked_at IS NULL`,
                [storedToken.token_family_id]
            );

            await client.query("COMMIT");

            return res.status(401).json({
                message: "Refresh token reuse detected. Please log in again."
            });
        }

        if (
            String(storedToken.user_id) !== String(decoded.userId) ||
            String(decoded.userId) !== String(requestedUserId) ||
            storedToken.token_family_id !== decoded.tokenFamilyId ||
            new Date(storedToken.expires_at) <= new Date()
        ) {
            await client.query("ROLLBACK");

            return res.status(401).json({
                message: "Invalid or expired refresh token."
            });
        }

        const newAccessToken = jwt.sign(
            { userId: storedToken.user_id },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: "15m" }
        );

        const newRefreshToken = jwt.sign(
            {
                userId: storedToken.user_id,
                tokenFamilyId: storedToken.token_family_id,
                jti: crypto.randomUUID()
            },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: "7d" }
        );

        const newTokenHash = crypto
            .createHash("sha256")
            .update(newRefreshToken)
            .digest("hex");

        const newExpiresAt = new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
        );

        await client.query(
            `UPDATE refresh_tokens
             SET revoked_at = CURRENT_TIMESTAMP
             WHERE id = $1`,
            [storedToken.id]
        );

        await client.query(
            `INSERT INTO refresh_tokens
             (user_id, token_hash, token_family_id, expires_at)
             VALUES ($1, $2, $3, $4)`,
            [
                storedToken.user_id,
                newTokenHash,
                storedToken.token_family_id,
                newExpiresAt
            ]
        );

        await client.query("COMMIT");

        res.cookie(`refreshToken_${requestedUserId}`, newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: "/api/users"
        });

        return res.status(200).json({
            message: "Token refreshed successfully.",
            accessToken: newAccessToken
        });

    } catch (error) {
        await client.query("ROLLBACK");

        console.error("Token refresh error:", error);

        return res.status(500).json({
            message: "Internal server error."
        });

    } finally {
        client.release();
    }
};

const logoutUser = async (req, res) => {
    try {
        const requestedUserId = Number(req.body?.userId);

        if (!Number.isSafeInteger(requestedUserId) || requestedUserId < 1) {
            return res.status(400).json({
                message: "Valid user ID is required."
            });
        }

        const refreshCookieName = `refreshToken_${requestedUserId}`;
        const refreshToken = req.cookies?.[refreshCookieName];

        // If no refresh token exists, logout is still successful.
        if (!refreshToken) {
            res.clearCookie(refreshCookieName, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
                path: "/api/users"
            });

            return res.status(200).json({
                message: "Logged out successfully."
            });
        }

        // Hash the refresh token to find its database record.
        const tokenHash = crypto
            .createHash("sha256")
            .update(refreshToken)
            .digest("hex");

        // Revoke the refresh token.
        await pool.query(
            `UPDATE refresh_tokens
     SET revoked_at = CURRENT_TIMESTAMP
     WHERE token_hash = $1
     AND user_id = $2
     AND revoked_at IS NULL`,
            [tokenHash, requestedUserId]
        );

        // Remove the refresh-token cookie from the browser.
        res.clearCookie(refreshCookieName, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            path: "/api/users"
        });

        return res.status(200).json({
            message: "Logged out successfully."
        });

    } catch (error) {
        console.error("Logout error:", error);

        return res.status(500).json({
            message: "Internal server error."
        });
    }
};


module.exports = { registerUser, loginUser, refreshAccessToken, logoutUser };