import * as yup from 'yup';

export const loginSchema = yup.object().shape({
  email: yup
    .string()
    .email('Invalid email')
    .test('domain', 'Email must end with @liftoffllc.com', (value) =>
      value?.toLowerCase().endsWith('@liftoffllc.com')
    )
    .required('Email is required'),
  password: yup.string().required('Password is required'),
});
