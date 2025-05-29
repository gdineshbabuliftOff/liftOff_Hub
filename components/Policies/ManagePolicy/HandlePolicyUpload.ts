import apiClient from '@/components/Api/apiClient';
import { ENDPOINTS } from '@/utils/endPoints';
import { getLocalData } from '@/utils/localData';
import * as FileSystem from 'expo-file-system';
import Toast from 'react-native-toast-message';

let currentXhr: XMLHttpRequest | null = null;

type FileInfo = {
  uri: string;
  name: string;
  size: number;
  type: string;
};

type ParsedUserData = {
  userId: string;
  [key: string]: any;
};

const HandlePoliciesUpload = async (
  files: FileList,
  setProgress: (progress: number) => void,
  setName: (name: string) => void,
  setSize: (size: number) => void
): Promise<boolean> => {
  try {
    const file = files[0];
    if (!file) throw new Error('No file selected');

    const { uri, name, size, type } = file as unknown as FileInfo;

    setProgress(0);
    setName(name);
    setSize(size);

    const localData = await getLocalData();
    if (!localData) throw new Error('User not logged in');

    const userdata: ParsedUserData = JSON.parse(localData?.userData);
    const payload = {
      fileName: name,
      fileSize: size,
      userId: userdata.userId,
    };

    const presignedUrlResponse = await apiClient<{ signedUrl: string }>(
      ENDPOINTS.UPLOAD_POLICY,
      {
        method: 'POST',
        body: payload,
        token: localData.token,
      }
    );

    const signedUrl = presignedUrlResponse?.signedUrl;
    if (!signedUrl) throw new Error('Failed to fetch signed URL');

    const uploadRes = await uploadFileWithProgress(signedUrl, uri, type, size, setProgress);

    if (uploadRes.status !== 200) {
      throw new Error('Upload failed');
    }

    setProgress(100);

    Toast.show({
      type: 'success',
      text1: `${name} policy uploaded Successfully!`,
      position: 'bottom',
    });

    return true;
  } catch (error: any) {
    setProgress(0);

    if (error.name === 'AbortError' || error.message === 'Upload aborted') {
      Toast.show({
        type: 'error',
        text1: 'Upload canceled',
        position: 'bottom',
      });
    } else {
      Toast.show({
        type: 'error',
        text1: 'Policy upload failed',
        position: 'bottom',
      });
    }

    return false;
  }
};

const uploadFileWithProgress = async (
  signedUrl: string,
  uri: string,
  type: string,
  fileSize: number,
  setProgress: (progress: number) => void
) => {
  return new Promise<any>(async (resolve, reject) => {
    const xhr = new XMLHttpRequest();
    currentXhr = xhr;

    xhr.open('PUT', signedUrl, true);
    xhr.setRequestHeader('Content-Type', type || 'application/octet-stream');

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const progress = (event.loaded / fileSize) * 100;
        setProgress(progress);
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        resolve({ status: 200 });
      } else {
        reject(new Error('Upload failed'));
      }
    };

    xhr.onerror = () => {
      if (xhr.status === 0) {
        reject(new Error('Upload aborted'));
      } else {
        reject(new Error('Upload failed'));
      }
    };

    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      xhr.send(bytes);
    } catch (err) {
      reject(err);
    }
  });
};

export const cancelCurrentUpload = () => {
  if (currentXhr) {
    currentXhr.abort();
    currentXhr = null;
  }
};

export default HandlePoliciesUpload;
