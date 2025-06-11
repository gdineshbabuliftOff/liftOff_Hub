// Example FormLayout.tsx - YOU NEED TO UPDATE YOUR ACTUAL FILE
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface FormLayoutProps {
  children: React.ReactNode;
  onNext: () => void;
  onBack: () => void;
  isLastStep: boolean;
  isFirstStep: boolean;
  isSubmitting: boolean; // Add this prop
}

const FormLayout: React.FC<FormLayoutProps> = ({
  children,
  onNext,
  onBack,
  isLastStep,
  isFirstStep,
  isSubmitting, // Destructure it
}) => {
  return (
    <View style={layoutStyles.container}>
      <View style={layoutStyles.content}>{children}</View>
      <View style={layoutStyles.navigationContainer}>
        {!isFirstStep && (
          <TouchableOpacity style={layoutStyles.backButton} onPress={onBack} disabled={isSubmitting}>
            <Text style={layoutStyles.buttonText}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={layoutStyles.nextButton}
          onPress={onNext}
          disabled={isSubmitting} // Disable when submitting
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" /> // Show loader when submitting
          ) : (
            <Text style={layoutStyles.buttonText}>{isLastStep ? 'Submit' : 'Next'}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const layoutStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingBottom: 10, // Add some padding at the bottom
  },
  backButton: {
    backgroundColor: '#50E3C2',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  nextButton: {
    backgroundColor: '#50E3C2',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default FormLayout;