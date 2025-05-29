import { EmployeeDetailsUtils } from "@/constants/interface";
import { ENDPOINTS } from "@/utils/endPoints";
import { getLocalData } from "@/utils/localData";
import apiClient from "./apiClient";

export const fetchEmployeeProfile = async (userId: any) => {
    const localdata = await getLocalData();
        const token = localdata?.token;
    return await apiClient<EmployeeDetailsUtils>(
      `${ENDPOINTS.PROFILE}${userId}`,
      {
        method: 'GET',
        token: token,
      },
    );
  };