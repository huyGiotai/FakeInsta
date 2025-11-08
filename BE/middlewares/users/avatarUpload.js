const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Đường dẫn đến thư mục lưu trữ avatar
const up_folder = path.join(__dirname, "../../assets/userAvatars");

// Cấu hình nơi lưu trữ và tên file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Tạo thư mục nếu nó chưa tồn tại
    if (!fs.existsSync(up_folder)) {
      fs.mkdirSync(up_folder, { recursive: true });
    }
    cb(null, up_folder);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

// Khởi tạo multer với các cấu hình đã định nghĩa
const avatarUpload = multer({
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // Giới hạn 20MB
  },
  fileFilter: (req, file, cb) => {
    // Chỉ chấp nhận các file ảnh
    if (
      file.mimetype === "image/jpeg" ||
      file.mimetype === "image/jpg" ||
      file.mimetype === "image/png"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Chỉ chấp nhận các tệp ảnh định dạng JPEG, JPG, PNG!"), false);
    }
  },
});

// Xuất đối tượng multer đã được cấu hình
module.exports = avatarUpload;