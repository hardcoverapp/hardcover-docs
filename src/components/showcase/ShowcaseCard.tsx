import * as React from 'react';
import { cn } from '@/lib/utils';
import type { ShowcaseProject } from './types';

interface ShowcaseCardProps {
  project: ShowcaseProject;
  onClick: () => void;
}

function isNew(dateAdded: Date): boolean {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return new Date(dateAdded) > thirtyDaysAgo;
}

function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    'Browser Extension': '🧩',
    'Mobile App': '📱',
    'Web App': '🌐',
    'CLI Tool': '⌨️',
    'E-ink Display': '📊',
    'Home Automation': '🏠',
    'Desktop App': '💻',
    'Widget': '📊',
    'Integration': '🔗',
    'Automation': '⚡',
    'Other': '📦',
  };
  return icons[category] || '📦';
}

export function ShowcaseCard({ project, onClick }: ShowcaseCardProps) {
  const hasScreenshots = project.screenshots && project.screenshots.length > 0;
  const showNewBadge = isNew(project.dateAdded);
  const primaryCategory = project.categories[0];

  return (
    <div
      className={cn(
        'cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]',
        'flex flex-col overflow-hidden rounded-lg min-h-[360px]',
        'border border-gray-200 dark:border-gray-700',
        'bg-white dark:bg-gray-800'
      )}
      onClick={onClick}
    >
      <div className="relative h-[150px] flex-shrink-0 bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
        {hasScreenshots ? (
          <img
            src={project.screenshots![0].src}
            alt={project.screenshots![0].alt}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-6xl opacity-50">
            {getCategoryIcon(primaryCategory)}
          </div>
        )}
        {showNewBadge && (
          <span className="absolute top-2 right-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-green-600 text-white">
            NEW
          </span>
        )}
        {project.featured && (
          <span className="absolute top-2 left-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-yellow-600 text-white">
            ★ Featured
          </span>
        )}
      </div>

      <div className="flex flex-col flex-1 p-4">
        <h3 className="font-semibold text-base leading-tight mb-2 line-clamp-2 text-gray-900 dark:text-gray-100">
          {project.name}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2 flex-1">
          {project.summary}
        </p>
        <div className="flex flex-wrap gap-1">
          {project.categories.slice(0, 2).map((category) => (
            <span
              key={category}
              className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              {category}
            </span>
          ))}
          {project.categories.length > 2 && (
            <span className="px-2 py-0.5 text-xs font-medium rounded-full border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400">
              +{project.categories.length - 2}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
