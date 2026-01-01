import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ImageLightbox } from './ImageLightbox';
import type { ShowcaseProject, ShowcaseLink } from './types';

interface ShowcaseModalProps {
  project: ShowcaseProject | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function isNew(dateAdded: Date): boolean {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return new Date(dateAdded) > thirtyDaysAgo;
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function GitHubIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

function getLinkStyles(type: ShowcaseLink['type']): string {
  switch (type) {
    case 'github':
      return 'bg-gray-900 hover:bg-gray-800 text-white dark:bg-gray-700 dark:hover:bg-gray-600';
    case 'store':
      return 'bg-blue-600 hover:bg-blue-700 text-white';
    case 'docs':
      return 'bg-emerald-600 hover:bg-emerald-700 text-white';
    case 'demo':
      return 'bg-purple-600 hover:bg-purple-700 text-white';
    default:
      return 'bg-indigo-600 hover:bg-indigo-700 text-white';
  }
}

function getLinkIcon(type: ShowcaseLink['type']): React.ReactNode {
  switch (type) {
    case 'github':
      return <GitHubIcon size={18} />;
    case 'store':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
          <path d="m3.3 7 8.7 5 8.7-5"/>
          <path d="M12 22V12"/>
        </svg>
      );
    case 'docs':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
          <polyline points="14,2 14,8 20,8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <line x1="10" y1="9" x2="8" y2="9"/>
        </svg>
      );
    case 'demo':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="5 3 19 12 5 21 5 3"/>
        </svg>
      );
    default:
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
        </svg>
      );
  }
}

function getDomainFromUrl(url: string): string {
  try {
    const domain = new URL(url).hostname.replace('www.', '');
    return domain;
  } catch {
    return '';
  }
}

function ShareIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

export function ShowcaseModal({ project, open, onOpenChange }: ShowcaseModalProps) {
  const [copied, setCopied] = React.useState(false);

  if (!project) return null;

  const showNewBadge = isNew(project.dateAdded);

  const handleShare = async () => {
    const url = `${window.location.origin}${window.location.pathname}?project=${project.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <div className="flex items-center justify-between pr-8">
            <div className="flex items-center gap-2 flex-wrap">
              <DialogTitle className="text-xl text-gray-900 dark:text-gray-100">
                {project.name}
              </DialogTitle>
              {showNewBadge && (
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-600 text-white">
                  NEW
                </span>
              )}
              {project.featured && (
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-yellow-600 text-white">
                  ★ Featured
                </span>
              )}
            </div>
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title="Copy link to this project"
            >
              <ShareIcon size={14} />
              <span>{copied ? 'Copied!' : 'Share'}</span>
            </button>
          </div>
        </DialogHeader>

        {project.screenshots && project.screenshots.length > 0 && (
          <div className="mt-2">
            <ImageLightbox screenshots={project.screenshots} />
          </div>
        )}

        <div className="mt-4 text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">
          {project.description}
        </div>

        <hr className="my-4 border-gray-200 dark:border-gray-700" />

        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold mb-2 text-gray-900 dark:text-gray-100">Categories</h4>
            <div className="flex flex-wrap gap-1.5">
              {project.categories.map((category) => (
                <span
                  key={category}
                  className="px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                >
                  {category}
                </span>
              ))}
            </div>
          </div>

          {project.tags && project.tags.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2 text-gray-900 dark:text-gray-100">Tags</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {project.tags.join(' · ')}
              </p>
            </div>
          )}
        </div>

        <hr className="my-4 border-gray-200 dark:border-gray-700" />

        <div>
          <h4 className="text-sm font-semibold mb-2 text-gray-900 dark:text-gray-100">Created by</h4>
          <p className="font-medium text-gray-900 dark:text-gray-100">{project.author.name}</p>
          <div className="flex items-center gap-4 mt-2">
            {project.author.github && (
              <a
                href={`https://github.com/${project.author.github}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                <GitHubIcon size={14} />
                <span>@{project.author.github}</span>
              </a>
            )}
            {project.author.hardcover && (
              <a
                href={`https://hardcover.app/@${project.author.hardcover}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                <span>📚</span>
                <span>@{project.author.hardcover}</span>
              </a>
            )}
          </div>
        </div>

        <hr className="my-4 border-gray-200 dark:border-gray-700" />

        <div>
          <h4 className="text-sm font-semibold mb-3 text-gray-900 dark:text-gray-100">Links</h4>
          <div className="flex flex-col gap-2">
            {project.links.map((link, index) => (
              <a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors no-underline hover:no-underline ${getLinkStyles(link.type)}`}
                style={{ textDecoration: 'none' }}
              >
                {getLinkIcon(link.type)}
                <span className="flex flex-col items-start">
                  <span>{link.label}</span>
                  <span className="text-xs opacity-75">{getDomainFromUrl(link.url)}</span>
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="ml-auto opacity-75"
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  <polyline points="15 3 21 3 21 9"/>
                  <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
              </a>
            ))}
          </div>
        </div>

        <hr className="my-4 border-gray-200 dark:border-gray-700" />

        <p className="text-xs text-gray-500 dark:text-gray-500">
          Added {formatDate(project.dateAdded)}
          {project.dateUpdated && project.dateUpdated.getTime() !== project.dateAdded.getTime() && (
            <> · Updated {formatDate(project.dateUpdated)}</>
          )}
        </p>
      </DialogContent>
    </Dialog>
  );
}
