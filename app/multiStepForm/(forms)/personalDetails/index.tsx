import { personalDetailsService } from '@/components/Api/userApi';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { Formik, FormikHelpers } from 'formik';
import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { ActivityIndicator, Alert, Image, Platform, ScrollView, Text, TextInput, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';
import { ImagePickerResponse, launchImageLibrary } from 'react-native-image-picker';
import * as Yup from 'yup';

import { fetchProfilePic, RNImagePickerAsset, uploadProfilePicture } from '@/components/Api/userApi';

const getImageSource = (uri: string | null) => {
    if (uri && typeof uri === 'string' && uri.trim() !== '') {
      console.log(uri);
        return { uri: uri.trim() };
    }
    return require('../../../../assets/images/newUser.png');
};

const formatAadharDisplay = (value: string) => {
  const cleanValue = value.replace(/\s/g, '').replace(/[^0-9]/g, '');
  let formatted = '';
  for (let i = 0; i < cleanValue.length; i++) {
    if (i > 0 && i % 4 === 0) {
      formatted += ' ';
    }
    formatted += cleanValue[i];
  }
  return formatted;
};

const genderOptions = [
  { label: 'Male', value: 'MALE' },
  { label: 'Female', value: 'FEMALE' },
  { label: 'Other', value: 'OTHER' },
];

export interface InputProps {
  name: string;
  type: 'text' | 'date' | 'select' | 'tel' | 'textarea' | 'email' | 'password';
  label: string;
  placeholder: string;
  options?: { value: string; label: string }[];
  readonly?: boolean;
  pattern?: string;
  maxLength?: number;
  required?: boolean;
}

const bloodGroupOptions = [
  { label: 'A+', value: 'A_POS' },
  { label: 'A-', value: 'A_NEG' },
  { label: 'B+', value: 'B_POS' },
  { label: 'B-', value: 'B_NEG' },
  { label: 'AB+', value: 'AB_POS' },
  { label: 'AB-', value: 'AB_NEG' },
  { label: 'O+', value: 'O_POS' },
  { label: 'O-', value: 'O_NEG' },
];

export const allPersonalDetailsInputs: InputProps[] = [
  {
    name: 'firstName',
    type: 'text',
    label: 'First Name (As per Aadhar)',
    placeholder: 'Full Name (As per Aadhar)',
    required: true,
  },
  {
    name: 'lastName',
    type: 'text',
    label: 'Last Name (As per Aadhar)',
    placeholder: 'Full Name (As per Aadhar)',
    required: true,
  },
  {
    name: 'employeeCode',
    type: 'text',
    label: 'Employee Id',
    placeholder: 'Employee Id',
    readonly: true,
  },
  {
    name: 'designation',
    type: 'text',
    label: 'Designation',
    placeholder: 'Designation',
    readonly: true,
  },
  {
    name: 'dateOfBirth',
    type: 'date',
    label: 'Date of Birth',
    placeholder: 'Date of Birth',
    required: true,
  },
  {
    name: 'gender',
    type: 'select',
    label: 'Gender',
    options: genderOptions,
    placeholder: 'Gender',
    required: true,
  },
  {
    name: 'bloodGroup',
    type: 'select',
    label: 'Blood Group',
    options: bloodGroupOptions,
    placeholder: 'Blood Group',
  },
  {
    name: 'phone',
    type: 'tel',
    label: 'Phone Number',
    placeholder: 'Phone',
    maxLength: 10,
    required: true,
  },
  {
    name: 'fatherName',
    type: 'text',
    label: 'Fathers Name (As per Aadhar)',
    placeholder: 'Fathers Name (As per Aadhar)',
    required: true,
  },
  {
    name: 'emergencyContactName',
    type: 'text',
    label: 'Emergency Contact Name',
    placeholder: 'Emergency Contact Name',
    required: true,
  },
  {
    name: 'emergencyContactNumber',
    type: 'tel',
    label: 'Emergency Contact Number',
    placeholder: 'Emergency Contact Number',
    maxLength: 10,
    required: true,
  },
  {
    name: 'currentAddress',
    type: 'textarea',
    label: 'Current Address',
    placeholder: 'Your Current Address',
    required: true,
  },
  {
    name: 'permanentAddress',
    type: 'textarea',
    label: 'Permanent Address',
    placeholder: 'Your Permanent Address',
    required: true,
  },
  {
    name: 'bio',
    type: 'textarea',
    label: 'About You',
    placeholder:
      'Share your story! 🌟 For example: What excites you? Your favorite tech stack? Any quirky hobbies or hidden talents?',
  },
  {
    name: 'dateOfJoining',
    type: 'date',
    label: 'Date of Joining Here',
    placeholder: 'Date of Joining Here',
    readonly: true,
  },
  {
    name: 'aadhar',
    type: 'text',
    label: 'Aadhar Card Number',
    placeholder: 'Aadhar Card Number',
    maxLength: 14,
    required: true,
  },
  {
    name: 'pan',
    type: 'text',
    label: 'PAN Card Number',
    placeholder: 'PAN Card Number',
    maxLength: 10,
    required: true,
  },
  {
    name: 'uan',
    type: 'tel',
    label: 'UAN (Universal Account Number)',
    placeholder: 'UAN',
    maxLength: 12,
    required: true,
  },
];

const validationSchema = Yup.object().shape({
  firstName: Yup.string().required('First Name is required.'),
  lastName: Yup.string().required('Last Name is required.'),
  dateOfBirth: Yup.date()
    .required('Date of Birth is required.')
    .max(new Date(), 'Date of Birth cannot be in the future.')
    .test('min-age', 'You must be at least 18 years old.', function(value) {
      if (!value) return true;
      const today = new Date();
      const dob = new Date(value);
      let age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      return age >= 18;
    }),
  gender: Yup.string().required('Gender is required.'),
  phone: Yup.string()
    .required('Phone Number is required.')
    .matches(/^\d{10}$/, 'Phone number must be exactly 10 digits.'),
  fatherName: Yup.string().required('Fathers Name is required.'),
  emergencyContactName: Yup.string().required('Emergency Contact Name is required.'),
  emergencyContactNumber: Yup.string()
    .required('Emergency Contact Number is required.')
    .matches(/^\d{10}$/, 'Emergency contact number must be exactly 10 digits.'),
  currentAddress: Yup.string().required('Current Address is required.'),
  permanentAddress: Yup.string().required('Permanent Address is required.'),
  aadhar: Yup.string()
    .required('Aadhar Card Number is required.')
    .test('len', 'Aadhar number must be 12 digits.', val => {
      const cleanAadhar = val ? val.replace(/\s/g, '') : '';
      return cleanAadhar.length === 12 && /^\d{12}$/.test(cleanAadhar);
    }),
  pan: Yup.string()
    .required('PAN Card Number is required.')
    .matches(/^[A-Z]{5}\d{4}[A-Z]{1}$/, 'Invalid PAN number format (e.g., ABCDE1234F).'),
  uan: Yup.string()
    .required('UAN is required.')
    .matches(/^\d{12}$/, 'UAN must be exactly 12 digits.'),
  bloodGroup: Yup.string().notRequired(),
  employeeCode: Yup.string().notRequired(),
  designation: Yup.string().notRequired(),
  bio: Yup.string().notRequired(),
  dateOfJoining: Yup.string().notRequired(),
});

type PersonalDetailsFormData = {
  firstName: string;
  lastName: string;
  employeeCode: string;
  designation: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup: string;
  phone: string;
  fatherName: string;
  emergencyContactName: string;
  emergencyContactNumber: string;
  currentAddress: string;
  permanentAddress: string;
  bio: string;
  dateOfJoining: string;
  aadhar: string;
  pan: string;
  uan: string;
  [key: string]: any;
};

const getInitialFormData = (): PersonalDetailsFormData => {
  const initialState: PersonalDetailsFormData = {
    firstName: '',
    lastName: '',
    employeeCode: '',
    designation: '',
    dateOfBirth: '',
    gender: '',
    bloodGroup: '',
    phone: '',
    fatherName: '',
    emergencyContactName: '',
    emergencyContactNumber: '',
    currentAddress: '',
    permanentAddress: '',
    bio: '',
    dateOfJoining: '',
    aadhar: '',
    pan: '',
    uan: '',
  };
  return initialState;
};

export type FormHandle = {
  submit: () => Promise<boolean>;
  isSubmitting: boolean;
};

const PersonalDetailsForm = forwardRef<FormHandle>((_, ref) => {
  const [initialFormValues, setInitialFormValues] = useState<PersonalDetailsFormData>(getInitialFormData());
  const [loading, setLoading] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentDatePickerField, setCurrentDatePickerField] = useState('');
  const [isSubmittingInternal, setIsSubmittingInternal] = useState(false);

  const [profilePictureUri, setProfilePictureUri] = useState<string | null>(null);
  const [profilePicLoading, setProfilePicLoading] = useState(false);
  const [profilePicError, setProfilePicError] = useState<string | null>(null);

  let formikRef: FormikHelpers<PersonalDetailsFormData>;

  useEffect(() => {
    const fetchFormDataAndProfilePic = async () => {
      try {
        const data = await personalDetailsService.fetchPersonalDetails();
        if (data) {
          const newInitialValues = { ...getInitialFormData(), ...data };

          if (newInitialValues.dateOfBirth) {
            newInitialValues.dateOfBirth = new Date(newInitialValues.dateOfBirth).toISOString().split('T')[0];
          }
          if (newInitialValues.dateOfJoining) {
            newInitialValues.dateOfJoining = new Date(newInitialValues.dateOfJoining).toISOString().split('T')[0];
          }
          if (newInitialValues.aadhar) {
            newInitialValues.aadhar = formatAadharDisplay(newInitialValues.aadhar);
          }

          setInitialFormValues(newInitialValues);
        }

        setProfilePicLoading(true);
        const picUrl = await fetchProfilePic();
        setProfilePictureUri(picUrl);
      } catch (error) {
        console.error('Failed to fetch personal details or profile picture:', error);
        Alert.alert('Error', 'Failed to load personal details or profile picture.');
      } finally {
        setLoading(false);
        setProfilePicLoading(false);
      }
    };

    fetchFormDataAndProfilePic();
  }, []);

  useImperativeHandle(ref, () => ({
    submit: async () => {
      if (formikRef) {
        setIsSubmittingInternal(true);
        try {
          const isValid = await formikRef.validateForm();
          if (Object.keys(isValid).length > 0) {
            formikRef.setTouched(
                Object.keys(isValid).reduce((acc, key) => {
                  acc[key as keyof PersonalDetailsFormData] = true;
                  return acc;
                }, {} as { [K in keyof PersonalDetailsFormData]?: boolean })
            );
            Alert.alert('Validation Error', 'Please correct the errors in the form.');
            return false;
          }

          await formikRef.submitForm();
          return true;
        } catch (error) {
          return false;
        } finally {
          setIsSubmittingInternal(false);
        }
      }
      return false;
    },
    isSubmitting: isSubmittingInternal,
  }));

  const handleDateChange = (event: any, selectedDate: Date | undefined, setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void, setFieldTouched: (field: string, isTouched?: boolean, shouldValidate?: boolean) => void) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate && currentDatePickerField) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      setFieldValue(currentDatePickerField, formattedDate, true);
      setFieldTouched(currentDatePickerField, true, true);
    }
  };

  const handleProfilePictureUpload = async () => {
    setProfilePicError(null);
    launchImageLibrary({ mediaType: 'photo', quality: 0.7 }, async (response: ImagePickerResponse) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        console.log('ImagePicker Error: ', response.errorMessage);
        setProfilePicError('Image picker error. Please try again.');
      } else if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        if (!asset.uri || !asset.fileName || !asset.type || !asset.fileSize) {
          setProfilePicError('Invalid image file. Missing URI or file details.');
          return;
        }

        const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
        if (asset.fileSize > MAX_FILE_SIZE_BYTES) {
          setProfilePicError('File size exceeds the limit of 10MB.');
          return;
        }

        if (!asset.type.startsWith('image/')) {
          setProfilePicError('Only image files are allowed.');
          return;
        }

        setProfilePicLoading(true);
        try {
          const uploadedUrl = await uploadProfilePicture(asset as RNImagePickerAsset);
          if (uploadedUrl) {
            setProfilePictureUri(uploadedUrl);
            Alert.alert('Success', 'Profile picture uploaded successfully!');
          } else {
            setProfilePicError('Failed to upload profile picture.');
          }
        } catch (error: any) {
          console.error('Upload failed:', error);
          setProfilePicError(error.message || 'Failed to upload profile picture.');
        } finally {
          setProfilePicLoading(false);
        }
      }
    });
  };

  const renderInputField = (input: InputProps, formik: any) => {
    const hasError = formik.touched[input.name] && formik.errors[input.name];

    switch (input.type) {
      case 'text':
      case 'tel':
      case 'email':
      case 'password':
        const keyboardType = input.type === 'tel' ? 'phone-pad' : 'default';
        const isNumeric = input.name === 'uan' || input.name === 'aadhar' || input.name === 'phone' || input.name === 'emergencyContactNumber';

        const displayValue = input.name === 'aadhar' ? formatAadharDisplay(formik.values[input.name]) : formik.values[input.name];

        return (
          <TextInput
            style={[
              styles.input,
              input.readonly && styles.readonlyInput,
              hasError && styles.errorInput,
            ]}
            placeholder={input.placeholder}
            value={displayValue}
            onChangeText={(text) => {
              if (input.name === 'aadhar' || isNumeric) {
                  const cleanText = text.replace(/\s/g, '').replace(/[^0-9]/g, '');
                  formik.setFieldValue(input.name, cleanText.substring(0, input.maxLength ? input.maxLength - (input.maxLength === 14 ? 2 : 0) : undefined));
              } else if (input.name === 'pan') {
                  formik.setFieldValue(input.name, text.toUpperCase().substring(0, input.maxLength));
              } else {
                  formik.setFieldValue(input.name, text);
              }
            }}
            onBlur={formik.handleBlur(input.name)}
            keyboardType={keyboardType}
            maxLength={input.maxLength}
            editable={!input.readonly}
            secureTextEntry={input.type === 'password'}
          />
        );
      case 'textarea':
        return (
          <TextInput
            style={[
              styles.textarea,
              input.readonly && styles.readonlyInput,
              hasError && styles.errorInput,
            ]}
            placeholder={input.placeholder}
            value={formik.values[input.name]}
            onChangeText={formik.handleChange(input.name)}
            onBlur={formik.handleBlur(input.name)}
            multiline
            editable={!input.readonly}
          />
        );
      case 'date':
        return (
          <TouchableOpacity
            onPress={() => {
                if (!input.readonly) {
                    setCurrentDatePickerField(input.name);
                    setShowDatePicker(true);
                }
            }}
            style={[
              styles.input,
              input.readonly && styles.readonlyInput,
              hasError && styles.errorInput,
              styles.datePickerButton,
            ]}
            disabled={input.readonly}
          >
            <Text style={{ color: formik.values[input.name] ? 'black' : '#aaa' }}>
              {formik.values[input.name] || input.placeholder}
            </Text>
          </TouchableOpacity>
        );
      case 'select':
        return (
          <View
            style={[
              styles.pickerContainer,
              input.readonly && styles.readonlyInput,
              hasError && styles.errorInput,
            ]}
          >
            <Picker
              selectedValue={formik.values[input.name]}
              onValueChange={(itemValue: string) => {
                formik.setFieldValue(input.name, itemValue, true);
                formik.setFieldTouched(input.name, true, true);
              }}
              enabled={!input.readonly}
              style={{ height: 50, width: '100%' }}
            >
              <Picker.Item label={input.placeholder} value="" enabled={false} style={{ color: '#aaa' }} />
              {input.options?.map(option => (
                <Picker.Item key={option.value} label={option.label} value={option.value} />
              ))}
            </Picker>
          </View>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={styles.centeredView as ViewStyle}>
        <ActivityIndicator size="large" color="#90D1CA" />
        <Text style={styles.loadingText}>Loading personal details...</Text>
      </View>
    );
  }

  return (
    <Formik
      initialValues={initialFormValues}
      validationSchema={validationSchema}
      enableReinitialize={true}
      onSubmit={async (values, helpers) => {
        setIsSubmittingInternal(true);
        try {
          const dataToSubmit = { ...values };
          if (dataToSubmit.aadhar) {
            dataToSubmit.aadhar = dataToSubmit.aadhar.replace(/\s/g, '');
          }
          
          const result = await personalDetailsService.submitPersonalDetails(dataToSubmit, true);
          if (result?.success) {
            Alert.alert('Success', result.message);
          } else {
            Alert.alert('Submission Error', result?.message || 'Failed to submit details.');
          }
        } catch (error) {
          console.error('Failed to submit personal details:', error);
          Alert.alert('Error', 'An unexpected error occurred during submission.');
        } finally {
          setIsSubmittingInternal(false);
        }
      }}
    >
      {formik => {
        formikRef = formik;

        return (
          <ScrollView>
            <View style={styles.profilePicContainer as ViewStyle}>
                {profilePicLoading ? (
                    <ActivityIndicator size="large" color="#50E3C2" />
                ) : (
                    <Image
                        source={getImageSource(profilePictureUri)}
                        style={styles.profilePic}
                    />
                )}
                <TouchableOpacity onPress={handleProfilePictureUpload} style={styles.uploadButton} disabled={profilePicLoading}>
                    <Text style={styles.uploadButtonText as TextStyle}>
                        {profilePictureUri ? 'Change Profile Picture' : 'Upload Profile Picture'}
                    </Text>
                </TouchableOpacity>
                {profilePicError && <Text style={styles.profilePicErrorText as TextStyle}>{profilePicError}</Text>}
            </View>

            {allPersonalDetailsInputs.map(input => (
              <View key={input.name} style={styles.fieldContainer}>
                <Text style={styles.label as TextStyle}>
                  {input.label}
                  {input.required && <Text style={styles.requiredIndicator}> *</Text>}
                </Text>
                {renderInputField(input, formik)}
                {formik.touched[input.name] && formik.errors[input.name] && (
                  <Text style={styles.errorText as TextStyle}>{(formik.errors[input.name] as string)}</Text>
                )}
              </View>
            ))}

            {showDatePicker && (
              <DateTimePicker
                testID="dateTimePicker"
                value={new Date(formik.values[currentDatePickerField] || new Date())}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => handleDateChange(event, selectedDate, formik.setFieldValue, formik.setFieldTouched)}
                maximumDate={new Date()}
              />
            )}
          </ScrollView>
        );
      }}
    </Formik>
  );
});

const styles = {
  container: {
    padding: 16,
    backgroundColor: '#f9f9f9',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center' as 'center',
    backgroundColor: '#f9f9f9',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  fieldContainer: {
    marginBottom: 18,
  },
  label: {
    marginBottom: 6,
    fontWeight: '600' as '600',
    fontSize: 15,
    color: '#333',
  },
  requiredIndicator: {
    color: 'red',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'white',
    fontSize: 16,
    color: '#333',
  },
  textarea: {
    borderWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    minHeight: 100,
    textAlignVertical: 'top',
    backgroundColor: 'white',
    fontSize: 16,
    color: '#333',
  },
  readonlyInput: {
    backgroundColor: '#e9e9e9',
    color: '#777',
  },
  errorInput: {
    borderColor: '#d9534f',
    borderWidth: 2,
  },
  errorText: {
    color: '#d9534f',
    marginTop: 6,
    fontSize: 13,
    fontWeight: '500' as '500',
  },
  datePickerButton: {
    justifyContent: 'center',
    minHeight: 48,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: 'white',
    overflow: 'hidden',
  },
  profilePicContainer: {
    alignItems: 'center' as 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  profilePic: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#ddd',
    backgroundColor: '#e0e0e0',
  },
  uploadButton: {
    marginTop: 10,
    backgroundColor: '#90D1CA',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold' as 'bold',
  },
  profilePicErrorText: {
    color: 'red',
    marginTop: 5,
    fontSize: 12,
  },
};

export default PersonalDetailsForm;