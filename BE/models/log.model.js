const mongoose = require("mongoose");

const LogSchema = new mongoose.Schema({
  // THÊM MỚI: Liên kết trực tiếp đến người dùng (nếu đã đăng nhập)
  user: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'userModel' // Tham chiếu động tới User hoặc Admin
  },
  
  // THÊM MỚI: Xác định model của người dùng (User hoặc Admin)
  userModel: {
    type: String,
    enum: ['User', 'Admin']
  },

  // Giữ lại email cho các hành động chưa được xác thực (vd: đăng nhập sai)
  email: { 
    type: String 
  },

  // THAY ĐỔI LỚN: Lưu context dưới dạng đối tượng để có thể truy vấn
  context: {
    ipAddress: String,
    country: String,
    city: String,
    deviceType: String,
    browser: String,
    platform: String,
    os: String,
    device: String,
  },

  // THÊM MỚI: Lưu thông tin về API endpoint và method
  endpoint: {
    type: String,
  },
  method: {
    type: String,
  },

  message: { type: String, required: true },
  type: { type: String, required: true },
  level: { type: String, required: true },
  timestamp: {
    type: Date,
    default: Date.now,
    expires: '7d', // Tự động xóa sau 7 ngày, cú pháp dễ đọc hơn
  },
});

// Không cần mã hóa/giải mã context nữa vì nó đã là một đối tượng
// LogSchema.methods.decryptContext = function () { ... };

module.exports = mongoose.model("Log", LogSchema);