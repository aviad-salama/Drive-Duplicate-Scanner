import type { CloudFile } from '../types/cloud';
import { he } from '../languages/he';
import { Button } from './ui/Button';

interface Props {
  file: CloudFile;
  onDelete: (file: CloudFile) => void;
}

export default function DeleteFileButton({ file, onDelete }: Props) {
  return (
    <Button
      variant="destructive"
      size="default"
      onClick={() => onDelete(file)}
      className="file-delete-button"
    >
      {he.actions.deleteFile}
    </Button>
  );
}
