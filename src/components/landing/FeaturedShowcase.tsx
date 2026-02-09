import { useTranslation } from '@/lib/utils';
import { ShowcaseCard } from '@/components/showcase/ShowcaseCard';
import type { ShowcaseProject } from '@/components/showcase/types';

interface FeaturedShowcaseProps {
  projects: ShowcaseProject[];
  locale: string;
}

export function FeaturedShowcase({ projects, locale }: FeaturedShowcaseProps) {
  const heading = useTranslation('ui.landing.showcase.heading', locale);
  const viewAll = useTranslation('ui.landing.showcase.viewAll', locale);

  if (projects.length === 0) return null;

  return (
    <section className="mt-12">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {heading}
        </h2>
        <a
          href="/showcase"
          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors no-underline"
        >
          {viewAll} &rarr;
        </a>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <ShowcaseCard
            key={project.slug}
            project={project}
            onClick={() => {
              window.location.href = `/showcase?project=${project.slug}`;
            }}
          />
        ))}
      </div>
    </section>
  );
}
