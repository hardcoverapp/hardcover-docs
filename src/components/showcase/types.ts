export interface ShowcaseAuthor {
  name: string;
  github?: string;
  hardcover?: string;
}

export interface ShowcaseLink {
  label: string;
  url: string;
  type: 'website' | 'github' | 'store' | 'docs' | 'demo';
}

export interface ShowcaseScreenshot {
  src: string;
  alt: string;
  /** Vertical crop anchor for the card thumbnail. Percentages are of the overflow, not the image. */
  origin?: string;
}

export interface ShowcaseStats {
  githubStars?: number;
  lastPushed?: string;
  /** When the star count last changed, written by scripts/update-github-stars.js. */
  starsUpdated?: string;
}

export interface ShowcasePick {
  /** YYYY-MM */
  month: string;
  /** Picker's Hardcover username. */
  by: string;
  /** Markdown, shown as the pick's quote. */
  why: string;
}

export interface ShowcaseProject {
  name: string;
  slug: string;
  summary: string;
  description: string;
  author: ShowcaseAuthor;
  links: ShowcaseLink[];
  categories: string[];
  platforms: Platform[];
  formats: Format[];
  features: Feature[];
  connects: Connection[];
  dateAdded: Date;
  dateUpdated: Date;
  screenshots?: ShowcaseScreenshot[];
  tags?: string[];
  featured?: boolean;
  picks: ShowcasePick[];
  stats?: ShowcaseStats;
}

export const CATEGORIES = [
  'Browser Extension',
  'Mobile App',
  'Web App',
  'CLI Tool',
  'E-ink Display',
  'Home Automation',
  'Desktop App',
  'Widget',
  'Integration',
  'Automation',
  'Other',
] as const;

export type Category = typeof CATEGORIES[number];

/** Where a project runs or what it plugs into. */
export const PLATFORMS = [
  'ios', 'ipados', 'android', 'web', 'macos', 'windows', 'linux', 'terminal',
  'chrome', 'firefox', 'kobo', 'kindle', 'koreader', 'trmnl', 'smartwatch',
  'obsidian', 'audiobookshelf', 'mcp', 'self-hosted',
] as const;

export type Platform = typeof PLATFORMS[number];

/** Only formats a project handles specifically; empty means format-agnostic. */
export const FORMATS = ['ebook', 'audiobook', 'print'] as const;

export type Format = typeof FORMATS[number];

/**
 * What a project does with Hardcover. `client` updates Hardcover directly;
 * `progress-sync` carries reading done in another app or device into Hardcover.
 */
export const FEATURES = [
  'client', 'progress-sync', 'two-way-sync', 'library-sync', 'import',
  'reading-stats', 'goals', 'journal', 'lists', 'reviews', 'recommendations',
  'discovery', 'release-tracking', 'metadata', 'librarian-tools',
  'developer-tools', 'ai-assistant', 'notes', 'dashboard',
] as const;

export type Feature = typeof FEATURES[number];

/** How a project talks to Hardcover: exactly one of api/sdk, plus any auth or data sources. */
export const CONNECTIONS = ['api', 'sdk', 'oauth', 'pat', 'export'] as const;

export type Connection = typeof CONNECTIONS[number];

export const LINK_TYPE_ICONS: Record<ShowcaseLink['type'], string> = {
  website: '🌐',
  github: '',
  store: '📦',
  docs: '📄',
  demo: '▶️',
};
