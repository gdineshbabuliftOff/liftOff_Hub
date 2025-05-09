export enum Roles {
    ADMIN = 'ADMIN',
    USER = 'USER',
  }
  
  export enum JoineeTypes {
    NEW = 'NEW',
    EXISTING = 'EXISTING',
  }
  
  export enum Routes {
    LOGIN = '(auth)/login',
    SIGNUP = '(auth)/signUp',
    FORGOT_PASSWORD = '(auth)/forgot-password',
    RESET_PASSWORD = '(auth)/reset-password',
    HOME = '/home',
    DASHBOARD = '/dashBoard',
    PROFILE = '/profile',
    FORM1 = '/forms/form1',
    FORM2 = '/forms/form2',
    FORM3 = '/forms/form3',
    FORM4 = '/forms/form4',
  }
  
  
  export enum FormSteps {
    FORM1 = 'form1Filled',
    FORM2 = 'form2Filled',
    FORM3 = 'form3Filled',
    FORM4 = 'form4Filled',
  }
  