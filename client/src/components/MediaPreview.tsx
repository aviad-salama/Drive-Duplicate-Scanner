import { useState } from 'react';
import { streamUrl, thumbnailUrl } from '../services/cloudService';
import type { CloudFile } from '../types/cloud';

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
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        ) : (
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )}
        <span className="text-sm font-medium">
          {isVideo ? 'וידאו חסר תצוגה' : 'אין תצוגה מקדימה'}
        </span>
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