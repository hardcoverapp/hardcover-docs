# Hardcover API Documentation Developer Guide

## Contributing to the Hardcover Documentation

### [Contributing Guidelines](CONTRIBUTING)

### Developer Code of Conduct

### PR Templates

## Developer FAQs

### How is the project structured?

#### File Structure

Starlight looks for `.md` or `.mdx` files in the `src/content/docs/` directory. Each file is exposed as a route based on
its file name.

Images can be added to `src/assets/` and embedded in Markdown with a relative link.

Static assets, like favicons, can be placed in the `public/` directory.

### How do I run the project locally?

#### 🚀 Quick Start
1. **Clone the repo:**
   ```bash
   git clone https://github.com/RevelryPlay/hardcover-doc.git
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

| Command                   | Action                                           |
|:--------------------------|:-------------------------------------------------|
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

### How do I add a new page?

### How do I add a new language to the language dropdown?

### How do I add a translation for an existing language?

## Support Resources

### Submitting a Bug Report

### Requesting a Feature

### Finding Help on Discord
