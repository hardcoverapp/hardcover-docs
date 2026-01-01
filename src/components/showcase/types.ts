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
}

export interface ShowcaseProject {
  name: string;
  slug: string;
  summary: string;
  description: string;
  author: ShowcaseAuthor;
  links: ShowcaseLink[];
  categories: string[];
  dateAdded: Date;
  dateUpdated: Date;
  screenshots?: ShowcaseScreenshot[];
  tags?: string[];
  featured?: boolean;
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

export const LINK_TYPE_ICONS: Record<ShowcaseLink['type'], string> = {
  website: '🌐',
  github: '',
  store: '📦',
  docs: '📄',
  demo: '▶️',
};
