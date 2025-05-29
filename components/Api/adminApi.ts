import { contactsProps, NotificationGroup, PolicyApiResponse } from "@/constants/interface";
import { ENDPOINTS } from "@/utils/endPoints";
import { getLocalData } from "@/utils/localData";
import apiClient from "./apiClient";

interface UserData {
  userId: string;
}

interface SendReminderParams {
  email: string;
  name: string;
}

export const fetchAllEmployees = async ({
search = '',
page = '1',
limit = '10',
sortBy = 'user.firstName',
sortOrder = 'ASC',
} = {}) => {
const localdata = await getLocalData();
const token = localdata?.token;
const response = await apiClient<contactsProps>(
    `${ENDPOINTS.CONTACTS}?page=${page}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}&search=${encodeURIComponent(search)}`,
    {
    method: 'GET',
    token: token,
    },
);
return response?.employeeProfiles;
};

export const getPolicies = async (): Promise<PolicyApiResponse[]> => {
    const localdata = await getLocalData();
    const token = localdata?.token;
    const data = await apiClient(ENDPOINTS.POLICYS, {
    method: 'GET',
    token: token,
    });
    return Array.isArray(data) ? data : [];

};

export const deletePolicy = async (fileName: string) => {
  const localData = await getLocalData();
  const userdata = localData?.userData as UserData| undefined;
  const userid = userdata?.userId;
  const token = localData?.token;
  return await apiClient(`${ENDPOINTS.DELETE_POLICY}`, {
    method: 'DELETE',
    body: { fileName, userid},
    token: token,
  });
};

export const BirthDayAnniversary = async () => {
    const localdata = await getLocalData();
    const token = localdata?.token;
    const response = await apiClient<NotificationGroup[]>(ENDPOINTS.NOTIFICATION, {
      method: 'GET',
      token: token,
    });
  
    if (Array.isArray(response)) {
      return response; // Return NotificationGroup[] as per the API response
    }
  };

export const fetchEmployeesData = async (
  currentPage: number,
  searchTerm: string,
  limit: number,
  sort: string,
  direction: string,
) => {
  const localdata = await getLocalData();
  const token = localdata?.token;
  const response = await apiClient(
    `${ENDPOINTS.ADMIN_DASHBOARD}?page=${currentPage}&limit=${limit}&sortBy=${sort}&sortOrder=${direction}&search=${searchTerm}`,
    {
      method: 'GET',
      token: token,
    },
  );
  return response;
};

export const sendReminder = async ({ email, name }: SendReminderParams) => {
  const localdata = await getLocalData();
  const token = localdata?.token;
  return await apiClient(ENDPOINTS.SEND_REMINDER, {
    method: 'POST',
    body: { email, name },
    token: token,
  });
};

export const enableEditRights = async (userId: string) => {
  const localdata = await getLocalData();
  const token = localdata?.token;
  return apiClient(
    `${ENDPOINTS.EDIT_RIGHTS}${userId}/edit-rights`,
    {
      method: 'PATCH',
      token: token,
    },
  );
};

export const disableEditRights = async (userId: string) => {
  const localdata = await getLocalData();
  const token = localdata?.token;
  return await apiClient(
    `${ENDPOINTS.EDIT_RIGHTS}${userId}/edit-rights`,
    {
      method: 'PATCH',
      token: token,
    },
  );
};

export const deleteUser = async ({ userId }: { userId: string }) => {
  const localdata = await getLocalData();
  const token = localdata?.token;
  return await apiClient(`${ENDPOINTS.EDIT_RIGHTS}${userId}`, {
    method: 'DELETE',
    body: { userId },
    token: token,
  });
};

export const deleteUserPermanently = async ({ userId }: { userId: string }) => {
  const localdata = await getLocalData();
  const token = localdata?.token;
  return await apiClient(`${ENDPOINTS.DELETE_USER_PERMANENTLY}${userId}`, {
    method: 'DELETE',
    body: { userId },
    token: token,
  });
};
