import { View, Text } from 'react-native';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import Toast from 'react-native-toast-message';
import AuthLayout from '@/components/layouts/AuthLayout';
import { router } from 'expo-router';
import FormInput from '../Atoms/Input/FormInput';
import PrimaryButton from '../Atoms/Buttons/PrimaryButton';
import { sendResetPasswordLink } from '../Api/authentication';
import { forgotPasswordSchema } from '@/constants/Validations';
import loginStyles from '../Styles/LoginStyles';
import { useState } from 'react';
import { openURL } from '@/utils/navigation';
import { Routes } from '@/constants/enums';

export default function ForgotPasswordPage() {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: yupResolver(forgotPasswordSchema) });

  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const response = await sendResetPasswordLink({ email: data.email });

      if (!response || response.status !== 'success') throw new Error('Reset link could not be sent');

      Toast.show({ type: 'success', text1: 'Password Reset Link Sent' });

      openURL(Routes.RESET_PASSWORD);
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Something went wrong';
      Toast.show({ type: 'error', text1: 'Failed to Send Link', text2: errMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AuthLayout title="Forgot Password">
        <FormInput
          name="email"
          control={control}
          placeholder="Email"
          error={errors.email?.message}
          style={loginStyles.input}
        />
        <View style={loginStyles.buttonContainer}>
          <PrimaryButton title="Reset Password" onPress={handleSubmit(onSubmit)} loading={loading} />
        </View>
        <Text style={loginStyles.bottomtext}>
          Remembered your password?{' '}
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
