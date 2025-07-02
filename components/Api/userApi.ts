import { Roles } from "@/constants/enums";
import { EmployeeDetailsUtils } from "@/constants/interface";
import { ENDPOINTS } from "@/utils/endPoints";
import { getLocalData } from "@/utils/localData";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
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
  width?: number;
  height?: number;
  mimeType?: string;
}

export interface FormValues {
  name: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branchName: string;
}

export interface BankDetailsResponse {
  name?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  branchName?: string;
}

export interface BankDetailsSubmitResponse {
  success: boolean;
  updatedAt?: string;
}

export interface BankDetailsFormValues {
  name: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branchName: string;
}

export interface GetLiftoffResponse {
  url: string;
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
    console.log(asset);
    const fileResponse = await fetch(asset.uri);
    const fileBlob = await fileResponse.blob();

    // Step 3: Upload the Blob to S3
    const uploadResponse = await fetch(preSignedUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': asset.type || 'application/octet-stream',
      },
      body: fileBlob,
    });

    if (!uploadResponse.ok) {
      throw new Error('Upload to presigned URL failed.');
    }

    return preSignedUrl;
  } catch (error: any) {
    Alert.alert('failedToFetch', error);
    throw new Error(error.message || 'failedToFetch');
  }
};


export const fetchDocumentData = async () => {
  const localdata = await getLocalData();
  const token = localdata?.token;
  const currentUserData: ParsedUserData = localdata?.userData
    ? JSON.parse(localdata.userData)
    : { userId: '', role: Roles.EMPLOYEE };
  const userId = currentUserData?.userId;
  const response = await apiClient(`${ENDPOINTS.DOCUMENTS}${userId}`, {
    method: 'GET',
    token: token,
  });
  return await response;
};


export const deleteDocument = async (fieldName: string) => {
  const localdata = await getLocalData();
  const token = localdata?.token;
  const currentUserData: ParsedUserData = localdata?.userData
    ? JSON.parse(localdata.userData)
    : { userId: '', role: Roles.EMPLOYEE };
  const userId = currentUserData?.userId;
  const response = await apiClient(
    `${ENDPOINTS.DOCUMENTS}${userId}/${fieldName}`,
    {
      method: 'DELETE',
      token: token,
    },
  );
  return response;
};

export const fetchBankDetails = async (): Promise<FormValues> => {
  const localdata = await getLocalData();
  const token = localdata?.token;
  const currentUserData: ParsedUserData = localdata?.userData
    ? JSON.parse(localdata.userData)
    : { userId: '', role: Roles.EMPLOYEE };
  const userId = currentUserData?.userId;
  const response = await apiClient<BankDetailsResponse>(
    `${ENDPOINTS.BANK}${userId}`,
    {
      method: 'GET',
      token: token,
    },
  );

  const {
    name = '',
    bankName = '',
    accountNumber = '',
    ifscCode = '',
    branchName = '',
  } = response || {};

  return {
    name,
    bankName,
    accountNumber,
    ifscCode,
    branchName,
  } as FormValues;
};

//submitBankDetails
export const submitBankDetails = async (
  values: FormValues,
): Promise<BankDetailsSubmitResponse> => {
  const localdata = await getLocalData();
  const token = localdata?.token;
  const currentUserData: ParsedUserData = localdata?.userData
    ? JSON.parse(localdata.userData)
    : { userId: '', role: Roles.EMPLOYEE };
  const userId = currentUserData?.userId;
  const response = await apiClient<BankDetailsResponse>(
    `${ENDPOINTS.BANK}${userId}`, {
    method: 'PATCH',
    token: token,
    body: values,
  });
  const data = (await response) as Partial<BankDetailsSubmitResponse>;

  return {
    success: data.success ?? true,
    updatedAt: data.updatedAt ?? new Date().toISOString(),
  };
};

export const getAgreement = async () => {
  const localdata = await getLocalData();
  const token = localdata?.token;
  const currentUserData: ParsedUserData = localdata?.userData
    ? JSON.parse(localdata.userData)
    : { userId: '', role: Roles.EMPLOYEE };
  const userId = currentUserData?.userId;
  const response = await apiClient(`${ENDPOINTS.DOCUMENTS}${userId}/agreement`, {
    method: 'GET',
    token: token,
  });
  return response;
};

//to download the agreement pdf
export const getLiftoffPdfUrl = async (): Promise<string | undefined> => {
  const localdata = await getLocalData();
  const token = localdata?.token;
  const response = await apiClient<GetLiftoffResponse>(
    `${ENDPOINTS.DOCUMENTS}liftOff-agreement`,
    {
      method: 'GET',
      token: token,
    },
  );
  return response?.url;
};
