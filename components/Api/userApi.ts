import { Roles } from "@/constants/enums";
import { EmployeeDetailsUtils } from "@/constants/interface";
import { ENDPOINTS } from "@/utils/endPoints";
import { getLocalData } from "@/utils/localData";
import AsyncStorage from "@react-native-async-storage/async-storage";
import apiClient from "./apiClient";

type ParsedUserData = {
  userId: string;
  role: Roles;
  [key: string]: any;
};


export interface RNImagePickerAsset {
  uri: string;
  fileName?: string;
  type?: string;
  fileSize?: number;
}

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

export const replaceEmptyStringsWithNull = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(replaceEmptyStringsWithNull);
  } else if (obj && typeof obj === 'object') {
    return Object.keys(obj).reduce(
      (acc, key) => {
        acc[key] =
          obj[key] === '' ? null : replaceEmptyStringsWithNull(obj[key]);
        return acc;
      },
      {} as Record<string, any>,
    );
  }
  return obj;
};

export const cleanData = (data: any): any => {
  if (data === null || data === undefined) return '';
  if (typeof data === 'object' && !Array.isArray(data)) {
    return Object.keys(data).reduce((acc: { [key: string]: any }, key: string) => {
      acc[key] = cleanData(data[key]);
      return acc;
    }, {});
  }
  return data;
};


export const personalDetailsService = {
  async fetchPersonalDetails() {
    const localdata = await getLocalData();
    const token = localdata?.token;
    const currentUserData: ParsedUserData = localdata?.userData
      ? JSON.parse(localdata.userData)
      : { userId: '', role: Roles.EMPLOYEE };
    const userId = currentUserData?.userId;

    const response = await apiClient(`${ENDPOINTS.PERSONAL_DETAILS}${userId}`, {
      method: 'GET',
      token: token,
    });

    const data = cleanData(response);
    return data;
  },

  // To submit the personalDetails
  async submitPersonalDetails(values: any, proceed: boolean) {
    const localdata = await getLocalData();
    const token = localdata?.token;
    const currentUserData: ParsedUserData = localdata?.userData
      ? JSON.parse(localdata.userData)
      : { userId: '', role: Roles.EMPLOYEE };
    const userId = currentUserData?.userId;
    const payloadValues = replaceEmptyStringsWithNull(values);
    const response = await apiClient(`${ENDPOINTS.PERSONAL_DETAILS}${userId}`, {
      method: 'PATCH',
      token: token,
      body: payloadValues,
    });

    if (response) {
      if (proceed) {
        const localData = await getLocalData();
        const step = localData?.activeStep || 0;
        if (step < 1) {
          AsyncStorage.setItem('activeStep', String(1));
        }
        return {
          success: true,
          message: 'personalDetailsSubmitted',
        };
      }
      return { success: true, message: 'personalDetailsSaved' };
    }
  },
};

export const fetchProfilePic = async (): Promise<string | null> => {
  const localdata = await getLocalData();
  const token = localdata?.token;
  const currentUserData: ParsedUserData = localdata?.userData
    ? JSON.parse(localdata.userData)
    : { userId: '', role: Roles.EMPLOYEE };
  const userId = currentUserData?.userId;

  const response = await apiClient(
    `${ENDPOINTS.DOCUMENTS}${userId}/profilePicture`,
    {
      method: 'GET',
      token: token,
    },
  ) as { profilePicture: { url: string } | null } | null;

  return response?.profilePicture?.url ?? null;
};

export const uploadProfilePicture = async (
  asset: RNImagePickerAsset,
): Promise<string | null> => {
  const localdata = await getLocalData();
  const token = localdata?.token;
  const currentUserData: ParsedUserData = localdata?.userData
    ? JSON.parse(localdata.userData)
    : { userId: '', role: Roles.EMPLOYEE };
  const userId = currentUserData?.userId;
  const MAX_FILE_SIZE_MB = 10;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1000 * 1000;

  try {
    if (asset.fileSize && asset.fileSize > MAX_FILE_SIZE_BYTES) {
      throw new Error(`File size exceeds the limit of ${MAX_FILE_SIZE_MB}MB.`);
    }
    const payload = {
      fileName: asset.fileName,
      documentType: 'profilePicture',
    };
    const response1 = await apiClient(
      `${ENDPOINTS.DOCUMENTS}${userId}/upload`,
      {
        method: 'POST',
        token: token,
        body: payload,
      },
    );

    if (!response1) {
      throw new Error("API did not return a valid response for pre-signed URL.");
    }

    const { preSignedUrl } = response1 as { preSignedUrl: string };

    await apiClient(preSignedUrl, {
      method: 'PUT',
      body: asset,
      headers: {
        'Content-Type': asset.type || 'application/octet-stream',
      },
    });

    return preSignedUrl;
  } catch (error: any) {
    console.error('failedToFetch', error);
    throw new Error(error.message || 'failedToFetch');
  }
};