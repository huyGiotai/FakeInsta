const rateLimit = require("express-rate-limit");
const { saveLogInfo } = require("../logger/logInfo");

// THÊM MỚI: Định nghĩa các hằng số log để sử dụng nội bộ
const LOG_TYPE = {
  SECURITY: "security",
};
const LEVEL = {
  WARN: "warn",
};

// --- CÁC LIMITER CŨ CỦA BẠN (GIỮ NGUYÊN) ---
const MESSAGE = "Too many requests, please try again later.";
const createLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { message: message },
  });
};
const configLimiter = createLimiter(60 * 60 * 1000, 3500, MESSAGE);
const logLimiter = createLimiter(60 * 60 * 1000, 3500, MESSAGE);
const createPostLimiter = createLimiter(5 * 60 * 1000, 20, MESSAGE);
const likeSaveLimiter = createLimiter(10 * 60 * 1000, 250, MESSAGE);
const followLimiter = createLimiter(10 * 60 * 1000, 100, MESSAGE);
const commentLimiter = createLimiter(5 * 60 * 1000, 100, MESSAGE);
// --- KẾT THÚC CÁC LIMITER CŨ ---


// NÂNG CẤP: Tạo một bộ giới hạn đăng nhập mới, an toàn hơn và có khả năng ghi log
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Cửa sổ thời gian: 15 phút
  max: 10, // Tối đa 10 yêu cầu từ mỗi IP trong cửa sổ thời gian trên
  standardHeaders: true, // Gửi header tiêu chuẩn về rate limit (RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset)
  legacyHeaders: false, // Tắt các header cũ (X-RateLimit-*)
  
  // Đây là phần quan trọng nhất:
  // Hàm này sẽ được gọi khi một yêu cầu bị chặn
  handler: async (req, res, next, options) => {
    // Ghi lại một log bảo mật
    await saveLogInfo(req, res, {
      message: `Rate limit exceeded for sign-in attempts. IP blocked for 15 minutes.`,
      type: LOG_TYPE.SECURITY,
      level: LEVEL.WARN,
      // Cố gắng lấy email từ body của request để log lại
      email: req.body.email || 'N/A' 
    });

    // Gửi thông báo lỗi về cho client
    res.status(options.statusCode).send({ message: options.message });
  },

  message: "Too many login attempts from this IP. For security reasons, you have been blocked for 15 minutes.",
});


module.exports = {
  configLimiter,
  logLimiter,
  createPostLimiter,
  likeSaveLimiter,
  followLimiter,
  commentLimiter,
  loginLimiter, // << Xuất ra loginLimiter mới
};