# Showcase Feature Specification

## Overview

A community showcase page to highlight projects built with the Hardcover API. The showcase will feature a filterable, searchable grid of project cards that expand to show full details.

---

## Data Schema

Each showcase entry is a YAML file in `src/content/showcase/`.

```yaml
# Required fields
name: "Project Name"
slug: "project-name"  # URL-safe identifier
summary: "Brief one-line description for card preview"
description: |
  Full markdown description with features, use cases,
  installation notes, etc. Supports formatting.

author:
  name: "Display Name"
  github: "github-username"      # optional
  hardcover: "hardcover-username"  # optional

links:
  - label: "Primary Link"
    url: "https://..."
    type: "website"  # website | github | store | docs | demo

categories:
  - "Browser Extension"  # At least one required

# Dates
dateAdded: 2025-01-15
dateUpdated: 2025-01-15

# Optional fields
screenshots:
  - src: "./images/project-1.png"  # Local or external URL
    alt: "Description of screenshot"
  - src: "https://example.com/image.png"
    alt: "Another screenshot"

tags:
  - "open-source"
  - "tracking"

featured: false  # Defaults to false
```

---

## Categories

Predefined list (can be expanded):

- Browser Extension
- Mobile App
- Web App
- CLI Tool
- E-ink Display
- Home Automation
- Desktop App
- Widget
- Integration
- Automation
- Other

Projects can have multiple categories.

---

## Link Types

| Type | Icon | Use Case |
|------|------|----------|
| `website` | 🌐 | Project homepage |
| `github` | GitHub icon | Source repository |
| `store` | 📦 | App store, Chrome Web Store, etc. |
| `docs` | 📄 | Documentation |
| `demo` | ▶️ | Live demo or video |

---

## Page Layout

```
┌─────────────────────────────────────────────────────────┐
│  Community Showcase                                     │
│  Discover projects built with the Hardcover API         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [🔍 Search projects...                              ]  │
│                                                         │
│  Categories:                                            │
│  [All] [Extensions] [Mobile] [CLI] [E-ink] [More ▾]    │
│                                                         │
│  Sort by: [Newest ▾]                                    │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ★ Featured                                             │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐             │
│  │ screenshot│ │ screenshot│ │ screenshot│             │
│  │           │ │           │ │           │             │
│  │ Name      │ │ Name      │ │ Name      │             │
│  │ Summary   │ │ Summary   │ │ Summary   │             │
│  │ [badges]  │ │ [badges]  │ │ [badges]  │             │
│  └───────────┘ └───────────┘ └───────────┘             │
│                                                         │
│  All Projects                                           │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐             │
│  │ w/ images │ │ w/ images │ │ w/ images │             │
│  └───────────┘ └───────────┘ └───────────┘             │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐             │
│  │ icon only │ │ icon only │ │ icon only │             │
│  └───────────┘ └───────────┘ └───────────┘             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Card Component

### Collapsed State

```
┌─────────────────────────────┐
│  ┌───────────────────────┐  │
│  │                       │  │
│  │  Screenshot 1         │  │  ← First screenshot or category icon
│  │  (or category icon)   │  │
│  │                       │  │
│  └───────────────────────┘  │
│                             │
│  Project Name        [NEW]  │  ← "NEW" if dateAdded < 30 days
│  Brief summary text that    │
│  can wrap to two lines...   │
│                             │
│  [Extension] [Mobile]       │  ← Category badges
│                        [→]  │  ← Expand indicator
└─────────────────────────────┘
```

### Expanded State (Modal)

```
┌──────────────────────────────────────────────────────────────┐
│                                                         [×]  │
│  Project Name                                         [NEW]  │
│                                                              │
│  ┌────────┐ ┌────────┐ ┌────────┐                           │
│  │        │ │        │ │        │  ← Horizontal scroll      │
│  │ img 1  │ │ img 2  │ │ img 3  │    or lightbox gallery    │
│  │        │ │        │ │        │                           │
│  └────────┘ └────────┘ └────────┘                           │
│                                                              │
│  Full markdown description rendered here. Can include:       │
│  - Bullet points                                             │
│  - **Bold** and *italic* text                                │
│  - Code snippets                                             │
│  - Links                                                     │
│                                                              │
│  ────────────────────────────────────────────────────────── │
│                                                              │
│  Categories                                                  │
│  [Browser Extension] [Productivity]                          │
│                                                              │
│  Tags                                                        │
│  chrome · search · open-source                               │
│                                                              │
│  ────────────────────────────────────────────────────────── │
│                                                              │
│  Created by                                                  │
│  Jane Doe                                                    │
│  [@janedoe on GitHub]  [@janedoe on Hardcover]              │
│                                                              │
│  ────────────────────────────────────────────────────────── │
│                                                              │
│  Links                                                       │
│  [🌐 Website]  [GitHub]  [📦 Chrome Web Store]              │
│                                                              │
│  ────────────────────────────────────────────────────────── │
│                                                              │
│  Added Jan 15, 2025 · Updated Mar 20, 2025                  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Sorting & Filtering

### Sort Options

| Option | Logic |
|--------|-------|
| Newest | `dateAdded` descending |
| Recently Updated | `dateUpdated` descending |
| Alphabetical | `name` ascending |
| Featured First | `featured` desc, then `dateAdded` desc |

### Display Order (within sort)

1. Featured projects with screenshots
2. Featured projects without screenshots
3. Non-featured with screenshots
4. Non-featured without screenshots

### Filtering

- **Category filter**: Multi-select, shows projects matching ANY selected category
- **Search**: Filters by name, summary, description, author name, tags

---

## Search Integration

### Page-level Search
- Instant client-side filtering as user types
- Searches: name, summary, description, author.name, tags

### Site-wide Search (Pagefind)
- Each project stored as separate content file
- Pagefind indexes automatically
- Projects discoverable via global search

---

## Date-based Features

| Feature | Condition | Display |
|---------|-----------|---------|
| "NEW" badge | `dateAdded` within 30 days | Badge on card and modal |
| "Updated" indicator | `dateUpdated` within 14 days | Subtle indicator |
| Stale warning (admin) | `dateUpdated` > 6 months | Flag for review |

---

## File Structure

```
src/
├── content/
│   └── showcase/
│       ├── marian-the-librarian.yaml
│       ├── hardcover-trmnl.yaml
│       └── ...
├── components/
│   └── showcase/
│       ├── ShowcaseGrid.tsx      # Main grid with filtering
│       ├── ShowcaseCard.tsx      # Individual card
│       ├── ShowcaseModal.tsx     # Expanded detail view
│       ├── ShowcaseFilters.tsx   # Category/search controls
│       ├── ImageGallery.tsx      # Screenshot carousel
│       └── AuthorLinks.tsx       # GitHub/HC profile links
├── pages/
│   └── showcase/
│       └── index.astro           # Main showcase page
└── assets/
    └── showcase/
        └── [project-slug]/
            ├── screenshot-1.png
            └── screenshot-2.png
```

---

## Content Collection Schema

`src/content/config.ts` addition:

```typescript
import { defineCollection, z } from 'astro:content';

const showcaseCollection = defineCollection({
  type: 'data',
  schema: z.object({
    name: z.string(),
    slug: z.string(),
    summary: z.string(),
    description: z.string(),
    author: z.object({
      name: z.string(),
      github: z.string().optional(),
      hardcover: z.string().optional(),
    }),
    links: z.array(z.object({
      label: z.string(),
      url: z.string().url(),
      type: z.enum(['website', 'github', 'store', 'docs', 'demo']),
    })),
    categories: z.array(z.string()).min(1),
    dateAdded: z.coerce.date(),
    dateUpdated: z.coerce.date(),
    screenshots: z.array(z.object({
      src: z.string(),
      alt: z.string(),
    })).optional(),
    tags: z.array(z.string()).optional(),
    featured: z.boolean().default(false),
  }),
});

export const collections = {
  // ...existing collections
  showcase: showcaseCollection,
};
```

---

## Sidebar Integration

Add to `astro.config.mjs` sidebar:

```javascript
{
  label: 'Community',
  items: [
    {
      label: 'Showcase',
      slug: 'showcase',
    },
    // Future: tutorials, blog, etc.
  ],
}
```

---

## Example Entries

### With Screenshots

```yaml
# src/content/showcase/marian-the-librarian.yaml
name: "Marian the Librarian"
slug: "marian-the-librarian"
summary: "Chrome extension for quick Hardcover access and book lookups"
description: |
  Marian the Librarian brings Hardcover to your browser. Features include:

  - Quick search from any tab
  - One-click "Want to Read" additions
  - Current reading progress in toolbar
  - Goodreads page integration

author:
  name: "Jane Doe"
  github: "janedoe"
  hardcover: "janedoe"

links:
  - label: "Chrome Web Store"
    url: "https://chromewebstore.google.com/detail/marian-the-librarian/gpnkkkbefalodcjhgafioibknoingann"
    type: "store"
  - label: "GitHub"
    url: "https://github.com/janedoe/marian"
    type: "github"

categories:
  - "Browser Extension"
  - "Productivity"

screenshots:
  - src: "./marian/popup.png"
    alt: "Extension popup showing current reads"
  - src: "./marian/search.png"
    alt: "Search results overlay"

tags:
  - "chrome"
  - "search"
  - "open-source"

dateAdded: 2025-01-15
dateUpdated: 2025-03-20
featured: true
```

### Without Screenshots

```yaml
# src/content/showcase/hardcover-trmnl.yaml
name: "Hardcover TRMNL"
slug: "hardcover-trmnl"
summary: "Display your reading stats on TRMNL e-ink devices"
description: |
  A TRMNL plugin that shows your Hardcover reading data on e-ink displays.

  Displays:
  - Reading goals and progress
  - Currently reading books
  - Want to read queue
  - Recent activity

author:
  name: "Jacob Tender"
  github: "jacobtender"
  hardcover: "jacobtender"

links:
  - label: "GitHub"
    url: "https://github.com/jacobtender/hardcover_trmnl"
    type: "github"

categories:
  - "E-ink Display"
  - "Widget"

tags:
  - "trmnl"
  - "e-ink"
  - "open-source"

dateAdded: 2025-02-01
dateUpdated: 2025-02-01
featured: false
```

---

## Decisions

| Question | Decision |
|----------|----------|
| Expand behavior | Modal overlay |
| Image gallery | Lightbox with zoom/fullscreen |
| Submission process | PR-based, tag `@revelry` on Discord |

## Open Questions

1. **Moderation**: Review process before projects appear?
2. **Project status**: Track if projects are actively maintained?
3. **Analytics**: Track clicks to project links?
4. **Localization**: Translate project descriptions?

---

## Submission Process

### For Contributors

The showcase page should include a "Submit Your Project" section with these instructions:

```markdown
## Add Your Project

Built something cool with the Hardcover API? We'd love to feature it!

### How to Submit

1. Fork the [docs repository](https://github.com/hardcover/docs)
2. Create a new file: `src/content/showcase/your-project-slug.yaml`
3. Use the template below
4. Add any screenshots to `src/assets/showcase/your-project-slug/`
5. Open a Pull Request
6. Tag `@revelry` in the [Hardcover Discord](https://discord.gg/hardcover) to let us know!

### Template

\`\`\`yaml
name: "Your Project Name"
slug: "your-project-slug"
summary: "One-line description (under 100 characters)"
description: |
  Longer description of your project. Markdown supported.

  - Feature 1
  - Feature 2

author:
  name: "Your Name"
  github: "your-github-username"      # optional
  hardcover: "your-hardcover-username"  # optional

links:
  - label: "GitHub"
    url: "https://github.com/..."
    type: "github"
  - label: "Website"
    url: "https://..."
    type: "website"

categories:
  - "Choose from: Browser Extension, Mobile App, Web App, CLI Tool, E-ink Display, Home Automation, Desktop App, Widget, Integration, Automation, Other"

dateAdded: 2025-01-15  # Today's date
dateUpdated: 2025-01-15

# Optional
screenshots:
  - src: "./your-project-slug/screenshot-1.png"
    alt: "Description of screenshot"

tags:
  - "relevant"
  - "tags"

featured: false  # Set by maintainers
\`\`\`
```

### For Maintainers

- Review PR for completeness and accuracy
- Verify links work and project is legitimate
- Set `featured: true` for standout projects
- Merge when ready

---

## Future Enhancements

- Voting/popularity metrics
- Project status badges (active, archived, beta)
- Related projects suggestions
- RSS feed for new additions
- Integration with Hardcover user profiles
