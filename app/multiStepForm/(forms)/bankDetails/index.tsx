import { getLocalData } from '@/utils/localData';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { TextInput, View } from 'react-native';
// import { submitBankDetails } from '../api/submitBankDetails';

export type FormHandle = {
  submit: () => Promise<boolean>;
};

const BankDetailsForm = forwardRef<FormHandle>((_, ref) => {
  const [accountNumber, setAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');

  useImperativeHandle(ref, () => ({
    submit: async () => {
      if (!accountNumber || !ifsc) {
        alert('All fields are required');
        return false;
      }
      const localData = await getLocalData();
      const step = localData?.activeStep || 0;
      if (step<3) {
        AsyncStorage.setItem('activeStep', String(3));
      }
    //   await submitBankDetails({ accountNumber, ifsc });
      return true;
    },
  }));

  return (
    <View>
      <TextInput
        placeholder="Account Number"
        value={accountNumber}
        onChangeText={setAccountNumber}
      />
      <TextInput
        placeholder="IFSC Code"
        value={ifsc}
        onChangeText={setIfsc}
      />
    </View>
  );
});

export default BankDetailsForm;
