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
const COMPLETED_GRADIENT = ['#26A69A', '#00897B'] as const;
const INACTIVE_COLOR = '#E0E0E0';
const LABEL_COLOR_ACTIVE = '#333333';
const LABEL_COLOR_INACTIVE = '#A8A8A8';

const StepIndicator = ({ steps, currentStep, onStepPress, highestReachedStep }: Props) => {
  const progress = useRef(new Animated.Value(highestReachedStep)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const effectiveCurrentStep = currentStep > 3 ? 0 : currentStep;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: highestReachedStep,
      duration: 400,
      useNativeDriver: false,
      easing: Easing.out(Easing.ease),
    }).start();

    scaleAnim.stopAnimation();
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

    return () => {
      scaleAnim.stopAnimation();
    };
  }, [currentStep, highestReachedStep]);

  const width = progress.interpolate({
    inputRange: [0, steps.length - 1],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <View style={styles.line} />
      <Animated.View style={[styles.progressLineContainer, { width }]}>
        <LinearGradient
          colors={[COMPLETED_GRADIENT[0], ACTIVE_COLOR]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.progressLine}
        />
      </Animated.View>

      {steps.map((label, index) => {
        const isActive = index === effectiveCurrentStep;
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
                isActive
                  ? styles.activeCircle
                  : isCompletedOrPassed
                  ? styles.completedCircle
                  : styles.inactiveCircle,
                {
                  transform: [{ scale: isActive ? scaleAnim : 1 }],
                },
              ]}
            >
              {isCompletedOrPassed && !isActive ? (
                <LinearGradient
                    colors={COMPLETED_GRADIENT}
                    style={styles.gradientCircle}
                >
                    <MaterialIcons name="check" size={18} color={'#FFF'} />
                </LinearGradient>
              ) : isCompletedOrPassed && isActive ? (
                <MaterialIcons name="check" size={18} color={ACTIVE_COLOR} />
              ) : null}
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
    overflow: 'hidden',
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
    backgroundColor: 'transparent',
  },
  inactiveCircle: {
    backgroundColor: INACTIVE_COLOR,
  },
  gradientCircle: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
    marginTop: 4,
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