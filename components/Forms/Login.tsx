import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';

import AuthLayout from '@/components/layouts/AuthLayout';
import { loginSchema } from '@/constants/Validations';
import FormInput from '../Atoms/Input/FormInput';
import loginStyles from '../Styles/LoginStyles';
import PrimaryButton from '../Atoms/Buttons/PrimaryButton';
import { loginUser } from '../Api/authentication';
import { getActiveStepAndRedirect } from '@/utils/navigationHelper';
import { UserData } from '@/constants/interface';
import { openURL } from '@/utils/navigation';
import { Routes } from '@/constants/enums';

export default function LoginPage() {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: yupResolver(loginSchema) });

  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const email = data.email.toLowerCase();
      const response = await loginUser({ email, password: data.password });

      if (!response || !response.access_token) throw new Error('Login failed');

      const token = response.access_token;
      const decoded = jwtDecode<UserData>(token);

      await AsyncStorage.setItem('userData', JSON.stringify(decoded));
      await AsyncStorage.setItem('token', token);

      Toast.show({ type: 'success', text1: 'Login Successful' });

      await getActiveStepAndRedirect(decoded);
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Something went wrong';
      Toast.show({ type: 'error', text1: 'Login Failed', text2: errMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AuthLayout title="Welcome LiftOffian!">
        <FormInput
          name="email"
          control={control}
          placeholder="Email"
          error={errors.email?.message}
          style={loginStyles.input}
        />
        <FormInput
          name="password"
          control={control}
          placeholder="Password"
          secureTextEntry
          error={errors.password?.message}
          style={loginStyles.input}
        />
        <Pressable onPress={() => openURL(Routes.FORGOT_PASSWORD)}>
          <Text style={loginStyles.link}>
            Forgot Password?
          </Text>
        </Pressable>
        <View style={loginStyles.buttonContainer}>
          <PrimaryButton title="Login" onPress={handleSubmit(onSubmit)} loading={loading} />
        </View>
        <Text style={loginStyles.bottomtext}>
          Joined Recently?{' '}
          <Text
            style={loginStyles.redirectionLink}
            onPress={() => openURL(Routes.SIGNUP)}
          >
            Create Account
          </Text>
        </Text>
      </AuthLayout>
      <Toast />
    </>
  );
}
