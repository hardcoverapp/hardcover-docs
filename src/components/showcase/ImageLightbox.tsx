import * as React from 'react';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { ShowcaseScreenshot } from './types';

interface ImageLightboxProps {
  screenshots: ShowcaseScreenshot[];
  initialIndex?: number;
}

export function ImageLightbox({ screenshots, initialIndex = 0 }: ImageLightboxProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  if (screenshots.length === 0) return null;

  const goToPrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? screenshots.length - 1 : prev - 1));
  };

  const goToNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === screenshots.length - 1 ? 0 : prev + 1));
  };

  return (
    <>
      <div className="space-y-3">
        {/* Main featured image */}
        <button
          onClick={() => {
            setCurrentIndex(currentIndex);
            setLightboxOpen(true);
          }}
          className="w-full rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors focus:outline-none focus:border-blue-500"
        >
          <img
            src={screenshots[currentIndex].src}
            alt={screenshots[currentIndex].alt}
            className="w-full h-auto max-h-80 object-contain bg-gray-100 dark:bg-gray-800"
          />
        </button>

        {/* Thumbnail navigation - only show if more than one image */}
        {screenshots.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {screenshots.map((screenshot, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  'flex-shrink-0 rounded-md overflow-hidden border-2 transition-all',
                  'hover:border-blue-500 focus:border-blue-500 focus:outline-none',
                  index === currentIndex
                    ? 'border-blue-500'
                    : 'border-gray-200 dark:border-gray-700'
                )}
              >
                <img
                  src={screenshot.src}
                  alt={screenshot.alt}
                  className="h-16 w-auto object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl w-full p-0 bg-black/95 border-none">
          <div className="relative flex items-center justify-center min-h-[60vh]">
            {screenshots.length > 1 && (
              <button
                onClick={goToPrevious}
                className="absolute left-2 z-10 text-white hover:bg-white/20 h-12 w-12 rounded-full flex items-center justify-center transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>
            )}

            <img
              src={screenshots[currentIndex].src}
              alt={screenshots[currentIndex].alt}
              className="max-h-[80vh] max-w-full object-contain"
            />

            {screenshots.length > 1 && (
              <button
                onClick={goToNext}
                className="absolute right-2 z-10 text-white hover:bg-white/20 h-12 w-12 rounded-full flex items-center justify-center transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            )}
          </div>

          <div className="flex flex-col items-center gap-2 pb-4 px-4">
            {screenshots.length > 1 && (
              <div className="text-white/70 text-sm">
                {currentIndex + 1} / {screenshots.length}
              </div>
            )}
            <p className="text-center text-white/70 text-sm">
              {screenshots[currentIndex].alt}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
