import { formatDateFull } from '@/constants/common';
import { JoineeTypes, Roles } from '@/constants/enums';
import React from 'react';
import {
    ActivityIndicator,
    Image,
    ImageSourcePropType,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { styles } from '../Styles/ProfileStyles';

// Re-importing paletteV2, DetailsCard, EXPERIENCE_SPECIFIC_DOCS from ProfileScreen
const paletteV2 = {
  primaryMain: '#5DBBAD',
  primaryDark: '#3E9C90',
  primaryLight: '#A7D7D3',
  accentMain: '#FCA311',
  backgroundLight: '#F8F9FA',
  surface: '#FFFFFF',
  textPrimaryOnLight: '#4A5568',
  textSecondaryOnLight: '#6B7280',
  textDisabled: '#9CA3AF',
  textPrimaryOnDark: '#FFFFFF',
  errorMain: '#E53935',
  warningMain: '#FFB300',
  successMain: '#43A047',
  iconDefault: '#8FA3AD',
  iconSubtle: '#B0BEC5',
  neutralDark: '#6A7881',
  neutralLight: '#ECEFF1',
  neutralMedium: '#9CA3AF',
  neutralWhite: '#FFFFFF',
  gradientPrimaryButton: ['#5DBBAD', '#3E9C90'],
};

export enum DetailsCard {
  aadharCard = 'Aadhar Card',
  panCard = 'PAN Card',
  tenthMarksCard = '10th Marks Card',
  twelthMarksCard = '12th Marks Card',
  bachelorsOrHigherDegree = 'Bachelors/Higher Degree',
  last3MonthsPayslips = 'Last 3 Months Payslips',
  last3OrgRelievingOfferLetter = 'Last Org. Relieving/Offer Letter',
  fullAndFinalSettlement = 'Full and Final Settlement',
  agreement = 'Agreement',
}

const EXPERIENCE_SPECIFIC_DOCS: string[] = [
  DetailsCard.last3MonthsPayslips,
  DetailsCard.last3OrgRelievingOfferLetter,
  DetailsCard.fullAndFinalSettlement,
];

type ApiDocumentDetail = {
  documentGroup: string;
  name: string;
  documentType: string;
  url: string;
};

type WebViewDocument = {
  documentTypeDisplay: string;
  url: string;
  name: string;
  documentGroup?: string;
};

type ContactType = {
  name: string;
  phoneNumber: string;
  relationship?: string;
};

interface DetailItemProps {
  label: string;
  value?: string | number | null;
  fullWidth?: boolean;
}

const DetailItem: React.FC<DetailItemProps> = ({ label, value, fullWidth = false }) => (
  <View style={[styles.fieldContainer, fullWidth && styles.fieldContainerFullWidth]}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>
      {value !== null && value !== undefined && String(value).trim() !== '' ? String(value) : 'N/A'}
    </Text>
  </View>
);

interface DetailRowProps {
  children: React.ReactElement<DetailItemProps> | React.ReactElement<DetailItemProps>[];
}

const DetailRow: React.FC<DetailRowProps> = ({ children }) => (
  <View style={styles.row}>
    {React.Children.map(children, (child) => (
      <View style={[styles.column, React.Children.count(children) === 1 && styles.fullColumn]}>
        {child}
      </View>
    ))}
  </View>
);

interface ProfileSectionProps {
  title: string;
  children: React.ReactNode;
}

const ProfileSection: React.FC<ProfileSectionProps> = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

interface ProfileHeaderProps {
  photoUrl?: string;
  defaultImage: ImageSourcePropType;
  imageLoading: boolean;
  imageError: boolean;
  onImageLoad: () => void;
  onImageError: () => void;
  showEditButton: boolean;
  onEditPress: () => void;
  onAvatarPress?: () => void;
}

const ProfileHeaderComponent: React.FC<ProfileHeaderProps> = ({
  photoUrl,
  defaultImage,
  imageLoading,
  imageError,
  onImageLoad,
  onImageError,
  showEditButton,
  onEditPress,
  onAvatarPress,
}) => (
  <View style={styles.profileHeaderMain}>
    <TouchableOpacity onPress={onAvatarPress} disabled={!onAvatarPress}>
      <View style={styles.avatarContainer}>
        {imageLoading && !imageError && photoUrl && (
          <ActivityIndicator size="small" color={paletteV2.primaryMain} style={styles.imageLoader} />
        )}
        <Image
          source={imageError || !photoUrl ? defaultImage : { uri: photoUrl }}
          style={styles.avatar}
          onLoad={onImageLoad}
          onError={onImageError}
        />
      </View>
    </TouchableOpacity>
    {showEditButton && (
      <TouchableOpacity style={styles.actionButton} onPress={onEditPress}>
        <MaterialIcons name="edit" size={18} color={paletteV2.textPrimaryOnDark} style={{ marginRight: 8 }} />
        <Text style={styles.actionButtonText}>Edit My Details</Text>
      </TouchableOpacity>
    )}
  </View>
);

interface DocumentItemProps {
  documentDisplayLabel: string;
  docFromApi?: ApiDocumentDetail;
  onViewDocument: (doc: WebViewDocument) => void;
}

const DocumentItemComponent: React.FC<DocumentItemProps> = ({ documentDisplayLabel, docFromApi, onViewDocument }) => (
  <View style={styles.documentItem}>
    <MaterialIcons name="description" size={24} color={paletteV2.primaryMain} />
    <Text style={styles.documentName}>{documentDisplayLabel}</Text>
    {docFromApi?.url ? (
      <TouchableOpacity
        onPress={() => onViewDocument({
          url: docFromApi.url,
          name: docFromApi.name,
          documentTypeDisplay: documentDisplayLabel,
          documentGroup: docFromApi.documentGroup,
        })}
        style={styles.viewButton}
      >
        <Text style={styles.viewButtonText}>View</Text>
        <MaterialIcons name="visibility" size={16} color={paletteV2.primaryDark} style={{ marginLeft: 5 }} />
      </TouchableOpacity>
    ) : (
      <View style={styles.pendingTag}>
        <Text style={styles.pendingTagText}>Pending</Text>
      </View>
    )}
  </View>
);

interface ProfileDetailsSectionProps {
  profile: any;
  employeeData: any;
  pathname: string;
  loggedInUserRole: Roles | null;
  currentProfileJoineeType: JoineeTypes | null;
  defaultImage: ImageSourcePropType;
  imageLoading: boolean;
  imageError: boolean;
  onImageLoad: () => void;
  onImageError: () => void;
  handleSelfEditDetails: () => void;
  handleViewDocument: (doc: WebViewDocument) => void;
  setIsProfilePicModalVisible: (visible: boolean) => void;
}

const shouldShowDocumentsSectionOriginal = (pathname: string, userRole: Roles | null) => {
  return (pathname === '/profile' && (userRole === Roles.EMPLOYEE || userRole === Roles.EDITOR)) ||
    (pathname === '/employee-details' && userRole === Roles.ADMIN);
};

const shouldShowBankDetailsOriginal = (userRole: Roles | null, currentJoineeType: JoineeTypes | null, pathname: string) => {
  return (userRole === Roles.EMPLOYEE || userRole === Roles.EDITOR || pathname === '/employee-details') &&
    (currentJoineeType === JoineeTypes.NEW || pathname === '/employee-details');
};


const ProfileDetailsSection: React.FC<ProfileDetailsSectionProps> = ({
  profile,
  employeeData,
  pathname,
  loggedInUserRole,
  currentProfileJoineeType,
  defaultImage,
  imageLoading,
  imageError,
  onImageLoad,
  onImageError,
  handleSelfEditDetails,
  handleViewDocument,
  setIsProfilePicModalVisible,
}) => {
  const { photoUrl, bankAccount } = profile;

  const canShowSensitiveJoineeType = currentProfileJoineeType === JoineeTypes.NEW;
  const showDocuments = shouldShowDocumentsSectionOriginal(pathname, loggedInUserRole) &&
                       (canShowSensitiveJoineeType || pathname === '/employee-details');
  const showBankDetails = shouldShowBankDetailsOriginal(loggedInUserRole, currentProfileJoineeType, pathname);

  return (
    <>
      <ProfileSection title="Employee Details">
        <ProfileHeaderComponent
          photoUrl={photoUrl}
          defaultImage={defaultImage}
          imageLoading={imageLoading}
          imageError={imageError}
          onImageLoad={onImageLoad}
          onImageError={onImageError}
          showEditButton={pathname === '/profile' && profile?.editRights === true}
          onEditPress={handleSelfEditDetails}
          onAvatarPress={() => {
            if (photoUrl || !imageError) {
              setIsProfilePicModalVisible(true);
            }
          }}
        />
        <DetailRow><DetailItem label="Email" value={profile?.email} fullWidth /></DetailRow>
        <DetailRow>
          <DetailItem label="DOB" value={formatDateFull(profile?.dateOfBirth)} />
          <DetailItem label="Gender" value={profile?.gender} />
        </DetailRow>
        <DetailRow>
          <DetailItem label="Blood Group" value={profile?.bloodGroup} />
          <DetailItem label="Phone" value={profile?.phone} />
        </DetailRow>
         <DetailRow>
          <DetailItem label="Father Name" value={profile?.fatherName} />
          <DetailItem label="Designation" value={employeeData?.designation} />
        </DetailRow>
        <DetailRow>
          <DetailItem label="DOJ" value={formatDateFull(employeeData?.dateOfJoining)} />
          <DetailItem label="UAN" value={employeeData?.uan} />
        </DetailRow>
        <DetailRow>
          <DetailItem label="PAN" value={employeeData?.pan} />
          <DetailItem label="Aadhar" value={employeeData?.aadhar} />
        </DetailRow>
        <DetailRow><DetailItem label="Current Address" value={profile?.currentAddress} fullWidth /></DetailRow>
        <DetailRow><DetailItem label="Permanent Address" value={profile?.permanentAddress} fullWidth /></DetailRow>
        <DetailRow><DetailItem label="About You" value={profile?.bio} fullWidth /></DetailRow>
      </ProfileSection>

      <ProfileSection title="Emergency Contacts">
        {Array.isArray(employeeData?.contacts) && employeeData.contacts.length > 0 ? (
          employeeData.contacts.map((contact: ContactType, index: number) => {
            const isLastItem = index === employeeData.contacts.length - 1;
            return (
              <View
                  key={index}
                  style={[
                      styles.contactItemContainer,
                      isLastItem && styles.lastContactItemContainer
                  ]}
              >
                <DetailRow>
                  <DetailItem label="Name" value={contact.name} />
                  <DetailItem label="Phone" value={contact.phoneNumber} />
                </DetailRow>
              </View>
            );
          })
        ) : ( <Text style={styles.noDataText}>No emergency contacts available.</Text> )}
      </ProfileSection>

      {showDocuments && (
        <ProfileSection title="Documents">
          {Object.keys(DetailsCard).map((enumKey) => {
            const documentDisplayLabel = DetailsCard[enumKey as keyof typeof DetailsCard];
            const apiDocKey = enumKey;
            const docFromApi = profile?.documents?.[apiDocKey] as ApiDocumentDetail | undefined;
            
            if (EXPERIENCE_SPECIFIC_DOCS.includes(documentDisplayLabel)) {
              if (employeeData?.status !== 'Experienced') {
                return null; 
              }
            }
            return (
              <DocumentItemComponent
                key={apiDocKey}
                documentDisplayLabel={documentDisplayLabel}
                docFromApi={docFromApi}
                onViewDocument={handleViewDocument}
              />
            );
          })}
        </ProfileSection>
      )}

      {showBankDetails && (
        <ProfileSection title="Bank Details">
          {bankAccount ? (
            <>
              <DetailRow>
                <DetailItem label="Account Holder Name" value={bankAccount.name} />
                <DetailItem label="Bank Name" value={bankAccount.bankName}/>
              </DetailRow>
              <DetailRow>
                <DetailItem label="Account Number" value={bankAccount.accountNumber} />
                <DetailItem label="IFSC Code" value={bankAccount.ifscCode}/>
              </DetailRow>
              <DetailRow>
                <DetailItem label="Branch Name" value={bankAccount.branchName} fullWidth/>
              </DetailRow>
            </>
          ) : ( <Text style={styles.noDataText}>No bank details available.</Text> )}
        </ProfileSection>
      )}
    </>
  );
};

export default ProfileDetailsSection;