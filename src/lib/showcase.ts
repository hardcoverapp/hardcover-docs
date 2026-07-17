import type { ShowcaseProject, ShowcaseLink } from '@/components/showcase/types';
import { isOpenSource } from '@/components/showcase/ShowcaseCard';

/**
 * Pure showcase-project logic shared by the detail card/modal. Extracted from
 * ProjectDetail so the link resolution and activity rules are unit-testable.
 */

/** "owner/repo" from a GitHub URL, or "" if unparseable. */
export function repoPath(url: string): string {
  try {
    return new URL(url).pathname.replace(/^\/|\/$/g, '');
  } catch {
    return '';
  }
}

/** Bare hostname (no leading www.), or "" if unparseable. */
export function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

export interface ProjectLinks {
  oss: boolean;
  githubLink?: ShowcaseLink;
  /** The main CTA target: the repo for OSS, else the first site/demo/store link. */
  primaryLink?: ShowcaseLink;
  /** Everything else, kept reachable so no link is dropped. */
  secondaryLinks: ShowcaseLink[];
  /** Footer domain text, or null when there's no link (show a fallback). */
  domain: string | null;
}

export function resolveProjectLinks(project: ShowcaseProject): ProjectLinks {
  const oss = isOpenSource(project);
  const githubLink = project.links.find((l) => l.type === 'github');
  const primaryLink =
    githubLink ??
    project.links.find((l) => l.type === 'website' || l.type === 'demo' || l.type === 'store') ??
    project.links[0];
  const secondaryLinks = project.links.filter((l) => l !== primaryLink);

  const domain =
    oss && githubLink
      ? `github.com/${repoPath(githubLink.url)}`
      : primaryLink
        ? hostname(primaryLink.url)
        : null;

  return { oss, githubLink, primaryLink, secondaryLinks, domain };
}

/** The date shown as "last activity": repo push for OSS, else the project's own update. */
export function getLastActivity(project: ShowcaseProject): Date | undefined {
  if (isOpenSource(project)) {
    return project.stats?.lastPushed ? new Date(project.stats.lastPushed) : undefined;
  }
  return project.dateUpdated;
}

/** OSS repo pushed within the last 90 days. `now` is injectable for tests. */
export function isRepoActive(project: ShowcaseProject, now: number = Date.now()): boolean {
  if (!isOpenSource(project) || !project.stats?.lastPushed) return false;
  return (now - new Date(project.stats.lastPushed).getTime()) / 86400000 <= 90;
}
