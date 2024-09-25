import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from "@/components/ui/table.tsx";
import React, {useEffect, useState} from "react";

export const TableResults = (props: {
    results: object
}) => {
    const {results} = props;

    const [tableColumns, setTableColumns] = useState(['']);
    const [tableRows, setTableRows] = useState([]);

    const [canRender, setCanRender] = useState(true);
    const [hasResults, setHasResults] = useState(false);

    useEffect(() => {
        if (results) {
            Object.values(results).forEach(value => {
                setTableRows(value);

                const firstRow = value[0];
                const keys = Object.keys(firstRow);
                setTableColumns(keys);

                if (keys.length > 0) {
                    setHasResults(true);
                }

                Object.values(firstRow).forEach(val => {
                    if (typeof val === 'object') {
                        setCanRender(false);
                    }
                });
            });
        }
    }, [results]);

    return (
        <div className="rounded-lg bg-slate-50 border border-gray-300 text-gray-900 text-sm block w-full min-h-64 p-2.5
                                dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white">
            {canRender && hasResults && (
                <Table>
                    <TableHeader>
                        <TableRow>
                            {tableColumns.map((col, i) => <TableHead key={i}>{col}</TableHead>)}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tableRows.map((row, i) => (
                            <TableRow role="row">
                                {tableColumns.map((col, x) => (
                                    <TableCell key={`row-${i}-col-${x}`} role="cell">{row[col]}</TableCell>))}
                            </TableRow>
                        ))}

                    </TableBody>
                </Table>)}

            {!hasResults && canRender && (
                <pre role="log">No results yet</pre>
            )}

            {!canRender && (
                <pre role="log">Tables are still a work in progress and can not currently render nested results.</pre>
            )}
        </div>

    );
};