import React, { useState, useEffect } from "react"; // THÊM React
import { useNavigate } from "react-router-dom"; // SỬA LỖI: Chỉ cần useNavigate
import { useDispatch, useSelector } from "react-redux";
import {
  verifyEmailAction,
  clearErrors,
} from "../redux/actions/authActions";
import { VERIFICATION_SUCCESS_RESET } from "../redux/constants/authConstants";
import { useDocTitle } from "../hooks/useDocTitle"; // Đảm bảo hook này tồn tại
import SocialEchoLogo from "../assets/SocialEcho.png"; // Đảm bảo đường dẫn logo đúng
import { toast } from "react-toastify"; // SỬA LỖI: Import toast
import ButtonLoadingSpinner from "../components/loader/ButtonLoadingSpinner"; // Đảm bảo component này tồn tại

const VerifyEmail = () => {
  useDocTitle("Verify Email");
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    loading,
    error,
    message, // SỬA LỖI: Lấy message từ state
    pendingVerificationEmail,
    verificationSuccess,
  } = useSelector((state) => state.auth);

  const [verificationCode, setVerificationCode] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!verificationCode || verificationCode.length !== 5) {
      toast.error("Please enter a valid 5-digit code.");
      return;
    }
    const formData = {
      email: pendingVerificationEmail,
      verificationCode,
    };
    dispatch(verifyEmailAction(formData));
  };

  useEffect(() => {
    // Nếu không có email chờ xác thực (ví dụ: refresh trang), quay lại trang đăng ký
    if (!pendingVerificationEmail) {
      navigate("/signup");
    }

    if (error) {
      toast.error(error);
      dispatch(clearErrors());
    }

    // Khi xác thực thành công, thông báo và chuyển đến trang đăng nhập
    if (verificationSuccess) {
      toast.success(message || "Email verified successfully!"); // SỬA LỖI: Hiển thị message từ state
      navigate("/signin");
      dispatch({ type: VERIFICATION_SUCCESS_RESET }); // Reset trạng thái
    }
  }, [
    error,
    dispatch,
    navigate,
    pendingVerificationEmail,
    verificationSuccess,
    message, // SỬA LỖI: Thêm message vào dependency array
  ]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <img
            src={SocialEchoLogo}
            alt="SocialEcho"
            className="w-32 h-32 mx-auto"
          />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Check your email
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            We've sent a 5-digit verification code to{" "}
            <span className="font-medium">{pendingVerificationEmail}</span>.
          </p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="verificationCode"
              className="block text-sm font-medium text-gray-700"
            >
              Verification Code
            </label>
            <input
              id="verificationCode"
              name="verificationCode"
              type="text"
              maxLength="5"
              required
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              className="w-full px-3 py-2 mt-1 text-center tracking-[1em] border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={loading}
              className="flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
            >
              {loading ? <ButtonLoadingSpinner /> : "Verify"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VerifyEmail;