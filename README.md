# SocialEcho - Hướng dẫn chi tiết

Đây là tài liệu hướng dẫn cài đặt, chạy và tìm hiểu cấu trúc của dự án mạng xã hội SocialEcho.

## Chức năng chính

-   **Xác thực người dùng:** Đăng ký, đăng nhập, JWT, xác thực dựa trên ngữ cảnh (vị trí, IP, thiết bị).
-   **Quản lý người dùng:** Tạo và quản lý hồ sơ, theo dõi người dùng khác.
-   **Bài đăng & Tương tác:** Tạo bài đăng trong các cộng đồng, bình luận, thích bài đăng và bình luận.
-   **Kiểm duyệt nội dung tự động:** Sử dụng các API xử lý ngôn ngữ tự nhiên (Perspective, TextRazor, Hugging Face) để lọc nội dung độc hại, spam...
-   **Quản trị:** Bảng điều khiển cho Admin để quản lý người dùng, cộng đồng, và các cài đặt hệ thống.
-   **Thông báo:** Gửi email thông báo cho các hoạt động bảo mật quan trọng.

## Công nghệ sử dụng

-   **Frontend:** React.js, Redux, Tailwind CSS
-   **Backend:** Node.js, Express.js
-   **Cơ sở dữ liệu:** MongoDB
-   **Xác thực:** Passport.js, JWT
-   **Dịch vụ khác:** Nodemailer (Email), Crypto-js (Mã hóa), Flask & Hugging Face (AI)

---

## Hướng dẫn cài đặt và chạy dự án

Thực hiện theo các bước sau để chạy dự án trên máy của bạn.

### 1. Yêu cầu cần có

-   **Node.js:** Phiên bản 16.x trở lên.
-   **MongoDB:** Cài đặt MongoDB Community Server trên máy hoặc sử dụng tài khoản MongoDB Atlas (khuyến khích).
-   **Git Bash:** (Trên Windows) Để chạy các tệp script `.sh`.



Cấu trúc và chức năng các thành phần
Dưới đây là giải thích chi tiết về cấu trúc thư mục và chức năng của các tệp quan trọng.

Thư mục gốc
client: Chứa toàn bộ mã nguồn của ứng dụng Frontend (React).
server: Chứa toàn bộ mã nguồn của ứng dụng Backend (Node.js/Express).
classifier_server: (Tùy chọn) Chứa mã nguồn của một server AI bằng Python/Flask để phân loại nội dung.
server (Backend)
config/:
db.js: Chứa logic kết nối đến cơ sở dữ liệu MongoDB.
passport.js: Cấu hình chiến lược xác thực JWT bằng Passport.js.
controllers/: Chứa logic xử lý cho các route. Ví dụ, postController.js sẽ chứa các hàm như createPost, getPostById, deletePost.
middleware/:
auth.js: Middleware để kiểm tra xem người dùng đã đăng nhập và có token hợp lệ hay không trước khi cho phép truy cập một route.
error.js: Middleware để bắt và xử lý các lỗi một cách tập trung.
models/: Định nghĩa cấu trúc (schema) cho các đối tượng trong cơ sở dữ liệu MongoDB bằng Mongoose. Mỗi file tương ứng với một collection (ví dụ: user.model.js, post.model.js).
routes/: Định nghĩa các điểm cuối (endpoints) của API. Ví dụ, routes/api/posts.js sẽ định nghĩa các route như POST /api/posts, GET /api/posts/:id.
scripts/: Chứa các script tiện ích để quản trị.
admin_tool.sh: Menu chính để gọi các script khác.
create-admin.js: Script tạo tài khoản admin.
add-community.js: Script thêm cộng đồng mẫu vào CSDL.
app.js: Tệp chính khởi tạo và cấu hình server Express, kết nối các middleware và các tệp route.
client (Frontend)
public/: Chứa các tài sản tĩnh.
index.html: Tệp HTML gốc mà React sẽ gắn ứng dụng vào.
src/: Thư mục mã nguồn chính của ứng dụng React.
assets/: Chứa hình ảnh, icon, và các tài sản khác.
components/: Chứa các thành phần UI có thể tái sử dụng (ví dụ: Button.js, Navbar.js, PostCard.js).
pages/: Chứa các thành phần đại diện cho một trang hoàn chỉnh (ví dụ: HomePage.js, LoginPage.js, ProfilePage.js).
redux/: Chứa toàn bộ logic quản lý trạng thái toàn cục bằng Redux Toolkit.
store.js: Nơi tạo và cấu hình Redux store.
slices/: Mỗi slice quản lý một phần của trạng thái ứng dụng (ví dụ: authSlice.js quản lý trạng thái đăng nhập, postSlice.js quản lý danh sách bài đăng).
services/: Chứa các hàm để giao tiếp với API của backend. Ví dụ, postService.js sẽ chứa các hàm như createPost(postData), getAllPosts().
utils/: Chứa các hàm tiện ích nhỏ, có thể tái sử dụng (ví dụ: formatDate.js).
App.js: Thành phần gốc của ứng dụng, nơi định tuyến (routing) các trang được thiết lập.
index.js: Điểm vào của ứng dụng, nơi render App.js vào DOM.
