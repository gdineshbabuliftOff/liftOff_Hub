
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
  