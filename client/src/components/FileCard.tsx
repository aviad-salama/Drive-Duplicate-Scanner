import type { CloudFile } from '../types/cloud';
import { formatBytes } from '../utils/format';
import MediaPreview from './MediaPreview';
import CloudBadge from './CloudBadge';
import Breadcrumbs from './Breadcrumbs';
import { PlayIcon, DocumentIcon } from './icons';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Text } from './ui/Typography';
import { Card } from './ui/Card';
interface Props {
  file: CloudFile;
  accountId: string;
  isRecommendedKeep: boolean;
  isRecommendedDelete: boolean;
  onDelete: (file: CloudFile) => void;
}

export default function FileCard({
  file,
  accountId,
  isRecommendedKeep,
  isRecommendedDelete,
  onDelete,
}: Props) {
  
  const isVideo = file.mimeType.startsWith('video/');

  return (
    <Card
      padding="sm"
      className={`relative flex flex-col items-center shadow transition-all ${
        isRecommendedKeep
          ? 'border-2 border-emerald-400 dark:border-emerald-500 ring-4 ring-emerald-50 dark:ring-emerald-900/30'
          : 'border border-gray-200 dark:border-slate-700'
      }`}
    >
      {isRecommendedKeep && (
        <Badge variant="success" className="absolute -top-3 right-4 z-10 rounded-full bg-emerald-500 px-3 py-1 text-white shadow-sm">
          יישמר (מועדף)
        </Badge>
      )}

      {isRecommendedDelete && (
        <Badge variant="danger" className="absolute -top-3 right-4 z-10 rounded-full bg-red-500 px-3 py-1 text-white shadow-sm">
          יימחק (לפי תעדוף)
        </Badge>
      )}

      <div className="relative w-full aspect-video mb-4 bg-gray-100 dark:bg-slate-800 rounded-lg overflow-hidden group border border-gray-200 dark:border-slate-700 flex items-center justify-center">
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
            className="absolute inset-0 flex items-center justify-center bg-black/10 hover:bg-black/40 transition-all cursor-pointer opacity-0 group-hover:opacity-100"
            title="Open in Cloud"
          >
            <div className="bg-white/90 rounded-full p-4 shadow-lg transform transition-transform group-hover:scale-110">
              {isVideo ? (
                <PlayIcon className="w-8 h-8 text-teal-600" />
              ) : (
                <DocumentIcon className="w-8 h-8 text-teal-600" />
              )}
            </div>
          </a>
        )}

        <div className="absolute top-2 right-2 z-10 pointer-events-none">
          <CloudBadge
            provider={file.provider}
            email={file.accountEmail}
          />
        </div>
      </div>

      <div className="w-full text-right mb-2">
        <Text
          as="p"
          className="truncate font-semibold"
          title={file.name}
          dir="auto"
        >
          {file.name}
        </Text>

        <Breadcrumbs path={file.path} />

        <div className="flex gap-2 items-center mt-2 flex-wrap">
          <Badge>
            {formatBytes(file.size)}
          </Badge>
        </div>
      </div>

      <Button
        variant="danger"
        size="md"
        onClick={() => onDelete(file)}
        className="mt-auto w-full rounded-lg bg-red-50 text-red-600 shadow-none hover:bg-red-100 hover:text-red-700 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 dark:hover:text-red-300"
      >
        מחק קובץ זה
      </Button>
    </Card>
  );
}