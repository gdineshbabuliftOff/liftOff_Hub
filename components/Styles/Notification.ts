import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#000',
      textAlign: 'center',
    },
    dateGroup: {
      marginBottom: 16,
      marginTop: 10,
      paddingHorizontal: 16,
    },
    groupDate: {
      fontSize: 16,
      fontWeight: '600',
      color: '#555',
      marginBottom: 8,
    },
    notificationItem: {
      padding: 16,
      marginBottom: 8,
      borderRadius: 10,
      flexDirection: 'row',
      alignItems: 'center',
      elevation: 2,
    },
    birthday: {
      backgroundColor: '#C1E1C1',
    },
    anniversary: {
      backgroundColor: '#B5EFFF',
    },
    icon: {
      width: 50,
      height: 50,
      marginRight: 12,
      borderRadius: 25,
    },
    textContainer: {
      flex: 1,
      justifyContent: 'center',
    },
    nameText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#000',
    },
    messageText: {
      fontSize: 14,
      color: '#555',
      marginTop: 4,
    },
    emptyContainer: {
      alignItems: 'center',
      marginTop: 40,
      paddingHorizontal: 20,
    },
    noEmployeeImage: {
      width: 150,
      height: 150,
      marginBottom: 16,
    },
    emptyText: {
      color: '#B0B0B0',
      textAlign: 'center',
      fontSize: 16,
    },
    loaderContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 40,
    },
  });
  