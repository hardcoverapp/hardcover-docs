import React, { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import { generateGraphDataForType, toCytoscapeElements } from '@/lib/schemaGraphUtils.ts';

interface SchemaGraphViewerProps {
  typeName: string;
}

type LayoutType = 'concentric' | 'circle' | 'grid';

type RelationshipFilter = 'all' | 'object' | 'array';

export const SchemaGraphViewer: React.FC<SchemaGraphViewerProps> = ({ typeName }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const tipsRef = useRef<Map<string, any>>(new Map());
  const [layout, setLayout] = useState<LayoutType>('concentric');
  const [showScalarFields, setShowScalarFields] = useState(false);
  const [showIncomingRels, setShowIncomingRels] = useState(true);
  const [relationshipFilter, setRelationshipFilter] = useState<RelationshipFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark') ||
                     document.documentElement.getAttribute('data-theme') === 'dark';
      setIsDarkMode(isDark);
    };

    checkDarkMode();

    // Watch for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme']
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    // Define color schemes for light and dark modes
    const colors = isDarkMode ? {
      // Dark mode: lighter, more saturated colors for better contrast
      primary: '#34d399',      // Lighter emerald for current type
      primaryBorder: '#10b981',
      incoming: '#fbbf24',     // Lighter amber for incoming
      incomingBorder: '#f59e0b',
      outgoing: '#818cf8',     // Lighter indigo for outgoing
      outgoingBorder: '#6366f1',
      bidirectional: '#c084fc', // Lighter purple for bidirectional
      bidirectionalBorder: '#a855f7',
      scalar: '#d1d5db',       // Lighter gray for scalars
      scalarBorder: '#9ca3af',
      edgeIncoming: '#fbbf24',
      edgeOutgoing: '#818cf8',
      edgeColor: '#9ca3af',
      textBg: '#1f2937'
    } : {
      // Light mode: current colors work well
      primary: '#10b981',
      primaryBorder: '#059669',
      incoming: '#f59e0b',
      incomingBorder: '#d97706',
      outgoing: '#6366f1',
      outgoingBorder: '#4f46e5',
      bidirectional: '#a855f7',
      bidirectionalBorder: '#9333ea',
      scalar: '#9ca3af',
      scalarBorder: '#6b7280',
      edgeIncoming: '#f59e0b',
      edgeOutgoing: '#6366f1',
      edgeColor: '#94a3b8',
      textBg: '#ffffff'
    };

    // Generate graph data for the specified type
    const graphData = generateGraphDataForType(typeName, showScalarFields, showIncomingRels);

    // Filter edges based on relationship type filter
    if (relationshipFilter !== 'all') {
      graphData.edges = graphData.edges.filter(edge => edge.relationshipType === relationshipFilter);

      // Remove nodes that no longer have any edges
      const connectedNodeIds = new Set<string>();
      connectedNodeIds.add(typeName); // Always keep the primary node
      graphData.edges.forEach(edge => {
        connectedNodeIds.add(edge.source);
        connectedNodeIds.add(edge.target);
      });
      graphData.nodes = graphData.nodes.filter(node => connectedNodeIds.has(node.id));
    }

    const elements = toCytoscapeElements(graphData);

    // Get layout configuration based on selected layout type
    const getLayoutConfig = (layoutType: LayoutType) => {
      switch (layoutType) {
        case 'concentric':
          return {
            name: 'concentric' as const,
            concentric: (node: any) => node.data('type') === 'primary' ? 2 : 1,
            levelWidth: () => 1,
            minNodeSpacing: 80,
            spacingFactor: 1.2,
            animate: true,
            animationDuration: 500,
            fit: true,
            padding: 30
          };
        case 'circle':
          return {
            name: 'circle' as const,
            radius: 180,
            animate: true,
            animationDuration: 500,
            fit: true,
            padding: 30
          };
        case 'grid':
          return {
            name: 'grid' as const,
            rows: Math.ceil(Math.sqrt(elements.length)),
            animate: true,
            animationDuration: 500,
            fit: true,
            padding: 30
          };
      }
    };

    // Initialize Cytoscape
    const cy = cytoscape({
      container: containerRef.current,
      elements: elements,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': colors.outgoing,
            'label': 'data(label)',
            'color': '#fff',
            'text-valign': 'center',
            'text-halign': 'center',
            'font-size': '10px',
            'width': '60px',
            'height': '35px',
            'shape': 'roundrectangle',
            'border-width': 2,
            'border-color': colors.outgoingBorder,
            'text-wrap': 'wrap',
            'text-max-width': '55px'
          }
        },
        {
          selector: 'node[type="primary"]',
          style: {
            'background-color': colors.primary,
            'border-color': colors.primaryBorder,
            'width': '80px',
            'height': '45px',
            'font-size': '12px',
            'font-weight': 'bold',
            'text-max-width': '75px'
          }
        },
        {
          selector: 'node[type="related"]',
          style: {
            'background-color': colors.outgoing,
            'border-color': colors.outgoingBorder
          }
        },
        {
          selector: 'node[relationDirection="outgoing"]',
          style: {
            'background-color': colors.outgoing,
            'border-color': colors.outgoingBorder
          }
        },
        {
          selector: 'node[relationDirection="incoming"]',
          style: {
            'background-color': colors.incoming,
            'border-color': colors.incomingBorder
          }
        },
        {
          selector: 'node[relationDirection="bidirectional"]',
          style: {
            'background-color': colors.bidirectional,
            'border-color': colors.bidirectionalBorder
          }
        },
        {
          selector: 'node[type="scalar"]',
          style: {
            'background-color': colors.scalar,
            'border-color': colors.scalarBorder,
            'width': '50px',
            'height': '28px',
            'shape': 'rectangle',
            'font-size': '9px',
            'text-max-width': '45px'
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 1.5,
            'line-color': colors.edgeColor,
            'target-arrow-color': colors.edgeColor,
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'label': 'data(label)',
            'font-size': '8px',
            'text-rotation': 'autorotate',
            'text-margin-y': -8,
            'color': colors.edgeColor,
            'text-background-color': colors.textBg,
            'text-background-opacity': 0.8,
            'text-background-padding': '2px'
          }
        },
        {
          selector: 'edge[relationshipType="array"]',
          style: {
            'line-style': 'dashed'
          }
        },
        {
          selector: 'edge[direction="incoming"]',
          style: {
            'line-color': colors.edgeIncoming,
            'target-arrow-color': colors.edgeIncoming,
            'color': colors.incomingBorder
          }
        },
        {
          selector: 'edge[direction="outgoing"]',
          style: {
            'line-color': colors.edgeOutgoing,
            'target-arrow-color': colors.edgeOutgoing,
            'color': colors.outgoingBorder
          }
        },
        {
          selector: 'node.dimmed',
          style: {
            'opacity': 0.3
          }
        },
        {
          selector: 'node.highlighted',
          style: {
            'border-width': 4,
            'border-color': colors.incoming,
            'z-index': 999
          }
        },
        {
          selector: 'edge.dimmed',
          style: {
            'opacity': 0.2
          }
        }
      ],
      layout: getLayoutConfig(layout),
      minZoom: 0.5,
      maxZoom: 2,
      wheelSensitivity: 0.2
    });

    cyRef.current = cy;

    // Function to create tooltips
    const createTooltips = () => {
      // Clear existing tooltips first
      tipsRef.current.forEach(tip => tip.destroy());
      tipsRef.current.clear();

      // Add tooltips for edges (relationship lines)
      cy.edges().forEach((edge) => {
        const label = edge.data('label');
        const relationshipType = edge.data('relationshipType');
        const direction = edge.data('direction');
        const typeText = relationshipType === 'array' ? 'Array/List' : 'Single Object';
        const directionText = direction === 'incoming' ? '← Incoming' : '→ Outgoing';
        const directionColor = direction === 'incoming' ? colors.edgeIncoming : colors.edgeOutgoing;

        const dummyDomEle = document.createElement('div');
        containerRef.current?.appendChild(dummyDomEle);

        const tip = tippy(dummyDomEle, {
          getReferenceClientRect: () => {
            const pos = edge.renderedMidpoint();
            const containerRect = containerRef.current?.getBoundingClientRect();
            if (!containerRect) return new DOMRect();

            // In fullscreen, use window coordinates directly
            const x = containerRect.left + pos.x;
            const y = containerRect.top + pos.y;

            return new DOMRect(x, y, 0, 0);
          },
          content: `
            <div style="text-align: center;">
              <strong>${label}</strong><br/>
              <span style="font-size: 0.85em; opacity: 0.9;">${typeText}</span><br/>
              <span style="font-size: 0.85em; color: ${directionColor}; font-weight: 500;">${directionText}</span>
            </div>
          `,
          trigger: 'manual',
          arrow: true,
          placement: 'top',
          hideOnClick: false,
          theme: 'light-border',
          allowHTML: true,
          appendTo: () => wrapperRef.current || document.body,
          zIndex: 9999,
          popperOptions: {
            strategy: 'absolute'
          }
        });

        tipsRef.current.set(`edge-${edge.id()}`, tip);

        // Remove old listeners and add new ones
        // @ts-ignore
        edge.removeAllListeners('mouseover');
        // @ts-ignore
        edge.removeAllListeners('mouseout');
        edge.on('mouseover', () => tip.show());
        edge.on('mouseout', () => tip.hide());
      });

      // Add tooltips for nodes
      cy.nodes().forEach((node) => {
        const nodeId = node.data('id');
        const nodeType = node.data('type');
        const fieldType = node.data('fieldType');
        const relationDirection = node.data('relationDirection');

        let typeLabel = 'Related Type';
        let directionLabel = '';

        if (nodeType === 'primary') {
          typeLabel = 'Current Type';
        } else if (nodeType === 'scalar') {
          typeLabel = `Scalar: ${fieldType || 'Field'}`;
        } else if (relationDirection === 'incoming') {
          typeLabel = 'Related Type';
          directionLabel = `<br/><span style="font-size: 0.85em; color: ${colors.incoming}; font-weight: 500;">← References this type</span>`;
        } else if (relationDirection === 'outgoing') {
          typeLabel = 'Related Type';
          directionLabel = `<br/><span style="font-size: 0.85em; color: ${colors.outgoing}; font-weight: 500;">→ Referenced by this type</span>`;
        } else if (relationDirection === 'bidirectional') {
          typeLabel = 'Related Type';
          directionLabel = `<br/><span style="font-size: 0.85em; color: ${colors.bidirectional}; font-weight: 500;">↔ Bidirectional</span>`;
        }

        const dummyDomEle = document.createElement('div');
        containerRef.current?.appendChild(dummyDomEle);

        const tip = tippy(dummyDomEle, {
          getReferenceClientRect: () => {
            const pos = node.renderedPosition();
            const containerRect = containerRef.current?.getBoundingClientRect();
            if (!containerRect) return new DOMRect();

            return new DOMRect(
              containerRect.left + pos.x,
              containerRect.top + pos.y,
              0,
              0
            );
          },
          content: `
            <div style="text-align: center;">
              <strong>${nodeId}</strong><br/>
              <span style="font-size: 0.85em; opacity: 0.9;">${typeLabel}</span>${directionLabel}
            </div>
          `,
          trigger: 'manual',
          arrow: true,
          placement: 'top',
          hideOnClick: false,
          theme: 'light-border',
          allowHTML: true,
          appendTo: () => wrapperRef.current || document.body,
          zIndex: 9999,
          popperOptions: {
            strategy: 'absolute'
          }
        });

        tipsRef.current.set(`node-${node.id()}`, tip);

        // Remove old listeners and add new ones
        // @ts-ignore
        node.removeAllListeners('mouseover');
        // @ts-ignore
        node.removeAllListeners('mouseout');
        node.on('mouseover', () => tip.show());
        node.on('mouseout', () => tip.hide());
      });
    };

    // Create tooltips initially
    createTooltips();

    // Store the function for later use
    // @ts-ignore
    cyRef.current.createTooltips = createTooltips;

    // Add hover effects
    cy.on('mouseover', 'node', (event) => {
      const nodeType = event.target.data('type');

      // Only show hover effect and pointer for clickable nodes
      if (nodeType !== 'scalar') {
        event.target.style('background-color', '#8b5cf6');
        document.body.style.cursor = 'pointer';
      }
    });

    cy.on('mouseout', 'node', (event) => {
      const nodeType = event.target.data('type');
      const relationDirection = event.target.data('relationDirection');

      if (nodeType === 'primary') {
        event.target.style('background-color', colors.primary);
      } else if (nodeType === 'scalar') {
        event.target.style('background-color', colors.scalar);
      } else if (relationDirection === 'incoming') {
        event.target.style('background-color', colors.incoming);
      } else if (relationDirection === 'bidirectional') {
        event.target.style('background-color', colors.bidirectional);
      } else {
        event.target.style('background-color', colors.outgoing);
      }
      document.body.style.cursor = 'default';
    });

    // Add click navigation
    cy.on('tap', 'node', (event) => {
      const nodeType = event.target.data('type');

      // Only navigate for primary and related types, not scalar fields
      if (nodeType === 'scalar') {
        return;
      }

      const nodeId = event.target.data('id');

      // Map type names to their actual page names
      const typeAliases: Record<string, string> = {
        'book_series': 'bookseries',
        'book_characters': 'characters',
        'book_mappings': 'books', // No separate page, go to books
        'book_statuses': 'books',
        'followed_users': 'users',
        'followed_lists': 'lists',
        'followed_prompts': 'prompts',
        'user_books': 'books',
        'list_books': 'lists',
        'prompt_answers': 'prompts',
        'reading_formats': 'readingformats',
        'reading_journals': 'readingjournals',
        'privacy_settings': 'users', // No separate page
        'collection_imports': 'books',
        'collection_import_results': 'books',
        'taggings': 'tags',
        'tag_categories': 'tags',
        'tag_counts': 'tags'
      };

      // Get the actual page name (use alias if exists, otherwise use the type name)
      const pageName = typeAliases[nodeId.toLowerCase()] || nodeId;

      // Navigate to the schema page (lowercase)
      window.location.href = `/api/graphql/schemas/${pageName.toLowerCase()}`;
    });

    // Cleanup
    return () => {
      // Destroy all tooltips
      tipsRef.current.forEach(tip => tip.destroy());
      tipsRef.current.clear();
      cy.destroy();
    };
  }, [typeName, layout, showScalarFields, showIncomingRels, relationshipFilter, isDarkMode]);

  // Search and highlight effect
  useEffect(() => {
    if (!cyRef.current) return;

    const cy = cyRef.current;

    if (searchQuery.trim() === '') {
      // Reset all nodes and edges to normal
      cy.nodes().removeClass('dimmed highlighted');
      cy.edges().removeClass('dimmed');
    } else {
      const query = searchQuery.toLowerCase();

      cy.nodes().forEach((node) => {
        const nodeId = node.data('id').toLowerCase();
        const nodeLabel = node.data('label')?.toLowerCase() || '';

        if (nodeId.includes(query) || nodeLabel.includes(query)) {
          node.removeClass('dimmed').addClass('highlighted');
        } else {
          node.removeClass('highlighted').addClass('dimmed');
        }
      });

      // Dim edges that don't connect to highlighted nodes
      cy.edges().forEach((edge) => {
        const sourceHighlighted = edge.source().hasClass('highlighted');
        const targetHighlighted = edge.target().hasClass('highlighted');

        if (sourceHighlighted && targetHighlighted) {
          edge.removeClass('dimmed');
        } else {
          edge.addClass('dimmed');
        }
      });
    }
  }, [searchQuery]);

  // Fullscreen handling
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      // Resize graph when entering/exiting fullscreen
      if (cyRef.current) {
        setTimeout(() => {
          cyRef.current?.resize();
          cyRef.current?.fit(undefined, 30);

          // Recreate all tooltips with new positioning
          setTimeout(() => {
            // @ts-ignore
            if (cyRef.current && cyRef.current.createTooltips) {
              // @ts-ignore
              cyRef.current.createTooltips();
            }
          }, 150);
        }, 100);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    if (!wrapperRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await wrapperRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error('Error toggling fullscreen:', err);
    }
  };

  return (
    <div ref={wrapperRef} className="w-full border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <div className="bg-gray-50 dark:bg-gray-800 p-2 sm:p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                Schema Relationships: {typeName}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 hidden sm:block">
                Click any node to navigate to its schema page
              </p>
            </div>
            <div className="flex gap-1 bg-white dark:bg-gray-900 rounded p-1 border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setLayout('concentric')}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  layout === 'concentric'
                    ? 'bg-indigo-500 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                title="Center Focus"
              >
                Center
              </button>
              <button
                onClick={() => setLayout('circle')}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  layout === 'circle'
                    ? 'bg-indigo-500 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                title="Circle Layout"
              >
                Circle
              </button>
              <button
                onClick={() => setLayout('grid')}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  layout === 'grid'
                    ? 'bg-indigo-500 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                title="Grid Layout"
              >
                Grid
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <span className="text-gray-600 dark:text-gray-400 font-medium">Filters:</span>
            <button
              onClick={() => setShowScalarFields(!showScalarFields)}
              className={`px-2 py-1 rounded transition-colors border ${
                showScalarFields
                  ? 'bg-gray-500 text-white border-gray-600'
                  : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              title="Toggle scalar fields (String, Int, etc.)"
            >
              {showScalarFields ? '✓ ' : ''}Fields
            </button>
            <button
              onClick={() => setShowIncomingRels(!showIncomingRels)}
              className={`px-2 py-1 rounded transition-colors border ${
                showIncomingRels
                  ? 'bg-emerald-500 text-white border-emerald-600'
                  : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              title="Toggle incoming relationships (from other types to this type)"
            >
              {showIncomingRels ? '✓ ' : ''}Incoming
            </button>
            <div className="flex gap-1 bg-white dark:bg-gray-900 rounded p-1 border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setRelationshipFilter('all')}
                className={`px-2 py-1 rounded transition-colors ${
                  relationshipFilter === 'all'
                    ? 'bg-indigo-500 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                title="Show all relationships"
              >
                All
              </button>
              <button
                onClick={() => setRelationshipFilter('object')}
                className={`px-2 py-1 rounded transition-colors ${
                  relationshipFilter === 'object'
                    ? 'bg-indigo-500 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                title="Show only single object relationships"
              >
                Single
              </button>
              <button
                onClick={() => setRelationshipFilter('array')}
                className={`px-2 py-1 rounded transition-colors ${
                  relationshipFilter === 'array'
                    ? 'bg-indigo-500 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                title="Show only array/list relationships"
              >
                Arrays
              </button>
            </div>
            <input
              type="text"
              placeholder="Search types..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-32"
            />
          </div>
        </div>
      </div>
      <div className="relative">
        <div
          ref={containerRef}
          className={`bg-white dark:bg-gray-900 w-full ${
            isFullscreen ? 'h-screen' : 'h-[400px] sm:h-[500px] lg:h-[600px]'
          }`}
        />
        <div className="absolute top-2 right-2 flex flex-col gap-1 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 p-1 shadow-lg">
          <button
            onClick={() => {
              if (cyRef.current) {
                cyRef.current.zoom(cyRef.current.zoom() * 1.2);
              }
            }}
            className="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
            title="Zoom in"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button
            onClick={() => {
              if (cyRef.current) {
                cyRef.current.zoom(cyRef.current.zoom() / 1.2);
              }
            }}
            className="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
            title="Zoom out"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <button
            onClick={() => {
              if (cyRef.current) {
                cyRef.current.fit(undefined, 30);
              }
            }}
            className="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
            title="Fit to view"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" strokeWidth={2} />
              <rect x="8" y="8" width="8" height="8" strokeWidth={2} />
            </svg>
          </button>
          <button
            onClick={() => {
              if (cyRef.current) {
                cyRef.current.center();
              }
            }}
            className="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
            title="Center view"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" strokeWidth={2} />
              <circle cx="12" cy="12" r="3" strokeWidth={2} />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v4m0 12v4M2 12h4m12 0h4" />
            </svg>
          </button>
          <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
          <button
            onClick={toggleFullscreen}
            className="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M15 9h4.5M15 9V4.5M15 9l5.25-5.25M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
              </svg>
            )}
          </button>
        </div>
      </div>
      <div className="bg-gray-50 dark:bg-gray-800 p-2 sm:p-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-3 sm:gap-4 text-xs text-gray-600 dark:text-gray-400">
            <span className="font-semibold text-gray-700 dark:text-gray-300 w-full sm:w-auto">Nodes:</span>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-emerald-500 border-2 border-emerald-600"></div>
              <span>Current Type</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-indigo-500 border-2 border-indigo-600"></div>
              <span>Outgoing Only</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-amber-500 border-2 border-amber-600"></div>
              <span>Incoming Only</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-purple-500 border-2 border-purple-600"></div>
              <span>Bidirectional</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-3 bg-gray-400 border-2 border-gray-500"></div>
              <span>Scalar Field</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 sm:gap-4 text-xs text-gray-600 dark:text-gray-400">
            <span className="font-semibold text-gray-700 dark:text-gray-300 w-full sm:w-auto">Edges:</span>
            <div className="flex items-center gap-1.5">
              <svg className="w-6 h-4" viewBox="0 0 24 16">
                <line x1="0" y1="8" x2="24" y2="8" stroke="#6366f1" strokeWidth="2" />
                <polygon points="24,8 18,5 18,11" fill="#6366f1" />
              </svg>
              <span>Outgoing</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="w-6 h-4" viewBox="0 0 24 16">
                <line x1="0" y1="8" x2="24" y2="8" stroke="#f59e0b" strokeWidth="2" />
                <polygon points="24,8 18,5 18,11" fill="#f59e0b" />
              </svg>
              <span>Incoming</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="w-6 h-4" viewBox="0 0 24 16">
                <line x1="0" y1="8" x2="24" y2="8" stroke="currentColor" strokeWidth="2" strokeDasharray="3,2" />
                <polygon points="24,8 18,5 18,11" fill="currentColor" />
              </svg>
              <span>Array/List</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
