import { employeeDetailsHeader } from "@/constants/common";
import { contactsProps, NotificationGroup, PolicyApiResponse } from "@/constants/interface";
import { ENDPOINTS } from "@/utils/endPoints";
import { getLocalData } from "@/utils/localData";
import * as FileSystem from 'expo-file-system';
import JSZip from 'jszip';
import { Platform } from 'react-native';
import apiClient from "./apiClient";

interface UserData {
  userId: string;
}

interface SendReminderParams {
  email: string;
  name: string;
}

interface DocumentInfo {
  documentGroup: string;
  name: string;
  documentType: string;
  url: string;
}

interface EmployeeDocumentsResponse {
  [key: string]: DocumentInfo;
}

async function getAuthDetails() {
  const localData = await getLocalData();
  const token = localData?.token;
  const userData = localData?.userData as UserData | undefined;
  const userId = userData?.userId;
  return { token, userId };
}

export const fetchAllEmployees = async ({
  search = '',
  page = '1',
  limit = '10',
  sortBy = 'user.firstName',
  sortOrder = 'ASC',
} = {}) => {
  const { token } = await getAuthDetails();
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
  const { token } = await getAuthDetails();
  const data = await apiClient<PolicyApiResponse[]>(ENDPOINTS.POLICYS, {
    method: 'GET',
    token: token,
  });
  return Array.isArray(data) ? data : [];
};

export const deletePolicy = async (fileName: string) => {
  const { token, userId } = await getAuthDetails();
  return apiClient(`${ENDPOINTS.DELETE_POLICY}`, {
    method: 'DELETE',
    body: { fileName, userid: userId },
    token: token,
  });
};

export const BirthDayAnniversary = async (): Promise<NotificationGroup[]> => {
  const { token } = await getAuthDetails();
  const response = await apiClient<NotificationGroup[]>(ENDPOINTS.NOTIFICATION, {
    method: 'GET',
    token: token,
  });
  return Array.isArray(response) ? response : [];
};

export const fetchEmployeesData = async (
  currentPage: number,
  searchTerm: string,
  limit: number,
  sort: string,
  direction: string,
) => {
  const { token } = await getAuthDetails();
  return apiClient(
    `${ENDPOINTS.ADMIN_DASHBOARD}?page=${currentPage}&limit=${limit}&sortBy=${sort}&sortOrder=${direction}&search=${encodeURIComponent(searchTerm)}`,
    {
      method: 'GET',
      token: token,
    },
  );
};

export const sendReminder = async ({ email, name }: SendReminderParams) => {
  const { token } = await getAuthDetails();
  return apiClient(ENDPOINTS.SEND_REMINDER, {
    method: 'POST',
    body: { email, name },
    token: token,
  });
};

export const enableEditRights = async (userId: string) => {
  const { token } = await getAuthDetails();
  return apiClient(`${ENDPOINTS.EDIT_RIGHTS}${userId}/edit-rights`, {
    method: 'PATCH',
    token: token,
  });
};

export const disableEditRights = async (userId: string) => {
  const { token } = await getAuthDetails();
  return apiClient(`${ENDPOINTS.EDIT_RIGHTS}${userId}/edit-rights`, {
    method: 'PATCH',
    token: token,
  });
};

export const deleteUser = async ({ userId }: { userId: string }) => {
  const { token } = await getAuthDetails();
  return apiClient(`${ENDPOINTS.EDIT_RIGHTS}${userId}`, {
    method: 'DELETE',
    token: token,
  });
};

export const deleteUserPermanently = async ({ userId }: { userId: string }) => {
  const { token } = await getAuthDetails();
  return apiClient(`${ENDPOINTS.DELETE_USER_PERMANENTLY}${userId}`, {
    method: 'DELETE',
    token: token,
  });
};

export const sendSignupMail = async (
  employeeCode: string,
  firstName: string,
  lastName: string,
  dateOfJoining: string,
  email: string,
  designation: string,
  status: string,
  joineeType: string,
  endPoint: string,
  request: any,
  permissions: string[],
  ) => {
  const { token } = await getAuthDetails();
  return apiClient(endPoint, {
  method: request,
  body: {
  employeeCode,
  firstName,
  lastName,
  dateOfJoining,
  email,
  designation,
  status,
  joineeType,
  permissions,
  },
  token: token,
  });
};

export const resignationDate = async (userId: string, date: string) => {
  const { token } = await getAuthDetails();
  return apiClient(`${ENDPOINTS.EDIT_RIGHTS}${userId}/resignation`, {
    method: 'PATCH',
    token: token,
    body: {
      resignationDate: date,
    },
  });
};

export const convertToCSV = (data: any): string => {
  const employeeDetails = data.employeeDetails || {};
  const bankDetails = data.bankAccount || {};

  const row = [
    employeeDetails.employeeCode || '',
    `${data.firstName || ''} ${data.lastName || ''}`.trim(),
    data.email || '',
    data.dateOfBirth || '',
    data.fatherName || '',
    employeeDetails.uan || '',
    employeeDetails.pan || '',
    employeeDetails.aadhar || '',
    employeeDetails.dateOfJoining || '',
    employeeDetails.designation || '',
    data.gender || '',
    employeeDetails.lastWorkingDayOfPreviousOrg || '',
    bankDetails.name || '',
    bankDetails.bankName || '',
    bankDetails.branchName || '',
    bankDetails.ifscCode || '',
    bankDetails.accountNumber || '',
  ];

  const headerString = Array.isArray(employeeDetailsHeader) ? employeeDetailsHeader.join(',') : '';
  const rowString = row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',');

  return [headerString, rowString].join('\n');
};

const sanitizeFileName = (name: string | undefined, defaultName: string): string => {
  return (name || defaultName).replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
};

async function saveFileWithSAF(
  fileName: string,
  mimeType: string,
  content: string,
  encoding: FileSystem.EncodingType,
  tempFileUri?: string
): Promise<void> {
  try {
    const directoryUri = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
    if (!directoryUri.granted) {
      alert('Permission to access storage was denied.');
      if (tempFileUri) {
          alert(`File saved in app's private folder. Path: ${tempFileUri}`);
      }
      return;
    }

    const fileUriInDownloads = await FileSystem.StorageAccessFramework.createFileAsync(
      directoryUri.directoryUri,
      fileName,
      mimeType
    );

    await FileSystem.writeAsStringAsync(fileUriInDownloads, content, { encoding });
    alert(`File "${fileName}" saved successfully to your chosen location!`);

    if (tempFileUri) {
        await FileSystem.deleteAsync(tempFileUri, { idempotent: true });
    }

  } catch (safError: any) {
    alert(`Could not save file to chosen location. Error: ${safError.message}.` +
          (tempFileUri ? ` The file is saved in the app's private folder: ${tempFileUri}` : ''));
  }
}

export const downloadAllDocuments = async ({ userId, userName }: { userId: string; userName: string }) => {
  const zip = new JSZip();
  const sanitizedUserName = sanitizeFileName(userName, 'employee_documents');
  const tempDownloadsDir = FileSystem.cacheDirectory + `tempUserDocs_${Date.now()}/`;

  try {
    await FileSystem.makeDirectoryAsync(tempDownloadsDir, { intermediates: true });
    const { token } = await getAuthDetails();

    const documentsResponse = await apiClient<EmployeeDocumentsResponse>(
      `${ENDPOINTS.DOWNLOAD_EMPLOYEE_DOCUMENTS}${userId}`,
      {
        method: 'GET',
        token: token,
      }
    );

    let documentsFound = false;
    if (documentsResponse) {
      for (const docKey in documentsResponse) {
        if (Object.prototype.hasOwnProperty.call(documentsResponse, docKey)) {
          const docInfo = documentsResponse[docKey];
          if (docInfo && docInfo.url && docInfo.name) {
            documentsFound = true;
            const sanitizedDocName = docInfo.name.replace(/[^a-zA-Z0-9._-]/g, '_');
            const localDocUri = tempDownloadsDir + sanitizedDocName;
            try {
              const downloadedFile = await FileSystem.downloadAsync(docInfo.url, localDocUri);
              const fileBase64 = await FileSystem.readAsStringAsync(downloadedFile.uri, {
                encoding: FileSystem.EncodingType.Base64,
              });
              zip.file(sanitizedDocName, fileBase64, { base64: true });
            } catch (docDownloadError: any) {
              console.error(`Could not download document: ${docInfo.name}. Error: ${docDownloadError.message}`);
            }
          }
        }
      }
    }

    if (!documentsFound) {
      alert('No documents found for this employee or failed to retrieve document list.');
      return;
    }

    const jszipPlatform = Platform.OS === 'windows' ? 'DOS' : 'UNIX';
    const zipContentBase64 = await zip.generateAsync({ type: "base64", platform: jszipPlatform });
    const zipFileName = `${sanitizedUserName}.zip`;
    const finalZipFileUri = FileSystem.documentDirectory + zipFileName;

    await FileSystem.writeAsStringAsync(finalZipFileUri, zipContentBase64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    if (Platform.OS === 'android') {
      await saveFileWithSAF(zipFileName, 'application/zip', zipContentBase64, FileSystem.EncodingType.Base64, finalZipFileUri);
    } else if (Platform.OS === 'ios') {
      alert(`ZIP file "${zipFileName}" has been downloaded to the app's private documents folder. You can access it using the Files app (look for this app's folder under "On My iPhone" or "iCloud Drive"). Path: ${finalZipFileUri}`);
    } else {
        alert(`ZIP file "${zipFileName}" saved to: ${finalZipFileUri}`);
    }

  } catch (error: any) {
    alert(`Failed to download documents: ${error.message}`);
    throw error;
  } finally {
    await FileSystem.deleteAsync(tempDownloadsDir, { idempotent: true });
  }
};

export const downloadAllDetails = async ({ userId, userName }: { userId: string; userName: string }) => {
  const sanitizedUserName = sanitizeFileName(userName, 'employee_details');
  const fileName = `${sanitizedUserName}.csv`;
  const tempFileUri = `${FileSystem.documentDirectory}${fileName}`;

  try {
    const { token } = await getAuthDetails();
    const data = await apiClient(`${ENDPOINTS.DOWNLOAD_EMPLOYEE_DETAILS}${userId}`, {
      method: 'GET',
      token: token,
    });

    if (!data) {
      alert('Failed to fetch employee details. Please try again.');
      throw new Error('Failed to fetch employee details for download.');
    }

    const csvData = convertToCSV(data);
    await FileSystem.writeAsStringAsync(tempFileUri, csvData, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    if (Platform.OS === 'android') {
      await saveFileWithSAF(fileName, 'text/csv', csvData, FileSystem.EncodingType.UTF8, tempFileUri);
    } else if (Platform.OS === 'ios') {
      alert(`File "${fileName}" has been downloaded to the app's private documents folder. You can access it using the Files app (look for this app's folder under "On My iPhone" or "iCloud Drive"). Path: ${tempFileUri}`);
    } else {
        alert(`CSV file "${fileName}" saved to: ${tempFileUri}`);
    }

  } catch (error: any) {
    alert(`Failed to download details: ${error.message}`);
    throw error;
  }
};