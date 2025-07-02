import { personalDetailsService } from '@/components/Api/userApi';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { Formik, FormikProps } from 'formik';
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from 'react';
import { ActivityIndicator, Alert, Image, Platform, RefreshControl, ScrollView, Text, TextInput, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';
import Toast from 'react-native-toast-message';
import * as Yup from 'yup';

import { fetchProfilePic, RNImagePickerAsset, uploadProfilePicture } from '@/components/Api/userApi';
import ProfilePictureModal from '@/components/Dashboard/ProfilePictureModal';

const getImageSource = (uri: string | null) => {
    if (uri && typeof uri === 'string' && uri.trim() !== '') {
        return { uri: uri.trim() };
    }
    return require('../../../../assets/images/newUser.png');
};

const defaultImage = require('../../../../assets/images/newUser.png');

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
  { label: 'A+', value: 'A+' },
  { label: 'A-', value: 'A-' },
  { label: 'B+', value: 'B+' },
  { label: 'B-', value: 'B-' },
  { label: 'AB+', value: 'AB+' },
  { label: 'AB-', value: 'AB-' },
  { label: 'O+', value: 'O+' },
  { label: 'O-', value: 'O-' },
];

export const allPersonalDetailsInputs: InputProps[] = [
  { name: 'firstName', type: 'text', label: 'First Name (As per Aadhar)', placeholder: 'Full Name (As per Aadhar)', required: true },
  { name: 'lastName', type: 'text', label: 'Last Name (As per Aadhar)', placeholder: 'Full Name (As per Aadhar)', required: true },
  { name: 'employeeCode', type: 'text', label: 'Employee Id', placeholder: 'Employee Id', readonly: true },
  { name: 'designation', type: 'text', label: 'Designation', placeholder: 'Designation', readonly: true },
  { name: 'dateOfBirth', type: 'date', label: 'Date of Birth', placeholder: 'Date of Birth', required: true },
  { name: 'gender', type: 'select', label: 'Gender', options: genderOptions, placeholder: 'Gender', required: true },
  { name: 'bloodGroup', type: 'select', label: 'Blood Group', placeholder: 'Blood Group', options: bloodGroupOptions },
  { name: 'phone', type: 'tel', label: 'Phone Number', placeholder: 'Phone', maxLength: 10, required: true },
  { name: 'fatherName', type: 'text', label: 'Fathers Name (As per Aadhar)', placeholder: 'Fathers Name (As per Aadhar)', required: true },
  { name: 'emergencyContactName', type: 'text', label: 'Emergency Contact Name', placeholder: 'Emergency Contact Name', required: true },
  { name: 'emergencyContactNumber', type: 'tel', label: 'Emergency Contact Number', placeholder: 'Emergency Contact Number', maxLength: 10, required: true },
  { name: 'currentAddress', type: 'textarea', label: 'Current Address', placeholder: 'Your Current Address', required: true },
  { name: 'permanentAddress', type: 'textarea', label: 'Permanent Address', placeholder: 'Your Permanent Address', required: true },
  { name: 'bio', type: 'textarea', label: 'About You', placeholder: 'Share your story! 🌟 For example: What excites you? Your favorite tech stack? Any quirky hobbies or hidden talents?', required: true },
  { name: 'dateOfJoining', type: 'date', label: 'Date of Joining Here', placeholder: 'Date of Joining Here', readonly: true },
  { name: 'aadhar', type: 'text', label: 'Aadhar Card Number', placeholder: 'Aadhar Card Number', maxLength: 14, required: true },
  { name: 'pan', type: 'text', label: 'PAN Card Number', placeholder: 'PAN Card Number', maxLength: 10, required: true },
  { name: 'uan', type: 'tel', label: 'UAN (Universal Account Number)', placeholder: 'UAN', maxLength: 12, required: true },
];

const validationSchema = Yup.object().shape({
  firstName: Yup.string().required('First Name is required.'),
  lastName: Yup.string().required('Last Name is required.'),
  dateOfBirth: Yup.date().required('Date of Birth is required.').max(new Date(), 'Date of Birth cannot be in the future.').test('min-age', 'You must be at least 18 years old.', function(value) { if (!value) return true; const today = new Date(); const dob = new Date(value); let age = today.getFullYear() - dob.getFullYear(); const m = today.getMonth() - dob.getMonth(); if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) { age--; } return age >= 18; }),
  gender: Yup.string().required('Gender is required.'),
  phone: Yup.string().required('Phone Number is required.').matches(/^\d{10}$/, 'Phone number must be exactly 10 digits.'),
  fatherName: Yup.string().required('Fathers Name is required.'),
  emergencyContactName: Yup.string().required('Emergency Contact Name is required.'),
  emergencyContactNumber: Yup.string().required('Emergency Contact Number is required.').matches(/^\d{10}$/, 'Emergency contact number must be exactly 10 digits.'),
  currentAddress: Yup.string().required('Current Address is required.'),
  permanentAddress: Yup.string().required('Permanent Address is required.'),
  aadhar: Yup.string().required('Aadhar Card Number is required.').test('len', 'Aadhar number must be 12 digits.', val => { const cleanAadhar = val ? val.replace(/\s/g, '') : ''; return cleanAadhar.length === 12 && /^\d{12}$/.test(cleanAadhar); }),
  pan: Yup.string().required('PAN Card Number is required.').matches(/^[A-Z]{5}\d{4}[A-Z]{1}$/, 'Invalid PAN number format (e.g., ABCDE1234F).'),
  uan: Yup.string().required('UAN is required.').matches(/^\d{12}$/, 'UAN must be exactly 12 digits.'),
  bloodGroup: Yup.string().notRequired(),
  employeeCode: Yup.string().notRequired(),
  designation: Yup.string().notRequired(),
  bio: Yup.string().notRequired(),
  dateOfJoining: Yup.string().notRequired(),
});

type PersonalDetailsFormData = {
  firstName: string; lastName: string; employeeCode: string; designation: string; dateOfBirth: string; gender: string; bloodGroup: string; phone: string; fatherName: string; emergencyContactName: string; emergencyContactNumber: string; currentAddress: string; permanentAddress: string; bio: string; dateOfJoining: string; aadhar: string; pan: string; uan: string; [key: string]: any;
};

const getInitialFormData = (): PersonalDetailsFormData => ({
    firstName: '', lastName: '', employeeCode: '', designation: '', dateOfBirth: '', gender: '', bloodGroup: '', phone: '', fatherName: '', emergencyContactName: '', emergencyContactNumber: '', currentAddress: '', permanentAddress: '', bio: '', dateOfJoining: '', aadhar: '', pan: '', uan: '',
});

export type FormHandle = {
  submit: () => Promise<boolean>;
  save: () => Promise<boolean>;
  isSubmitting: boolean;
  isSubmittingSave: boolean;
  isSubmittingNext: boolean;
};

interface PersonalDetailsFormProps {
    isSpecialUserMode?: boolean;
    onDirtyChange: (isDirty: boolean) => void;
}

const PersonalDetailsForm = forwardRef<FormHandle, PersonalDetailsFormProps>(({ isSpecialUserMode, onDirtyChange }, ref) => {
  const [initialFormValues, setInitialFormValues] = useState<PersonalDetailsFormData>(getInitialFormData());
  const [loading, setLoading] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentDatePickerField, setCurrentDatePickerField] = useState('');
  const [isSubmittingNext, setIsSubmittingNext] = useState(false);
  const [isSubmittingSave, setIsSubmittingSave] = useState(false);
  const [profilePictureUri, setProfilePictureUri] = useState<string | null>(null);
  const [profilePicLoading, setProfilePicLoading] = useState(false);
  const [profilePicError, setProfilePicError] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [isImageRendering, setIsImageRendering] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  let formikRef: FormikProps<PersonalDetailsFormData> | null = null;

  const loadData = useCallback(async (isInitialLoad = false) => {
    if (isInitialLoad) setLoading(true);
    try {
      const [detailsData] = await Promise.all([
          personalDetailsService.fetchPersonalDetails(),
          fetchAndSetProfilePic(),
      ]);

      if (detailsData) {
        const newInitialValues = { ...getInitialFormData(), ...detailsData };
        if (newInitialValues.dateOfBirth) newInitialValues.dateOfBirth = new Date(newInitialValues.dateOfBirth).toISOString().split('T')[0];
        if (newInitialValues.dateOfJoining) newInitialValues.dateOfJoining = new Date(newInitialValues.dateOfJoining).toISOString().split('T')[0];
        if (newInitialValues.aadhar) newInitialValues.aadhar = newInitialValues.aadhar.replace(/\s/g, ''); 
        setInitialFormValues(newInitialValues);
        if (formikRef) formikRef.resetForm({ values: newInitialValues });
      }
    } catch (error) {
      console.error('Failed to fetch personal details:', error);
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to load personal details.' });
    } finally {
      if (isInitialLoad) setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadData(false);
    setIsRefreshing(false);
  }, [loadData]);

  const fetchAndSetProfilePic = async () => {
    setImageLoading(true);
    setProfilePicError(null);
    try {
      const picUrl = await fetchProfilePic();
      setProfilePictureUri(picUrl);
    } catch (error) {
      console.error('Failed to fetch profile picture:', error);
      setProfilePicError('Failed to load profile picture.');
    } finally {
      setImageLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);
  }, [loadData]);

  useImperativeHandle(ref, () => ({
    submit: async () => {
      if (!formikRef) return false;
      setIsSubmittingNext(true);
      try {
        const errors = await formikRef.validateForm();
        if (Object.keys(errors).length > 0) {
          formikRef.setTouched(Object.keys(errors).reduce((acc, key) => { acc[key as keyof PersonalDetailsFormData] = true; return acc; }, {} as { [K in keyof PersonalDetailsFormData]?: boolean }));
          Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Please correct the errors in the form.', });
          return false;
        }

        const dataToSubmit = { ...formikRef.values };
        if (dataToSubmit.aadhar) dataToSubmit.aadhar = dataToSubmit.aadhar.replace(/\s/g, '');
        const result = await personalDetailsService.submitPersonalDetails(dataToSubmit, true); 

        if (result?.success) {
          Toast.show({ type: 'success', text1: 'Success', text2: result.message || 'Details submitted successfully!', });
          const newInitialValues = { ...formikRef.values };
          formikRef.resetForm({ values: newInitialValues });
          setInitialFormValues(newInitialValues);
          return true;
        } else {
          Toast.show({ type: 'error', text1: 'Submission Error', text2: result?.message || 'Failed to submit details.', });
          return false;
        }
      } catch (error) {
        console.error('Failed to submit personal details:', error);
        Toast.show({ type: 'error', text1: 'Error', text2: 'An unexpected error occurred during submission.', });
        return false;
      } finally {
        setIsSubmittingNext(false);
      }
    },
    save: async () => {
      if (!formikRef) return false;
      if (!formikRef.dirty) {
        Toast.show({ type: 'info', text1: 'No Changes', text2: 'No changes to save.', });
        return true;
      }
      setIsSubmittingSave(true);
      try {
        const dataToSubmit = { ...formikRef.values };
        if (dataToSubmit.aadhar) dataToSubmit.aadhar = dataToSubmit.aadhar.replace(/\s/g, '');
        const result = await personalDetailsService.submitPersonalDetails(dataToSubmit, false); 
        if (result?.success) {
          Toast.show({ type: 'success', text1: 'Success', text2: result.message || 'Details saved successfully!', });
          formikRef.resetForm({ values: dataToSubmit }); 
          setInitialFormValues(dataToSubmit);
          return true;
        } else {
          Toast.show({ type: 'error', text1: 'Save Error', text2: result?.message || 'Failed to save details.', });
          return false;
        }
      } catch (error) {
        console.error('Failed to save personal details:', error);
        Toast.show({ type: 'error', text1: 'Error', text2: 'An unexpected error occurred during saving.', });
        return false;
      } finally {
        setIsSubmittingSave(false);
      }
    },
    isSubmitting: isSubmittingNext || isSubmittingSave,
    isSubmittingSave,
    isSubmittingNext,
  }));

  const handleDateChange = useCallback((event: any, selectedDate: Date | undefined, setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void, setFieldTouched: (field: string, isTouched?: boolean, shouldValidate?: boolean) => void) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      setFieldValue(currentDatePickerField, formattedDate, true);
    }
    setFieldTouched(currentDatePickerField, true, true);
  }, [currentDatePickerField]);

  const handleImageSelectionAndUpload = async (source: 'gallery' | 'camera') => {
    setProfilePicError(null);
    let result;
    try {
      if (source === 'gallery') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') { Toast.show({ type: 'error', text1: 'Permission Denied', text2: 'Sorry, we need camera roll permissions to make this work!', }); return; }
        result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.7 });
      } else {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') { Toast.show({ type: 'error', text1: 'Permission Denied', text2: 'Sorry, we need camera permissions to make this work!', }); return; }
        result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 });
      }
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (!asset.uri) { setProfilePicError('Invalid image file: Missing URI.'); return; }
        const isImage = (asset.type && asset.type.startsWith('image/')) || (asset.mimeType && asset.mimeType.startsWith('image/')) || (/\.(jpe?g|png|gif|bmp|webp)$/i.test(asset.uri));
        if (!isImage) { setProfilePicError(`Only image files are allowed. Selected media MIME type is "${asset.type || asset.mimeType || 'unknown'}".`); return; }
        const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
        if (asset.fileSize && asset.fileSize > MAX_FILE_SIZE_BYTES) { setProfilePicError('File size exceeds the limit of 10MB.'); return; }
        setProfilePictureUri(asset.uri); 
        setProfilePicLoading(true);
        try {
          const uploadedAsset: RNImagePickerAsset = { uri: asset.uri, type: asset.type || 'image', fileName: asset.fileName || `profile_pic_${Date.now()}.jpg`, fileSize: asset.fileSize, width: asset.width, height: asset.height, mimeType: asset.mimeType || 'image/jpeg' };
          await uploadProfilePicture(uploadedAsset); 
          Toast.show({ type: 'success', text1: 'Success', text2: 'Profile picture uploaded successfully!', });
        } catch (error: any) {
          console.error('Upload failed:', error);
          setProfilePicError(error.message || 'Failed to upload profile picture due to an unexpected error.');
          await fetchAndSetProfilePic();
        } finally {
          setProfilePicLoading(false);
        }
      }
    } catch (err: any) {
      console.error("Error during image selection process:", err);
      setProfilePicError(err.message || "An unexpected error occurred during image selection.");
    }
  };

  const handleProfilePictureAction = () => {
    Alert.alert("Select Profile Picture", "Choose an option to upload your profile picture", [
        { text: "Choose from Gallery", onPress: () => handleImageSelectionAndUpload('gallery') },
        { text: "Take Photo", onPress: () => handleImageSelectionAndUpload('camera') },
        { text: "Cancel", style: "cancel" },
    ], { cancelable: true });
  };

  const renderInputField = (input: InputProps, formik: FormikProps<PersonalDetailsFormData>) => {
    const hasError = formik.touched[input.name] && formik.errors[input.name];
    const isFieldReadonly = input.readonly;
    const handleTextInputChange = (text: string) => {
      if (input.name === 'aadhar') {
          const cleanText = text.replace(/[^0-9]/g, '');
          formik.setFieldValue(input.name, cleanText.substring(0, 12));
      } else if (input.type === 'tel' || input.name === 'uan') {
          const cleanText = text.replace(/[^0-9]/g, '');
          formik.setFieldValue(input.name, cleanText.substring(0, input.maxLength));
      } else {
          formik.setFieldValue(input.name, text);
      }
    };

    switch (input.type) {
      case 'text':
      case 'tel':
      case 'email':
      case 'password':
        const keyboardType = (input.type === 'tel' || input.name === 'uan' || input.name === 'aadhar') ? 'phone-pad' : 'default';
        const displayValue = input.name === 'aadhar' ? formatAadharDisplay(formik.values[input.name]) : formik.values[input.name];
        return <TextInput style={[styles.input, isFieldReadonly && styles.readonlyInput, hasError && styles.errorInput]} placeholder={input.placeholder} value={displayValue} onChangeText={handleTextInputChange} onBlur={formik.handleBlur(input.name)} keyboardType={keyboardType} maxLength={input.maxLength} editable={!isFieldReadonly} secureTextEntry={input.type === 'password'} />;
      case 'textarea':
        return <TextInput style={[styles.textarea, isFieldReadonly && styles.readonlyInput, hasError && styles.errorInput]} placeholder={input.placeholder} value={formik.values[input.name]} onChangeText={(text) => formik.setFieldValue(input.name, text)} onBlur={formik.handleBlur(input.name)} multiline editable={!isFieldReadonly} />;
      case 'date':
        return <TouchableOpacity onPress={() => { if (!isFieldReadonly) { setCurrentDatePickerField(input.name); setShowDatePicker(true); } }} style={[styles.input, isFieldReadonly && styles.readonlyInput, hasError && styles.errorInput, styles.datePickerButton]} disabled={isFieldReadonly} onBlur={() => formik.setFieldTouched(input.name, true, true)}>
            <Text style={{ color: formik.values[input.name] ? 'black' : '#aaa' }}>{formik.values[input.name] || input.placeholder}</Text>
          </TouchableOpacity>;
      case 'select':
        return <View style={[styles.pickerContainer, isFieldReadonly && styles.readonlyInput, hasError && styles.errorInput]}>
            <Picker selectedValue={formik.values[input.name]} onValueChange={(itemValue: string) => { formik.setFieldValue(input.name, itemValue, true); formik.setFieldTouched(input.name, true, true); }} enabled={!isFieldReadonly} style={{ height: 50, width: '100%' }} itemStyle={Platform.OS === 'ios' ? {} : {fontSize: 16, color: '#333'}} onBlur={() => formik.setFieldTouched(input.name, true, true)}>
              <Picker.Item label={input.placeholder} value="" enabled={false} style={{ color: '#aaa' }} />
              {input.options?.map(option => <Picker.Item key={option.value} label={option.label} value={option.value} />)}
            </Picker>
          </View>;
      default: return null;
    }
  };

  if (loading) {
    return <View style={styles.centeredView as ViewStyle}><ActivityIndicator size="large" color="#90D1CA" /><Text style={styles.loadingText}>Loading personal details...</Text></View>;
  }

  return (
    <Formik initialValues={initialFormValues} validationSchema={validationSchema} enableReinitialize={true} onSubmit={() => {}}>
      {formik => {
        formikRef = formik;
        useEffect(() => {
          onDirtyChange(formik.dirty);
        }, [formik.dirty, onDirtyChange]);

        return (
          <>
            <ScrollView contentContainerStyle={styles.container} refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={["#90D1CA", "#50E3C2"]} />}>
                <View style={styles.profilePicContainer as ViewStyle}>
                    <TouchableOpacity onPress={() => profilePictureUri && setIsModalVisible(true)} disabled={!profilePictureUri}>
                        <View style={styles.profilePicWrapper}>
                            <Image
                                source={getImageSource(profilePictureUri)}
                                style={styles.profilePic}
                                onLoadStart={() => setIsImageRendering(true)}
                                onLoadEnd={() => setIsImageRendering(false)}
                            />
                            {(profilePicLoading || imageLoading || isImageRendering) && (
                                <View style={styles.profilePicLoaderOverlay}>
                                    <ActivityIndicator size="large" color="#FFFFFF" />
                                </View>
                            )}
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleProfilePictureAction} style={styles.uploadButton} disabled={profilePicLoading || imageLoading}>
                        <Text style={styles.uploadButtonText as TextStyle}>{profilePictureUri ? 'Change Profile Picture' : 'Upload Profile Picture'}</Text>
                    </TouchableOpacity>
                    {profilePicError && <Text style={styles.profilePicErrorText as TextStyle}>{profilePicError}</Text>}
                </View>

                {allPersonalDetailsInputs.map(input => (
                <View key={input.name} style={styles.fieldContainer}>
                    <Text style={styles.label as TextStyle}>{input.label}{input.required && <Text style={styles.requiredIndicator}> *</Text>}</Text>
                    {renderInputField(input, formik)}
                    {formik.touched[input.name] && formik.errors[input.name] && <Text style={styles.errorText as TextStyle}>{(formik.errors[input.name] as string)}</Text>}
                </View>
                ))}
                <Toast position="bottom" bottomOffset={20} />

                {showDatePicker && <DateTimePicker testID="dateTimePicker" value={new Date(formik.values[currentDatePickerField] || new Date())} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={(event, selectedDate) => handleDateChange(event, selectedDate, formik.setFieldValue, formik.setFieldTouched)} maximumDate={new Date()} />}
            </ScrollView>
            <ProfilePictureModal 
                isVisible={isModalVisible}
                imageUrl={profilePictureUri}
                onClose={() => setIsModalVisible(false)}
                defaultImage={defaultImage}
            />
          </>
        );
      }}
    </Formik>
  );
});

const styles = {
  container: { padding: 16, backgroundColor: '#f9f9f9', paddingBottom: 50 },
  centeredView: { flex: 1, justifyContent: 'center', alignItems: 'center' as 'center', backgroundColor: '#f9f9f9' },
  loadingText: { marginTop: 10, fontSize: 16, color: '#555' },
  fieldContainer: { marginBottom: 18 },
  label: { marginBottom: 6, fontWeight: '600' as '600', fontSize: 15, color: '#333' },
  requiredIndicator: { color: 'red' },
  input: { borderWidth: 1, borderColor: '#ccc', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, backgroundColor: 'white', fontSize: 16, color: '#333' },
  textarea: { borderWidth: 1, borderColor: '#ccc', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, minHeight: 100, textAlignVertical: 'top' as 'top', backgroundColor: 'white', fontSize: 16, color: '#333' },
  readonlyInput: { backgroundColor: '#e9e9e9', color: '#777' },
  errorInput: { borderColor: '#d9534f', borderWidth: 2 },
  errorText: { color: '#d9534f', marginTop: 6, fontSize: 13, fontWeight: '500' as '500' },
  datePickerButton: { justifyContent: 'center' as 'center', minHeight: 48 },
  pickerContainer: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, backgroundColor: 'white' },
  profilePicContainer: { alignItems: 'center' as 'center', marginBottom: 20, marginTop: 10 },
  profilePicWrapper: { 
    width: 120, 
    height: 120, 
    borderRadius: 60, 
    justifyContent: 'center' as 'center', 
    alignItems: 'center' as 'center' 
  },
  profilePic: { width: 120, height: 120, borderRadius: 60, borderWidth: 2, borderColor: '#ddd', backgroundColor: '#e0e0e0' },
  profilePicLoaderOverlay: {
    position: 'absolute' as 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 60,
    justifyContent: 'center' as 'center',
    alignItems: 'center' as 'center',
  },
  uploadButton: { marginTop: 10, backgroundColor: '#90D1CA', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 5 },
  uploadButtonText: { color: '#fff', fontSize: 14, fontWeight: 'bold' as 'bold' },
  profilePicErrorText: { color: 'red', marginTop: 5, fontSize: 12 },
};

export default PersonalDetailsForm;