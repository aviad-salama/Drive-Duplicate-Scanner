import { GoogleDriveIcon, OneDriveIcon } from './icons';
import { ProviderId } from '../config/providers';
interface Props {
  provider?: string;
  email?: string;
}

export default function CloudBadge({ provider, email }: Props) {
  if (!provider && !email) {
    return null;
  }

  let colorClasses = 'bg-gray-100 text-gray-700 border-gray-200';
  let providerName = provider;
  let Icon = null;

  if (provider === ProviderId.GOOGLE_DRIVE) {
    colorClasses = 'bg-amber-50 text-amber-800 border-amber-200';
    providerName = 'Google Drive';
    Icon = GoogleDriveIcon;
  } else if (provider === ProviderId.ONEDRIVE) {
    colorClasses = 'bg-blue-50 text-blue-800 border-blue-200';
    providerName = 'OneDrive';
    Icon = OneDriveIcon;
  }

  return (
    <div
      className={`
        flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium shadow-xs
        ${colorClasses}
      `.trim()}
      title={email}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      <span className="font-semibold">{providerName}</span>
      {email && <span className="opacity-75 max-w-35 truncate">({email})</span>}
    </div>
  );
}