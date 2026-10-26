import type { CloudFile } from '../types/cloud';
import { formatBytes } from '../utils/format';
import Breadcrumbs from './Breadcrumbs';
import { Badge } from './ui/badge';
import { Text } from './ui/Typography';
import { Card } from './ui/Card';
import DeleteFileButton from './DeleteFileButton';
import FilePreviewFrame from './FilePreviewFrame';
import FileStatusBadge from './FileStatusBadge';

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
  const cardStateClasses = isRecommendedKeep
    ? 'border-2 border-emerald-400 dark:border-emerald-500 ring-4 ring-emerald-50 dark:ring-emerald-900/30'
    : 'border border-gray-200 dark:border-slate-700';

  return (
    <Card
      padding="sm"
      className={`relative flex flex-col items-center shadow transition-all ${cardStateClasses}`}
    >
      <FileStatusBadge
        isRecommendedKeep={isRecommendedKeep}
        isRecommendedDelete={isRecommendedDelete}
      />

      <FilePreviewFrame file={file} accountId={accountId} />

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

      <DeleteFileButton file={file} onDelete={onDelete} />
    </Card>
  );
}
