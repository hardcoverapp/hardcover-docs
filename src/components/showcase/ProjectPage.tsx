import * as React from 'react';
import { ProjectDetail, ArrowIcon } from './ProjectDetail';
import { useTranslation as t } from '@/lib/utils';
import type { ShowcaseProject } from './types';

/**
 * Standalone /showcase/<slug> page — the same detail the modal shows, in a card
 * instead of a dialog. Categories and tags render as static chips here: filtering
 * belongs to the grid, which isn't on this page.
 */
export function ProjectPage({ project }: { project: ShowcaseProject }) {
  return (
    <div className="not-content mx-auto w-full max-w-[720px] px-4 py-10">
      <a
        href="/showcase"
        className="mb-5 inline-flex items-center gap-1.5 text-[13px] text-[var(--hc-ink-2)] no-underline transition-colors hover:text-primary"
      >
        <span className="inline-grid place-items-center [transform:scaleX(-1)]">
          <ArrowIcon size={14} />
        </span>
        {t('ui.showcase.detail.allProjects')}
      </a>

      <div className="flex flex-col overflow-hidden rounded-[18px] border border-border bg-[var(--hc-paper)] shadow-hc">
        <ProjectDetail
          project={project}
          title={
            <h1 className="m-0 border-0 p-0 font-serif text-[32px] font-normal leading-[1.02] tracking-[-0.02em] text-foreground">
              {project.name}
            </h1>
          }
        />
      </div>
    </div>
  );
}
