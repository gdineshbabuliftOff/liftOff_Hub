import { getLocalData } from '@/utils/localData';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { TextInput, View } from 'react-native';
// import { submitDocuments } from '../api/submitDocuments';

export type FormHandle = {
  submit: () => Promise<boolean>;
};

const DocumentsForm = forwardRef<FormHandle>((_, ref) => {
  const [documentId, setDocumentId] = useState('');

  useImperativeHandle(ref, () => ({
    submit: async () => {
      if (!documentId) {
        alert('Document ID is required');
        return false;
      }
      const localData = await getLocalData();
      const step = localData?.activeStep || 0;
      if (step<2) {
        AsyncStorage.setItem('activeStep', String(2));
      }
    //   await submitDocuments({ documentId });
      return true;
    },
  }));

  return (
    <View>
      <TextInput
        placeholder="Document ID"
        value={documentId}
        onChangeText={setDocumentId}
      />
    </View>
  );
});

export default DocumentsForm;
