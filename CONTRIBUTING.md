# Hardcover Contributing Guidelines

The Hardcover documentation site is an open-source project, and we welcome contributions from the community.
This document outlines the process for contributing to Hardcover.

## Ways to Contribute

We are currently looking for contributions in the following areas:

- API Documentation: Help us improve the API documentation by adding new pages or updating existing content.
- API Guides: Share your knowledge by writing guides on how to use the Hardcover API.
- Bug Fixes: Help us fix bugs in the documentation site.
- Reporting Issues: Report any issues you encounter with the documentation
  site.
  [Create an Issue](https://github.com/hardcoverapp/hardcover-docs/issues/new?template=bug_report.yml)
- Feature Requests: Share your ideas for new features or improvements to the documentation
  site.
  [Suggest a Feature](https://github.com/hardcoverapp/hardcover-docs/issues/new?template=feature_request.yml)
- Librarian Guides: Share your expertise by writing guides on how to use the Librarian tools.
- Showcase Projects: Built something with the Hardcover API? Add it to the community showcase.
  [Add Your Project](https://docs.hardcover.app/showcase/submit/)

## Finding Something to Work On

You can find issues to work on
by looking at the [Issues Board](https://github.com/hardcoverapp/hardcover-docs/issues) on GitHub
or by joining the [Hardcover Discord](https://discord.gg/edGpYN8ym8) and asking for suggestions in
the [#API](https://discord.com/channels/835558721115389962/1278040045324075050)
or [#librarians](https://discord.com/channels/835558721115389962/1105918193022812282) channels.

## Being a Good Contributor

When contributing to Hardcover, please follow these guidelines:

- Be respectful of others and their contributions.
- Be open to feedback and willing to make changes based on feedback.
- Be patient and understanding of the time it takes to review and merge contributions.
- Be clear and concise in your contributions.
- Be willing to help others and answer questions.
- Be willing to work with others to improve the documentation site.
- Be open to learning and growing as a contributor.
- Be willing to follow the contribution processes.
- Be willing to accept that not all contributions will be accepted.

## Contribution Process

To contribute to Hardcover, follow these steps:

### For Code Contributions

1. Fork the [Hardcover Docs Repository](https://github.com/hardcoverapp/hardcover-docs.git) on GitHub.
2. Clone your fork to your local machine.
3. Create a new branch for your contribution.
4. Follow the [Hardcover Documentation Developer Guide](/DEVELOPERS.md) to set up your local development environment.
5. Make your changes.
6. Test your changes locally.
7. Run `npm run test` to ensure your changes pass the tests.
8. Commit your changes.
9. Push your changes to your fork on GitHub.
10. Create a pull request to the main Hardcover Docs Repository.
11. When your pull request is ready for review, let us know by leaving a comment on it tagging `@KylieBenfield`, or by
	posting in the [Hardcover Discord](https://discord.gg/edGpYN8ym8) (#API, #librarians, or tagging `@revelry`).
12. Wait for feedback and review from the Hardcover team.
13. Make any requested changes.
14. Once your pull request is approved, it will be merged into the main branch.
15. Celebrate your contribution!
16. Update your fork with the latest changes from the main branch.
17. Continue contributing to Hardcover!

### For Content Contributions

1. Using the UI navigate to the page you want to edit.
2. Click the "Edit page" button near the bottom of the content.
3. Make your changes in the editor.
4. Preview your changes for formatting and accuracy.
5. Submit your changes opening a pull request.
6. When your pull request is ready for review, let us know by leaving a comment on it tagging `@KylieBenfield`, or by
   posting in the [Hardcover Discord](https://discord.gg/edGpYN8ym8) (#API, #librarians, or tagging `@revelry`).
7. Wait for feedback and review from the Hardcover team.
8. Make any requested changes.
9. Once your pull request is approved, it will be merged into the main branch.
10. Celebrate your contribution!
11. Continue contributing to Hardcover!

Changes to the Librarian guides also need sign-off from the Hardcover librarians team before they're merged.

### For Contribution Suggestions

If you have a suggestion for a contribution, but don't want to make the changes yourself, follow these steps:

1. [Open a new issue](https://github.com/hardcoverapp/hardcover-docs/issues/new/choose) and pick the form that fits:
   - Report a problem with the docs
   - Suggest an improvement
   - Submit a project to the showcase
   - Report a showcase project
2. Fill out the form. No technical knowledge is needed.
3. Wait for feedback and review from the Hardcover team.

## FAQ

### How is the project structured?

#### File Structure

Starlight looks for `.md` or `.mdx` files in the `src/content/docs/` directory.
Each file is exposed as a route based on its file name.

Images for doc pages go in `src/content/images/` and are embedded with the `ImageComponent`.

Static assets, like favicons, can be placed in the `public/` directory.

### Frontmatter

Each Markdown file can include frontmatter to provide metadata about the document.

| Field           | Description                                                                                                                                                                             | Required    |
|-----------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------|
| title           | String containing the title of the page                                                                                                                                                 | Yes         |
| category        | `guide`, `reference`, or `tool`. Shown as a badge at the top of the page by the documentation layout                                                                                    | Recommended |
| layout          | Required for doc pages. Use `/src/layouts/documentation.astro`, which adds the last updated date and category badge                                                                  | Yes         |
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

#### Example Frontmatter

```md
---
title: Getting Started with the API
description: Get started with the Hardcover GraphQL API.
category: guide
lastUpdated: 2025-02-01 17:03:00
layout: /src/layouts/documentation.astro
---
```

### Finding Help on Discord

Connect with us on [Discord](https://discord.gg/edGpYN8ym8)
