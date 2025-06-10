import { JoineeTypes, Roles, Routes } from '@/constants/enums';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { openURL } from './navigation';

interface UserData {
  role: string;
  joineeType: string;
  editRights: boolean;
  allFormsFilled: boolean;
  form1Filled: boolean;
  form2Filled: boolean;
  form3Filled: boolean;
  form4Filled: boolean;
}

const getEmployeeActiveStep = (userData: UserData): number => {
  if (userData.editRights) {
    if (userData.form4Filled) {
      return 4;
    } else if (userData.form3Filled) {
      return 3;
    } else if (userData.form2Filled) {
      return 2;
    } else if (userData.form1Filled) {
      return 1;
    } else if (userData.allFormsFilled) {
      return 4;
    } else {
      return 0;
    }
  }
  return 3;
};

const determineActiveStep = (user: UserData): number => {
  if (user.role === Roles.EMPLOYEE) {
    return getEmployeeActiveStep(user);
  }
  return 3;
};

const getEmployeeNextRoute = (userData: UserData): Routes => {
  if (userData.editRights && userData.joineeType === JoineeTypes.EXISTING && !userData.form1Filled) {
    return Routes.FORMS;
  } else if (userData.editRights && userData.joineeType === JoineeTypes.NEW) {
    if (userData.allFormsFilled) {
      return Routes.PROFILE;
    } else {
      return Routes.FORMS;
    }
  }
  return Routes.PROFILE;
};

const determineTargetRoute = (user: UserData): Routes => {
  if (user.role === Roles.ADMIN) {
    return Routes.DASHBOARD;
  } else if (user.role === Roles.EMPLOYEE) {
    return getEmployeeNextRoute(user);
  }
  return Routes.PROFILE;
};

export const getActiveStepAndRedirect = async (user: UserData) => {
  const activeStep = determineActiveStep(user);
  const targetRoute = determineTargetRoute(user);

  await AsyncStorage.setItem('activeStep', JSON.stringify(activeStep));
  openURL(targetRoute);
};