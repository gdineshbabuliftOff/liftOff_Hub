import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface FormLayoutProps {
  children: React.ReactNode;
  onNext: () => void;
  onBack: () => void;
  isLastStep: boolean;
  isFirstStep: boolean;
  isSubmittingNextButton: boolean;
  isSubmittingSaveButton: boolean;
  currentActionType: 'submit' | 'save' | 'none';
  isDirty: boolean;
  onSave?: () => Promise<void>;
  isSpecialUserMode?: boolean;
}

const ACTIVE_COLORS = ['#26A69A', '#00897B'] as const;
const DISABLED_COLORS = ['#B5B5B5', '#9D9D9D'] as const;

const FormLayout: React.FC<FormLayoutProps> = ({
  children,
  onNext,
  onBack,
  isLastStep,
  isFirstStep,
  isSubmittingNextButton,
  isSubmittingSaveButton,
  currentActionType,
  isDirty,
  onSave,
  isSpecialUserMode,
}) => {
  const isAnyActionInProgress = isSubmittingNextButton || isSubmittingSaveButton;
  const isSaveDisabled = !isDirty || isAnyActionInProgress;

  const useBorderedSaveStyle = !isSaveDisabled && !(currentActionType === 'save' && isSubmittingSaveButton);

  return (
    <View style={layoutStyles.container}>
      <View style={layoutStyles.content}>{children}</View>
      <View style={layoutStyles.navigationContainer}>
        {!isFirstStep && !isSpecialUserMode && (
          <TouchableOpacity
            style={layoutStyles.buttonContainer}
            onPress={onBack}
            disabled={isAnyActionInProgress}>
            <LinearGradient
              colors={isAnyActionInProgress ? DISABLED_COLORS : ACTIVE_COLORS}
              style={layoutStyles.gradientWrapper}>
              <Text style={layoutStyles.buttonText}>Back</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {onSave && (
          <TouchableOpacity
            style={layoutStyles.buttonContainer}
            onPress={onSave}
            disabled={isSaveDisabled}>
            {useBorderedSaveStyle ? (
              <LinearGradient
                colors={ACTIVE_COLORS}
                style={layoutStyles.gradientBorder}>
                <View style={layoutStyles.innerSaveButton}>
                  <Text style={layoutStyles.saveButtonText}>Save</Text>
                </View>
              </LinearGradient>
            ) : (
              <LinearGradient
                colors={isSaveDisabled ? DISABLED_COLORS : ACTIVE_COLORS}
                style={layoutStyles.gradientWrapper}>
                {currentActionType === 'save' && isSubmittingSaveButton ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={layoutStyles.buttonText}>Save</Text>
                )}
              </LinearGradient>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={layoutStyles.buttonContainer}
          onPress={onNext}
          disabled={isAnyActionInProgress}>
          <LinearGradient
            colors={isAnyActionInProgress ? DISABLED_COLORS : ACTIVE_COLORS}
            style={layoutStyles.gradientWrapper}>
            {currentActionType === 'submit' && isSubmittingNextButton ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={layoutStyles.buttonText}>
                {isSpecialUserMode ? 'Submit' : isLastStep ? 'Submit' : 'Next'}
              </Text>
            )}
          </LinearGradient>
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
    gap: 10,
  },
  buttonContainer: {
    flex: 1,
  },
  gradientWrapper: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  gradientBorder: {
    borderRadius: 8,
    padding: 2, 
  },
  innerSaveButton: {
    backgroundColor: '#fff',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#00897B',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default FormLayout;