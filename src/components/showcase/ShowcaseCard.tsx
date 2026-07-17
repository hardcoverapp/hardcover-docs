import { useTranslation as t } from '@/lib/utils';
import type { ShowcaseProject } from './types';

interface ShowcaseCardProps {
  project: ShowcaseProject;
  onClick: () => void;
}

/** A project is treated as open source if it links to a GitHub repo. */
export function isOpenSource(project: ShowcaseProject): boolean {
  return !!project.links?.some((l) => l.type === 'github');
}

/** Deterministic avatar hue from the project name. */
export function hueFromName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return h;
}

export function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    'Browser Extension': '🧩',
    'Mobile App': '📱',
    'Web App': '🌐',
    'CLI Tool': '⌨️',
    'E-ink Display': '📊',
    'Home Automation': '🏠',
    'Desktop App': '💻',
    Widget: '📊',
    Integration: '🔗',
    Automation: '⚡',
    Other: '📦',
  };
  return icons[category] || '📦';
}

export function ShowcaseCard({ project, onClick }: ShowcaseCardProps) {
  const hasScreenshots = project.screenshots && project.screenshots.length > 0;
  const oss = isOpenSource(project);
  const stars = project.stats?.githubStars;

  return (
    <div
      onClick={onClick}
      className="group flex cursor-pointer flex-col overflow-hidden rounded-[14px] border border-border bg-card shadow-hc transition-[transform,box-shadow] duration-150 hover:-translate-y-[3px] hover:shadow-hc-lg"
    >
      {/* Preview */}
      <div className="relative flex h-[158px] flex-shrink-0 items-center justify-center overflow-hidden border-b border-border bg-muted">
        {hasScreenshots ? (
          <img
            src={project.screenshots![0].src}
            alt={project.screenshots![0].alt}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="text-5xl opacity-40">{getCategoryIcon(project.categories[0])}</div>
        )}
        {project.featured && (
          <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-md bg-primary px-2 py-[3px] text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[var(--hc-indigo-ink)]">
            <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M8 0c.4 3.6 1.4 4.6 5 5-3.6.4-4.6 1.4-5 5-.4-3.6-1.4-4.6-5-5 3.6-.4 4.6-1.4 5-5z" />
            </svg>
            {t('ui.showcase.card.featured')}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2.5 p-[18px]">
        <div className="flex items-start justify-between gap-2.5">
          <div className="font-serif text-[21px] leading-[1.05] text-foreground">{project.name}</div>
          {oss ? (
            <span className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full bg-indigo-soft px-[9px] py-[3px] text-[11px] font-semibold uppercase tracking-[0.03em] text-primary">
              <svg width="10" height="10" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
                <path d="M6 0a6 6 0 0 0-1.9 11.7c.3.05.4-.13.4-.29l-.01-1.13c-1.67.36-2.02-.7-2.02-.7-.27-.7-.67-.88-.67-.88-.55-.37.04-.36.04-.36.6.04.92.62.92.62.54.92 1.41.65 1.76.5.05-.39.21-.66.38-.81-1.34-.15-2.74-.67-2.74-2.97 0-.66.24-1.19.62-1.61-.06-.15-.27-.77.06-1.6 0 0 .51-.16 1.66.62a5.78 5.78 0 0 1 3.02 0c1.15-.78 1.66-.62 1.66-.62.33.83.12 1.45.06 1.6.39.42.62.95.62 1.61 0 2.31-1.41 2.81-2.75 2.96.22.18.41.55.41 1.1l-.01 1.64c0 .16.11.34.41.28A6 6 0 0 0 6 0Z" />
              </svg>
              {t('ui.showcase.card.oss')}
              {stars != null && (
                <span className="font-medium opacity-70">
                  {' · ★'}
                  {stars >= 1000 ? `${(stars / 1000).toFixed(1)}k` : stars}
                </span>
              )}
            </span>
          ) : (
            <span className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full border border-[var(--hc-closed-line)] bg-closed-soft px-[9px] py-[3px] text-[11px] font-semibold uppercase tracking-[0.03em] text-closed">
              <svg width="9" height="10" viewBox="0 0 10 12" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
                <rect x="1.5" y="5.5" width="7" height="5.5" rx="0.5" />
                <path d="M3 5.5V3.5a2 2 0 0 1 4 0v2" />
              </svg>
              {t('ui.showcase.card.closed')}
            </span>
          )}
        </div>

        <p className="m-0 flex-1 text-[13.5px] leading-normal text-[var(--hc-ink-2)] line-clamp-3">
          {project.summary}
        </p>

        <div className="flex items-center justify-between gap-2 border-t border-border pt-2.5">
          <div className="flex items-center gap-1.5">
            <span
              className="grid h-5 w-5 flex-shrink-0 place-items-center rounded-full text-[10px] font-semibold text-white"
              style={{ background: `oklch(0.62 0.13 ${hueFromName(project.name)})` }}
            >
              {project.name.charAt(0).toUpperCase()}
            </span>
            <span className="text-[12.5px] text-muted-foreground">{project.author.name}</span>
          </div>
          <div className="flex gap-1.5">
            {project.categories.slice(0, 2).map((category) => (
              <span
                key={category}
                className="rounded-md border border-border bg-muted px-2 py-[3px] text-[11px] font-medium text-[var(--hc-ink-2)]"
              >
                {category}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
