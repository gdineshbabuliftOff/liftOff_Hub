import AuthLayout from '@/components/Layouts/AuthLayout';
import { yupResolver } from '@hookform/resolvers/yup';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Text, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { Routes } from '@/constants/enums';
import { resetPasswordSchema } from '@/constants/Validations';
import { openURL } from '@/utils/navigation';
import { resetUserPassword } from '../Api/authentication';
import PrimaryButton from '../Atoms/Buttons/PrimaryButton';
import FormInput from '../Atoms/Input/FormInput';
import loginStyles from '../Styles/LoginStyles';

export default function ResetPasswordPage() {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: yupResolver(resetPasswordSchema) });

  const [loading, setLoading] = useState(false);
  const { token } = useLocalSearchParams<{ token: string }>();

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      if (!token) throw new Error('Reset token is missing from the URL.');

      const response = await resetUserPassword({
        token,
        newPassword: data.newPassword,
      });

      if (!response || response.status !== 'success') {
        throw new Error('Password reset failed');
      }

      Toast.show({ type: 'success', text1: 'Password reset successful' });
      openURL(Routes.LOGIN);
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Something went wrong';
      Toast.show({ type: 'error', text1: 'Reset Failed', text2: errMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AuthLayout title="Reset Your Password!">
        <FormInput
          name="newPassword"
          control={control}
          placeholder="New Password"
          secureTextEntry
          error={errors.newPassword?.message as string}
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
