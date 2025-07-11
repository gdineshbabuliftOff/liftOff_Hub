import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F3F4F6',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
    },
    card: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      marginBottom: 20,
      elevation: 1,
      shadowColor: '#4B5563',
      shadowOpacity: 0.05,
      shadowRadius: 15,
      shadowOffset: { width: 0, height: 5 },
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: 'transparent',
    },
    cardError: {
        borderColor: '#EF4444', 
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    cardIconContainer: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    cardBody: {
      padding: 16,
    },
    label: {
      fontSize: 17,
      fontWeight: '600',
      color: '#1F2937',
    },
    requiredAsterisk: {
      color: '#EF4444',
    },
    inlineErrorText: {
        fontSize: 13,
        color: '#EF4444',
        marginTop: 4,
    },
    dropzone: {
        borderWidth: 2,
        borderColor: '#D1D5DB',
        borderStyle: 'dashed',
        borderRadius: 12,
        paddingVertical: 24,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F9FAFB',
    },
    dropzoneError: {
        borderColor: '#FCA5A5',
        backgroundColor: '#FEF2F2',
    },
    dropzoneText: {
        marginTop: 12,
        fontSize: 16,
        fontWeight: '500',
        color: '#4B5563',
    },
    dropzoneSubText: {
        marginTop: 4,
        fontSize: 12,
        color: '#9CA3AF'
    },
    errorText: {
        color: '#EF4444',
    },
    uploadingContainer: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 12,
    },
    progressWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    progressText: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '600',
        marginHorizontal: 10,
    },
    fileName: {
        fontSize: 15,
        color: '#374151',
        fontWeight: '500',
    },
    cancelButtonIcon: {
        padding: 4,
    },
    successContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ECFDF5',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
    },
    fileNameSuccess: {
        fontSize: 14,
        fontWeight: '500',
        color: '#059669',
        flex: 1,
    },
    actionButtonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    smallActionButton: {
      padding: 6,
      marginLeft: 16,
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(17, 24, 39, 0.6)',
    },
    modalContainer: {
      width: '85%',
      maxWidth: 340,
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: 24,
      alignItems: 'center',
      elevation: 20,
      shadowColor: '#000',
      shadowOpacity: 0.25,
      shadowRadius: 20,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700',
      marginBottom: 12,
      color: '#111827',
    },
    modalMessage: {
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 24,
      color: '#4B5563',
      lineHeight: 24,
    },
    modalButtonContainer: {
      flexDirection: 'row',
      width: '100%',
    },
    modalButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
    },
    cancelButton: {
      backgroundColor: '#E5E7EB',
      marginRight: 8,
    },
    cancelButtonText: {
      color: '#374151',
      fontWeight: '600',
      fontSize: 16,
    },
    deleteButton: {
      backgroundColor: '#EF4444',
      marginLeft: 8,
    },
    deleteButtonText: {
      color: '#FFFFFF',
      fontWeight: '600',
      fontSize: 16,
    },
});