import { useState } from 'react';
import { streamUrl, thumbnailUrl } from '../services/cloudService';
import type { CloudFile } from '../types/cloud';
import { MissingVideoIcon, MissingImageIcon } from './icons';
import { Text } from './ui/Typography';
import { he } from '../languages/he';

interface Props {
  file: CloudFile;
  isVideo: boolean;
  accountId: string;
}

export default function MediaPreview({ file, isVideo, accountId }: Props) {
  // Try the thumbnail first; videos fall back to a frame from the stream.
  const sources: { type: 'img' | 'video'; src: string }[] = [
    { type: 'img', src: thumbnailUrl(accountId, file.id) },
  ];

  if (isVideo) {
    sources.push({ type: 'video', src: `${streamUrl(accountId, file.id)}#t=0.5` });
  }

  const [index, setIndex] = useState(0);
  const next = () => setIndex((i) => i + 1);
  const current = sources[index];

  if (!current) {
    return (
      <div className="text-gray-400 flex flex-col items-center gap-2">
        {isVideo ? (
          <MissingVideoIcon className="w-12 h-12" />
        ) : (
          <MissingImageIcon className="w-12 h-12" />
        )}
        <Text as="span" size="sm" className="font-medium">
          {isVideo ? he.files.missingVideo : he.files.noPreview}
        </Text>
      </div>
    );
  }

  return current.type === 'img' ? (
    <img
      src={current.src}
      alt={file.name}
      className="w-full h-full object-cover"
      referrerPolicy="no-referrer"
      crossOrigin="use-credentials" // Required to send cookies with the protected image.
      onError={next}
    />
  ) : (
    <video
      src={current.src}
      className="w-full h-full object-cover"
      preload="metadata"
      muted
      playsInline
      crossOrigin="use-credentials" // Required to send cookies with the protected video.
      onError={next}
    />
  );
}
