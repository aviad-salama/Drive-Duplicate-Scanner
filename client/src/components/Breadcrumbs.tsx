import { Text } from './ui/Typography';
import { he } from '../languages/he';

interface Props {
  path: string | null;
}

export default function Breadcrumbs({ path }: Props) {
  if (!path) {
    return null;
  }

  const getPathDirection = (pathString: string): 'rtl' | 'ltr' => {
    const firstLetter = pathString.match(/[\p{L}]/u)?.[0];
    if (firstLetter && /[\u0590-\u05FF\uFB1D-\uFB4F]/u.test(firstLetter)) {
      return 'rtl';
    }
    return 'ltr';
  };

  const pathSegments = path.split('/').filter(Boolean);

  return (
    <div className="mt-2 w-full">
      <Text size="xs" variant="dimmed" className="mb-1 font-semibold">
        {he.files.location}
      </Text>

      <Text
        as="div"
        size="xs"
        variant="dimmed"
        className="flex flex-wrap items-center gap-x-1 gap-y-1"
        dir={getPathDirection(path)}
        title={path}
      >
        {pathSegments.map((segment, index) => (
          <span
            key={pathSegments.slice(0, index + 1).join('/')}
            className="inline-flex items-center gap-1"
          >
            <span
              dir="auto"
              style={{
                unicodeBidi: 'isolate',
                overflowWrap: 'anywhere',
              }}
            >
              {segment}
            </span>

            {index < pathSegments.length - 1 && (
              <span aria-hidden="true" dir="ltr">
                /
              </span>
            )}
          </span>
        ))}
      </Text>
    </div>
  );
}
