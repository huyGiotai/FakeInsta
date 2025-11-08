import * as types from "../constants/userConstants";
import { LOGOUT } from "../constants/authConstants";

const initialState = {
  loading: false, // --- THÊM DÒNG NÀY ---
  user: {},
  publicUsers: [],
  publicUserProfile: {},
  followingUsers: [],
  isFollowing: null,
  userError: null,
};

const userReducer = (state = initialState, action) => {
  const { type, payload } = action;

  switch (type) {
    case LOGOUT:
      return {
        ...state,
        user: {},
        publicUsers: [],
        publicUserProfile: {},
        followingUsers: [],
        isFollowing: null,
        userError: null,
      };

    case types.GET_USER_REQUEST:
      return { ...state, loading: true };
    case types.GET_USER_SUCCESS:
      return { ...state, loading: false, user: payload, userError: null };
    case types.GET_USER_FAIL:
      return { ...state, loading: false, userError: payload };

    case types.UPDATE_USER_REQUEST:
      return {
        ...state,
        loading: true, // Bật loading khi bắt đầu cập nhật
      };
    case types.UPDATE_USER_SUCCESS:
      return {
        ...state,
        loading: false,
        // --- SỬA LỖI CUỐI CÙNG TẠI ĐÂY ---
        // Thay vì ghi đè `user: payload`, chúng ta hợp nhất nó.
        // Thao tác này sẽ giữ lại `state.user.posts` và các trường khác,
        // trong khi cập nhật các trường mới từ `payload` (như name, avatar).
        user: { ...state.user, ...payload },
        userError: null,
      };
    case types.UPDATE_USER_FAIL:
      return {
        ...state,
        loading: false, // Tắt loading khi thất bại
        userError: payload,
      };
    case types.GET_PUBLIC_USERS_SUCCESS:
      return {
        ...state,
        publicUsers: payload || [],
        userError: null,
      };

    case types.GET_PUBLIC_USERS_FAIL:
      return { ...state, userError: payload };

    case types.GET_PUBLIC_USER_PROFILE_SUCCESS:
      return {
        ...state,
        publicUserProfile: payload || {},
        userError: null,
        isFollowing: payload?.isFollowing ?? null,
      };

    case types.GET_PUBLIC_USER_PROFILE_FAIL:
      return { ...state, userError: payload };

    case types.CHANGE_FOLLOW_STATUS_SUCCESS:
      return {
        ...state,
        isFollowing: payload ? payload.isFollowing : null,
        userError: null,
      };

    case types.CHANGE_FOLLOW_STATUS_FAIL:
      return { ...state, userError: payload };

    case types.GET_FOLLOWING_USERS_SUCCESS:
      return { ...state, followingUsers: payload, userError: null };

    case types.GET_FOLLOWING_USERS_FAIL:
      return { ...state, userError: payload };

    default:
      return state;
  }
};

export default userReducer;
