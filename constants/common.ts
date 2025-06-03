export const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    const day = date.getDate();
    const suffix = (d: number) =>
      d % 10 === 1 && d !== 11 ? 'st' :
      d % 10 === 2 && d !== 12 ? 'nd' :
      d % 10 === 3 && d !== 13 ? 'rd' : 'th';
    return `${date.toLocaleString('en-US', { month: 'short' })} ${day}${suffix(day)} ${date.getFullYear()}`;
  };

 export const formatDateFull = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
  
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
  
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
  
    // Add the appropriate suffix to the day
    let daySuffix = 'th';
    if (day % 10 === 1 && day !== 11) {
      daySuffix = 'st';
    } else if (day % 10 === 2 && day !== 12) {
      daySuffix = 'nd';
    } else if (day % 10 === 3 && day !== 13) {
      daySuffix = 'rd';
    }
  
    return `${month} ${day}${daySuffix} ${year}`;
  };

  export const employeeDetailsHeader = [
  'Emp Code',
  'Employee Name',
  'email ID',
  'Date of Birth (dd/mm/yyyy)',
  'Fathers Name',
  'PF UAN No',
  'PAN No',
  'Adhar Card No',
  'Date of Hire (dd/mm/yyyy)',
  'Designation',
  'Gender',
  'DOL from Previous Employment ',
  'Name as in bank AC',
  'Bank Name',
  'Branch Name',
  'IFSC Code',
  'Bank A/c Number',
];

export const SORTABLE_FIELDS = [
  { key: 'userId', label: 'ID' },
  { key: 'email', label: 'Email' },
  { key: 'firstName', label: 'Name' },
];

export const DEFAULT_LIMIT = 100;
export const ITEMS_PER_PAGE_OPTIONS = [100, 200, 500];

export const MENU_ACTIONS = {
  REMINDER_EMAIL: 'Send Reminder',
  TOGGLE_EDIT_RIGHTS: 'Toggle Edit Rights',
  DOWNLOAD_DETAILS: 'Download Details',
  DOWNLOAD_DOCUMENTS: 'Download Documents',
  EDIT_USER: 'Edit User',
  DELETE_USER: 'Deactivate User',
  DELETE_USER_PERMANENTLY: 'Delete User Permanently',
};

export const MENU_ACTION_ICONS: { [key: string]: string } = {
  [MENU_ACTIONS.REMINDER_EMAIL]: 'email-send-outline',
  [MENU_ACTIONS.TOGGLE_EDIT_RIGHTS]: 'account-edit-outline',
  [MENU_ACTIONS.DOWNLOAD_DETAILS]: 'download-circle-outline',
  [MENU_ACTIONS.DOWNLOAD_DOCUMENTS]: 'folder-download-outline',
  [MENU_ACTIONS.EDIT_USER]: 'account-cog-outline',
  [MENU_ACTIONS.DELETE_USER]: 'account-cancel-outline',
  [MENU_ACTIONS.DELETE_USER_PERMANENTLY]: 'trash-can-outline',
};

export const ALL_MENU_ITEMS_ORDERED = [
  MENU_ACTIONS.REMINDER_EMAIL,
  MENU_ACTIONS.TOGGLE_EDIT_RIGHTS,
  MENU_ACTIONS.DOWNLOAD_DETAILS,
  MENU_ACTIONS.DOWNLOAD_DOCUMENTS,
  MENU_ACTIONS.EDIT_USER,
  MENU_ACTIONS.DELETE_USER,
  MENU_ACTIONS.DELETE_USER_PERMANENTLY,
];
