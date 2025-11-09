const bcrypt = require("bcrypt");
const User = require("../models/user.model");
const jwt = require("jsonwebtoken");
const Token = require("../models/token.model");
const Post = require("../models/post.model");
const Community = require("../models/community.model");
const UserPreference = require("../models/preference.model");
const formatCreatedAt = require("../utils/timeConverter");
const { verifyContextData, types } = require("./auth.controller");
const { saveLogInfo } = require("../middlewares/logger/logInfo");
const duration = require("dayjs/plugin/duration");
const dayjs = require("dayjs");
dayjs.extend(duration);

const nodemailer = require("nodemailer");
const crypto = require("crypto");


const LOG_TYPE = {
  SIGN_IN: "sign in",
  LOGOUT: "logout",

  SIGN_UP: "sign up", // THÊM LOG_TYPE CHO SIGN_UP
  VERIFY_EMAIL: "verify email", // THÊM LOG_TYPE CHO VERIFY_EMAIL
};

const LEVEL = {
  INFO: "info",
  ERROR: "error",
  WARN: "warn",
};

const MESSAGE = {
  SIGN_IN_ATTEMPT: "User attempting to sign in",
  SIGN_IN_ERROR: "Error occurred while signing in user: ",
  INCORRECT_EMAIL: "Incorrect email",
  INCORRECT_PASSWORD: "Incorrect password",
  DEVICE_BLOCKED: "Sign in attempt from blocked device",
  CONTEXT_DATA_VERIFY_ERROR: "Context data verification failed",
  MULTIPLE_ATTEMPT_WITHOUT_VERIFY:
    "Multiple sign in attempts detected without verifying identity.",
  LOGOUT_SUCCESS: "User has logged out successfully",
  SIGN_UP_SUCCESS: "User registered successfully", // THÊM MESSAGE
  VERIFICATION_CODE_SENT: "Verification email sent", // THÊM MESSAGE
  EMAIL_ALREADY_VERIFIED: "Email is already verified", // THÊM MESSAGE
  INVALID_VERIFICATION_CODE: "Invalid verification code", // THÊM MESSAGE
  VERIFICATION_CODE_EXPIRED: "Verification code has expired", // THÊM MESSAGE
  EMAIL_VERIFIED_SUCCESS: "Email verified successfully", // THÊM MESSAGE
};

// Hàm tạo mã xác thực 5 chữ số/ký tự
const generateVerificationCode = () => {
  return crypto.randomBytes(3).toString('hex').toUpperCase().substring(0, 5); // 5-digit alphanumeric
};

// Hàm gửi email xác thực
const sendVerificationEmail = async (email, code) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Verify your SocialEcho account",
      html: `
        <p>Hello,</p>
        <p>Thank you for registering with SocialEcho. Please use the following code to verify your email address:</p>
        <h3 style="font-size: 24px; font-weight: bold; color: #007bff;">${code}</h3>
        <p>This code will expire in 10 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${email}`);
    await saveLogInfo(null, `${MESSAGE.VERIFICATION_CODE_SENT} to ${email}`, LOG_TYPE.VERIFY_EMAIL, LEVEL.INFO);
  } catch (error) {
    console.error(`Error sending verification email to ${email}:`, error);
    await saveLogInfo(null, `Error sending verification email to ${email}: ${error.message}`, LOG_TYPE.VERIFY_EMAIL, LEVEL.ERROR);
  }
};

const signin = async (req, res, next) => {
  await saveLogInfo(
    req,
    "User attempting to sign in",
    LOG_TYPE.SIGN_IN,
    LEVEL.INFO
  );

  try {
    const { email, password } = req.body;
    const existingUser = await User.findOne({
      email: { $eq: email },
    });
    if (!existingUser) {
      await saveLogInfo(
        req,
        MESSAGE.INCORRECT_EMAIL,
        LOG_TYPE.SIGN_IN,
        LEVEL.ERROR
      );

      return res.status(404).json({
        message: "Invalid credentials",
      });
    }

    // if (!existingUser.isEmailVerified) {
    //   return res.status(401).json({
    //     message: "Your account has not been verified. Please check your email.",
    //   });
    // }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      existingUser.password
    );

    if (!isPasswordCorrect) {
      await saveLogInfo(
        req,
        MESSAGE.INCORRECT_PASSWORD,
        LOG_TYPE.SIGN_IN,
        LEVEL.ERROR
      );

      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    const isContextAuthEnabled = await UserPreference.findOne({
      user: existingUser._id,
      enableContextBasedAuth: true,
    });

    if (isContextAuthEnabled) {
      const contextDataResult = await verifyContextData(req, existingUser);

      if (contextDataResult === types.BLOCKED) {
        await saveLogInfo(
          req,
          MESSAGE.DEVICE_BLOCKED,
          LOG_TYPE.SIGN_IN,
          LEVEL.WARN
        );

        return res.status(401).json({
          message:
            "You've been blocked due to suspicious login activity. Please contact support for assistance.",
        });
      }

      if (
        contextDataResult === types.NO_CONTEXT_DATA ||
        contextDataResult === types.ERROR
      ) {
        await saveLogInfo(
          req,
          MESSAGE.CONTEXT_DATA_VERIFY_ERROR,
          LOG_TYPE.SIGN_IN,
          LEVEL.ERROR
        );

        return res.status(500).json({
          message: "Error occurred while verifying context data",
        });
      }

      if (contextDataResult === types.SUSPICIOUS) {
        await saveLogInfo(
          req,
          MESSAGE.MULTIPLE_ATTEMPT_WITHOUT_VERIFY,
          LOG_TYPE.SIGN_IN,
          LEVEL.WARN
        );

        return res.status(401).json({
          message: `You've temporarily been blocked due to suspicious login activity. We have already sent a verification email to your registered email address. 
          Please follow the instructions in the email to verify your identity and gain access to your account.

          Please note that repeated attempts to log in without verifying your identity will result in this device being permanently blocked from accessing your account.
          
          Thank you for your cooperation`,
        });
      }

      if (contextDataResult.mismatchedProps) {
        const mismatchedProps = contextDataResult.mismatchedProps;
        const currentContextData = contextDataResult.currentContextData;
        if (
          mismatchedProps.some((prop) =>
            [
              "ip",
              "country",
              "city",
              "device",
              "deviceLOG_TYPE",
              "os",
              "platform",
              "browser",
            ].includes(prop)
          )
        ) {
          req.mismatchedProps = mismatchedProps;
          req.currentContextData = currentContextData;
          req.user = existingUser;
          return next();
        }
      }
    }

    const payload = {
      id: existingUser._id,
      email: existingUser.email,
    };

    const accessToken = jwt.sign(payload, process.env.SECRET, {
      expiresIn: "6h",
    });

    const refreshToken = jwt.sign(payload, process.env.REFRESH_SECRET, {
      expiresIn: "7d",
    });

    const newRefreshToken = new Token({
      user: existingUser._id,
      refreshToken,
      accessToken,
    });
    await newRefreshToken.save();

    res.status(200).json({
      accessToken,
      refreshToken,
      accessTokenUpdatedAt: new Date().toLocaleString(),
      user: {
        _id: existingUser._id,
        name: existingUser.name,
        email: existingUser.email,
        role: existingUser.role,
        avatar: existingUser.avatar,
      },
    });
  } catch (err) {
    await saveLogInfo(
      req,
      MESSAGE.SIGN_IN_ERROR + err.message,
      LOG_TYPE.SIGN_IN,
      LEVEL.ERROR
    );

    res.status(500).json({
      message: "Something went wrong",
    });
  }
};

const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("-password").lean();

    const totalPosts = await Post.countDocuments({ user: user._id });

    const communities = await Community.find({ members: user._id });
    const totalCommunities = communities.length;

    const postCommunities = await Post.find({ user: user._id }).distinct(
      "community"
    );
    const totalPostCommunities = postCommunities.length;

    const createdAt = dayjs(user.createdAt);
    const now = dayjs();
    const durationObj = dayjs.duration(now.diff(createdAt));
    const durationMinutes = durationObj.asMinutes();
    const durationHours = durationObj.asHours();
    const durationDays = durationObj.asDays();

    user.totalPosts = totalPosts;
    user.totalCommunities = totalCommunities;
    user.totalPostCommunities = totalPostCommunities;
    user.duration = "";

    if (durationMinutes < 60) {
      user.duration = `${Math.floor(durationMinutes)} minutes`;
    } else if (durationHours < 24) {
      user.duration = `${Math.floor(durationHours)} hours`;
    } else if (durationDays < 365) {
      user.duration = `${Math.floor(durationDays)} days`;
    } else {
      const durationYears = Math.floor(durationDays / 365);
      user.duration = `${durationYears} years`;
    }
    const posts = await Post.find({ user: user._id })
      .populate("community", "name members")
      .limit(20)
      .lean()
      .sort({ createdAt: -1 });

    user.posts = posts.map((post) => ({
      ...post,
      isMember: post.community?.members
        .map((member) => member.toString())
        .includes(user._id.toString()),
      createdAt: formatCreatedAt(post.createdAt),
    }));

    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
};

/**
 * SỬA LỖI: Hàm này chỉ tạo user, sau đó gọi next() để chuyển cho middleware gửi email.
 */
const addUser = async (req, res, next) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const defaultAvatar = "https://raw.githubusercontent.com/nz-m/public-files/main/dp.jpg";

    const fileUrl = req.file?.filename
      ? `${req.protocol}://${req.get("host")}/assets/userAvatars/${req.file.filename}`
      : defaultAvatar;

    const emailDomain = req.body.email.split("@")[1];
    const role = emailDomain === "mod.socialecho.com" ? "moderator" : "general";

    // Tạo mã xác thực và thời gian hết hạn
    const verificationCode = generateVerificationCode();
    const verificationCodeExpires = dayjs().add(10, 'minute').toDate(); // Mã có hiệu lực 10 phút

    const newUser = new User({
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
      role: role,
      avatar: fileUrl,
      isEmailVerified: false, // Mặc định là false khi đăng ký
      verificationCode: verificationCode, // Lưu mã xác thực
      verificationCodeExpires: verificationCodeExpires, // Lưu thời gian hết hạn
    });

    const savedUser = await newUser.save();

    // Gửi email xác thực
    await sendVerificationEmail(savedUser.email, verificationCode);
    await saveLogInfo(req, MESSAGE.SIGN_UP_SUCCESS, LOG_TYPE.SIGN_UP, LEVEL.INFO);


    // SỬA LỖI: Gửi phản hồi thành công trực tiếp về cho client
    return res.status(201).json({
      message: "Sign up successful! Please check your email to verify your account.",
      user: {
        email: savedUser.email,
      },
    });

  } catch (err) {
    if (err.code === 11000) {
      await saveLogInfo(req, `Sign up failed: ${req.body.email} already registered`, LOG_TYPE.SIGN_UP, LEVEL.ERROR);
      return res.status(409).json({ // 409 Conflict
        errors: ["This email is already registered."],
      });
    }

    console.error("Error adding user:", err); // Log lỗi chi tiết
    await saveLogInfo(req, `Error adding user: ${err.message}`, LOG_TYPE.SIGN_UP, LEVEL.ERROR);
    res.status(500).json({
      errors: ["Failed to add user due to a server error."],
    });
  }
};

const logout = async (req, res) => {
  try {
    const accessToken = req.headers.authorization?.split(" ")[1] ?? null;
    if (accessToken) {
      await Token.deleteOne({ accessToken });
      await saveLogInfo(
        null,
        MESSAGE.LOGOUT_SUCCESS,
        LOG_TYPE.LOGOUT,
        LEVEL.INFO
      );
    }
    res.status(200).json({
      message: "Logout successful",
    });
  } catch (err) {
    await saveLogInfo(null, err.message, LOG_TYPE.LOGOUT, LEVEL.ERROR);
    res.status(500).json({
      message: "Internal server error. Please try again later.",
    });
  }
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    const existingToken = await Token.findOne({
      refreshToken: { $eq: refreshToken },
    });
    if (!existingToken) {
      return res.status(401).json({
        message: "Invalid refresh token",
      });
    }
    const existingUser = await User.findById(existingToken.user);
    if (!existingUser) {
      return res.status(401).json({
        message: "Invalid refresh token",
      });
    }

    const refreshTokenExpiresAt =
      jwt.decode(existingToken.refreshToken).exp * 1000;
    if (Date.now() >= refreshTokenExpiresAt) {
      await existingToken.deleteOne();
      return res.status(401).json({
        message: "Expired refresh token",
      });
    }

    const payload = {
      id: existingUser._id,
      email: existingUser.email,
    };

    const accessToken = jwt.sign(payload, process.env.SECRET, {
      expiresIn: "6h",
    });

    res.status(200).json({
      accessToken,
      refreshToken: existingToken.refreshToken,
      accessTokenUpdatedAt: new Date().toLocaleString(),
    });
  } catch (err) {
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

const getModProfile = async (req, res) => {
  try {
    const moderator = await User.findById(req.userId);
    if (!moderator) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const moderatorInfo = {
      ...moderator._doc,
    };
    delete moderatorInfo.password;
    moderatorInfo.createdAt = moderatorInfo.createdAt.toLocaleString();

    res.status(200).json({
      moderatorInfo,
    });
  } catch (err) {
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

const updateInfo = async (req, res) => {
  try {
    if (req.userId !== req.params.id) {
      return res.status(403).json({
        message: "Forbidden: You can only update your own profile.",
      });
    }

    const updateData = {};
    const { name, location, interests, bio } = req.body;

    if (name !== undefined) updateData.name = name;
    if (location !== undefined) updateData.location = location;
    if (interests !== undefined) updateData.interests = interests;
    if (bio !== undefined) updateData.bio = bio;

    if (req.file) {
      const fileUrl = `/assets/userAvatars/${req.file.filename}`;
      updateData.avatar = fileUrl;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { $set: updateData },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(updatedUser);

  } catch (err) {
    res.status(500).json({
      message: "Error updating user info",
    });
  }
};

// THÊM HÀM verifyEmail MỚI NÀY
const verifyEmail = async (req, res) => {
  try {
    const { email, verificationCode } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      await saveLogInfo(req, `Email verification failed: User not found for ${email}`, LOG_TYPE.VERIFY_EMAIL, LEVEL.ERROR);
      return res.status(404).json({ message: "User not found." });
    }

    if (user.isEmailVerified) {
      await saveLogInfo(req, `Email verification failed: ${email} is already verified`, LOG_TYPE.VERIFY_EMAIL, LEVEL.WARN);
      return res.status(400).json({ message: MESSAGE.EMAIL_ALREADY_VERIFIED });
    }

    if (!user.verificationCode || !user.verificationCodeExpires) {
      await saveLogInfo(req, `Email verification failed: No code found for ${email}`, LOG_TYPE.VERIFY_EMAIL, LEVEL.ERROR);
      return res.status(400).json({ message: "No verification code found for this user. Please request a new one." });
    }

    if (user.verificationCode !== verificationCode) {
      await saveLogInfo(req, `Email verification failed: Invalid code for ${email}`, LOG_TYPE.VERIFY_EMAIL, LEVEL.WARN);
      return res.status(400).json({ message: MESSAGE.INVALID_VERIFICATION_CODE });
    }

    if (dayjs().isAfter(dayjs(user.verificationCodeExpires))) {
      await saveLogInfo(req, `Email verification failed: Code expired for ${email}`, LOG_TYPE.VERIFY_EMAIL, LEVEL.WARN);
      return res.status(400).json({ message: MESSAGE.VERIFICATION_CODE_EXPIRED });
    }

    user.isEmailVerified = true;
    user.verificationCode = undefined; // Xóa mã code sau khi xác thực
    user.verificationCodeExpires = undefined; // Xóa thời gian hết hạn
    await user.save();

    await saveLogInfo(req, `${MESSAGE.EMAIL_VERIFIED_SUCCESS} for ${email}`, LOG_TYPE.VERIFY_EMAIL, LEVEL.INFO);
    res.status(200).json({ message: MESSAGE.EMAIL_VERIFIED_SUCCESS + "! You can now sign in." });

  } catch (error) {
    console.error("Error verifying email:", error);
    await saveLogInfo(req, `Error verifying email for ${req.body.email}: ${error.message}`, LOG_TYPE.VERIFY_EMAIL, LEVEL.ERROR);
    res.status(500).json({ message: "Internal server error during email verification." });
  }
};


module.exports = {
  addUser,
  signin,
  logout,
  refreshToken,
  getModProfile,
  getUser,
  updateInfo,
  verifyEmail, // THÊM HÀM NÀY VÀO EXPORTS
};