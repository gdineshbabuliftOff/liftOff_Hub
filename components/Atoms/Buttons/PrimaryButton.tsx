import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, DimensionValue } from 'react-native';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  height?: number;
  width?: DimensionValue;
  style?: ViewStyle;
  disabled?: boolean;
}

export default function PrimaryButton({
  title,
  onPress,
  height = 48,
  width = '100%',
  style,
  disabled = false,
}: PrimaryButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.button,
        { height, width, opacity: disabled ? 0.5 : 1 } as ViewStyle,
        style,
      ]}
      activeOpacity={0.8}
      disabled={disabled}
    >
      <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
