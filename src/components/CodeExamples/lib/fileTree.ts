interface TreeNode {
  name: string;
  isDir: boolean;
  fullPath: string;
  children: Map<string, TreeNode>;
}

/**
 * Converts a list of file paths into an HTML unordered list structure
 * suitable for Starlight's `<FileTree>` component.
 *
 * If `highlightFile` is provided, that file entry will be wrapped in `<strong>` tags,
 * which Starlight's FileTree renders with active accent highlight styling.
 */
export function fileListToTreeHtml(files: string[], highlightFile?: string): string {
  const root: TreeNode = { name: '', isDir: true, fullPath: '', children: new Map() };
  const cleanHighlight = highlightFile?.replace(/^\/+|\/+$/g, '');

  for (const rawFile of files) {
    const clean = rawFile.replace(/^\/+|\/+$/g, '');
    if (!clean) continue;
    const segments = clean.split('/').filter(Boolean);
    let current = root;

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const isLast = i === segments.length - 1;
      const currentPath = segments.slice(0, i + 1).join('/');

      if (!current.children.has(segment)) {
        current.children.set(segment, {
          name: segment,
          isDir: !isLast,
          fullPath: currentPath,
          children: new Map(),
        });
      }
      current = current.children.get(segment)!;
    }
  }

  function renderNodes(nodes: Map<string, TreeNode>): string {
    const sorted = Array.from(nodes.values()).sort((a, b) => {
      if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    });

    let html = '<ul>';
    for (const node of sorted) {
      if (node.isDir) {
        html += `<li>${node.name}/${renderNodes(node.children)}</li>`;
      } else if (cleanHighlight && node.fullPath === cleanHighlight) {
        html += `<li><strong>${node.name}</strong></li>`;
      } else {
        html += `<li>${node.name}</li>`;
      }
    }
    html += '</ul>';
    return html;
  }

  return renderNodes(root.children);
}
