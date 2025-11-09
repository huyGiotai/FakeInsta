import * as api from "../api/authAPI";
import * as types from "../constants/authConstants";
import { isValidToken } from "../../utils/authUtils";
import { refreshTokenAction } from "./refreshTokenAction"; // Đảm bảo import này đúng

export const initializeAuth = () => async (dispatch) => {
  const accessToken = JSON.parse(localStorage.getItem("profile"))?.accessToken;
  const refreshToken = JSON.parse(
    localStorage.getItem("profile")
  )?.refreshToken;

  if (accessToken && refreshToken) {
    if (isValidToken(accessToken)) {
      dispatch(setAccessToken(accessToken));
      dispatch(setRefreshToken(refreshToken));
      dispatch(setUserData(JSON.parse(localStorage.getItem("profile")).user));
    } else {
      await dispatch(refreshTokenAction(refreshToken));
    }
  }
};

export const setAccessToken = (accessToken) => async (dispatch) => {
  dispatch({ type: types.SET_ACCESS_TOKEN, payload: accessToken });
};

export const setRefreshToken = (refreshToken) => async (dispatch) => {
  dispatch({ type: types.SET_REFRESH_TOKEN, payload: refreshToken });
};

export const setUserData = (userData) => async (dispatch) => {
  dispatch({ type: types.SET_USER_DATA, payload: userData });
};

export const setInitialAuthState = (navigate) => async (dispatch) => {
  await dispatch({ type: types.LOGOUT });
  navigate("/signin");
};

export const clearMessage = () => async (dispatch) => {
  dispatch({ type: types.CLEAR_MESSAGE });
};

export const clearErrors = () => async (dispatch) => { // THÊM DÒNG NÀY
  dispatch({ type: types.CLEAR_ERRORS });
};

export const logoutAction = () => async (dispatch) => {
  try {
    const { error } = await api.logout(); // SỬA LỖI: Lấy error từ response
    if (error) {
      throw new Error(error);
    }
    localStorage.removeItem("profile");
    dispatch({ type: types.LOGOUT }); // Không cần payload nếu chỉ logout
  } catch (error) {
    dispatch({ type: types.LOGOUT, payload: types.ERROR_MESSAGE });
  }
};

// SỬA LỖI: Đơn giản hóa signUpAction, loại bỏ navigate và isConsentGiven
export const signUpAction = (formData) => async (dispatch) => {
  try {
    dispatch({ type: types.SIGNUP_REQUEST }); // THÊM DÒNG NÀY
    localStorage.removeItem("profile");
    const { error, data } = await api.signUp(formData); // Lấy error và data từ response
    if (error) {
      dispatch({
        type: types.SIGNUP_FAIL,
        payload: error,
      });
    } else {
      dispatch({
        type: types.SIGNUP_SUCCESS,
        payload: {
          message: data.message, // Backend trả về message và user.email
          user: data.user,
        },
      });
    }
  } catch (err) {
    // SỬA LỖI: Trích xuất đúng mảng 'errors' từ phản hồi của axios
    const errorPayload =
      err.response && err.response.data && err.response.data.errors
        ? err.response.data.errors
        : ["An unexpected error occurred. Please try again."];

    dispatch({
      type: types.SIGNUP_FAIL, // SỬA LỖI: Đổi thành SIGNUP_FAIL
      payload: errorPayload,
    });
  }
};

export const signInAction = (formData, navigate) => async (dispatch) => {
  try {
    dispatch({ type: types.SIGNIN_REQUEST }); // THÊM DÒNG NÀY
    const { error, data } = await api.signIn(formData);
    if (error) {
      dispatch({
        type: types.SIGNIN_FAIL,
        payload: error,
      });
    } else {
      const { user, accessToken, refreshToken, accessTokenUpdatedAt } = data;
      const profile = {
        user,
        accessToken,
        refreshToken,
        accessTokenUpdatedAt,
      };
      localStorage.setItem("profile", JSON.stringify(profile));
      dispatch({
        type: types.SIGNIN_SUCCESS,
        payload: profile,
      });
      navigate("/");
    }
  } catch (error) {
    await dispatch({
      type: types.SIGNIN_FAIL,
      payload: error.message || types.ERROR_MESSAGE,
    });
    // navigate("/signin"); // Không cần navigate ở đây, component sẽ xử lý
  }
};

export const getModProfileAction = () => async (dispatch) => {
  try {
    const { error, data } = await api.getModProfile();
    if (error) {
      throw new Error(error);
    }
    dispatch({
      type: types.GET_MOD_PROFILE_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: types.GET_MOD_PROFILE_FAIL,
      payload: types.ERROR_MESSAGE,
    });
  }
};

export const getContextAuthDataAction = () => async (dispatch) => {
  try {
    const { error, data } = await api.getContextAuthData();
    if (error) {
      throw new Error(error);
    }
    dispatch({
      type: types.GET_CONTEXT_AUTH_DATA_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: types.GET_CONTEXT_AUTH_DATA_FAIL,
      payload: types.ERROR_MESSAGE,
    });
  }
};

export const getTrustedContextAuthDataAction = () => async (dispatch) => {
  try {
    const { error, data } = await api.getTrustedContextAuthData();
    if (error) {
      throw new Error(error);
    }
    dispatch({
      type: types.GET_TRUSTED_AUTH_CONTEXT_DATA_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: types.GET_TRUSTED_AUTH_CONTEXT_DATA_FAIL,
      payload: types.ERROR_MESSAGE,
    });
  }
};

export const getUserPreferencesAction = () => async (dispatch) => {
  try {
    const { error, data } = await api.getUserPreferences();
    if (error) {
      throw new Error(error);
    }
    dispatch({
      type: types.GET_USER_PREFERENCES_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: types.GET_USER_PREFERENCES_FAIL,
      payload: types.ERROR_MESSAGE,
    });
  }
};

export const getBlockedAuthContextDataAction = () => async (dispatch) => {
  try {
    const { error, data } = await api.getBlockedAuthContextData();
    if (error) {
      throw new Error(error);
    }
    dispatch({
      type: types.GET_BLOCKED_AUTH_CONTEXT_DATA_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: types.GET_BLOCKED_AUTH_CONTEXT_DATA_FAIL,
      payload: types.ERROR_MESSAGE,
    });
  }
};

export const deleteContextAuthDataAction = (contextId) => async (dispatch) => {
  try {
    const { error } = await api.deleteContextAuthData(contextId);
    if (error) {
      throw new Error(error);
    }
  } catch (error) {
    dispatch({
      type: types.DELETE_CONTEXT_AUTH_DATA_FAIL,
      payload: types.ERROR_MESSAGE,
    });
  }
};

export const blockContextAuthDataAction = (contextId) => async (dispatch) => {
  try {
    const { error } = await api.blockContextAuthData(contextId);
    if (error) {
      throw new Error(error);
    }
  } catch (error) {
    dispatch({
      type: types.BLOCK_CONTEXT_AUTH_DATA_FAIL,
      payload: types.ERROR_MESSAGE,
    });
  }
};

export const unblockContextAuthDataAction = (contextId) => async (dispatch) => {
  try {
    const { error } = await api.unblockContextAuthData(contextId);
    if (error) {
      throw new Error(error);
    }
  } catch (error) {
    dispatch({
      type: types.UNBLOCK_CONTEXT_AUTH_DATA_FAIL,
      payload: types.ERROR_MESSAGE,
    });
  }
};

// SỬA LỖI: Đơn giản hóa forgotPasswordAction, loại bỏ navigate
export const forgotPasswordAction = (email) => async (dispatch) => {
  dispatch({ type: types.FORGOT_PASSWORD_REQUEST });
  try {
    const { error, data } = await api.forgotPasswordAPI(email); // SỬA LỖI: Gọi đúng hàm API
    if (error) {
      throw new Error(error);
    }
    dispatch({ type: types.FORGOT_PASSWORD_SUCCESS, payload: data.message });
  } catch (error) {
    dispatch({ type: types.FORGOT_PASSWORD_FAIL, payload: error.message });
  }
};

// SỬA LỖI: Đơn giản hóa resetPasswordAction, loại bỏ navigate
export const resetPasswordAction =
  (token, userId, password) => async (dispatch) => {
    dispatch({ type: types.RESET_PASSWORD_REQUEST });
    try {
      const { error, data } = await api.resetPasswordAPI(token, userId, password); // SỬA LỖI: Gọi đúng hàm API
      if (error) {
        throw new Error(error);
      }
      dispatch({ type: types.RESET_PASSWORD_SUCCESS, payload: data.message });
      // navigate("/signin"); // Component sẽ xử lý điều hướng
    } catch (error) {
      dispatch({ type: types.RESET_PASSWORD_FAIL, payload: error.message });
    }
  };

export const verifyEmailAction = (formData) => async (dispatch) => {
  try {
    dispatch({ type: types.VERIFY_EMAIL_REQUEST }); // SỬA LỖI: Sử dụng types.
    const { error, data } = await api.verifyEmailAPI(formData); // SỬA LỖI: Gọi đúng hàm API
    if (error) {
      throw new Error(error);
    }
    dispatch({ type: types.VERIFY_EMAIL_SUCCESS, payload: data });
  } catch (error) {
    dispatch({
      type: types.VERIFY_EMAIL_FAIL, // SỬA LỖI: Sử dụng types.
      payload: error.message || "Verification failed",
    });
  }
};