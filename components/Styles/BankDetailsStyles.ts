
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    paddingBottom: 60,
  },
  scrollContentContainer: {
    flexGrow: 1,
    padding: 20,
    marginBottom: 60,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  fieldContainer: {
    marginBottom: 22,
  },
  label: {
    marginBottom: 8,
    fontWeight: '600',
    fontSize: 15,
    color: '#333',
  },
  requiredIndicator: {
    color: 'red',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: 'white',
    fontSize: 16,
    color: '#333',
  },
  errorInput: {
    borderColor: '#d9534f',
    borderWidth: 1.5,
  },
  errorText: {
    color: '#d9534f',
    marginTop: 6,
    fontSize: 13,
    fontWeight: '500',
  },
});