import type { CloudFile } from '../types/cloud';
import CloudBadge from './CloudBadge';
import MediaPreview from './MediaPreview';
import { DocumentIcon, PlayIcon } from './icons';

interface Props {
  file: CloudFile;
  accountId: string;
}

export default function FilePreviewFrame({ file, accountId }: Props) {
  const isVideo = file.mimeType.startsWith('video/');

  return (
    <div className="file-preview-frame">
      <MediaPreview
        file={file}
        isVideo={isVideo}
        accountId={file.accountId ?? accountId}
      />

      {file.webViewLink && (
        <a
          href={file.webViewLink}
          target="_blank"
          rel="noopener noreferrer"
          className="file-preview-link"
          title="Open in Cloud"
        >
          <div className="file-preview-action">
            {isVideo ? (
              <PlayIcon className="h-8 w-8 text-teal-600" />
            ) : (
              <DocumentIcon className="h-8 w-8 text-teal-600" />
            )}
          </div>
        </a>
      )}

      <div className="pointer-events-none absolute right-2 top-2 z-10">
        <CloudBadge provider={file.provider} email={file.accountEmail} />
      </div>
    </div>
  );
}
