// src/styles/loginStyles.ts
import { StyleSheet } from 'react-native';

const loginStyles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    marginBottom: 4,
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  error: {
    color: 'red',
    marginBottom: 8,
    marginLeft: 4,
  },
  buttonContainer: {
    marginTop: 12,
  },
});

export default loginStyles;
