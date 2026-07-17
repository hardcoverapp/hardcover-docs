import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { ProjectDetail } from './ProjectDetail';
import { useTranslation as t } from '@/lib/utils';
import type { ShowcaseProject } from './types';

/**
 * The project detail shown over the grid. Everything inside is ProjectDetail,
 * shared with the standalone /showcase/<slug> page — this only supplies the
 * dialog frame, the title element and the close button.
 */
interface ShowcaseModalProps {
  project: ShowcaseProject | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCategoryClick?: (category: string) => void;
  onTagClick?: (tag: string) => void;
}

export function ShowcaseModal({
  project,
  open,
  onOpenChange,
  onCategoryClick,
  onTagClick,
}: ShowcaseModalProps) {
  if (!project) return null;

  // Filtering happens on the grid behind the modal, so close it on the way out.
  const filterAndClose = (handler?: (value: string) => void) =>
    handler
      ? (value: string) => {
          onOpenChange(false);
          handler(value);
        }
      : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showClose={false}
        className="flex max-h-[90vh] w-full max-w-[720px] flex-col gap-0 overflow-hidden rounded-[18px] border border-border bg-[var(--hc-paper)] p-0 shadow-[0_32px_80px_-24px_rgba(0,0,0,0.5),0_12px_30px_-12px_rgba(0,0,0,0.3)]"
      >
        <ProjectDetail
          project={project}
          scrollBody
          title={
            <DialogTitle className="m-0 font-serif text-[32px] font-normal leading-[1.02] tracking-[-0.02em] text-foreground">
              {project.name}
            </DialogTitle>
          }
          actions={
            <DialogClose
              className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-[9px] border border-border bg-card text-[var(--hc-ink-2)] transition-colors hover:text-foreground"
              title={t('ui.showcase.detail.close')}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
                <path d="M3 3l8 8M11 3l-8 8" />
              </svg>
              <span className="sr-only">{t('ui.showcase.detail.close')}</span>
            </DialogClose>
          }
          onCategoryClick={filterAndClose(onCategoryClick)}
          onTagClick={filterAndClose(onTagClick)}
        />
      </DialogContent>
    </Dialog>
  );
}
