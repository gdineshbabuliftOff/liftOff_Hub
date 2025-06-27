import Card from '@/components/Layouts/Card';
import { getLocalData, LocalUserData } from '@/utils/localData';
import { openURL } from '@/utils/navigation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Image, KeyboardAvoidingView, Platform, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import AgreementForm from './(forms)/agreement';
import BankDetailsForm from './(forms)/bankDetails';
import DocumentsForm from './(forms)/documents';
import PersonalDetailsForm, { FormHandle } from './(forms)/personalDetails';
import FormLayout from './components/FormLayout';
import StepIndicator from './components/StepIndicator';

const steps = ['Personal', 'Documents', 'Bank', 'Agreement'];
type AnimationDirection = 'forward' | 'backward';
type FormActionType = 'submit' | 'save' | 'none';

const MultiStepForm = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [animationDirection, setAnimationDirection] = useState<AnimationDirection>('forward');
  const { width } = useWindowDimensions();
  const formRef = useRef<FormHandle>(null);
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [highestReachedStep, setHighestReachedStep] = useState(0);
  const [userData, setUserData] = useState<LocalUserData | null>(null);
  const [isSpecialUser, setIsSpecialUser] = useState(false);
  const [currentActionType, setCurrentActionType] = useState<FormActionType>('none');
  const [isFormDirty, setIsFormDirty] = useState(false);
  const defaultImage = require('../../assets/images/newUser.png');

  useEffect(() => {
    const loadData = async () => {
      const stored = await AsyncStorage.getItem('activeStep');
      if (stored !== null) {
        const parsedStep = parseInt(stored, 10);
        setCurrentStep(parsedStep);
        setHighestReachedStep(parsedStep);
      }
      const localData = await getLocalData();
      setUserData(localData);
      const parsedUserData = localData?.userData ? JSON.parse(localData.userData) : {};
      const specialUser = parsedUserData.role === 'ADMIN' || parsedUserData.joineeType === 'EXPERIENCE';
      setIsSpecialUser(specialUser);
      if (specialUser) {
        setCurrentStep(0);
        setHighestReachedStep(0);
        await AsyncStorage.setItem('activeStep', '0');
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (currentStep > 3) {
      setCurrentStep(0);
      AsyncStorage.setItem('activeStep', '0');
    }
  }, [currentStep]);

  useEffect(() => {
    if (currentStep > highestReachedStep) setHighestReachedStep(currentStep);
    animatedValue.setValue(animationDirection === 'forward' ? width : -width);
    Animated.timing(animatedValue, { toValue: 0, duration: 350, useNativeDriver: true }).start();
  }, [currentStep, animationDirection, width]);

  const goNext = async () => {
    if (formRef.current?.isSubmitting) return;
    setCurrentActionType('submit');
    try {
      const isSuccess = await formRef.current?.submit?.();
      if (isSuccess) {
        if (isSpecialUser) {
          Alert.alert('Form Submitted', 'Redirecting to Profile Page!');
          handleProfileRedirect();
        } else if (currentStep === steps.length - 1) {
          Alert.alert('Onboarding Complete', 'You have successfully completed all steps.');
          setAnimationDirection('forward');
          setCurrentStep(0);
          await AsyncStorage.setItem('activeStep', '0');
        } else {
          setAnimationDirection('forward');
          const nextStep = currentStep + 1;
          setCurrentStep(nextStep);
          await AsyncStorage.setItem('activeStep', nextStep.toString());
        }
      }
    } finally {
      setCurrentActionType('none');
    }
  };
  
  const handleProfileRedirect = () => {
    openURL('/profile');
  };

  const handleSave = async () => {
    if (formRef.current?.isSubmitting) return;
    setCurrentActionType('save');
    try {
      await formRef.current?.save?.();
    } finally {
      setCurrentActionType('none');
    }
  };

  const goBack = () => {
    if (currentStep > 0 && !isSpecialUser) {
      setAnimationDirection('backward');
      animatedValue.setValue(0);
      Animated.timing(animatedValue, { toValue: width, duration: 350, useNativeDriver: true }).start(async () => {
        const prevStep = currentStep - 1;
        setCurrentStep(prevStep);
        await AsyncStorage.setItem('activeStep', (prevStep).toString());
      });
    }
  };

  const handleStepPress = (clickedStep: number) => {
    if (isSpecialUser) return;
    if (clickedStep <= highestReachedStep) {
      if (clickedStep < currentStep) setAnimationDirection('backward');
      else if (clickedStep > currentStep) setAnimationDirection('forward');
      setCurrentStep(clickedStep);
    }
  };

  const renderStepContent = () => {
    const formProps = {
        ref: formRef,
        onDirtyChange: setIsFormDirty,
    };
    switch (currentStep) {
      case 0: return <PersonalDetailsForm {...formProps} isSpecialUserMode={isSpecialUser} />;
      case 1: return <DocumentsForm {...formProps} />;
      case 2: return <BankDetailsForm {...formProps} />;
      case 3: return <AgreementForm {...formProps} />;
      default: return null;
    }
  };

  return (
    <Card topNavBackgroundColor="#fff" topNavContent={
        <View>
          {isSpecialUser ? <Text style={styles.personalDetailsTitle}>Personal Details</Text> : <StepIndicator steps={steps} currentStep={currentStep} onStepPress={handleStepPress} highestReachedStep={highestReachedStep} />}
        </View>
      } fullHeight={true}>
      <KeyboardAvoidingView style={styles.keyboardAvoidingView} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
        <Animated.View style={[styles.animatedContainer, { transform: [{ translateX: animatedValue }] }]}>
          <FormLayout onNext={goNext} onBack={goBack} isLastStep={isSpecialUser ? true : currentStep === steps.length - 1} isFirstStep={isSpecialUser ? true : currentStep === 0} currentActionType={currentActionType} isSubmittingNextButton={formRef.current?.isSubmittingNext || false} isSubmittingSaveButton={formRef.current?.isSubmittingSave || false} isDirty={isFormDirty} onSave={handleSave} isSpecialUserMode={isSpecialUser}>
            {renderStepContent()}
          </FormLayout>
        </Animated.View>
      </KeyboardAvoidingView>
      <TouchableOpacity onPress={handleProfileRedirect} style={styles.fab}>
        <Image 
            source={defaultImage} 
            style={styles.fabImage} 
        />
    </TouchableOpacity>
    </Card>
  );
};

export default MultiStepForm;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  animatedContainer: {
    flex: 1,
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  personalDetailsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    paddingVertical: 15
  },
  fab: {
    position: 'absolute',
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    right: 10,
    bottom: 70,
    backgroundColor: '#fff',
    borderRadius: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowRadius: 5,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
  },
  fabImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
});