import schemaFieldsData from '../../schema-fields.json';

export interface GraphNode {
  id: string;
  label: string;
  type: 'primary' | 'related' | 'scalar';
  fieldType?: string; // For scalar fields, the actual type (String, Int, etc.)
  relationDirection?: 'incoming' | 'outgoing' | 'bidirectional'; // For related nodes
}

export interface GraphEdge {
  source: string;
  target: string;
  label: string;
  relationshipType: 'object' | 'array';
  direction?: 'outgoing' | 'incoming'; // Direction relative to the primary type
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/**
 * Extracts relationship fields from a type's fields
 */
function extractRelationships(typeName: string, fields: any[]): GraphEdge[] {
  const edges: GraphEdge[] = [];

  for (const field of fields) {
    // Check if this field is a relationship (points to another type)
    // Object relationships: type is another schema type (not a scalar)
    if (field.description?.includes('object relationship')) {
      const targetType = field.type.replace(/[!\[\]]/g, ''); // Remove !, [, ]
      edges.push({
        source: typeName,
        target: targetType,
        label: field.name,
        relationshipType: 'object'
      });
    }
    // Array relationships: type is an array of another type
    else if (field.description?.includes('array relationship')) {
      const targetType = field.type.replace(/[!\[\]]/g, '');
      edges.push({
        source: typeName,
        target: targetType,
        label: field.name,
        relationshipType: 'array'
      });
    }
    // Also check type pattern for relationships (e.g., "users!", "books", "[editions]")
    else if (field.type && !isScalarType(field.type)) {
      const targetType = field.type.replace(/[!\[\]]/g, '');
      // Only add if target exists in our schema
      if (schemaFieldsData[targetType as keyof typeof schemaFieldsData]) {
        const relationshipType = field.type.includes('[') ? 'array' : 'object';
        edges.push({
          source: typeName,
          target: targetType,
          label: field.name,
          relationshipType
        });
      }
    }
  }

  return edges;
}

/**
 * Check if a type is a scalar (primitive) type
 */
function isScalarType(type: string): boolean {
  const cleanType = type.replace(/[!\[\]]/g, '');
  const scalarTypes = ['String', 'Int', 'Float', 'Boolean', 'ID', 'Date', 'DateTime',
                       'timestamp', 'timestamptz', 'date', 'json', 'jsonb', 'smallint', 'citext', 'numeric',
                       'bigint', 'float8'];
  return scalarTypes.includes(cleanType);
}

/**
 * Finds all incoming relationships to the specified type
 * (relationships from other types that point TO this type)
 */
function findIncomingRelationships(targetTypeName: string): GraphEdge[] {
  const incomingEdges: GraphEdge[] = [];

  // Iterate through all types in the schema
  for (const [typeName, fields] of Object.entries(schemaFieldsData)) {
    if (typeName === targetTypeName) continue; // Skip the target type itself

    // Check each field in this type
    for (const field of fields as any[]) {
      const fieldType = field.type?.replace(/[!\[\]]/g, '');

      // Check if this field points to our target type
      if (fieldType === targetTypeName) {
        const relationshipType = field.type.includes('[') ? 'array' : 'object';
        incomingEdges.push({
          source: typeName,
          target: targetTypeName,
          label: field.name,
          relationshipType,
          direction: 'incoming'
        });
      }
    }
  }

  return incomingEdges;
}

/**
 * Generates graph data for a specific type showing its immediate relationships
 */
export function generateGraphDataForType(typeName: string, includeScalarFields: boolean = false, includeIncomingRels: boolean = true): GraphData {
  const schemaFields = schemaFieldsData[typeName as keyof typeof schemaFieldsData];

  if (!schemaFields) {
    return { nodes: [], edges: [] };
  }

  // Create the primary node
  const nodes: GraphNode[] = [
    {
      id: typeName,
      label: typeName,
      type: 'primary'
    }
  ];

  // Extract outgoing relationships (from this type to others)
  const edges = extractRelationships(typeName, schemaFields);
  // Mark these as outgoing
  edges.forEach(edge => edge.direction = 'outgoing');

  // Find incoming relationships (from other types to this type)
  if (includeIncomingRels) {
    const incomingEdges = findIncomingRelationships(typeName);
    edges.push(...incomingEdges);
  }

  // Create nodes for related types and categorize by relationship direction
  const relatedTypes = new Set<string>();
  const nodeDirections = new Map<string, Set<'incoming' | 'outgoing'>>();

  edges.forEach(edge => {
    if (edge.target !== typeName) {
      relatedTypes.add(edge.target);
      if (!nodeDirections.has(edge.target)) {
        nodeDirections.set(edge.target, new Set());
      }
      nodeDirections.get(edge.target)!.add('outgoing');
    }
    if (edge.source !== typeName && edge.direction === 'incoming') {
      relatedTypes.add(edge.source);
      if (!nodeDirections.has(edge.source)) {
        nodeDirections.set(edge.source, new Set());
      }
      nodeDirections.get(edge.source)!.add('incoming');
    }
  });

  relatedTypes.forEach(relatedType => {
    const directions = nodeDirections.get(relatedType);
    let relationDirection: 'incoming' | 'outgoing' | 'bidirectional' = 'outgoing';

    if (directions) {
      if (directions.has('incoming') && directions.has('outgoing')) {
        relationDirection = 'bidirectional';
      } else if (directions.has('incoming')) {
        relationDirection = 'incoming';
      } else {
        relationDirection = 'outgoing';
      }
    }

    nodes.push({
      id: relatedType,
      label: relatedType,
      type: 'related',
      relationDirection
    });
  });

  // Add scalar fields if requested
  if (includeScalarFields) {
    schemaFields.forEach(field => {
      // Only add if it's a scalar field (not a relationship)
      if (field.type && isScalarType(field.type) && !field.hasArgs) {
        const scalarNodeId = `${typeName}_${field.name}`;
        nodes.push({
          id: scalarNodeId,
          label: field.name,
          type: 'scalar',
          fieldType: field.type.replace(/[!\[\]]/g, '')
        });

        // Add edge from primary to scalar field
        edges.push({
          source: typeName,
          target: scalarNodeId,
          label: field.type,
          relationshipType: 'object',
          direction: 'outgoing'
        });
      }
    });
  }

  return { nodes, edges };
}

/**
 * Converts graph data to Cytoscape.js format
 */
export function toCytoscapeElements(graphData: GraphData) {
  const elements = [];

  // Add nodes
  for (const node of graphData.nodes) {
    elements.push({
      data: {
        id: node.id,
        label: node.label,
        type: node.type,
        fieldType: node.fieldType,
        relationDirection: node.relationDirection
      }
    });
  }

  // Add edges
  for (const edge of graphData.edges) {
    elements.push({
      data: {
        id: `${edge.source}-${edge.target}-${edge.label}`,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        relationshipType: edge.relationshipType,
        direction: edge.direction
      }
    });
  }

  return elements;
}
