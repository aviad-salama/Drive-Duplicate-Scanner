import type { CloudFile, DuplicateGroup } from '../types/cloud';
import FileCard from './FileCard';

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
    <div className="bg-red-50/30 dark:bg-slate-900/50 p-6 rounded-2xl border border-red-100 dark:border-slate-800 shadow-sm transition-colors">
      <h2 className="text-lg font-bold text-red-800 dark:text-red-400 mb-4 flex items-center gap-2">
        <span className="bg-red-200 dark:bg-red-900/50 text-red-900 dark:text-red-200 px-3 py-1 rounded-full text-sm">סט #{index + 1}</span>
        {count === 2 ? 'אותו קובץ מופיע פעמיים' : `אותו קובץ מופיע ${count} פעמים`}
      </h2>

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
    </div>
  );
}