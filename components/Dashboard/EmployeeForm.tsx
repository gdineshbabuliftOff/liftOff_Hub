import { Employee, EmployeeFormData, FormErrors, initialFormData as globalInitialFormData } from '@/constants/interface';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Keyboard,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Toast from 'react-native-toast-message';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import * as yup from 'yup';
import { paletteV2, styles } from '../Styles/DashBoardStyles';

const employeeFormSchema = yup.object().shape({
  employeeCode: yup
    .string()
    .required('Employee Code is required.')
    .matches(/^U\d{3}$/, "Code must be 'U' followed by 3 digits (e.g., U001)."),
  firstName: yup.string().required('First Name is required.').min(2, 'First Name is too short.'),
  lastName: yup.string().required('Last Name is required.').min(2, 'Last Name is too short.'),
  email: yup
    .string()
    .email('Invalid email format.')
    .required('Email is required.')
    .test('domain', 'Email must end with @liftoffllc.com', (value) =>
      value ? value.toLowerCase().endsWith('@liftoffllc.com') : false
    ),
  dateOfJoining: yup
    .date()
    .required('Date of Joining is required.')
    .max(new Date(), 'Date of Joining cannot be in the future.')
    .typeError('Invalid date format. Please use YYYY-MM-DD.'),
  designation: yup.string().required('Designation is required.'),
  status: yup.string().oneOf(['Fresher', 'Experienced'], 'Invalid status.').required('Status is required.'),
  joineeType: yup.string().oneOf(['NEW', 'EXISTING'], 'Invalid joinee type.').required('Joinee Type is required.'),
});


interface EmployeeFormProps {
  isVisible: boolean;
  mode: 'add' | 'edit';
  employeeToEdit?: Employee | null;
  onSubmit: (formData: EmployeeFormData, mode: 'add' | 'edit', employeeId?: number) => Promise<void>;
  onClose: () => void;
}

const EmployeeForm: React.FC<EmployeeFormProps> = ({
  isVisible,
  mode,
  employeeToEdit,
  onSubmit,
  onClose,
}) => {
  const [formData, setFormData] = useState<EmployeeFormData>(globalInitialFormData);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isExistingJoinee, setIsExistingJoinee] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const modalFormTranslateY = useRef(new Animated.Value(300)).current;
  const modalFormOpacity = useRef(new Animated.Value(0)).current;

  const animateModalIn = useCallback(() => {
    Animated.parallel([
      Animated.timing(modalFormOpacity, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(modalFormTranslateY, {
        toValue: 0,
        friction: 7,
        tension: 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, [modalFormOpacity, modalFormTranslateY]);

  const animateModalOut = useCallback((callback?: () => void) => {
    Animated.parallel([
      Animated.timing(modalFormOpacity, {
        toValue: 0,
        duration: 250,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(modalFormTranslateY, {
        toValue: 300,
        duration: 250,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (callback) callback();
      modalFormTranslateY.setValue(300);
      modalFormOpacity.setValue(0);
    });
  }, [modalFormOpacity, modalFormTranslateY]);


  useEffect(() => {
    if (isVisible) {
      if (mode === 'edit' && employeeToEdit) {
        setFormData({
          employeeCode: employeeToEdit.employeeCode,
          firstName: employeeToEdit.firstName,
          lastName: employeeToEdit.lastName,
          dateOfJoining: employeeToEdit.dateOfJoining || '',
          email: employeeToEdit.email,
          designation: employeeToEdit.designation || '',
          status: employeeToEdit.status as 'Fresher' | 'Experienced',
          joineeType: (employeeToEdit.joineeType || 'NEW') as 'NEW' | 'EXISTING',
        });
        const isExisting = employeeToEdit.joineeType === 'EXISTING';
        setIsExistingJoinee(isExisting);
        if (isExisting) {
            setFormData(prev => ({...prev, status: 'Experienced'}));
        }
      } else {
        setFormData(globalInitialFormData);
        setIsExistingJoinee(false);
      }
      setFormErrors({});
      animateModalIn();
    }
  }, [isVisible, mode, employeeToEdit, animateModalIn]);

  const handleCloseRequest = () => {
    if (!formSubmitting) {
      animateModalOut(() => {
        onClose();
        setFormData(globalInitialFormData);
        setIsExistingJoinee(false);
        setFormErrors({});
      });
    }
  };

  const handleFormInputChange = (name: keyof EmployeeFormData, value: string) => {
    let processedValue = value;
    if (name === 'employeeCode') {
      processedValue = value.toUpperCase();
      if (value.length === 1 && value.toLowerCase() === 'u') {
        processedValue = 'U';
      }
      if (processedValue.length > 1) {
        processedValue = 'U' + processedValue.substring(1).replace(/\D/g, '');
      }
      if(processedValue.length > 4) {
        processedValue = processedValue.substring(0,4);
      }
    }
    setFormData(prev => ({ ...prev, [name]: processedValue }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
    if (formErrors.general){
        setFormErrors(prev => ({ ...prev, general: undefined}));
    }
  };

  const handleJoineeTypeChange = (isChecked: boolean) => {
    setIsExistingJoinee(isChecked);
    const newJoineeType = isChecked ? 'EXISTING' : 'NEW';
    const newStatus = isChecked ? 'Experienced' : formData.status;

    setFormData(prev => ({
      ...prev,
      joineeType: newJoineeType,
      status: newStatus,
    }));
  };

  const handleStatusChange = (newStatus: 'Fresher' | 'Experienced') => {
    if (!isExistingJoinee) {
      setFormData(prev => ({ ...prev, status: newStatus }));
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0]; // Format to YYYY-MM-DD
      handleFormInputChange('dateOfJoining', formattedDate);
    }
  };

  const showDatepicker = () => {
    setShowDatePicker(true);
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();
    setFormSubmitting(true);
    setFormErrors({});

    try {
      await employeeFormSchema.validate(formData, { abortEarly: false });
      await onSubmit(formData, mode, mode === 'edit' ? employeeToEdit?.userId : undefined);
    } catch (err) {
      if (err instanceof yup.ValidationError) {
        const newErrors: FormErrors = {};
        err.inner.forEach(error => {
          if (error.path && !newErrors[error.path as keyof FormErrors]) {
            newErrors[error.path as keyof EmployeeFormData] = error.message;
          }
        });
        setFormErrors(newErrors);
        Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Please correct the highlighted fields.', position: 'bottom' });
      } else {
        const error = err as any;
        let errorMessage = `Could not ${mode} employee. Please try again.`;
        if (error?.response?.data?.message) {
            errorMessage = error.response.data.message;
        } else if (error?.message) {
            errorMessage = error.message;
        }
        setFormErrors({general: errorMessage});
        Toast.show({
          type: 'error',
          text1: `${mode === 'add' ? 'Add' : 'Update'} Failed`,
          text2: errorMessage,
          position: 'bottom'
        });
      }
    } finally {
      setFormSubmitting(false);
    }
  };


  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={isVisible}
      onRequestClose={handleCloseRequest}
    >
      <View style={styles.modalOverlay}>
        <Animated.View style={[styles.modalContent, { opacity: modalFormOpacity, transform: [{ translateY: modalFormTranslateY }] }]}>
          <ScrollView contentContainerStyle={styles.formScrollView} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>{mode === 'add' ? 'Add New Employee' : 'Edit Employee Details'}</Text>
              <TouchableOpacity onPress={handleCloseRequest} style={styles.formCloseButton} disabled={formSubmitting}>
                <MaterialCommunityIcons name="close-thick" size={22} color={paletteV2.neutralMedium} />
              </TouchableOpacity>
            </View>

            <Text style={styles.formLabel}>Employee Code <Text style={styles.requiredIndicator}>*</Text></Text>
            <TextInput
              style={[styles.formInput, formErrors.employeeCode && styles.formInputError]}
              value={formData.employeeCode}
              onChangeText={(val) => handleFormInputChange('employeeCode', val)}
              placeholder="e.g., U001"
              placeholderTextColor={styles.textPlaceholder.color}
              maxLength={4}
              autoCapitalize="characters"
            />
            {formErrors.employeeCode && <Text style={styles.formErrorText}>{formErrors.employeeCode}</Text>}

            <View style={styles.formRow}>
              <View style={styles.formColumn}>
                <Text style={styles.formLabel}>First Name <Text style={styles.requiredIndicator}>*</Text></Text>
                <TextInput
                  style={[styles.formInput, formErrors.firstName && styles.formInputError]}
                  value={formData.firstName}
                  onChangeText={(val) => handleFormInputChange('firstName', val)}
                  placeholder="Enter first name"
                  placeholderTextColor={styles.textPlaceholder.color}
                />
                {formErrors.firstName && <Text style={styles.formErrorText}>{formErrors.firstName}</Text>}
              </View>
              <View style={styles.formColumn}>
                <Text style={styles.formLabel}>Last Name <Text style={styles.requiredIndicator}>*</Text></Text>
                <TextInput
                  style={[styles.formInput, formErrors.lastName && styles.formInputError]}
                  value={formData.lastName}
                  onChangeText={(val) => handleFormInputChange('lastName', val)}
                  placeholder="Enter last name"
                  placeholderTextColor={styles.textPlaceholder.color}
                />
                {formErrors.lastName && <Text style={styles.formErrorText}>{formErrors.lastName}</Text>}
              </View>
            </View>

            <Text style={styles.formLabel}>Email <Text style={styles.requiredIndicator}>*</Text></Text>
            <TextInput
              style={[styles.formInput, mode === 'edit' && styles.disabledInput, formErrors.email && styles.formInputError]}
              value={formData.email}
              onChangeText={(val) => handleFormInputChange('email', val)}
              placeholder="employee@liftoffllc.com"
              placeholderTextColor={styles.textPlaceholder.color}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={mode === 'add'}
            />
            {formErrors.email && <Text style={styles.formErrorText}>{formErrors.email}</Text>}

            <Text style={styles.formLabel}>Date of Joining <Text style={styles.requiredIndicator}>*</Text></Text>
            <TouchableOpacity onPress={showDatepicker} style={[styles.formInput, formErrors.dateOfJoining && styles.formInputError, { justifyContent: 'center' }]}>
                <Text>
                    {formData.dateOfJoining || "YYYY-MM-DD"}
                </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                testID="dateTimePicker"
                value={formData.dateOfJoining ? new Date(formData.dateOfJoining) : new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            )}
            {formErrors.dateOfJoining && <Text style={styles.formErrorText}>{formErrors.dateOfJoining}</Text>}

            <Text style={styles.formLabel}>Designation <Text style={styles.requiredIndicator}>*</Text></Text>
            <TextInput
                style={[styles.formInput, formErrors.designation && styles.formInputError]}
                value={formData.designation}
                onChangeText={(val) => handleFormInputChange('designation', val)}
                placeholder="e.g., Software Engineer"
                placeholderTextColor={styles.textPlaceholder.color}
            />
            {formErrors.designation && <Text style={styles.formErrorText}>{formErrors.designation}</Text>}


            <View style={styles.checkboxContainer}>
              <TouchableOpacity onPress={() => handleJoineeTypeChange(!isExistingJoinee)} style={styles.checkboxTouchable}>
                <MaterialCommunityIcons
                  name={isExistingJoinee ? 'checkbox-marked-outline' : 'checkbox-blank-outline'}
                  size={26}
                  color={isExistingJoinee ? paletteV2.primaryMain : paletteV2.neutralMedium}
                  style={styles.checkboxIcon}
                />
                <Text style={styles.checkboxLabel}>This is an Existing Employee</Text>
              </TouchableOpacity>
              <Text style={styles.derivedInfoLabel}>(Joinee Type: {formData.joineeType})</Text>
            </View>

            <Text style={styles.formLabel}>Experience Status <Text style={styles.requiredIndicator}>*</Text></Text>
            <View style={styles.radioGroup}>
              <TouchableOpacity
                style={[styles.radioButtonContainer, formData.status === 'Fresher' && styles.radioButtonActive, isExistingJoinee && styles.radioButtonDisabled]}
                onPress={() => handleStatusChange('Fresher')}
                disabled={isExistingJoinee}
              >
                <MaterialCommunityIcons
                  name={formData.status === 'Fresher' ? "radiobox-marked" : "radiobox-blank"}
                  size={24}
                  color={isExistingJoinee ? paletteV2.neutralLight : (formData.status === 'Fresher' ? paletteV2.primaryMain : paletteV2.iconDefault)}
                />
                <Text style={[styles.radioLabel, isExistingJoinee && {color: paletteV2.neutralLight}]}>Fresher</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.radioButtonContainer, (formData.status === 'Experienced' || isExistingJoinee) && styles.radioButtonActive]}
                onPress={() => handleStatusChange('Experienced')}
                disabled={isExistingJoinee}
              >
                  <MaterialCommunityIcons
                    name={formData.status === 'Experienced' || isExistingJoinee ? "radiobox-marked" : "radiobox-blank"}
                    size={24}
                    color={isExistingJoinee ? paletteV2.primaryMain : (formData.status === 'Experienced' ? paletteV2.primaryMain : paletteV2.iconDefault)}
                  />
                <Text style={[styles.radioLabel, isExistingJoinee && {color: paletteV2.textPrimaryOnLight, fontWeight:'500'}]}>Experienced</Text>
              </TouchableOpacity>
            </View>
            {(formErrors.status || formErrors.joineeType || formErrors.general) && <Text style={[styles.formErrorText, styles.formGeneralErrorText]}>{formErrors.status || formErrors.joineeType || formErrors.general}</Text>}


            <View style={styles.formActions}>
              <TouchableOpacity
                  style={[styles.formButtonBase, styles.cancelButton]}
                  onPress={handleCloseRequest}
                  disabled={formSubmitting}
              >
                <Text style={[styles.formButtonText, styles.cancelButtonText]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={formSubmitting}
                  style={[styles.formButtonBase, formSubmitting && styles.submitButtonDisabled]}
              >
                <LinearGradient
                    colors={formSubmitting ? paletteV2.gradientDisabled : paletteV2.gradientPrimaryButton}
                    style={styles.submitButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                  {formSubmitting ? (
                    <ActivityIndicator size="small" color={paletteV2.textPrimaryOnDark} />
                  ) : (
                    <Text style={styles.formButtonText}>{mode === 'add' ? 'Add Employee' : 'Save Changes'}</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default EmployeeForm;