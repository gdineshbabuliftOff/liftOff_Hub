import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView, // Import KeyboardAvoidingView
  Platform,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';

import AgreementForm from './(forms)/agreement';
import BankDetailsForm from './(forms)/bankDetails';
import DocumentsForm from './(forms)/documents';
import PersonalDetailsForm from './(forms)/personalDetails'; // Ensure this is the latest version

import Card from '@/components/Layouts/Card';
import FormLayout from './components/FormLayout';
import StepIndicator from './components/StepIndicator';

const steps = ['Personal', 'Documents', 'Bank', 'Agreement'];

type AnimationDirection = 'forward' | 'backward';

const MultiStepForm = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [animationDirection, setAnimationDirection] =
    useState<AnimationDirection>('forward');
  const { width } = useWindowDimensions();
  const formRef = useRef<{ submit: () => Promise<boolean>; isSubmitting: boolean }>(null); // Updated ref type
  const animatedValue = useRef(new Animated.Value(0)).current;

  const [highestReachedStep, setHighestReachedStep] = useState(0);

  useEffect(() => {
    const loadStep = async () => {
      const stored = await AsyncStorage.getItem('activeStep');
      if (stored !== null) {
        const parsedStep = parseInt(stored, 10);
        setCurrentStep(parsedStep);
        setHighestReachedStep(parsedStep);
      }
    };
    loadStep();
  }, []);

  useEffect(() => {
    if (currentStep > highestReachedStep) {
      setHighestReachedStep(currentStep);
    }

    animatedValue.setValue(animationDirection === 'forward' ? width : -width);

    Animated.timing(animatedValue, {
      toValue: 0,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [currentStep]);

  const goNext = async () => {
    // Check if the form is currently submitting
    if (formRef.current?.isSubmitting) {
      return; // Prevent multiple submissions
    }
    const isValid = await formRef.current?.submit?.();
    if (isValid && currentStep < steps.length - 1) {
      setAnimationDirection('forward');
      setCurrentStep((prev) => prev + 1);
    }
  };

  const goBack = () => {
    if (currentStep > 0) {
      setAnimationDirection('backward');
      animatedValue.setValue(0);
      Animated.timing(animatedValue, {
        toValue: width,
        duration: 350,
        useNativeDriver: true,
      }).start(() => {
        setCurrentStep((prev) => prev - 1);
      });
    }
  };

  const handleStepPress = (clickedStep: number) => {
    if (clickedStep <= highestReachedStep) {
      if (clickedStep < currentStep) {
        setAnimationDirection('backward');
      } else if (clickedStep > currentStep) {
        setAnimationDirection('forward');
      }
      setCurrentStep(clickedStep);
    }
  };

  const renderStep = () => {
    // Pass isSubmitting state to FormLayout from the ref
    const isFormSubmitting = formRef.current?.isSubmitting || false;

    switch (currentStep) {
      case 0:
        return <PersonalDetailsForm ref={formRef} />;
      case 1:
        return <DocumentsForm ref={formRef} />;
      case 2:
        return <BankDetailsForm ref={formRef} />;
      case 3:
        return <AgreementForm ref={formRef} />;
      default:
        return null;
    }
  };

  return (
    <Card
      topNavBackgroundColor="#fff"
      topNavContent={
        <View style={styles.stepIndicatorContainer}>
          <StepIndicator
            steps={steps}
            currentStep={currentStep}
            onStepPress={handleStepPress}
            highestReachedStep={highestReachedStep}
          />
        </View>
      }
      fullHeight={true}
    >
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} // 'height' often works better on Android
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0} // Adjust offset if needed
      >
        <Animated.View
          style={[
            styles.animatedContainer,
            {
              transform: [{ translateX: animatedValue }],
            },
          ]}
        >
          {/* We need to get isSubmitting from the active form's ref */}
          <FormLayout
            onNext={goNext}
            onBack={goBack}
            isLastStep={currentStep === steps.length - 1}
            isFirstStep={currentStep === 0}
            isSubmitting={formRef.current?.isSubmitting || false} // Pass isSubmitting here
          >
            {renderStep()}
          </FormLayout>
        </Animated.View>
      </KeyboardAvoidingView>
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
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
  },
  stepIndicatorContainer: {
    flex: 1,
  },
});