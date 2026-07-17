import * as React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { getCategoryIcon, hueFromName, isOpenSource } from './ShowcaseCard';
import { getLastActivity, isRepoActive, resolveProjectLinks } from '@/lib/showcase';
import { useTranslation as t } from '@/lib/utils';
import type { ShowcaseProject } from './types';

/**
 * The project detail layout — header, preview carousel, description, meta table
 * and footer CTA. Shared by the modal (over the grid) and the standalone
 * /showcase/<slug> page, which are the same content in different frames.
 *
 * The frame is the caller's job: the modal supplies a DialogContent, the page a
 * plain card. This renders the three sections and nothing around them.
 */
interface ProjectDetailProps {
  project: ShowcaseProject;
  /** Heading element — DialogTitle in the modal, h1 on the page. */
  title: React.ReactNode;
  /** Extra header controls beside Share (the modal's close button). */
  actions?: React.ReactNode;
  /** Omit to render categories/tags as static chips rather than filters. */
  onCategoryClick?: (category: string) => void;
  onTagClick?: (tag: string) => void;
  /** The modal scrolls its own body; a page scrolls normally. */
  scrollBody?: boolean;
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function GitHubIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

export function ArrowIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
}

/** UPPERCASE section label shared by Categories / Tags. */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--hc-ink-3)]">
      {children}
    </div>
  );
}

/** A label/value row in the meta table (Source, Created by, …). */
function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-3 border-t border-border py-[11px]">
      <span className="flex-[0_0_118px] text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--hc-ink-3)]">
        {label}
      </span>
      <div className="flex-1 text-[13.5px] text-foreground">{children}</div>
    </div>
  );
}

export function ProjectDetail({
  project,
  title,
  actions,
  onCategoryClick,
  onTagClick,
  scrollBody = false,
}: ProjectDetailProps) {
  const [copied, setCopied] = React.useState(false);
  const [previewIndex, setPreviewIndex] = React.useState(0);
  const [zoomOpen, setZoomOpen] = React.useState(false);
  const [zoomIndex, setZoomIndex] = React.useState(0);

  // Reset the carousel whenever a different project is shown.
  React.useEffect(() => {
    setPreviewIndex(0);
  }, [project.slug]);

  const stars = project.stats?.githubStars;
  const byHandle = project.author.github ? `@${project.author.github}` : project.author.name;
  const screenshots = project.screenshots ?? [];
  const hasScreenshots = screenshots.length > 0;

  const { oss, primaryLink, secondaryLinks, domain } = resolveProjectLinks(project);
  const lastActivity = getLastActivity(project);
  const isActive = isRepoActive(project);
  const domainText = domain ?? t('ui.showcase.detail.visitDeveloperSite');

  const handleShare = async () => {
    const url = `${window.location.origin}/showcase/${project.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="flex flex-row items-start justify-between gap-4 border-b border-border p-[22px_26px_18px] text-left">
        <div className="flex min-w-0 flex-col gap-2.5">
          <div className="flex flex-wrap items-center gap-2.5">
            {project.featured && (
              <span className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-[3px] text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[var(--hc-indigo-ink)]">
                <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                  <path d="M8 0c.4 3.6 1.4 4.6 5 5-3.6.4-4.6 1.4-5 5-.4-3.6-1.4-4.6-5-5 3.6-.4 4.6-1.4 5-5z" />
                </svg>
                {t('ui.showcase.card.featured')}
              </span>
            )}
            {oss ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-soft px-[9px] py-[3px] text-[11px] font-semibold uppercase tracking-[0.03em] text-primary">
                <GitHubIcon size={12} />
                {t('ui.showcase.card.oss')}
                {stars != null && (
                  <span className="font-medium opacity-70">
                    {' · ★'}
                    {stars >= 1000 ? `${(stars / 1000).toFixed(1)}k` : stars}
                  </span>
                )}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--hc-closed-line)] bg-closed-soft px-[9px] py-[3px] text-[11px] font-semibold uppercase tracking-[0.03em] text-closed">
                <svg width="9" height="10" viewBox="0 0 10 12" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
                  <rect x="1.5" y="5.5" width="7" height="5.5" rx="0.5" />
                  <path d="M3 5.5V3.5a2 2 0 0 1 4 0v2" />
                </svg>
                {t('ui.showcase.card.closed')}
              </span>
            )}
          </div>
          {title}
          <div className="flex items-center gap-2">
            <span
              className="grid h-5 w-5 flex-shrink-0 place-items-center rounded-full text-[10px] font-semibold text-white"
              style={{ background: `oklch(0.62 0.13 ${hueFromName(project.name)})` }}
            >
              {project.name.charAt(0).toUpperCase()}
            </span>
            <span className="text-[13px] text-[var(--hc-ink-2)]">{t('ui.showcase.detail.by')} {byHandle}</span>
          </div>
        </div>
        <div className="flex flex-shrink-0 gap-2">
          <button
            onClick={handleShare}
            className="inline-flex h-[34px] items-center gap-1.5 rounded-[9px] border border-border bg-card px-[13px] text-[12.5px] font-medium text-foreground transition-colors hover:border-indigo-line"
            title={t('ui.showcase.detail.shareTitle')}
          >
            <ArrowIcon size={14} />
            {copied ? t('ui.showcase.detail.copied') : t('ui.showcase.detail.share')}
          </button>
          {actions}
        </div>
      </div>

      {/* Body */}
      <div className={`px-[26px] pb-1 pt-[22px] ${scrollBody ? 'flex-1 overflow-y-auto' : ''}`}>
        {/* Preview */}
        <div className="relative mb-[22px] h-[260px] overflow-hidden rounded-xl border border-border bg-muted">
          {hasScreenshots ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setZoomIndex(previewIndex);
                  setZoomOpen(true);
                }}
                className="block h-full w-full cursor-zoom-in"
                aria-label={t('ui.showcase.detail.viewLarger')}
              >
                <img
                  src={screenshots[previewIndex].src}
                  alt={screenshots[previewIndex].alt}
                  className="h-full w-full object-cover"
                />
              </button>
              {screenshots.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setPreviewIndex((i) => (i === 0 ? screenshots.length - 1 : i - 1))}
                    className="absolute left-2.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm transition-colors hover:bg-black/75"
                    aria-label={t('ui.showcase.detail.previousScreenshot')}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewIndex((i) => (i === screenshots.length - 1 ? 0 : i + 1))}
                    className="absolute right-2.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm transition-colors hover:bg-black/75"
                    aria-label={t('ui.showcase.detail.nextScreenshot')}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                  </button>
                  <span className="pointer-events-none absolute bottom-2.5 right-2.5 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white">
                    {previewIndex + 1} / {screenshots.length}
                  </span>
                </>
              )}
            </>
          ) : (
            <div className="grid h-full place-items-center text-5xl opacity-40">
              {getCategoryIcon(project.categories[0])}
            </div>
          )}
        </div>

        {/* Description */}
        <p className="m-0 mb-2 whitespace-pre-wrap text-[15px] leading-[1.6] text-[var(--hc-ink-2)]">
          {project.description}
        </p>

        {/* Categories */}
        <div className="mt-5">
          <SectionLabel>{t('ui.showcase.detail.categories')}</SectionLabel>
          <div className="flex flex-wrap gap-1.5">
            {project.categories.map((category) => (
              <button
                key={category}
                onClick={() => onCategoryClick?.(category)}
                className={`rounded-lg border border-border bg-card px-[11px] py-1.5 text-[12.5px] font-medium text-[var(--hc-ink-2)] transition-colors ${
                  onCategoryClick ? 'cursor-pointer hover:border-indigo-line hover:text-primary' : ''
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Tags */}
        {project.tags && project.tags.length > 0 && (
          <div className="mt-[18px]">
            <SectionLabel>{t('ui.showcase.detail.tags')}</SectionLabel>
            <div className="flex flex-wrap gap-1.5">
              {project.tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => onTagClick?.(tag)}
                  className={`rounded-full border border-border bg-muted px-[9px] py-[3px] text-[12px] text-[var(--hc-ink-3)] transition-colors ${
                    onTagClick ? 'cursor-pointer hover:border-indigo-line hover:text-primary' : ''
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Meta table */}
        <div className="mt-5 mb-1.5">
          <MetaRow label={t('ui.showcase.detail.source')}>
            <span className="inline-flex items-center gap-2">
              <span className={`h-[7px] w-[7px] rounded-full ${oss ? 'bg-primary' : 'bg-closed'}`} />
              {oss
                ? t('ui.showcase.detail.sourceOpen')
                : t('ui.showcase.detail.sourceClosed')}
            </span>
          </MetaRow>
          <MetaRow label={t('ui.showcase.detail.createdBy')}>
            <span className="inline-flex items-center gap-2">
              {project.author.github && <GitHubIcon size={14} />}
              {byHandle}
            </span>
          </MetaRow>
          {oss && stars != null && <MetaRow label={t('ui.showcase.detail.githubStars')}>★ {stars.toLocaleString()}</MetaRow>}
          <MetaRow label={t('ui.showcase.detail.dateAdded')}>{formatDate(project.dateAdded)}</MetaRow>
          {lastActivity && (
            <MetaRow label={oss ? t('ui.showcase.detail.lastRepoActivity') : t('ui.showcase.detail.lastUpdated')}>
              <span className="inline-flex items-center gap-2">
                {formatDate(lastActivity)}
                {isActive && (
                  <span className="inline-flex items-center gap-1.5 text-[12px] text-[var(--hc-ink-3)]">
                    · <span className="h-1.5 w-1.5 rounded-full bg-[#6fb088]" />
                    {t('ui.showcase.detail.active')}
                  </span>
                )}
              </span>
            </MetaRow>
          )}
          {secondaryLinks.length > 0 && (
            <MetaRow label={t('ui.showcase.detail.links')}>
              <div className="flex flex-wrap gap-1.5">
                {secondaryLinks.map((link, i) => (
                  <a
                    key={i}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 text-[12.5px] font-medium text-[var(--hc-ink-2)] no-underline transition-colors hover:border-indigo-line hover:text-primary"
                  >
                    {link.type === 'github' && <GitHubIcon size={13} />}
                    {link.label}
                  </a>
                ))}
              </div>
            </MetaRow>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-3.5 border-t border-border bg-muted px-[26px] py-4">
        <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[12px] text-[var(--hc-ink-3)]">
          {domainText}
        </span>
        {primaryLink && (
          <a
            href={primaryLink.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex flex-shrink-0 items-center gap-2 rounded-[10px] border border-[var(--hc-ink)] bg-[var(--hc-ink)] px-[18px] py-2.5 text-[13px] font-semibold text-[var(--hc-paper)] no-underline transition-opacity hover:opacity-90"
          >
            {oss ? (
              <>
                <GitHubIcon size={15} />
                {t('ui.showcase.detail.viewOnGitHub')}
              </>
            ) : (
              <>
                {t('ui.showcase.detail.visitSite')}
                <ArrowIcon size={14} />
              </>
            )}
          </a>
        )}
      </div>

      {/* Fullscreen screenshot viewer */}
      <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
        <DialogContent showClose className="w-full max-w-4xl border-none bg-black/95 p-0">
          <div className="relative flex min-h-[60vh] items-center justify-center">
            {screenshots.length > 1 && (
              <button
                type="button"
                onClick={() => setZoomIndex((i) => (i === 0 ? screenshots.length - 1 : i - 1))}
                className="absolute left-2 z-10 flex h-12 w-12 items-center justify-center rounded-full text-white transition-colors hover:bg-white/20"
                aria-label={t('ui.showcase.detail.previousScreenshot')}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
              </button>
            )}
            {screenshots[zoomIndex] && (
              <img
                src={screenshots[zoomIndex].src}
                alt={screenshots[zoomIndex].alt}
                className="max-h-[80vh] max-w-full object-contain"
              />
            )}
            {screenshots.length > 1 && (
              <button
                type="button"
                onClick={() => setZoomIndex((i) => (i === screenshots.length - 1 ? 0 : i + 1))}
                className="absolute right-2 z-10 flex h-12 w-12 items-center justify-center rounded-full text-white transition-colors hover:bg-white/20"
                aria-label={t('ui.showcase.detail.nextScreenshot')}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
              </button>
            )}
          </div>
          {screenshots[zoomIndex] && (
            <div className="flex flex-col items-center gap-2 px-4 pb-4">
              {screenshots.length > 1 && (
                <div className="text-sm text-white/70">
                  {zoomIndex + 1} / {screenshots.length}
                </div>
              )}
              <p className="text-center text-sm text-white/70">{screenshots[zoomIndex].alt}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
