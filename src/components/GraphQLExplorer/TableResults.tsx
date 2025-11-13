import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from "@/components/ui/table.tsx";
import {useTranslation} from "@/lib/utils.ts";
import React, {useEffect, useState} from "react";

export const TableResults = (props: {
    results: object,
    locale?: string,
}) => {
    const {results, locale = 'en'} = props;

    const [tableColumns, setTableColumns] = useState<string[]>(['']);
    const [tableRows, setTableRows] = useState<any[]>([]);

    const [hasResults, setHasResults] = useState(false);

    /**
     * Flatten nested objects into dot notation and handle arrays
     * @param obj - The object to flatten
     * @param prefix - The prefix for nested keys
     * @returns Flattened object
     */
    const flattenObject = (obj: any, prefix = ''): any => {
        const flattened: any = {};

        for (const key in obj) {
            if (!obj.hasOwnProperty(key)) continue;

            const value = obj[key];
            const newKey = prefix ? `${prefix}.${key}` : key;

            if (value === null || value === undefined) {
                flattened[newKey] = value;
            } else if (Array.isArray(value)) {
                // Handle arrays
                if (value.length === 0) {
                    flattened[newKey] = '';
                } else if (typeof value[0] === 'object') {
                    // Array of objects - show count and first item preview
                    flattened[newKey] = `[${value.length} items]`;
                } else {
                    // Array of primitives - show comma-separated
                    flattened[newKey] = value.join(', ');
                }
            } else if (typeof value === 'object') {
                // Check if it's a simple object (only primitive values)
                const isSimpleObject = Object.values(value).every(v =>
                    v === null || v === undefined || typeof v !== 'object'
                );

                if (isSimpleObject) {
                    // Flatten one level
                    Object.assign(flattened, flattenObject(value, newKey));
                } else {
                    // Complex nested object - show as JSON preview
                    flattened[newKey] = JSON.stringify(value);
                }
            } else {
                flattened[newKey] = value;
            }
        }

        return flattened;
    };

    /**
     * Format cell value for display
     */
    const formatCellValue = (value: any): string => {
        if (value === null) return 'null';
        if (value === undefined) return '';
        if (typeof value === 'boolean') return value.toString();
        if (typeof value === 'string' && value.startsWith('[') && value.endsWith(' items]')) {
            return value; // Already formatted array count
        }
        if (typeof value === 'string' && value.length > 100) {
            return value.substring(0, 100) + '...';
        }
        return String(value);
    };

    useEffect(() => {
        if (results) {
            Object.values(results).forEach(value => {
                if (!Array.isArray(value) || value.length === 0) return;

                // Flatten all rows
                const flattenedRows = value.map(row => flattenObject(row));
                setTableRows(flattenedRows);

                // Get all unique columns across all rows
                const allColumns = new Set<string>();
                flattenedRows.forEach(row => {
                    Object.keys(row).forEach(key => allColumns.add(key));
                });

                const columns = Array.from(allColumns);
                setTableColumns(columns);

                if (columns.length > 0) {
                    setHasResults(true);
                }
            });
        }
    }, [results]);

    return (
        <div className="rounded-lg bg-slate-50 border border-gray-300 text-gray-900 text-sm block w-full min-h-64 p-2.5
                                dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white overflow-x-auto">
            {hasResults && (
                <Table>
                    <TableHeader>
                        <TableRow>
                            {tableColumns.map((col, i) => <TableHead key={i}>{col}</TableHead>)}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tableRows.map((row, i) => (
                            <TableRow key={`row-${i}`} role="row">
                                {tableColumns.map((col, x) => (
                                    <TableCell key={`row-${i}-col-${x}`} role="cell">
                                        {formatCellValue(row[col])}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}

            {!hasResults && (
                <pre role="log">{useTranslation("ui.graphQLExplorer.statusMessages.noResults", locale)}</pre>
            )}
        </div>
    );
};