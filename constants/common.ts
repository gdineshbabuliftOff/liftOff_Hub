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