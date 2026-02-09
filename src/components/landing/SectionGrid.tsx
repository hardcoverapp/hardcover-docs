import { useTranslation } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface Section {
  id: string;
  href: string;
  icon: string;
}

interface SectionGridProps {
  sections: Section[];
  locale: string;
}

const icons: Record<string, JSX.Element> = {
  api: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="m7 8-4 4 4 4" />
      <path d="m17 8 4 4-4 4" />
      <path d="m14 4-4 16" />
    </svg>
  ),
  librarians: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    </svg>
  ),
  contributing: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
};

export function SectionGrid({ sections, locale }: SectionGridProps) {
  const heading = useTranslation('ui.landing.sections.heading', locale);

  return (
    <section className="mt-8">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
        {heading}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((section) => {
          const title = useTranslation(`ui.landing.sections.${section.id}.title`, locale);
          const description = useTranslation(`ui.landing.sections.${section.id}.description`, locale);

          return (
            <a key={section.id} href={section.href} className="no-underline">
              <Card className="h-full transition-all hover:shadow-md hover:scale-[1.02] cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="text-indigo-600 dark:text-indigo-400">
                      {icons[section.icon] ?? icons.api}
                    </div>
                    <CardTitle className="text-lg">{title}</CardTitle>
                  </div>
                  <CardDescription className="mt-2">{description}</CardDescription>
                </CardHeader>
              </Card>
            </a>
          );
        })}
      </div>
    </section>
  );
}
