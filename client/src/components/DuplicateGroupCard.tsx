import type { CloudFile, DuplicateGroup } from '../types/cloud';
import FileCard from './FileCard';

interface Props {
  group: DuplicateGroup;
  index: number;
  accountId: string;
  onDelete: (file: CloudFile) => void;
}

export default function DuplicateGroupCard({ group, index, accountId, onDelete }: Props) {
  const isQuality = group.type === 'quality';
  const count = group.files.length;

  return (
    <div className="bg-red-50/30 p-6 rounded-2xl border border-red-100 shadow-sm">
      <h2 className="text-lg font-bold text-red-800 mb-4 flex items-center gap-2">
        <span className="bg-red-200 text-red-900 px-3 py-1 rounded-full text-sm">סט #{index + 1}</span>
        {count === 2 ? 'אותו קובץ מופיע פעמיים' : `אותו קובץ מופיע ${count} פעמים`}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-6">
        {group.files.map((file, i) => (
          <FileCard
            key={file.id}
            file={file}
            accountId={accountId}
            isRecommendedKeep={isQuality && i === 0}
            isRecommendedDelete={isQuality && i > 0}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}