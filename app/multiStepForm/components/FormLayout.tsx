import React from 'react';
import { StyleSheet, View } from 'react-native';
import SubmitButton from './SubmitButton';

type Props = {
  children: React.ReactNode;
  onNext: () => void;
  onBack: () => void;
  isLastStep: boolean;
  isFirstStep: boolean;
};

const FormLayout = ({ children, onNext, onBack, isFirstStep, isLastStep }: Props) => (
  <View style={styles.wrapper}>
    <View style={styles.content}>{children}</View>
    <View style={styles.footer}>
      {!isFirstStep ? (
        <View style={styles.leftButtonContainer}>
          <SubmitButton label="Previous" onPress={onBack} />
        </View>
      ) : (
        <View style={styles.emptyLeftSpace} />
      )}
      <View style={styles.rightButtonContainer}>
        <SubmitButton label={isLastStep ? 'Submit' : 'Next'} onPress={onNext} />
      </View>
    </View>
  </View>
);

export default FormLayout;

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    alignItems: 'center',
  },
  leftButtonContainer: {
  },
  emptyLeftSpace: {
    width: 0,
    height: 1,
  },
  rightButtonContainer: {
  },
});