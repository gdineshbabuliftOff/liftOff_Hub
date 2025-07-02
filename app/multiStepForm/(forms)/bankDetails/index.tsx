import { fetchBankDetails, submitBankDetails } from '@/components/Api/userApi';
import { getLocalData } from '@/utils/localData';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Formik, FormikProps } from 'formik';
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Toast from 'react-native-toast-message';
import * as Yup from 'yup';

export type FormHandle = {
  submit: () => Promise<boolean>;
  save: () => Promise<boolean>;
  isSubmitting: boolean;
  isSubmittingSave: boolean;
  isSubmittingNext: boolean;
};

interface BankDetailsFormProps {
  onDirtyChange: (isDirty: boolean) => void;
}

interface FormValues {
  name: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branchName: string;
}

const validationSchema = Yup.object().shape({
  name: Yup.string().required('Name as per bank records is required.'),
  bankName: Yup.string().required('Bank Name is required.'),
  accountNumber: Yup.string().required('Account Number is required.').matches(/^[0-9]+$/, "Account Number must only contain digits."),
  ifscCode: Yup.string().required('IFSC Code is required.').matches(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code format (e.g., ABCD0123456).'),
  branchName: Yup.string().required('Branch Name is required.'),
});

const getInitialFormData = (): FormValues => ({
  name: '',
  bankName: '',
  accountNumber: '',
  ifscCode: '',
  branchName: '',
});

const fieldLabels: { [key in keyof FormValues]: string } = {
  name: 'Name (As per Bank Records)',
  bankName: 'Bank Name',
  accountNumber: 'Account Number',
  ifscCode: 'IFSC Code',
  branchName: 'Branch Name',
};

const BankDetailsForm = forwardRef<FormHandle, BankDetailsFormProps>(({ onDirtyChange }, ref) => {
  const [initialFormValues, setInitialFormValues] = useState<FormValues>(getInitialFormData());
  const [loading, setLoading] = useState(true);
  const [isSubmittingNext, setIsSubmittingNext] = useState(false);
  const [isSubmittingSave, setIsSubmittingSave] = useState(false);
  const formikRef = useRef<FormikProps<FormValues>>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const detailsData = await fetchBankDetails();
      if (detailsData) {
        const newInitialValues = { ...getInitialFormData(), ...detailsData };
        setInitialFormValues(newInitialValues);
        if (formikRef.current) {
          formikRef.current.resetForm({ values: newInitialValues });
        }
      }
    } catch (error) {
      console.error('Failed to fetch bank details:', error);
      Toast.show({
        type: 'error',
        text1: 'Loading Error',
        text2: 'Failed to load your bank details.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useImperativeHandle(ref, () => ({
    submit: async () => {
      if (!formikRef.current) return false;
      setIsSubmittingNext(true);
      try {
        const errors = await formikRef.current.validateForm();
        if (Object.keys(errors).length > 0) {
          formikRef.current.setTouched(Object.keys(errors).reduce((acc, key) => { acc[key as keyof FormValues] = true; return acc; }, {} as { [K in keyof FormValues]?: boolean }));
          Toast.show({
            type: 'error',
            text1: 'Validation Error',
            text2: 'Please correct the errors in the form.',
          });
          return false;
        }

        const result = await submitBankDetails(formikRef.current.values);
        if (result?.success) {
          Toast.show({
            type: 'success',
            text1: 'Success',
            text2: 'Bank details submitted successfully!',
          });
          const localData = await getLocalData();
          const step = localData?.activeStep || 0;
          if (step < 3) {
            await AsyncStorage.setItem('activeStep', String(3));
          }
          setInitialFormValues(formikRef.current.values);
          formikRef.current.resetForm({ values: formikRef.current.values });
          return true;
        } else {
          Toast.show({
            type: 'error',
            text1: 'Submission Error',
            text2: 'Failed to submit bank details.',
          });
          return false;
        }
      } catch (error) {
        console.error('Failed to submit bank details:', error);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'An unexpected error occurred.',
        });
        return false;
      } finally {
        setIsSubmittingNext(false);
      }
    },
    save: async () => {
      if (!formikRef.current) return false;
      if (!formikRef.current.dirty) {
        Toast.show({
          type: 'info',
          text1: 'No Changes',
          text2: 'There are no changes to save.',
        });
        return true;
      }
      setIsSubmittingSave(true);
      try {
        const result = await submitBankDetails(formikRef.current.values);
        if (result?.success) {
          Toast.show({
            type: 'success',
            text1: 'Success',
            text2: 'Details saved successfully!',
          });
          setInitialFormValues(formikRef.current.values);
          formikRef.current.resetForm({ values: formikRef.current.values });
          return true;
        } else {
          Toast.show({
            type: 'error',
            text1: 'Save Error',
            text2: 'Failed to save details.',
          });
          return false;
        }
      } catch (error) {
        console.error('Failed to save bank details:', error);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'An unexpected error occurred while saving.',
        });
        return false;
      } finally {
        setIsSubmittingSave(false);
      }
    },
    isSubmitting: isSubmittingNext || isSubmittingSave,
    isSubmittingSave,
    isSubmittingNext,
  }));

  if (loading) {
    return (
      <View style={styles.centeredView}>
        <ActivityIndicator size="large" color="#90D1CA" />
        <Text style={styles.loadingText}>Loading Bank Details...</Text>
      </View>
    );
  }

  return (
    <Formik
      innerRef={formikRef}
      initialValues={initialFormValues}
      validationSchema={validationSchema}
      enableReinitialize
      onSubmit={() => {}}
    >
      {(formik) => {
        useEffect(() => {
          onDirtyChange(formik.dirty);
        }, [formik.dirty, onDirtyChange]);

        return (
          <KeyboardAwareScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContentContainer}
            resetScrollToCoords={{ x: 0, y: 0 }}
            scrollEnabled={true}
          >
            <Toast position="bottom" bottomOffset={20} />
            {Object.keys(initialFormValues).map((key) => {
              const fieldName = key as keyof FormValues;
              return (
                <View key={fieldName} style={styles.fieldContainer}>
                  <Text style={styles.label}>
                    {fieldLabels[fieldName]}
                    <Text style={styles.requiredIndicator}> *</Text>
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      formik.touched[fieldName] && formik.errors[fieldName] && styles.errorInput,
                    ]}
                    placeholder={`Enter ${fieldLabels[fieldName]}`}
                    value={formik.values[fieldName]}
                    onChangeText={formik.handleChange(fieldName)}
                    onBlur={formik.handleBlur(fieldName)}
                    keyboardType={fieldName === 'accountNumber' ? 'numeric' : 'default'}
                    autoCapitalize={fieldName === 'ifscCode' ? 'characters' : 'words'}
                  />
                  {formik.touched[fieldName] && formik.errors[fieldName] && (
                    <Text style={styles.errorText}>{formik.errors[fieldName]}</Text>
                  )}
                </View>
              );
            })}
          </KeyboardAwareScrollView>
        );
      }}
    </Formik>
  );
});

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    paddingBottom: 60,
  },
  scrollContentContainer: {
    flexGrow: 1,
    padding: 20,
    marginBottom: 60,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  fieldContainer: {
    marginBottom: 22,
  },
  label: {
    marginBottom: 8,
    fontWeight: '600',
    fontSize: 15,
    color: '#333',
  },
  requiredIndicator: {
    color: 'red',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: 'white',
    fontSize: 16,
    color: '#333',
  },
  errorInput: {
    borderColor: '#d9534f',
    borderWidth: 1.5,
  },
  errorText: {
    color: '#d9534f',
    marginTop: 6,
    fontSize: 13,
    fontWeight: '500',
  },
});

export default BankDetailsForm;
