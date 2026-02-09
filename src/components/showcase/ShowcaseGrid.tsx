import * as React from 'react';
import { useState, useMemo, useEffect } from 'react';
import { ShowcaseCard } from './ShowcaseCard';
import { ShowcaseModal } from './ShowcaseModal';
import { ShowcaseFilters, type SortOption } from './ShowcaseFilters';
import { FeaturedCarousel } from './FeaturedCarousel';
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
        case 'stars':
          return (b.stats?.githubStars ?? 0) - (a.stats?.githubStars ?? 0);
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

  // Get featured projects for carousel, sorted by stars
  const featuredProjects = filteredProjects
    .filter((p) => p.featured)
    .sort((a, b) => (b.stats?.githubStars ?? 0) - (a.stats?.githubStars ?? 0));

  const handleCardClick = (project: ShowcaseProject) => {
    setSelectedProject(project);
    setModalOpen(true);
    // Update URL with project slug
    const url = new URL(window.location.href);
    url.searchParams.set('project', project.slug);
    window.history.pushState({}, '', url.toString());
  };

  const handleModalClose = (open: boolean) => {
    setModalOpen(open);
    if (!open) {
      // Remove project from URL when modal closes
      const url = new URL(window.location.href);
      url.searchParams.delete('project');
      window.history.pushState({}, '', url.toString());
    }
  };

  // Open project from URL on initial load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const projectSlug = params.get('project');
    if (projectSlug) {
      const project = projects.find((p) => p.slug === projectSlug);
      if (project) {
        setSelectedProject(project);
        setModalOpen(true);
      }
    }
  }, [projects]);

  // Aggregate stats
  const totalStars = projects.reduce((sum, p) => sum + (p.stats?.githubStars ?? 0), 0);
  const totalCategories = availableCategories.length;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1.5">
          <span className="font-semibold text-gray-900 dark:text-gray-100">{projects.length}</span> projects
        </span>
        <span className="flex items-center gap-1.5">
          <span className="font-semibold text-gray-900 dark:text-gray-100">{totalCategories}</span> categories
        </span>
        {totalStars > 0 && (
          <span className="flex items-center gap-1.5">
            <span className="font-semibold text-gray-900 dark:text-gray-100">{totalStars.toLocaleString()}</span> GitHub stars
          </span>
        )}
      </div>

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
        <div className="text-center py-16">
          <div className="text-5xl mb-4 opacity-50">🔍</div>
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">No projects found</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Try adjusting your search or clearing the category filter.
          </p>
          <button
            onClick={() => { setSearch(''); setSelectedCategory(null); setSortBy('featured'); }}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <>
          {featuredProjects.length > 0 && sortBy === 'featured' && (
            <section className="!mt-16 !mb-0">
              <h2 className="!mb-4 !mt-0 text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <span>★</span> Featured Projects
              </h2>
              <FeaturedCarousel
                projects={featuredProjects}
                onProjectClick={handleCardClick}
              />
            </section>
          )}

          <section className="!mt-16 !mb-0">
            <h2 className="!mb-4 !mt-0 text-lg font-semibold text-gray-900 dark:text-gray-100">
              All Projects
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredProjects.map((project) => (
                <div key={project.slug} className="!mt-0 !mb-0">
                  <ShowcaseCard
                    project={project}
                    onClick={() => handleCardClick(project)}
                  />
                </div>
              ))}
            </div>
          </section>
        </>
      )}

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
