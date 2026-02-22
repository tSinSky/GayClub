import Image from 'next/image';
import MarkdownContent from '@/components/ui/markdown-content';
import type { SectionContent } from '@/types';

interface Props {
  content: SectionContent;
}

export default function CinematographySection({ content }: Props) {
  const { text, images, videos } = content;

  return (
    <div className="space-y-8">
      {text && (
        <MarkdownContent className="prose-lg">{text}</MarkdownContent>
      )}

      {/* Image Gallery */}
      {images && images.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
          {images.map((image, index) => (
            <div
              key={index}
              className="relative overflow-hidden rounded-lg group cursor-pointer"
            >
              <Image
                src={image}
                alt={`Кадр ${index + 1}`}
                width={600}
                height={337}
                className="w-full aspect-video object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 ring-1 ring-white/10 rounded-lg pointer-events-none" />
            </div>
          ))}
        </div>
      )}

      {/* Video Embeds */}
      {videos && videos.length > 0 && (
        <div className="space-y-6 mt-8">
          {videos.map((video, index) => (
            <div key={index} className="space-y-2">
              {video.title && (
                <h4 className="text-lg text-zinc-300">{video.title}</h4>
              )}
              <div className="relative w-full aspect-video rounded-lg overflow-hidden ring-1 ring-white/10">
                <iframe
                  src={video.url}
                  title={video.title || `Video ${index + 1}`}
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
