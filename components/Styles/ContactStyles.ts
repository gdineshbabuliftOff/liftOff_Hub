import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    flex: 1,
    height: 60,
  },
  navLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    backgroundColor: '#f1f1f1',
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  list: {
    padding: 12,
  },
  employeeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    marginBottom: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    borderColor: '#ccc',
    borderWidth: 1,
  },
  employeeName: {
    fontSize: 16,
    color: '#222',
    fontWeight: '500',
  },
  detailContainer: {
    padding: 20,
    backgroundColor: '#fff',
    paddingBottom: 40,
  },
  detailAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: 'center',
    marginBottom: 20,
    borderColor: '#ccc',
    borderWidth: 2,
  },
  detailRowVertical: {
    marginBottom: 16,
  },
  detailLabel: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#444',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f9f9f9',
    padding: 8,
    borderRadius: 6,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
});