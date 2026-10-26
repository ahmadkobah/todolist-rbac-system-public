const express = require("express");
const { signup, signin } = require("../controllers/authController");
const router = express.Router();

router.post("/signup", signup);
router.post("/login", signin);

module.exports = router;
