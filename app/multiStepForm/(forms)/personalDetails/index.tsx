import { getLocalData } from '@/utils/localData';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { TextInput, View } from 'react-native';

export type FormHandle = {
  submit: () => Promise<boolean>;
};

const PersonalDetailsForm = forwardRef<FormHandle>((_, ref) => {
  const [name, setName] = useState('');

  useImperativeHandle(ref, () => ({
    submit: async () => {
      if (!name) {
        alert('Name is required');
        return false;
      }
      const localData = await getLocalData();
      const step = localData?.activeStep || 0;
      if (step<1) {
        AsyncStorage.setItem('activeStep', String(1));
      }

    //   await submitPersonalDetails({ name });
      return true;
    },
  }));

  return (
    <View>
      <TextInput placeholder="Name" value={name} onChangeText={setName} />
    </View>
  );
});

export default PersonalDetailsForm;
