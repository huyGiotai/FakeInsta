import * as types from "../constants/adminConstants";

const initialState = {
  logs: [],
  currentPage: 1,
  totalPages: 1,
  totalLogs: 0,
  loadingLogs: true,
  servicePreferences: null,
  communities: null,
  community: null,
  moderators: null,
  adminPanelError: null,
  signInError: null,
};

const adminReducer = (state = initialState, action) => {
  const { type, payload } = action;

  switch (type) {
    case types.SIGN_IN_SUCCESS:
      return {
        ...state,
        signInError: null,
      };
    case types.SIGN_IN_FAIL:
      return {
        ...state,
        signInError: payload ? payload : null,
      };

    case types.LOGOUT_SUCCESS:
      return {
        ...state,
        adminAccessToken: null,
        logs: [],
        servicePreferences: null,
        communities: null,
        community: null,
        moderators: null,
        adminPanelError: null,
        signInError: null,
      };
    case types.GET_LOGS_SUCCESS:
      return {
         ...state,
        logs: payload.logs || [], // Lấy mảng logs từ payload
        currentPage: payload.currentPage,
        totalPages: payload.totalPages,
        totalLogs: payload.totalLogs,
        adminPanelError: null,
      };

    case types.GET_LOGS_FAIL:
      return {
        ...state,
        logs: [], // Trả về mảng rỗng khi có lỗi
        adminPanelError: payload,
      };

    case types.DELETE_LOGS_SUCCESS:
      return {
        ...state,
        adminPanelError: null,
      };

    case types.DELETE_LOGS_FAIL:
      return {
        ...state,
        adminPanelError: payload ? payload : [],
      };

    case types.GET_SERVICE_PREFERENCES_SUCCESS:
      return {
        ...state,
        servicePreferences: payload ? payload : null,
        adminPanelError: null,
      };

    case types.GET_SERVICE_PREFERENCES_FAIL:
      return {
        ...state,
        servicePreferences: null,
        adminPanelError: payload ? payload : null,
      };

    case types.UPDATE_SERVICE_PREFERENCES_SUCCESS:
      return {
        ...state,
        servicePreferences: payload ? payload : null,
        adminPanelError: null,
      };

    case types.GET_COMMUNITIES_SUCCESS:
      return {
        ...state,
        communities: payload ? payload : null,
        adminPanelError: null,
      };

    case types.GET_COMMUNITIES_FAIL:
      return {
        ...state,
        communities: null,
        adminPanelError: payload ? payload : null,
      };

    case types.GET_COMMUNITY_SUCCESS:
      return {
        ...state,
        community: payload ? payload : null,
        adminPanelError: null,
      };
    case types.GET_COMMUNITY_FAIL:
      return {
        ...state,
        community: null,
        adminPanelError: payload ? payload : null,
      };

    case types.GET_MODERATORS_SUCCESS:
      return {
        ...state,
        moderators: payload ? payload : null,
        adminPanelError: null,
      };
    case types.GET_MODERATORS_FAIL:
      return {
        ...state,
        moderators: null,
        adminPanelError: payload ? payload : null,
      };
    case types.ADD_MODERATOR_SUCCESS:
      return {
        ...state,
        adminPanelError: null,
      };
    case types.ADD_MODERATOR_FAIL:
      return {
        ...state,
        adminPanelError: payload ? payload : null,
      };
    case types.REMOVE_MODERATOR_SUCCESS:
      return {
        ...state,
        adminPanelError: null,
      };
    case types.REMOVE_MODERATOR_FAIL:
      return {
        ...state,
        adminPanelError: payload ? payload : null,
      };
    default:
      return state;
  }
};

export default adminReducer;
