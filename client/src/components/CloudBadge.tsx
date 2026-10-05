interface Props {
  provider?: string;
  email?: string;
}

export default function CloudBadge({ provider, email }: Props) {
  if (!provider && !email) return null;

  const isGoogle = provider === 'google-drive';
  const isOneDrive = provider === 'onedrive';

  return (
    <div
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border shadow-xs ${
        isGoogle
          ? 'bg-amber-50 text-amber-800 border-amber-200'
          : isOneDrive
          ? 'bg-blue-50 text-blue-800 border-blue-200'
          : 'bg-gray-100 text-gray-700 border-gray-200'
      }`}
      title={email}
    >
      {isGoogle && (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M7.71 3.5L1.15 15l3.43 6 6.55-11.5L7.71 3.5zm2.86 6.5l3.43 6H24l-3.43-6H10.57zm5.72-6.5l-6.56 11.5 3.43 6 6.56-11.5-3.43-6z" />
        </svg>
      )}
      {isOneDrive && (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
        </svg>
      )}
      <span className="font-semibold">{isGoogle ? 'Google Drive' : isOneDrive ? 'OneDrive' : provider}</span>
      {email && <span className="opacity-75 max-w-35 truncate">({email})</span>}
    </div>
  );
}