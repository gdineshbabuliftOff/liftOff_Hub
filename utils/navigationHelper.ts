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

export const getActiveStepAndRedirect = async (user: UserData) => {
  let targetRoute = Routes.PROFILE;
  let activeStep = 0;

  const {
    role,
    joineeType,
    editRights,
    allFormsFilled,
    form1Filled,
    form2Filled,
    form3Filled,
    form4Filled,
  } = user;

  if (role === Roles.ADMIN) {
    targetRoute = Routes.DASHBOARD;
  } else if (role === Roles.EMPLOYEE && joineeType === JoineeTypes.NEW) {
    if (!editRights || allFormsFilled) {
      targetRoute = Routes.PROFILE;
    } else if (!form1Filled) {
      targetRoute = Routes.FORM1;
      activeStep = 0;
    } else if (!form2Filled) {
      targetRoute = Routes.FORM2;
      activeStep = 1;
    } else if (!form3Filled) {
      targetRoute = Routes.FORM3;
      activeStep = 2;
    } else if (!form4Filled) {
      targetRoute = Routes.FORM4;
      activeStep = 3;
    }
  } else if (role === Roles.EMPLOYEE && joineeType === JoineeTypes.EXISTING) {
    if (!editRights || allFormsFilled || form1Filled) {
      targetRoute = Routes.PROFILE;
    } else {
      targetRoute = Routes.FORM1;
      activeStep = 0;
    }
  }

  await AsyncStorage.setItem('activeStep', JSON.stringify(activeStep));
  // openURL('/home');
  openURL(targetRoute);
};
