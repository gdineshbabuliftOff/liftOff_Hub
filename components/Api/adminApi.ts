import { contactsProps, NotificationGroup, PolicyApiResponse } from "@/constants/interface";
import { ENDPOINTS } from "@/utils/endPoints";
import { getLocalData } from "@/utils/localData";
import apiClient from "./apiClient";

type ParsedUserData = {
  userId: string;
  [key: string]: any;
};

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
  const userdata = localData?.userData;
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
  