const Log = require("../../models/log.model");
const getCurrentContextData = require("../../utils/contextData");

/**
 * NÂNG CẤP: Hàm lưu log với cấu trúc linh hoạt hơn.
 * @param req - Request object
 * @param res - Response object
 * @param options {object} - Các tùy chọn log { message, type, level, user, email, userModel }
 */
const saveLogInfo = async (req, res, options) => {
  try {
    const { message, type, level, user, email, userModel } = options;
    
    // 1. Lấy dữ liệu context dưới dạng đối tượng
    const { ip, country, city, browser, platform, os, device, deviceType } =
      getCurrentContextData(req);

    const contextData = {
      ipAddress: ip,
      country,
      city,
      deviceType,
      browser,
      platform,
      os,
      device,
    };
    
    // 2. Tạo bản ghi log mới với schema đã được nâng cấp
    const log = new Log({
      message: message || '',
      type,
      level,
      context: contextData,
      endpoint: req.originalUrl,
      method: req.method,
      // Gán thông tin người dùng một cách linh hoạt
      user: user || (req.user ? req.user.id : null),
      userModel: userModel || (req.baseUrl.includes('/admin') ? 'Admin' : 'User'),
      email: email || (req.user ? req.user.email : (req.body ? req.body.email : null)),
    });

    await log.save();
  } catch (error) {
    // SỬA LỖI: Không nên bỏ qua lỗi, hãy log nó ra để gỡ lỗi
    console.error("Failed to save log info:", error);
  }
};

module.exports = { saveLogInfo };