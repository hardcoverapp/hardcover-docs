import { useMemo } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table.tsx";
import { useTranslation } from "@/lib/utils.ts";
import { flattenForDisplay, formatCellValue, formatFieldLabel } from "../../lib/shape";

interface TableShape {
    columns: string[];
    rows: Record<string, any>[];
}

const EMPTY: TableShape = { columns: [], rows: [] };

/**
 * Derive the table from the results.
 *
 * This is a `useMemo` rather than `useEffect` + `useState` on purpose. The
 * previous version only assigned state when it found a non-empty array and
 * never cleared it, so running a query that returned rows and then one that
 * returned none left the first query's table on screen.
 */
const toTable = (results: object | null | undefined): TableShape => {
    if (!results) return EMPTY;

    let shape = EMPTY;

    for (const value of Object.values(results)) {
        if (!Array.isArray(value) || value.length === 0) continue;

        const rows = value.map((row) => flattenForDisplay(row));
        const columns = new Set<string>();
        rows.forEach((row) => Object.keys(row).forEach((key) => columns.add(key)));

        shape = { columns: Array.from(columns), rows };
    }

    return shape;
};

export const TableResults = (props: { results: object; locale?: string }) => {
    const { results, locale = "en" } = props;

    const { columns, rows } = useMemo(() => toTable(results), [results]);
    const hasResults = columns.length > 0;

    // Capped with an inner scroll: a 100-row result otherwise runs past
    // everything else on the page and stops being readable.
    return (
        <div className="rounded-lg bg-card border border-border text-foreground text-sm block w-full min-h-64 max-h-[28rem] p-2.5 overflow-auto">
            {hasResults && (
                <Table>
                    <TableHeader>
                        <TableRow>
                            {/* Headers use the same labels as the chart legend so
                                the two views name a field identically. The exact
                                path stays reachable on hover, since which field
                                a column came from is the thing an API reader is
                                usually checking. */}
                            {columns.map((col, i) => (
                                <TableHead
                                    key={i}
                                    title={col}
                                    className="normal-case tracking-normal sticky top-0 z-10"
                                >
                                    {formatFieldLabel(col)}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map((row, i) => (
                            <TableRow key={`row-${i}`} role="row">
                                {columns.map((col, x) => (
                                    <TableCell key={`row-${i}-col-${x}`} role="cell">
                                        {/* Nulls stay literal — "returned null" and
                                            "returned an empty string" are different
                                            answers from an API — but recede so real
                                            values carry the eye.

                                            Italic does the receding, not low
                                            contrast: `muted-foreground` measures
                                            3.8:1 against the card in both themes,
                                            under the 4.5:1 floor for body text.
                                            ink-2 reads as secondary at 9.2:1 light
                                            and 7.6:1 dark. */}
                                        {row[col] === null ? (
                                            <span className="italic text-[var(--hc-ink-2)]">null</span>
                                        ) : (
                                            formatCellValue(row[col])
                                        )}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}

            {!hasResults && (
                <pre role="log">
                    {useTranslation("ui.graphQLExplorer.statusMessages.noResults", locale)}
                </pre>
            )}
        </div>
    );
};
