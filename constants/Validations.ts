import * as yup from 'yup';

const passwordRules = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_\-+=\[\]{};':"\\|,.<>/?]).{8,}$/;

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

export const signUpSchema = yup.object().shape({
  email: yup
    .string()
    .trim()
    .lowercase()
    .email('Invalid email format')
    .matches(/^[a-zA-Z0-9._%+-]+@liftoffllc\.com$/, 'Email must end with @liftoffllc.com')
    .required('Email is required'),
  password: yup
    .string()
    .matches(
      passwordRules,
      'Password must be at least 8 characters, contain one uppercase letter and one special character'
    )
    .required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password'), undefined], 'Passwords must match')
    .required('Confirm Password is required'),
});

export const resetPasswordSchema = yup.object().shape({
  newPassword: yup
    .string()
    .matches(
      passwordRules,
      'Password must be at least 8 characters, contain one uppercase letter and one special character'
    )
    .required('New password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('newPassword')], 'Passwords must match')
    .required('Please confirm your password'),
});

export const forgotPasswordSchema = yup.object().shape({
  email: yup
    .string()
    .email('Invalid email')
    .test('domain', 'Email must end with @liftoffllc.com', (value) =>
      value?.toLowerCase().endsWith('@liftoffllc.com')
    )
    .required('Email is required'),
});
