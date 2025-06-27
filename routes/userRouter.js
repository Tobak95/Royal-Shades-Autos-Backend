const router = require("express").Router();
const {
  handleRegister,
  handleVerifyEmail,
  handleLogin,
  resendVerificationEmail,
  handleForgotPassword,
  handleChangePassword,
} = require("../controllers/userController");

const { isLoggedIn } = require("../middleware/auth");

router.post("/register", handleRegister);
router.post("/verify-email/:token", handleVerifyEmail);
router.post("/login", handleLogin);
router.post("/resend-verification-email", resendVerificationEmail);
router.post("/forgot-password", handleForgotPassword);

router.patch("/change-password", handleChangePassword);

module.exports = router;
