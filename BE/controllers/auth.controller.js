const UserContext = require("../models/context.model");
const UserPreference = require("../models/preference.model");
const SuspiciousLogin = require("../models/suspiciousLogin.model");
const geoip = require("geoip-lite");
const { saveLogInfo } = require("../middlewares/logger/logInfo");
const formatCreatedAt = require("../utils/timeConverter");
const User = require("../models/user.model");
const Token = require("../models/token.model");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { sendEmail } = require("../utils/sendEmail");
const { forgotPasswordHTML } = require("../utils/emailTemplates");
const EmailVerification = require("../models/email.model");

const types = {
  SIGN_IN: "SIGN_IN",
  SIGN_UP: "SIGN_UP",
  SIGN_OUT: "SIGN_OUT",
  POST_DELETED: "POST_DELETED",
  POST_CREATED: "POST_CREATED",
  POST_UPDATED: "POST_UPDATED",
  COMMUNITY_CREATED: "COMMUNITY_CREATED",
  COMMUNITY_DELETED: "COMMUNITY_DELETED",
  COMMUNITY_UPDATED: "COMMUNITY_UPDATED",
  USER_DELETED: "USER_DELETED",
  USER_UPDATED: "USER_UPDATED",
  USER_BANNED: "USER_BANNED",
  USER_UNBANNED: "USER_UNBANNED",
  USER_FOLLOWED: "USER_FOLLOWED",
  USER_UNFOLLOWED: "USER_UNFOLLOWED",
  COMMENT_CREATED: "COMMENT_CREATED",
  COMMENT_DELETED: "COMMENT_DELETED",
  COMMENT_UPDATED: "COMMENT_UPDATED",
  REPLY_CREATED: "REPLY_CREATED",
  REPLY_DELETED: "REPLY_DELETED",
  REPLY_UPDATED: "REPLY_UPDATED",
  POST_REPORTED: "POST_REPORTED",
  POST_APPROVED: "POST_APPROVED",
  POST_REJECTED: "POST_REJECTED",
  MODERATOR_ADDED: "MODERATOR_ADDED",
  MODERATOR_REMOVED: "MODERATOR_REMOVED",
  BLOCKED: "blocked",
  SUSPICIOUS: "suspicious",
  NO_CONTEXT_DATA: "no_context_data",
  ERROR: "error",
};

const verifyContextData = async (req, user) => {
  // ... (Logic to verify context data - this is a placeholder, your original logic might be more complex)
  const context = await UserContext.findOne({ userId: user._id, ip: req.clientIp });
  if (context) {
    if (context.isBlocked) return types.BLOCKED;
    return context;
  }
  return types.NO_CONTEXT_DATA;
};

const addContextData = async (req, res) => {
  try {
    const { user } = req;
    const { isTrusted } = req.query;
    const userContext = await UserContext.findOne({
      userId: user._id,
      ip: user.ip,
      "useragent.browser": user.useragent.browser,
      "useragent.os": user.useragent.os,
      "useragent.platform": user.useragent.platform,
    });
    if (userContext) {
      return res.redirect(`${process.env.CLIENT_URL}/`);
    }
    const newContext = new UserContext({
      userId: user._id,
      ip: user.ip,
      useragent: user.useragent,
      location: user.location,
      isTrusted: isTrusted === "true",
    });
    await newContext.save();
    res.redirect(`${process.env.CLIENT_URL}/`);
  } catch (error) {
    res.status(500).json({ message: "Error adding context data" });
  }
};

const getAuthContextData = async (req, res) => {
  try {
    const { userId } = req;
    const contexts = await UserContext.find({
      userId,
      isTrusted: false,
      isBlocked: false,
    });
    res.status(200).json(contexts);
  } catch (error) {
    res.status(500).json({ message: "Error getting context data" });
  }
};

const getTrustedAuthContextData = async (req, res) => {
  try {
    const { userId } = req;
    const contexts = await UserContext.find({ userId, isTrusted: true });
    res.status(200).json(contexts);
  } catch (error) {
    res.status(500).json({ message: "Error getting trusted context data" });
  }
};

const getBlockedAuthContextData = async (req, res) => {
  try {
    const { userId } = req;
    const contexts = await UserContext.find({ userId, isBlocked: true });
    res.status(200).json(contexts);
  } catch (error) {
    res.status(500).json({ message: "Error getting blocked context data" });
  }
};

const getUserPreferences = async (req, res) => {
  try {
    const { userId } = req;
    const preferences = await UserPreference.findOne({ userId });
    res.status(200).json(preferences);
  } catch (error) {
    res.status(500).json({ message: "Error getting user preferences" });
  }
};

const deleteContextAuthData = async (req, res) => {
  try {
    const { contextId } = req.params;
    await UserContext.findByIdAndDelete(contextId);
    res.status(200).json({ message: "Context deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting context data" });
  }
};

const blockContextAuthData = async (req, res) => {
  try {
    const { contextId } = req.params;
    const context = await UserContext.findById(contextId);
    if (!context) {
      return res.status(404).json({ message: "Context not found" });
    }
    context.isBlocked = true;
    await context.save();
    res.status(200).json({ message: "Context blocked successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error blocking context data" });
  }
};

const unblockContextAuthData = async (req, res) => {
  try {
    const { contextId } = req.params;
    const context = await UserContext.findById(contextId);
    if (!context) {
      return res.status(404).json({ message: "Context not found" });
    }
    context.isBlocked = false;
    await context.save();
    res.status(200).json({ message: "Context unblocked successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error unblocking context data" });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json({ message: "If an account with that email exists, a password reset link has been sent." });
    }

    await Token.deleteOne({ userId: user._id });

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = await bcrypt.hash(resetToken, 10);

    await new Token({
      userId: user._id,
      token: hashedToken,
      createdAt: Date.now(),
    }).save();

    const link = `${process.env.CLIENT_URL}/reset-password/${resetToken}/${user._id}`;
    const emailHTML = forgotPasswordHTML(user.name, link);

    await sendEmail(user.email, "Password Reset Request", emailHTML);

    res.status(200).json({ message: "If an account with that email exists, a password reset link has been sent." });
  } catch (error) {
    res.status(500).json({ message: "An error occurred on the server." });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const { token, userId } = req.params;

    const passwordResetToken = await Token.findOne({ userId });

    if (!passwordResetToken) {
      return res.status(400).json({ message: "Invalid or expired password reset link." });
    }

    const isValid = await bcrypt.compare(token, passwordResetToken.token);

    if (!isValid) {
      return res.status(400).json({ message: "Invalid or expired password reset link." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.updateOne(
      { _id: userId },
      { $set: { password: hashedPassword } },
      { new: true }
    );

    await passwordResetToken.deleteOne();

    res.status(200).json({ message: "Password reset successfully." });
  } catch (error) {
    res.status(500).json({ message: "An error occurred on the server." });
  }
};

const verifyUserEmail = async (req, res) => {
  try {
    const { email, verificationCode } = req.body;

    const verificationRequest = await EmailVerification.findOne({
      email,
      verificationCode,
      for: "signup",
    });

    if (!verificationRequest) {
      return res.status(400).json({ message: "Invalid or expired verification code." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    user.isEmailVerified = true;
    await user.save();

    await EmailVerification.deleteOne({ _id: verificationRequest._id });

    res.status(200).json({ message: "Email verified successfully. You can now sign in." });
  } catch (error) {
    res.status(500).json({ message: "An error occurred on the server." });
  }
};

module.exports = {
  verifyContextData,
  addContextData,
  getAuthContextData,
  getTrustedAuthContextData,
  getUserPreferences,
  getBlockedAuthContextData,
  deleteContextAuthData,
  blockContextAuthData,
  unblockContextAuthData,
  types,
  forgotPassword,
  resetPassword,
  verifyUserEmail,
};