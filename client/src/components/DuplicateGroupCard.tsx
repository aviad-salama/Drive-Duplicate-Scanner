import type { CloudFile, DuplicateGroup } from '../types/cloud';
import FileCard from './FileCard';
import { Card } from './ui/Card';
import { Title } from './ui/Typography';
import { Badge } from './ui/Badge';

interface Props {
  group: DuplicateGroup;
  index: number;
  accountId: string;
  onDelete: (file: CloudFile) => void;
  keepFileId: string;
}

export default function DuplicateGroupCard({ group, index, accountId, onDelete, keepFileId }: Props) {
  const count = group.files.length;

  return (
    <Card className="bg-white/80 dark:bg-slate-900/80 border-teal-200/80 dark:border-teal-900">
      <Title level={2} className="mb-4 flex items-center gap-2 text-lg">
        <Badge variant="teal" className="rounded-full px-3 text-sm">סט #{index + 1}</Badge>
        {count === 2 ? 'אותו קובץ מופיע פעמיים' : `אותו קובץ מופיע ${count} פעמים`}
      </Title>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-6">
        {group.files.map((file) => {
          const isKept = file.id === keepFileId;
          return (
            <FileCard
              key={`${file.accountId ?? ''}:${file.id}`}
              file={file}
              accountId={accountId}
              isRecommendedKeep={isKept}
              isRecommendedDelete={!isKept}
              onDelete={onDelete}
            />
          );
        })}
      </div>
    </Card>
  );
}