import { Badge } from './ui/badge';
import { he } from '../languages/he';

interface Props {
  isRecommendedKeep: boolean;
  isRecommendedDelete: boolean;
}

export default function FileStatusBadge({ isRecommendedKeep, isRecommendedDelete }: Props) {
  if (isRecommendedKeep) {
    return (
      <Badge variant="success" className="file-status-badge file-status-badge-keep">
        {he.files.kept}
      </Badge>
    );
  }

  if (isRecommendedDelete) {
    return (
      <Badge variant="danger" className="file-status-badge file-status-badge-delete">
        {he.files.deletedByPriority}
      </Badge>
    );
  }

  return null;
}
