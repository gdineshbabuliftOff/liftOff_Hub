import { ENDPOINTS } from "@/utils/endPoints";
import apiClient from "./apiClient";
import { getLocalData } from "@/utils/localData";
import { apiResponse, LoginResponse } from "@/constants/interface";

export const loginUser = async (body: any) => {
  const localData = await getLocalData();
  const token = localData?.token || '';

  return apiClient<LoginResponse> (ENDPOINTS.LOGIN, {
    method: 'POST',
    body,
  });
};

export const registerUser = async (body: any) => {
  
    return apiClient<LoginResponse> (ENDPOINTS.SIGNUP, {
      method: 'PATCH',
      body,
    });
  };

export const sendResetPasswordLink = async (body: any) => {
  
    return apiClient<apiResponse> (ENDPOINTS.FORGOT_PASSWORD, {
      method: 'POST',
      body,
    });
  };

export const resetUserPassword = async (body: any) => {

  return apiClient<apiResponse> (ENDPOINTS.RESET_PASSWORD, {
    method: 'PATCH',
    body,
  });
};

export const logoutUser = async (token: any) => {

  return apiClient<apiResponse> (ENDPOINTS.LOGOUT, {
    method: 'POST',
    token: token,
  });
};
