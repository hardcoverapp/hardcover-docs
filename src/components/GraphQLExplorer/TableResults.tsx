import React, {useEffect, useState} from "react";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from "@/components/ui/table.tsx";

export const TableResults = (props: {
    results: object
}) => {
    const {results} = props;

    const [tableColumns, setTableColumns] = useState(['']);
    const [tableRows, setTableRows] = useState([]);

    useEffect(() => {
        if (results) {
            Object.values(results).forEach(value => {
                setTableRows(value);

                const firstRow = value[0];
                const keys = Object.keys(firstRow);
                setTableColumns(keys);
            })
        }
    }, [results]);

    return (
        <div className="rounded-lg bg-slate-50 border border-gray-300 text-gray-900 text-sm block w-full p-2.5
                                dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white">
            <Table>
                <TableHeader>
                    <TableRow>
                        {tableColumns.map((col, i) => <TableHead key={i}>{col}</TableHead>)}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {tableRows.map((row, i) => (
                    <TableRow>
                        { tableColumns.map(col => (<TableCell key={`row-${i}`}>{row[col]}</TableCell>)) }
                    </TableRow>
                    ))}

                </TableBody>
            </Table>
        </div>

    );
};