export const formatBytes = (bytes?: string | null) => {
  if (!bytes) return 'N/A';
  return (parseInt(bytes) / (1024 * 1024)).toFixed(2) + ' MB';
};