import { GoogleDriveIcon, OneDriveIcon } from './icons';
interface Props {
  provider?: string;
  email?: string;
}

export default function CloudBadge({ provider, email }: Props) {
  if (!provider && !email) {
    return null;
  }

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
        <GoogleDriveIcon className="w-3.5 h-3.5" />
      )}
      {isOneDrive && (
        <OneDriveIcon className="w-3.5 h-3.5" />
      )}
      <span className="font-semibold">{isGoogle ? 'Google Drive' : isOneDrive ? 'OneDrive' : provider}</span>
      {email && <span className="opacity-75 max-w-35 truncate">({email})</span>}
    </div>
  );
}