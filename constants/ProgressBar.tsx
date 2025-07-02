import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';

interface Props {
  progress: number;
}

export default function CustomProgressBar({ progress }: Props) {
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: progress,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  return (
    <View
      style={{
        width: '100%',
        height: 10,
        backgroundColor: '#e0e0e0',
        borderRadius: 5,
        overflow: 'hidden',
        marginTop: 10,
        marginBottom: 5,
      }}
    >
      <Animated.View
        style={{
          width: widthAnim.interpolate({
            inputRange: [0, 100],
            outputRange: ['0%', '100%'],
          }),
          height: '100%',
          backgroundColor: '#5DBBAD',
          borderRadius: 5,
        }}
      />
    </View>
  );
}
