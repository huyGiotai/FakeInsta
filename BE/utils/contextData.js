const geoip = require("geoip-lite");

const getCurrentContextData = (req) => {
  // Ưu tiên sử dụng req.ip là tiêu chuẩn của Express
  const ip = req.ip || req.clientIp || "unknown";

  // SỬA LỖI: Xử lý trường hợp geoip.lookup trả về null (ví dụ: cho localhost)
  // Gán một đối tượng rỗng `{}` thay vì chuỗi "unknown" để tránh lỗi
  const location = geoip.lookup(ip) || {};

  // Giờ đây chúng ta có thể truy cập các thuộc tính một cách an toàn
  const country = location.country || "Unknown";
  const city = location.city || "Unknown";

  // Xử lý an toàn trường hợp req.useragent không tồn tại
  const ua = req.useragent || {};

  const browser = ua.browser
    ? `${ua.browser} ${ua.version}`
    : "Unknown";
  const platform = ua.platform ? String(ua.platform) : "Unknown";
  const os = ua.os ? String(ua.os) : "Unknown";
  const device = ua.device ? String(ua.device) : "Unknown";

  const deviceType = ua.isMobile
    ? "Mobile"
    : ua.isDesktop
    ? "Desktop"
    : ua.isTablet
    ? "Tablet"
    : "Unknown";

  return { ip, country, city, browser, platform, os, device, deviceType };
};

module.exports = getCurrentContextData;