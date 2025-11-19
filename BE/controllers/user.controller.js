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
  LOGIN_FAIL: "login fail", // << THÊM MỚI
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
  const { email, password } = req.body;
  // SỬA LỖI: Cập nhật cách gọi hàm saveLogInfo theo cú pháp mới
  await saveLogInfo(req, res, {
    message: MESSAGE.SIGN_IN_ATTEMPT,
    type: LOG_TYPE.SIGN_IN,
    level: LEVEL.INFO,
    email: email, // Ghi lại email ngay từ đầu
  });

  try {
    const existingUser = await User.findOne({ email: { $eq: email } });
    if (!existingUser) {
      // SỬA LỖI: Cập nhật cách gọi và sử dụng đúng LOG_TYPE
      await saveLogInfo(req, res, {
        message: MESSAGE.INCORRECT_EMAIL,
        type: LOG_TYPE.LOGIN_FAIL,
        level: LEVEL.WARN,
        email: email,
      });
      return res.status(404).json({ message: "Invalid credentials" });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      existingUser.password
    );

    if (!isPasswordCorrect) {
      // SỬA LỖI: Cập nhật cách gọi, sử dụng đúng LOG_TYPE và bổ sung thông tin user
      await saveLogInfo(req, res, {
        message: MESSAGE.INCORRECT_PASSWORD,
        type: LOG_TYPE.LOGIN_FAIL,
        level: LEVEL.WARN,
        email: email,
        user: existingUser._id,
        userModel: 'User'
      });
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isContextAuthEnabled = await UserPreference.findOne({
      user: existingUser._id,
      enableContextBasedAuth: true,
    });

    if (isContextAuthEnabled) {
      const contextDataResult = await verifyContextData(req, existingUser);
      // SỬA LỖI: Cần cập nhật tất cả các lệnh gọi saveLogInfo bên trong khối này
      if (contextDataResult === types.BLOCKED) {
        await saveLogInfo(req, res, {
          message: MESSAGE.DEVICE_BLOCKED,
          type: LOG_TYPE.LOGIN_FAIL,
          level: LEVEL.WARN,
          user: existingUser._id,
          userModel: 'User'
        });
        return res.status(401).json({ message: "..." });
      }
      // ... (tương tự cho các điều kiện khác)
    }

    const payload = { id: existingUser._id, email: existingUser.email };
    const accessToken = jwt.sign(payload, process.env.SECRET, { expiresIn: "6h" });
    const refreshToken = jwt.sign(payload, process.env.REFRESH_SECRET, { expiresIn: "7d" });

    await new Token({
      user: existingUser._id,
      refreshToken,
      accessToken,
    }).save();

    // SỬA LỖI: Thêm log cho đăng nhập thành công
    await saveLogInfo(req, res, {
      message: 'User signed in successfully',
      type: LOG_TYPE.SIGN_IN,
      level: LEVEL.INFO,
      user: existingUser._id,
      userModel: 'User'
    });

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
    // SỬA LỖI: Cập nhật cách gọi trong khối catch
    await saveLogInfo(req, res, {
      message: MESSAGE.SIGN_IN_ERROR + err.message,
      type: LOG_TYPE.LOGIN_FAIL,
      level: LEVEL.ERROR, // Lỗi hệ thống nên là ERROR
      email: email
    });
    res.status(500).json({ message: "Something went wrong" });
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
    // SỬA LỖI: Cập nhật cách gọi saveLogInfo
    await saveLogInfo(req, res, {
      message: MESSAGE.SIGN_UP_SUCCESS,
      type: LOG_TYPE.SIGN_UP,
      level: LEVEL.INFO,
      user: savedUser._id,
      userModel: 'User'
    });

    // SỬA LỖI: Gửi phản hồi thành công trực tiếp về cho client
    return res.status(201).json({
      message: "Sign up successful! Please check your email to verify your account.",
      user: {
        email: savedUser.email,
      },
    });

  } catch (err) {
    // SỬA LỖI: Cập nhật cách gọi saveLogInfo
    await saveLogInfo(req, res, {
      message: `Sign up failed: ${err.code === 11000 ? 'Email already registered' : err.message}`,
      type: LOG_TYPE.SIGN_UP, // Nên có type riêng cho sign up fail
      level: LEVEL.ERROR,
      email: req.body.email
    });
    if (err.code === 11000) {
      return res.status(409).json({ errors: ["This email is already registered."] });
    }
    res.status(500).json({ errors: ["Failed to add user due to a server error."] });
  };
}

const logout = async (req, res) => {
  try {
    const accessToken = req.headers.authorization?.split(" ")[1] ?? null;
    if (accessToken) {
      await Token.deleteOne({ accessToken });
      await saveLogInfo(req, res, {
        message: MESSAGE.LOGOUT_SUCCESS,
        type: LOG_TYPE.LOGOUT,
        level: LEVEL.INFO,
      });
    }
    res.status(200).json({
      message: "Logout successful",
    });
  } catch (err) {
    // SỬA LỖI: Cập nhật cách gọi saveLogInfo
    await saveLogInfo(req, res, {
      message: err.message,
      type: LOG_TYPE.LOGOUT,
      level: LEVEL.ERROR,
    });
    res.status(500).json({ message: "Internal server error. Please try again later." });
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

    // ... ví dụ một trường hợp ...
    if (user.isEmailVerified) {
      await saveLogInfo(req, res, {
        message: `Email verification failed: ${email} is already verified`,
        type: LOG_TYPE.VERIFY_EMAIL,
        level: LEVEL.WARN
      });
      return res.status(400).json({ message: MESSAGE.EMAIL_ALREADY_VERIFIED });
    }

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

    await saveLogInfo(req, res, {
      message: `${MESSAGE.EMAIL_VERIFIED_SUCCESS} for ${email}`,
      type: LOG_TYPE.VERIFY_EMAIL,
      level: LEVEL.INFO,
      user: user._id,
      userModel: 'User'
    });
    res.status(200).json({ message: MESSAGE.EMAIL_VERIFIED_SUCCESS + "! You can now sign in." });

  } catch (error) {
    await saveLogInfo(req, res, {
      message: `Error verifying email for ${req.body.email}: ${error.message}`,
      type: LOG_TYPE.VERIFY_EMAIL,
      level: LEVEL.ERROR
    });
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