import axios from "axios"; // SỬA LỖI: Import axios
import { API, handleApiError } from "./utils"; // Đảm bảo API và handleApiError được import từ utils

// Đảm bảo BASE_URL được lấy từ biến môi trường
const BASE_URL = process.env.REACT_APP_SERVER_URL; // SỬA LỖI: Sử dụng REACT_APP_SERVER_URL cho nhất quán

export const signIn = async (formData) => {
  try {
    const res = await API.post("/users/signin", formData, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return { error: null, data: res.data };
  } catch (error) {
    return handleApiError(error);
  }
};

export const signUp = async (formData) => {
  try {
    const res = await API.post("/users/signup", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return { error: null, data: res.data };
  } catch (error) {
    // SỬA LỖI: Đảm bảo trả về message từ backend nếu có
    return {
      error: error.response?.data?.message || error.response?.data?.errors || "Sign up failed",
      data: null,
    };
  }
};

export const logout = async () => {
  try {
    const res = await API.post("/users/logout", {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return { error: null, data: res.data };
  } catch (error) {
    return handleApiError(error);
  }
};

export const getModProfile = async () => {
  try {
    const res = await API.get("/users/moderator");
    return { error: null, data: res.data };
  } catch (error) {
    return handleApiError(error);
  }
};

export const getContextAuthData = async () => {
  try {
    const res = await API.get("/auth/context-data/primary");
    return { error: null, data: res.data };
  } catch (error) {
    return handleApiError(error);
  }
};

export const getTrustedContextAuthData = async () => {
  try {
    const res = await API.get("/auth/context-data/trusted");
    return { error: null, data: res.data };
  } catch (error) {
    return handleApiError(error);
  }
};

export const getBlockedAuthContextData = async () => {
  try {
    const res = await API.get("/auth/context-data/blocked");
    return { error: null, data: res.data };
  } catch (error) {
    return handleApiError(error);
  }
};

export const getUserPreferences = async () => {
  try {
    const res = await API.get("/auth/user-preferences");
    return { error: null, data: res.data };
  } catch (error) {
    return handleApiError(error);
  }
};

export const deleteContextAuthData = async (contextId) => {
  try {
    const res = await API.delete(`/auth/context-data/${contextId}`);
    return { error: null, data: res.data };
  } catch (error) {
    return handleApiError(error);
  }
};

export const blockContextAuthData = async (contextId) => {
  try {
    const res = await API.patch(`/auth/context-data/block/${contextId}`);
    return { error: null, data: res.data };
  } catch (error) {
    return handleApiError(error);
  }
};

export const unblockContextAuthData = async (contextId) => {
  try {
    const res = await API.patch(`/auth/context-data/unblock/${contextId}`);
    return { error: null, data: res.data };
  } catch (error) {
    return handleApiError(error);
  }
};

export const forgotPasswordAPI = async (email) => { // Đổi tên để nhất quán với các API khác
  try {
    const res = await API.post("/users/forgot-password", { email });
    return { error: null, data: res.data };
  } catch (error) {
    return handleApiError(error);
  }
};

export const resetPasswordAPI = async (token, userId, password) => { // Đổi tên để nhất quán với các API khác
  try {
    const res = await API.post(`/users/reset-password/${token}/${userId}`, {
      password,
    });
    return { error: null, data: res.data };
  } catch (error) {
    return handleApiError(error);
  }
};

// SỬA LỖI: Định nghĩa hàm verifyEmailAPI đúng cách
export const verifyEmailAPI = async (formData) => {
  try {
    const res = await API.post("/users/verify-email", formData);
    return { error: null, data: res.data };
  } catch (error) {
    return handleApiError(error);
  }
};