import { getLocalData } from '@/utils/localData';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { Switch, Text, View } from 'react-native';
// import { submitAgreement } from '../api/submitAgreement';

export type FormHandle = {
  submit: () => Promise<boolean>;
};

const AgreementForm = forwardRef<FormHandle>((_, ref) => {
  const [agreed, setAgreed] = useState(false);

  useImperativeHandle(ref, () => ({
    submit: async () => {
      if (!agreed) {
        alert('You must agree to continue');
        return false;
      }
      const localData = await getLocalData();
      const step = localData?.activeStep || 0;
      if (step<4) {
        AsyncStorage.setItem('activeStep', String(4));
      }
    //   await submitAgreement({ agreed });
      return true;
    },
  }));

  return (
    <View>
      <Text>Do you agree to the terms and conditions?</Text>
      <Switch value={agreed} onValueChange={setAgreed} />
    </View>
  );
});

export default AgreementForm;
