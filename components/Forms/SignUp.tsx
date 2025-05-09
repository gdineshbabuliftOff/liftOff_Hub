import { View, Text } from 'react-native';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthLayout from '@/components/layouts/AuthLayout';
import { signUpSchema } from '@/constants/Validations';
import FormInput from '../Atoms/Input/FormInput';
import PrimaryButton from '../Atoms/Buttons/PrimaryButton';
import { registerUser } from '../Api/authentication';
import { UserData } from '@/constants/interface';
import { jwtDecode } from 'jwt-decode';
import loginStyles from '../Styles/LoginStyles';
import { useState } from 'react';
import { openURL } from '@/utils/navigation';
import { Routes } from '@/constants/enums';

export default function SignUpPage() {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: yupResolver(signUpSchema) });

  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const email = data.email.toLowerCase();
      const response = await registerUser({
        email,
        password: data.password,
      });

      if (!response || !response.access_token) throw new Error('Registration failed');

      const token = response.access_token;
      const decoded = jwtDecode<UserData>(token);

      await AsyncStorage.setItem('userData', JSON.stringify(decoded));
      await AsyncStorage.setItem('token', token);

      Toast.show({ type: 'success', text1: 'Registration Successful' });

      openURL(Routes.HOME);
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Something went wrong';
      Toast.show({ type: 'error', text1: 'Registration Failed', text2: errMsg });
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
          error={errors.email?.message as string}
          style={loginStyles.input}
        />
        <FormInput
          name="password"
          control={control}
          placeholder="Password"
          secureTextEntry
          error={errors.password?.message as string}
          style={loginStyles.input}
        />
        <FormInput
          name="confirmPassword"
          control={control}
          placeholder="Confirm Password"
          secureTextEntry
          error={errors.confirmPassword?.message as string}
          style={loginStyles.input}
        />
        <View style={loginStyles.buttonContainer}>
          <PrimaryButton title="Sign Up" onPress={handleSubmit(onSubmit)} loading={loading} />
        </View>
        <Text style={loginStyles.bottomtext}>
          Already have an account?{' '}
          <Text
            style={loginStyles.redirectionLink}
            onPress={() => openURL(Routes.LOGIN)}
          >
            Login
          </Text>
        </Text>
      </AuthLayout>
      <Toast />
    </>
  );
}
