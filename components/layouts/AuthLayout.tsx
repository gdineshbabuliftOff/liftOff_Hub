import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  SafeAreaView,
  Image,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Fonts } from '@/utils/Fonts';

const { height: screenHeight } = Dimensions.get('window');

type Props = {
  children: React.ReactNode;
  title?: string;
};

export default function AuthLayout({ children, title }: Props) {
  return (
    <View style={styles.container}>
      <Video
        source={require('@/assets/videos/bg-video.mov')}
        style={StyleSheet.absoluteFill}
        resizeMode={ResizeMode.COVER}
        isLooping
        isMuted
        shouldPlay
      />

      <SafeAreaView style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoiding}
        >
          <View style={styles.card}>
          <Image
                  source={require('@/assets/images/logo.png')} // Replace with your image path
                  style={styles.logo}
                  resizeMode="contain"
                />
            {title && <Text style={styles.title}>{title}</Text>}
            <View style={styles.content}>{children}</View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 15,
    fontFamily: Fonts.LatoRegular,
  },
  keyboardAvoiding: {
    width: '100%',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 500,
    maxHeight: screenHeight * 0.8,
    backgroundColor: 'hsla(0, 0%, 100%, .85)',
    borderRadius: 16,
    padding: 15,
    gap: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'left',
    fontFamily: Fonts.WorkSansSemiBold,
  },
  content: {
    width: '100%',
  },
  logo: {
    width: 150,
  }
});
