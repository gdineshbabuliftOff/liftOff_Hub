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