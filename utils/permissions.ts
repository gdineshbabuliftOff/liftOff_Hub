import { editorPermissions, Roles } from "@/constants/enums";
import { getLocalData } from "./localData";


interface ParsedUserData {
  role: Roles;
  permissions: string[];
}

const getParsedUserData = async (): Promise<ParsedUserData | null> => {
  const localData = await getLocalData();
  if (!localData) return null;

  try {
    return JSON.parse(localData.userData);
  } catch (e) {
    console.error('Failed to parse userData', e);
    return null;
  }
};

export const isEditor = async (): Promise<boolean> => {
  const data = await getParsedUserData();
  return data?.role === Roles.EDITOR;
};

export const isAdmin = async (): Promise<boolean> => {
  const data = await getParsedUserData();
  return data?.role === Roles.ADMIN;
};

export const isUser = async (): Promise<boolean> => {
  const data = await getParsedUserData();
  return data?.role === Roles.EMPLOYEE;
};

const hasPermission = async (permission: string): Promise<boolean> => {
  const data = await getParsedUserData();
  return data?.permissions?.includes(permission) ?? false;
};

export const viewUsers = () => hasPermission(editorPermissions.VIEW_ALL_USERS);
export const addNewUsers = () => hasPermission(editorPermissions.ADD_USER);
export const addPolicy = () => hasPermission(editorPermissions.ADD_POLICY);
export const deletePolicy = () => hasPermission(editorPermissions.DELETE_POLICY);
export const deleteUser = () => hasPermission(editorPermissions.DELETE_USER);
export const deleteUserPermanently = () => hasPermission(editorPermissions.DELETE_USER_PERMANENTLY);
export const downloadUserDetails = () => hasPermission(editorPermissions.DOWNLOAD_USER_DETAILS);
export const downloadUserDocuments = () => hasPermission(editorPermissions.DOWNLOAD_USER_DOCUMENTS);
export const editUserDetails = () => hasPermission(editorPermissions.EDIT_USER_DETAILS);
export const manageSecretSanta = () => hasPermission(editorPermissions.MANAGE_SECRET_SANTA);
export const sendReminder = () => hasPermission(editorPermissions.SEND_REMINDER_MAIL);
export const updateEditRights = () => hasPermission(editorPermissions.UPDATE_EDIT_RIGHTS);
export const adminContactsView = () => hasPermission(editorPermissions.ADMIN_CONTACTS_VIEW);
