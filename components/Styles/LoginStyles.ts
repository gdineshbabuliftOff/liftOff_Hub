// src/styles/loginStyles.ts
import { link } from 'fs';
import { StyleSheet } from 'react-native';

const loginStyles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    marginTop: 10,
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  error: {
    color: '#90191C',
    marginBottom: 8,
    marginLeft: 4,
  },
  buttonContainer: {
    marginTop: 20,
  },
  link: {
    color: '#000',
    textAlign: 'right',
    marginTop: 10,
  },

  redirectionLink: {
    color: '#90191C',
    textDecorationLine: 'underline',
  },

  bottomtext: {
    marginTop: 10,
    textAlign: 'center',
    fontWeight: 600,
  }
  
});

export default loginStyles;
