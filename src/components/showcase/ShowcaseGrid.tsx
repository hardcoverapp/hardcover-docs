import * as React from 'react';
import { useState, useMemo } from 'react';
import { ShowcaseCard } from './ShowcaseCard';
import { ShowcaseModal } from './ShowcaseModal';
import { ShowcaseFilters, type SortOption } from './ShowcaseFilters';
import type { ShowcaseProject } from './types';

interface ShowcaseGridProps {
  projects: ShowcaseProject[];
}

export function ShowcaseGrid({ projects }: ShowcaseGridProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [selectedProject, setSelectedProject] = useState<ShowcaseProject | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Get unique categories from projects
  const availableCategories = useMemo(() => {
    const categories = new Set<string>();
    projects.forEach((project) => {
      project.categories.forEach((cat) => categories.add(cat));
    });
    return Array.from(categories).sort();
  }, [projects]);

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    let result = [...projects];

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (project) =>
          project.name.toLowerCase().includes(searchLower) ||
          project.summary.toLowerCase().includes(searchLower) ||
          project.description.toLowerCase().includes(searchLower) ||
          project.author.name.toLowerCase().includes(searchLower) ||
          project.tags?.some((tag) => tag.toLowerCase().includes(searchLower))
      );
    }

    // Filter by category
    if (selectedCategory) {
      result = result.filter((project) =>
        project.categories.includes(selectedCategory)
      );
    }

    // Sort
    result.sort((a, b) => {
      // Helper to check if project has screenshots
      const hasScreenshots = (p: ShowcaseProject) =>
        p.screenshots && p.screenshots.length > 0;

      switch (sortBy) {
        case 'newest':
          return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
        case 'updated':
          return new Date(b.dateUpdated).getTime() - new Date(a.dateUpdated).getTime();
        case 'alphabetical':
          return a.name.localeCompare(b.name);
        case 'featured':
        default:
          // Featured first, then by screenshots, then by date
          if (a.featured !== b.featured) {
            return a.featured ? -1 : 1;
          }
          if (hasScreenshots(a) !== hasScreenshots(b)) {
            return hasScreenshots(a) ? -1 : 1;
          }
          return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
      }
    });

    return result;
  }, [projects, search, selectedCategory, sortBy]);

  // Separate featured and regular projects
  const featuredProjects = filteredProjects.filter((p) => p.featured);
  const regularProjects = filteredProjects.filter((p) => !p.featured);

  const handleCardClick = (project: ShowcaseProject) => {
    setSelectedProject(project);
    setModalOpen(true);
  };

  return (
    <div className="space-y-8">
      <ShowcaseFilters
        search={search}
        onSearchChange={setSearch}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        sortBy={sortBy}
        onSortChange={setSortBy}
        availableCategories={availableCategories}
      />

      {filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No projects found matching your criteria.</p>
        </div>
      ) : (
        <>
          {featuredProjects.length > 0 && sortBy === 'featured' && (
            <section>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <span>★</span> Featured Projects
              </h2>
              <div className="showcase-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredProjects.map((project) => (
                  <ShowcaseCard
                    key={project.slug}
                    project={project}
                    onClick={() => handleCardClick(project)}
                  />
                ))}
              </div>
            </section>
          )}

          <section>
            {featuredProjects.length > 0 && sortBy === 'featured' && (
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">All Projects</h2>
            )}
            <div className="showcase-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(sortBy === 'featured' ? regularProjects : filteredProjects).map(
                (project) => (
                  <ShowcaseCard
                    key={project.slug}
                    project={project}
                    onClick={() => handleCardClick(project)}
                  />
                )
              )}
            </div>
          </section>
        </>
      )}

      <ShowcaseModal
        project={selectedProject}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
}
