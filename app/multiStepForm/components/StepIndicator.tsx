import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Props = {
  steps: string[];
  currentStep: number;
  onStepPress: (stepIndex: number) => void;
  highestReachedStep: number;
};

const ACTIVE_COLOR = '#9B59B6';
const COMPLETED_COLOR = '#50E3C2';
const INACTIVE_COLOR = '#E0E0E0';
const LABEL_COLOR_ACTIVE = '#333333';
const LABEL_COLOR_INACTIVE = '#A8A8A8';

const StepIndicator = ({ steps, currentStep, onStepPress, highestReachedStep }: Props) => {
  const progress = useRef(new Animated.Value(highestReachedStep)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: highestReachedStep,
      duration: 400,
      useNativeDriver: false,
      easing: Easing.out(Easing.ease),
    }).start();

    scaleAnim.stopAnimation();

    if (currentStep < steps.length) {
      scaleAnim.setValue(1);
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.15,
            duration: 700,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
        ])
      ).start();
    }

    return () => {
      scaleAnim.stopAnimation();
    };
  }, [currentStep, highestReachedStep, steps.length]);

  const width = progress.interpolate({
    inputRange: [0, steps.length - 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.line} />
      <Animated.View style={[styles.progressLineContainer, { width }]}>
        <LinearGradient
          colors={[COMPLETED_COLOR, ACTIVE_COLOR]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.progressLine}
        />
      </Animated.View>

      {steps.map((label, index) => {
        const isActive = index === currentStep;
        const isClickable = index <= highestReachedStep;
        const isCompletedOrPassed = index <= highestReachedStep;

        return (
          <TouchableOpacity
            key={index}
            style={styles.stepContainer}
            onPress={() => isClickable && onStepPress(index)}
            activeOpacity={isClickable ? 0.7 : 1}
          >
            <Animated.View
              style={[
                styles.circle,
                isCompletedOrPassed
                  ? styles.completedCircle
                  : isActive
                  ? styles.activeCircle
                  : styles.inactiveCircle,
                {
                  transform: [{ scale: isActive ? scaleAnim : 1 }],
                },
              ]}
            >
              {isCompletedOrPassed && (
                <MaterialIcons name="check" size={18} color="#FFF" />
              )}
            </Animated.View>
            <Text
              style={[
                styles.label,
                isActive ? styles.activeLabel : styles.inactiveLabel,
                !isClickable && styles.disabledLabel,
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default StepIndicator;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
    marginBottom: 40,
    position: 'relative',
    alignItems: 'flex-start',
    marginTop: 5,
  },
  line: {
    position: 'absolute',
    top: 14,
    left: 15,
    right: 15,
    height: 4,
    backgroundColor: INACTIVE_COLOR,
    borderRadius: 2,
    zIndex: 0,
  },
  progressLineContainer: {
    position: 'absolute',
    top: 14,
    left: 15,
    height: 4,
    zIndex: 1,
  },
  progressLine: {
    height: 4,
    borderRadius: 2,
  },
  stepContainer: {
    alignItems: 'center',
    zIndex: 2,
    width: 80,
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginBottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  activeCircle: {
    borderWidth: 3,
    borderColor: ACTIVE_COLOR,
    shadowColor: ACTIVE_COLOR,
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 12,
    elevation: 10,
  },
  completedCircle: {
    backgroundColor: COMPLETED_COLOR,
  },
  inactiveCircle: {
    backgroundColor: INACTIVE_COLOR,
  },
  label: {
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
  },
  activeLabel: {
    color: LABEL_COLOR_ACTIVE,
    fontWeight: 'bold',
  },
  inactiveLabel: {
    color: LABEL_COLOR_INACTIVE,
  },
  disabledLabel: {
    opacity: 0.6,
  },
});