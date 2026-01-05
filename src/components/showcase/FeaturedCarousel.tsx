import * as React from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import type { ShowcaseProject } from './types';

interface FeaturedCarouselProps {
  projects: ShowcaseProject[];
  onProjectClick: (project: ShowcaseProject) => void;
}

export function FeaturedCarousel({ projects, onProjectClick }: FeaturedCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  const transition = useCallback((newIndex: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(newIndex);
      setTimeout(() => setIsTransitioning(false), 150);
    }, 150);
  }, [isTransitioning]);

  const goToPrevious = useCallback(() => {
    const newIndex = currentIndex === 0 ? projects.length - 1 : currentIndex - 1;
    transition(newIndex);
  }, [currentIndex, projects.length, transition]);

  const goToNext = useCallback(() => {
    const newIndex = currentIndex === projects.length - 1 ? 0 : currentIndex + 1;
    transition(newIndex);
  }, [currentIndex, projects.length, transition]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if carousel is in viewport
      if (!carouselRef.current) return;
      const rect = carouselRef.current.getBoundingClientRect();
      const isInViewport = rect.top < window.innerHeight && rect.bottom > 0;

      if (!isInViewport) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPrevious, goToNext]);

  if (projects.length === 0) return null;

  const currentProject = projects[currentIndex];
  const hasScreenshots = currentProject.screenshots && currentProject.screenshots.length > 0;

  return (
    <div ref={carouselRef} className="relative">
      {/* Main carousel card */}
      <div
        className={cn(
          'cursor-pointer hover:shadow-xl',
          'flex flex-col md:flex-row overflow-hidden rounded-xl',
          'border border-gray-200 dark:border-gray-700',
          'bg-white dark:bg-gray-800',
          'transition-opacity duration-150 ease-in-out',
          isTransitioning ? 'opacity-0' : 'opacity-100'
        )}
        onClick={() => onProjectClick(currentProject)}
        style={{ marginTop: 0, marginBottom: 0 }}
      >
        {/* Image section */}
        <div className="relative w-full md:w-1/2 h-[200px] md:h-[300px] flex-shrink-0 bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
          {hasScreenshots ? (
            <img
              src={currentProject.screenshots![0].src}
              alt={currentProject.screenshots![0].alt}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-8xl opacity-50">★</div>
          )}
          <span className="absolute top-3 left-3 px-3 py-1 text-sm font-semibold rounded-full bg-yellow-600 text-white">
            ★ Featured
          </span>
          {currentProject.stats?.githubStars && (
            <span className="absolute bottom-3 right-3 px-3 py-1 text-sm font-medium rounded-full bg-gray-900/80 text-white flex items-center gap-1.5">
              ⭐ {currentProject.stats.githubStars.toLocaleString()}
            </span>
          )}
        </div>

        {/* Content section */}
        <div className="flex flex-col flex-1 p-6 md:p-8">
          <h3 className="font-bold text-2xl mb-2 text-gray-900 dark:text-gray-100">
            {currentProject.name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            by {currentProject.author.name}
          </p>
          <p className="text-base text-gray-700 dark:text-gray-300 mb-4 line-clamp-3 flex-1">
            {currentProject.summary}
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {currentProject.categories.map((category) => (
              <span
                key={category}
                className="px-3 py-1 text-sm font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                {category}
              </span>
            ))}
          </div>
          <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
            Click to view details →
          </div>
        </div>
      </div>

      {/* Navigation arrows */}
      {projects.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className={cn(
              'absolute left-2 top-1/2 -translate-y-1/2 z-10',
              'w-10 h-10 rounded-full flex items-center justify-center',
              'bg-white dark:bg-gray-800 shadow-lg',
              'border border-gray-200 dark:border-gray-600',
              'text-gray-700 dark:text-gray-300',
              'hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors'
            )}
            aria-label="Previous project"
          >
            ←
          </button>
          <button
            onClick={goToNext}
            className={cn(
              'absolute right-2 top-1/2 -translate-y-1/2 z-10',
              'w-10 h-10 rounded-full flex items-center justify-center',
              'bg-white dark:bg-gray-800 shadow-lg',
              'border border-gray-200 dark:border-gray-600',
              'text-gray-700 dark:text-gray-300',
              'hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors'
            )}
            aria-label="Next project"
          >
            →
          </button>
        </>
      )}

      {/* Dot indicators */}
      {projects.length > 1 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '0.5rem',
            marginTop: '1rem',
            marginBottom: 0
          }}
        >
          {projects.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                if (index !== currentIndex) transition(index);
              }}
              style={{
                width: '0.625rem',
                height: '0.625rem',
                borderRadius: '9999px',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                margin: 0,
              }}
              className={cn(
                'transition-colors',
                index === currentIndex
                  ? 'bg-blue-600 dark:bg-blue-400'
                  : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
              )}
              aria-label={`Go to project ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
