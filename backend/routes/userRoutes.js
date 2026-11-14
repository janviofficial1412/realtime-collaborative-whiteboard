const express = require("express");
const router = express.Router();

const { registerUser, loginUser, refreshAccessToken ,logoutUser} = require("../controllers/userController");
const { authenticateToken } = require("../middleware/authMiddleware");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/refresh", refreshAccessToken);
router.post("/logout", logoutUser);

module.exports = router;