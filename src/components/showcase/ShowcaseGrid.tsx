import * as React from 'react';
import { useState, useMemo, useEffect } from 'react';
import { ShowcaseCard, isOpenSource } from './ShowcaseCard';
import { ShowcaseModal } from './ShowcaseModal';
import { ShowcaseFilters, type SourceFilter } from './ShowcaseFilters';
import { useTranslation as t } from '@/lib/utils';
import type { ShowcaseProject } from './types';

interface ShowcaseGridProps {
  projects: ShowcaseProject[];
}

function Spark({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 0c.4 3.6 1.4 4.6 5 5-3.6.4-4.6 1.4-5 5-.4-3.6-1.4-4.6-5-5 3.6-.4 4.6-1.4 5-5z" />
    </svg>
  );
}

function SectionHead({ title, sub, count }: { title: string; sub: string; count: number }) {
  return (
    <div className="mb-5 flex items-baseline gap-3.5 border-b border-border pb-3.5">
      <h2 className="m-0 border-0 p-0 font-serif text-[30px] tracking-[-0.02em] text-foreground">{title}</h2>
      <span className="text-[13.5px] text-muted-foreground">{sub}</span>
      <span className="ml-auto font-mono text-[12.5px] text-muted-foreground">{count}</span>
    </div>
  );
}

const gridClass = 'grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3';

export function ShowcaseGrid({ projects }: ShowcaseGridProps) {
  const [search, setSearch] = useState('');
  const [source, setSource] = useState<SourceFilter>('All');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<ShowcaseProject | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => p.categories.forEach((c) => set.add(c)));
    return Array.from(set).sort();
  }, [projects]);

  const ossCount = useMemo(() => projects.filter(isOpenSource).length, [projects]);
  const closedCount = projects.length - ossCount;
  const totalStars = useMemo(
    () => projects.reduce((sum, p) => sum + (p.stats?.githubStars ?? 0), 0),
    [projects]
  );

  const match = (p: ShowcaseProject) => {
    if (source === 'Open source' && !isOpenSource(p)) return false;
    if (source === 'Closed source' && isOpenSource(p)) return false;
    if (selectedCategory && !p.categories.includes(selectedCategory)) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.summary.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.author.name.toLowerCase().includes(q) ||
        (p.tags?.some((t) => t.toLowerCase().includes(q)) ?? false) ||
        p.categories.some((c) => c.toLowerCase().includes(q))
      );
    }
    return true;
  };
  const byStars = (a: ShowcaseProject, b: ShowcaseProject) =>
    (b.stats?.githubStars ?? 0) - (a.stats?.githubStars ?? 0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const featured = useMemo(() => projects.filter((p) => p.featured && match(p)).sort(byStars), [projects, search, source, selectedCategory]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const oss = useMemo(() => projects.filter((p) => isOpenSource(p) && !p.featured && match(p)).sort(byStars), [projects, search, source, selectedCategory]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const closed = useMemo(() => projects.filter((p) => !isOpenSource(p) && !p.featured && match(p)), [projects, search, source, selectedCategory]);
  const totalShown = featured.length + oss.length + closed.length;

  // The modal mirrors the real /showcase/<slug> page, so the URL matches either
  // way in: click a card and it's a modal over the grid; land on the URL cold and
  // the page renders it. Reloading or sharing at any point lands on the page.
  const handleCardClick = (project: ShowcaseProject) => {
    setSelectedProject(project);
    setModalOpen(true);
    window.history.pushState({}, '', `/showcase/${project.slug}`);
  };

  const handleModalClose = (open: boolean) => {
    setModalOpen(open);
    if (!open) window.history.pushState({}, '', '/showcase');
  };

  // Keep the modal in step with the back/forward buttons, which only move the
  // URL — without this, going back would leave the modal open over the grid.
  useEffect(() => {
    const syncToUrl = () => {
      const match = window.location.pathname.match(/^\/showcase\/([^/]+)\/?$/);
      const project = match ? projects.find((p) => p.slug === match[1]) : undefined;
      setSelectedProject(project ?? null);
      setModalOpen(Boolean(project));
    };
    window.addEventListener('popstate', syncToUrl);
    return () => window.removeEventListener('popstate', syncToUrl);
  }, [projects]);

  // Legacy ?project= links: the old redirect stub advertised
  // /showcase?project=<slug> as canonical, so those are out in the wild. Open the
  // project and rewrite the URL to its real page — replaceState, not push, so Back
  // doesn't land on the dead query form.
  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get('project');
    if (!slug) return;
    const project = projects.find((p) => p.slug === slug);
    if (project) {
      setSelectedProject(project);
      setModalOpen(true);
      window.history.replaceState({}, '', `/showcase/${project.slug}`);
    } else {
      window.history.replaceState({}, '', '/showcase');
    }
  }, [projects]);

  const stats: [string, string][] = [
    [projects.length.toString(), t('ui.showcase.stats.projects')],
    [availableCategories.length.toString(), t('ui.showcase.stats.categories')],
    ...(totalStars > 0 ? ([[`★ ${totalStars.toLocaleString()}`, t('ui.showcase.stats.githubStars')]] as [string, string][]) : []),
  ];

  return (
    <div className="not-content">
      {/* Hero */}
      <div className="inline-flex items-center gap-2 rounded-full border border-indigo-line bg-indigo-soft px-[13px] py-1.5 text-[12.5px] text-primary">
        <Spark /> {t('ui.showcase.badge')}
      </div>
      <div className="mt-[22px] grid grid-cols-1 items-end gap-10 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <h1 className="m-0 border-0 p-0 font-serif text-[clamp(2.5rem,6vw,3.5rem)] font-[450] leading-[0.98] tracking-[-0.025em] text-foreground">
            {t('ui.showcase.title')}<em className="italic text-primary">{t('ui.showcase.titleAccent')}</em>.
          </h1>
          <p className="m-0 mt-4 max-w-[480px] text-[16.5px] leading-[1.55] text-[var(--hc-ink-2)]">
{t('ui.showcase.tagline')}
          </p>
        </div>
        <div className="flex justify-start gap-7 lg:justify-end">
          {stats.map(([value, label]) => (
            <div key={label} className="text-left lg:text-right">
              <div className="font-serif text-[34px] leading-none text-foreground">{value}</div>
              <div className="mt-[5px] text-[11px] uppercase tracking-[0.08em] text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="mt-8">
        <ShowcaseFilters
          search={search}
          onSearchChange={setSearch}
          source={source}
          onSourceChange={setSource}
          counts={{ all: projects.length, oss: ossCount, closed: closedCount }}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          availableCategories={availableCategories}
        />
      </div>

      {/* Rules note */}
      <div className="mt-8 flex flex-wrap items-center gap-3.5 rounded-xl border border-border bg-muted px-5 py-4">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-primary">
          <Spark /> {t('ui.showcase.rules.badge')}
        </span>
        <span className="text-[13.5px] text-[var(--hc-ink-2)]">
{t('ui.showcase.rules.text')}
        </span>
        <a href="/showcase/submit" className="ml-auto inline-flex items-center gap-1.5 text-[13px] text-primary no-underline">
          {t('ui.showcase.rules.link')}
        </a>
      </div>

      {/* Sections */}
      {totalShown === 0 ? (
        <div className="py-16 text-center text-sm text-muted-foreground">
          {t('ui.showcase.empty.text')}{' '}
          <button
            onClick={() => {
              setSearch('');
              setSelectedCategory(null);
              setSource('All');
            }}
            className="cursor-pointer border-0 bg-transparent text-primary"
          >
            {t('ui.showcase.empty.reset')}
          </button>
        </div>
      ) : (
        <>
          {featured.length > 0 && (
            <section className="mt-12">
              <SectionHead title={t('ui.showcase.sections.featured.title')} sub={t('ui.showcase.sections.featured.subtitle')} count={featured.length} />
              <div className={gridClass}>
                {featured.map((p) => (
                  <ShowcaseCard key={p.slug} project={p} onClick={() => handleCardClick(p)} />
                ))}
              </div>
            </section>
          )}
          {oss.length > 0 && (
            <section className="mt-12">
              <SectionHead title={t('ui.showcase.sections.openSource.title')} sub={t('ui.showcase.sections.openSource.subtitle')} count={oss.length} />
              <div className={gridClass}>
                {oss.map((p) => (
                  <ShowcaseCard key={p.slug} project={p} onClick={() => handleCardClick(p)} />
                ))}
              </div>
            </section>
          )}
          {closed.length > 0 && (
            <section className="mt-12">
              <SectionHead title={t('ui.showcase.sections.closedSource.title')} sub={t('ui.showcase.sections.closedSource.subtitle')} count={closed.length} />
              <div className={gridClass}>
                {closed.map((p) => (
                  <ShowcaseCard key={p.slug} project={p} onClick={() => handleCardClick(p)} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* Submit band */}
      <section className="mt-12">
        <div className="relative flex flex-wrap items-center justify-between gap-7 overflow-hidden rounded-2xl bg-primary px-8 py-7 text-[var(--hc-indigo-ink)]">
          <div>
            <h3 className="m-0 mb-1.5 border-0 p-0 font-serif text-[26px] leading-tight text-[var(--hc-indigo-ink)]">
              Built something with the API?
            </h3>
            <p className="m-0 max-w-[480px] text-sm leading-snug opacity-90">
              Add it to the showcase by opening a pull request against the docs repo — title, description, and a
              category are all it takes to be listed.
            </p>
          </div>
          <a
            href="/showcase/submit"
            className="inline-flex flex-shrink-0 items-center gap-2 rounded-[10px] bg-[var(--hc-indigo-ink)] px-5 py-3 text-sm font-semibold text-primary no-underline"
          >
            Submit via PR
          </a>
        </div>
      </section>

      <ShowcaseModal
        project={selectedProject}
        open={modalOpen}
        onOpenChange={handleModalClose}
        onCategoryClick={setSelectedCategory}
        onTagClick={setSearch}
      />
    </div>
  );
}
