import { View } from 'react-native';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import Toast from 'react-native-toast-message';

import AuthLayout from '@/components/layouts/AuthLayout';
import { login } from '@/utils/auth';
import { router } from 'expo-router';
import { loginSchema } from '@/constants/Validations';
import FormInput from '../Atoms/Input/FormInput';
import loginStyles from '../Styles/LoginStyles';
import PrimaryButton from '../Atoms/Buttons/PrimaryButton';

export default function LoginPage() {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: yupResolver(loginSchema) });

  const onSubmit = async (data: any) => {
    try {
      const email = data.email.toLowerCase();
      await login({ email, password: data.password });
      Toast.show({ type: 'success', text1: 'Login Successful' });
      router.replace('/home');
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Something went wrong';
      Toast.show({ type: 'error', text1: 'Login Failed', text2: errMsg });
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
        <View style={loginStyles.buttonContainer}>
        <PrimaryButton title="Login" onPress={handleSubmit(onSubmit)} />
        </View>
      </AuthLayout>
      <Toast />
    </>
  );
}
