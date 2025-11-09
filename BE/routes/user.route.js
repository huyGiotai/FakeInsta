const router = require("express").Router();
const passport = require("passport");
const useragent = require("express-useragent");
const requestIp = require("request-ip");

const {
  addUser,
  signin,
  logout,
  refreshToken,
  getModProfile,
  getUser,
  updateInfo,
  verifyEmail
} = require("../controllers/user.controller");

const {
  forgotPassword,
  resetPassword,
  verifyUserEmail,
} = require("../controllers/auth.controller");

const {
  getPublicUsers,
  followUser,
  getPublicUser,
  unfollowUser,
  getFollowingUsers,
} = require("../controllers/profile.controller");

const {
  addUserValidator,
  addUserValidatorHandler,
} = require("../middlewares/users/usersValidator");

// SỬA LỖI: Import middleware mới
const { sendSignupVerification } = require("../middlewares/users/sendSignupVerification");
const {
  sendLoginVerificationEmail,
} = require("../middlewares/users/verifyLogin");

const avatarUpload = require("../middlewares/users/avatarUpload");
const {
  signUpSignInLimiter,
  followLimiter,
} = require("../middlewares/limiter/limiter");

const decodeToken = require("../middlewares/auth/decodeToken");
const requireAuth = passport.authenticate("jwt", { session: false }, null);

router.get("/public-users/:id", requireAuth, decodeToken, getPublicUser);
router.get("/public-users", requireAuth, decodeToken, getPublicUsers);
router.get("/moderator", requireAuth, decodeToken, getModProfile);
router.get("/following", requireAuth, decodeToken, getFollowingUsers);
router.get("/:id", requireAuth, getUser);

router.post(
  "/signup",
  signUpSignInLimiter,
  avatarUpload.single("avatar"),
  addUserValidator,
  addUserValidatorHandler,
  addUser,
  sendSignupVerification // SỬA LỖI: Sử dụng middleware mới
);

router.post("/refresh-token", refreshToken);
router.post(
  "/signin",
  signUpSignInLimiter,
  requestIp.mw(),
  useragent.express(),
  signin,
  sendLoginVerificationEmail
);
router.post("/verify-email", verifyEmail); // THÊM TUYẾN ĐƯỜNG NÀY
router.post("/logout", logout);

router.post("/verify-email", verifyUserEmail);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token/:userId", resetPassword);

router.put(
  "/:id",
  requireAuth,
  decodeToken,
  avatarUpload.single("avatar"),
  updateInfo
);

router.use(followLimiter);
router.patch("/:id/follow", requireAuth, decodeToken, followUser);
router.patch("/:id/unfollow", requireAuth, decodeToken, unfollowUser);

module.exports = router;