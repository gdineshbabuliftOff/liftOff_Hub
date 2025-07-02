export enum Roles {
    ADMIN = 'ADMIN',
    EMPLOYEE = 'EMPLOYEE',
    EDITOR = 'EDITOR',
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
    DASHBOARD = '/(tabs)/dashboard',
    PROFILE = '/profile',
    FORMS = '/multiStepForm',
  }
  
  
  export enum FormSteps {
    FORM1 = 'form1Filled',
    FORM2 = 'form2Filled',
    FORM3 = 'form3Filled',
    FORM4 = 'form4Filled',
  }
  

  export enum editorPermissions {
    VIEW_ALL_USERS = 'VIEW_USERS',
    UPDATE_EDIT_RIGHTS = 'UPDATE_EDIT_RIGHTS',
    DELETE_USER = 'DELETE_USER',
    EDIT_USER_DETAILS = 'EDIT_USER_DETAILS',
    DELETE_USER_PERMANENTLY = 'DELETE_PERMANENTLY',
    DOWNLOAD_USER_DETAILS = 'DOWNLOAD_USER_DETAILS',
    ADD_USER = 'ADD_USER',
    SEND_REMINDER_MAIL = 'SEND_REMINDER_MAIL',
    DOWNLOAD_USER_DOCUMENTS = 'DOWNLOAD_USER_DOCUMENTS',
    ADMIN_CONTACTS_VIEW = 'VIEW_USER_CONTACTS',
    ADD_POLICY = 'ADD_POLICY',
    DELETE_POLICY = 'DELETE_POLICY',
    MANAGE_SECRET_SANTA = 'MANAGE_SECRET_SANTA',
  }