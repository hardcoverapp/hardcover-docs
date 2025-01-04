# Hardcover Documentation Developer Guide

## Contributing to the Hardcover Documentation

### [Contributing Guidelines](CONTRIBUTING)

### Developer Code of Conduct

### PR Templates

## Developer FAQs

### How is the project structured?

#### File Structure

Starlight looks for `.md` or `.mdx` files in the `src/content/docs/` directory. 
Each file is exposed as a route based on its file name.

Images can be added to `src/assets/` and embedded in Markdown with a relative link.

Static assets, like favicons, can be placed in the `public/` directory.

### How do I run the project locally?

#### 🚀 Quick Start

1. **Clone the repo:**
   ```bash
   git clone https://github.com/hardcoverapp/hardcover-docs.git
    ```
2. **Navigate to the project directory:**
   ```bash
   cd hardcover-doc
   ```
3. **Install dependencies:**
    ```bash
    npm install
    ```
4. **Start the dev server:**
    ```bash
    npm run dev
    ```
5. **Open your browser**
6. **Navigate to `http://localhost:4321`**

#### 🧞 Commands

The Hardcover documentation site is built with [Astro](https://astro.build/).
All commands are run from the root of the project, from a terminal:

| Command                              | Action                                           |
|:-------------------------------------|:-------------------------------------------------|
| `npm install`                        | Installs dependencies                            |
| `npm run dev`                        | Starts local dev server at `localhost:4321`      |
| `npm run build`                      | Build your production site to `./dist/`          |
| `npm run preview`                    | Preview your build locally, before deploying     |
| `npm run astro ...`                  | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help`            | Get help using the Astro CLI                     |
| `npx vitest`                         | Run the unit tests for the project               |
| `npx vitest --coverage.enabled true` | Run the unit tests with code coverage            |

### How do I add a new page or update an existing page?
#### Adding a New Page

1. Create a new `.mdx` file in the `src/content/docs/` directory.
2. Give the file a name that describes the content.
3. Add [frontmatter](#page-frontmatter) to the top of the file.
4. Add content to the file using Markdown or MDX syntax.
5. Add the new page to the sidebar
- If the page is part of the `api/GraphQL/Schema` or `guides` sections the sidebar will automatically update with the new page.
- All other pages will need to be added to the astro config file
  see [Starlight - Add links and link groups](https://starlight.astro.build/guides/sidebar/#add-links-and-link-groups)
  for more information.

##### Page Frontmatter

| Field           | Description                                                                                                                                                                             | Required    |
|-----------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------|
| title           | String containing the title of the page                                                                                                                                                 | Yes         |
| category        | String of the category the page should be included in `guide` or `reference`                                                                                                            | Yes         |
| layout          | relative path to `/src/layouts/documentation.astro`                                                                                                                                     | Yes         |
| description     | String containing the descriptive text to use in HTML meta tags                                                                                                                         | Recommended |
| lastUpdated     | String in the format `YYYY-MM-DD HH:MM:SS`                                                                                                                                              | Recommended |
| draft           | Boolean value determining whether the page should be hidden from the production site                                                                                                    | No          |
| slug            | String containing the URL slug for the page                                                                                                                                             | No          |
| tableOfContents | Boolean value determining whether a table of contents should be generated                                                                                                               | No          |
| template        | `doc` or `splash` default is `doc`. `splash` is a wider layout without the normal sidebars                                                                                              | No          |
| hero            | See [Starlight - Frontmatter HeroConfig](https://starlight.astro.build/reference/frontmatter/#heroconfig) for more information                                                          | No          |
| banner          | See [Starlight - Frontmatter Banner](https://starlight.astro.build/reference/frontmatter/#banner) for more information                                                                  | No          |
| prev            | Boolean value determining whether a previous button should be shown. See [Starlight - Frontmatter Prev](https://starlight.astro.build/reference/frontmatter/#prev) for more information | No          |
| next            | Boolean value determining whether a next button should be shown. See [Starlight - Frontmatter Next](https://starlight.astro.build/reference/frontmatter/#next) for more information     | No          |
| sidebar         | Control how the page is displayed in the sidebar. See [Starlight - Frontmatter Sidebar](https://starlight.astro.build/reference/frontmatter/#sidebarconfig) for more information        | No          |

###### Example Frontmatter

```md
---
title: Getting Started with the API
description: Get started with the Hardcover GraphQL API.
category: guide
lastUpdated: 2025-02-01 17:03:00
layout: ../../layouts/documentation.astro
---
```

#### Available Components

In addition to the standard [Starlight - Components](https://starlight.astro.build/guides/components/), the Hardcover
documentation site includes the following custom
components:

##### GraphQLExplorer

This component allows a user to view GraphQL queries and experiment by running them against the API.

**Import Path:**

```js
import GraphQLExplorer from '@/components/GraphQLExplorer/GraphQLExplorer.astro';
```

**Parameters:**

- `canTry` - A boolean value determining whether the user can run the query in the explorer. The default is `true`.
- `description` - A string describing the query.
- `forcePresentation` - A boolean value determining whether the presentation options should be hidden. The default is `false`.
- `presentation` - The default presentation of the response, either `json` or `table`. The default is `json`.
- `query` - A string containing the GraphQL query to be displayed in the explorer.
- `title` - A string for the title of the query shown in the explorer. The default is `Example Query`. Change this when translating the page to another language.

**Usage:**

```mdx
<GraphQLExplorer
    query={query}
    description="An example query"
    presentation='table'
    title="Example"
/>
```

### How do I add a new language to the language dropdown?

The root language should **not** be changed from English. To add a new language, see [Starlight - Configure i18n](https://starlight.astro.build/guides/i18n/#configure-i18n).

When adding a new language, you should also update the existing translations in the astro config file to include the new language.

### How do I add a translation for an existing language?

Once a language has been added to the Astro config file you can create a new file in the `src/content/docs/` directory
inside a folder named with the language code. This new file should have the same name as the original file you are translating.

For example, if you are translating the `src/content/docs/getting-started.mdx` file into Spanish you would create a new
file at `src/content/docs/es/getting-started.mdx` with the Spanish translation of the content.

## Support Resources

### Submitting a Bug Report

### Requesting a Feature

### Finding Help on Discord
Connect with us on [Discord](https://discord.gg/edGpYN8ym8)
