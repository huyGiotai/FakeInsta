import * as types from "../constants/authConstants";
import {
  GET_COMMUNITY_SUCCESS,
  GET_COMMUNITY_FAIL,
} from "../constants/communityConstants";

const initialState = {
  userData: null,
  refreshToken: null,
  accessToken: null,
  signInError: null,
  signUpError: [], // Giữ lại là mảng để xử lý nhiều lỗi
  error: null, // THÊM DÒNG NÀY cho lỗi chung
  successMessage: null,
  message: null, // THÊM DÒNG NÀY cho thông báo chung
  loading: false,
  isModeratorOfThisCommunity: false,
  contextAuthData: null,
  trustedAuthContextData: [],
  blockedAuthContextData: [],
  userPreferences: null,
  contextAuthError: null,
  pendingVerificationEmail: null,
  verificationSuccess: false,
};

const authReducer = (state = initialState, action) => {
  const { type, payload } = action;

  switch (type) {
    case types.SET_ACCESS_TOKEN:
      return {
        ...state,
        accessToken: payload ? payload : null,
      };
    case types.SET_REFRESH_TOKEN:
      return {
        ...state,
        refreshToken: payload ? payload : null,
      };
    case types.SET_USER_DATA:
      return {
        ...state,
        userData: payload ? payload : null,
      };

    case types.SIGNUP_REQUEST: // THÊM DÒNG NÀY
    case types.SIGNIN_REQUEST: // THÊM DÒNG NÀY
    case types.FORGOT_PASSWORD_REQUEST:
    case types.RESET_PASSWORD_REQUEST:
    case types.VERIFY_EMAIL_REQUEST: // SỬA LỖI: Sử dụng types.
      return {
        ...state,
        loading: true,
        error: null, // Reset lỗi
        message: null, // Reset thông báo
        successMessage: null, // Reset thông báo thành công
        signUpError: [], // Reset lỗi đăng ký
        signInError: null, // Reset lỗi đăng nhập
      };

    case types.SIGNUP_SUCCESS:
      return {
        ...state,
        loading: false, // SỬA LỖI: Đặt loading về false
        signInError: null,
        signUpError: [],
        pendingVerificationEmail: payload.user.email, // Lấy email từ payload
        message: payload.message, // Lấy message từ payload
      };

    case types.SIGNUP_FAIL:
      return {
        ...state,
        loading: false, // SỬA LỖI: Đặt loading về false
        successMessage: null,
        signInError: null,
        signUpError: Array.isArray(payload) ? payload : [payload], // Đảm bảo là mảng
        error: Array.isArray(payload) ? payload[0] : payload, // Lấy lỗi đầu tiên hoặc toàn bộ
      };

    case types.SIGNIN_SUCCESS:
      return {
        ...state,
        loading: false, // SỬA LỖI: Đặt loading về false
        userData: payload ? payload.user : null,
        accessToken: payload ? payload.accessToken : null,
        refreshToken: payload ? payload.refreshToken : null,
        signInError: null,
       successMessage: "Sign in successful!", // SỬA LỖI: Gán một chuỗi thông báo
      };

    case types.SIGNIN_FAIL:
      return {
        ...state,
        loading: false, // SỬA LỖI: Đặt loading về false
        successMessage: null,
        signUpError: [],
        signInError: payload ? payload : null,
        error: payload, // Đặt lỗi chung
      };

    case types.VERIFY_EMAIL_SUCCESS: // SỬA LỖI: Sử dụng types.
      return {
        ...state,
        loading: false,
        pendingVerificationEmail: null,
        verificationSuccess: true,
        message: payload.message, // Lấy message từ payload
        error: null,
      };

    case types.VERIFY_EMAIL_FAIL: // SỬA LỖI: Sử dụng types.
      return {
        ...state,
        loading: false,
        error: payload,
        message: null,
      };

    case types.VERIFICATION_SUCCESS_RESET: // SỬA LỖI: Sử dụng types.
      return {
        ...state,
        verificationSuccess: false,
        message: null, // Reset message sau khi chuyển trang
      };

    case types.LOGOUT:
      return {
        ...state,
        userData: null,
        refreshToken: null,
        accessToken: null,
        signInError: null,
        signUpError: [],
        successMessage: null,
        isModeratorOfThisCommunity: false,
        pendingVerificationEmail: null, // Reset khi logout
        verificationSuccess: false, // Reset khi logout
        error: null,
        message: null,
      };

    case types.REFRESH_TOKEN_SUCCESS:
      return {
        ...state,
        accessToken: payload ? payload.accessToken : null,
        refreshToken: payload ? payload.refreshToken : null,
      };

    case types.REFRESH_TOKEN_FAIL:
      return {
        ...state,
        userData: null,
        refreshToken: null,
        accessToken: null,
        signUpError: [],
        signInError: null,
        successMessage: null,
        isModeratorOfThisCommunity: false,
      };

    case GET_COMMUNITY_SUCCESS:
      const moderators = payload ? payload.moderators : [];
      const isModeratorOfThisCommunity = moderators.some(
        (moderator) => state.userData && moderator === state.userData._id
      ); // SỬA LỖI: Kiểm tra state.userData trước
      return {
        ...state,
        isModeratorOfThisCommunity,
      };

    case GET_COMMUNITY_FAIL:
      return {
        ...state,
        isModeratorOfThisCommunity: false,
      };

    case types.GET_CONTEXT_AUTH_DATA_SUCCESS:
      return {
        ...state,
        contextAuthData: payload ? payload : null,
        contextAuthError: null,
      };

    case types.GET_CONTEXT_AUTH_DATA_FAIL:
      return {
        ...state,
        contextAuthData: null,
        contextAuthError: payload ? payload : null,
      };

    case types.GET_TRUSTED_AUTH_CONTEXT_DATA_SUCCESS:
      return {
        ...state,
        trustedAuthContextData: payload ? payload : [],
        contextAuthError: null,
      };

    case types.GET_TRUSTED_AUTH_CONTEXT_DATA_FAIL:
      return {
        ...state,
        trustedAuthContextData: [],
        contextAuthError: payload ? payload : null,
      };

    case types.GET_USER_PREFERENCES_SUCCESS:
      return {
        ...state,
        userPreferences: payload ? payload : null,
        contextAuthError: null,
      };

    case types.GET_USER_PREFERENCES_FAIL:
      return {
        ...state,
        userPreferences: null,
        contextAuthError: payload ? payload : null,
      };

    case types.GET_BLOCKED_AUTH_CONTEXT_DATA_SUCCESS:
      return {
        ...state,
        blockedAuthContextData: payload ? payload : [],
        contextAuthError: null,
      };

    case types.GET_BLOCKED_AUTH_CONTEXT_DATA_FAIL:
      return {
        ...state,
        blockedAuthContextData: [],
        contextAuthError: payload ? payload : null,
      };

    case types.DELETE_CONTEXT_AUTH_DATA_FAIL:
    case types.UNBLOCK_CONTEXT_AUTH_DATA_FAIL:
    case types.BLOCK_CONTEXT_AUTH_DATA_FAIL:
      return {
        ...state,
        contextAuthError: payload ? payload : null,
      };

    case types.FORGOT_PASSWORD_SUCCESS:
    case types.RESET_PASSWORD_SUCCESS:
      return {
        ...state,
        loading: false,
        successMessage: payload,
        error: null, // Reset lỗi
      };

    case types.FORGOT_PASSWORD_FAIL:
    case types.RESET_PASSWORD_FAIL:
      return {
        ...state,
        loading: false,
        error: payload, // Đặt lỗi chung
        successMessage: null,
      };

    case types.CLEAR_MESSAGE:
      return {
        ...state,
        successMessage: null,
        message: null, // Clear cả message
      };

    case types.CLEAR_ERRORS: // THÊM DÒNG NÀY
      return {
        ...state,
        error: null,
        signInError: null,
        signUpError: [],
        contextAuthError: null,
      };

    default:
      return state;
  }
};

export default authReducer;