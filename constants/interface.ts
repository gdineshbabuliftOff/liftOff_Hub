
export interface LoginResponse {
    access_token: string;
  }

export interface apiResponse {
    status: string;
}
  

export interface UserData {
    userId: number;
    email: string;
    role: 'ADMIN' | 'USER';
    status: string;
    joineeType: 'NEW' | 'EXISTING';
    editRights: boolean;
    form1Filled: boolean;
    form2Filled: boolean;
    form3Filled: boolean;
    form4Filled: boolean;
    allFormsFilled: boolean;
    permissions: string[];
    iat?: number;
    exp?: number;
  }
  
  export interface contactsProps {
    employeeProfiles: any;
  }

export interface PolicyApiResponse {
  signedUrl: string;
  fileName: string;
  lastUpdated: string;
  progress: number;
  newPolicy: boolean;
}

export interface Notification {
  fullName: string;
  email: string;
  type: 'birthday' | 'anniversary';
  years?: number;
}

export interface NotificationGroup {
  date: string;
  events: Notification[];
}

export interface UserData {
  userId: number;
}

export interface LocalUserData {
  token: string;
  activeStep: number;
  userData: UserData;
}

export interface EmployeeDetailsUtils {
  email: string;
  status: string;
  employeeCode: string;
  designation: string;
  editRights: boolean;
  joineeType: string;
  firstName: string;
  lastName: string;
  photoUrl?: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  fatherName: string;
  dateOfJoining: string;
  lastWorkingDayOfPreviousOrg?: string;
  aadharCard: string;
  panCard: string;
  uan?: string;
  currentAddress: string;
  permanentAddress: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  bloodGroup: string;
  bankFullName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branch: string;
  documents: Document[];
  allFieldsFilled: boolean;
  bio: string;
  bankAccount: any;
  employeeDetails: any;
}

export interface Employee {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  employeeCode: string;
  status: string;
  designation?: string;
  dateOfJoining?: string;
  photoUrl?: string;
  editRights: boolean;
  joineeType?: string;
  allFieldsFilled?: boolean;
}

export interface EmployeeFormData {
  employeeCode: string;
  firstName: string;
  lastName: string;
  dateOfJoining: string;
  email: string;
  designation: string;
  status: 'Fresher' | 'Experienced' | string;
  joineeType: 'NEW' | 'EXISTING';
}

export const initialFormData: EmployeeFormData = {
  employeeCode: '',
  firstName: '',
  lastName: '',
  dateOfJoining: '',
  email: '',
  designation: '',
  status: 'Fresher',
  joineeType: 'NEW',
};

export interface FormErrors {
  employeeCode?: string;
  firstName?: string;
  lastName?: string;
  dateOfJoining?: string;
  email?: string;
  designation?: string;
  status?: string;
  joineeType?: string;
  general?: string;
}

export interface EmployeesApiResponse {
  data: Employee[];
  total: number;
}