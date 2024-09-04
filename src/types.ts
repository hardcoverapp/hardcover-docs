// Mainly copied from the Starlight schemas, with minor changes, and placed here for simplicity.

export interface BadgeConfig {
    text: string;
    variant?: 'note' | 'tip' | 'caution' | 'danger' | 'success' | 'default';
    class?: string;
}

export interface BannerConfig {
    content: string;
}

export interface HeadConfig {
    tag: string;
    attrs?: Record<string, string | boolean | undefined>;
    content?: string;
}

export interface HeroConfig {
    title?: string;
    tagline?: string;
    image?:
        | {
        // Relative path to an image in your repository.
        file: string;
        // Alt text to make the image accessible to assistive technology
        alt?: string;
    }
        | {
        // Relative path to an image in your repository to be used for dark mode.
        dark: string;
        // Relative path to an image in your repository to be used for light mode.
        light: string;
        // Alt text to make the image accessible to assistive technology
        alt?: string;
    }
        | {
        // Raw HTML to use in the image slot.
        // Could be a custom `<img>` tag or inline `<svg>`.
        html: string;
    };
    actions?: Array<{
        text: string;
        link: string;
        variant?: 'primary' | 'secondary' | 'minimal';
        icon?: string;
        attrs?: Record<string, string | number | boolean>;
    }>;
}

export interface PaginationOption {
    link?: string;
    label?: string;
}

export interface SidebarConfig {
    label?: string;
    order?: number;
    hidden?: boolean;
    badge?: string | BadgeConfig;
    attrs?: Record<string, string | number | boolean | undefined>;
}

export interface FrontmatterConfig {
    author?: string;
    banner?: BannerConfig;
    category?: string;
    description?: string;
    draft?: boolean;
    editUrl?: string | boolean;
    head?: HeadConfig[];
    hero?: HeroConfig;
    lastUpdated?: string;
    next?: boolean | string | PaginationOption;
    pagefind?: boolean;
    prev?: boolean | string | PaginationOption;
    sidebar?: SidebarConfig;
    slug?: string;
    template?: 'doc' | 'splash';
    title: string;
}
