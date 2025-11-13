import React from "react";
import { render } from "@testing-library/react";
import { TableResults } from "./TableResults";
import {expect, it, describe} from "vitest";

describe("TableResults", () => {
    it("renders table results", () => {
        const { getAllByRole } = render(
            <TableResults
                results={{ rows: [{ cola: "test", colb: "another cell" }, {cola: "second", colb: "fourth cell"}] }}
            />
        );

        expect(getAllByRole("cell")).toHaveLength(4);
        expect(getAllByRole("cell")[0]).toHaveTextContent("test");
        expect(getAllByRole("cell")[1]).toHaveTextContent("another cell");
        expect(getAllByRole("cell")[2]).toHaveTextContent("second");
        expect(getAllByRole("cell")[3]).toHaveTextContent("fourth cell");
    });

    it("renders no results", () => {
        const { getAllByRole, getByRole } = render(
            <TableResults results={undefined} />
        );

        expect(getAllByRole("log")).toHaveLength(1);
        expect(getByRole("log")).toHaveTextContent("No results found");
    });

    it("renders nested objects with flattening", () => {
        const { getAllByRole } = render(
            <TableResults
                results={{ rows: [{ cola: "test", colb: { nested: "object" } }] }}
            />
        );

        // Should render cells with flattened column names (cola and colb.nested)
        expect(getAllByRole("cell")).toHaveLength(2);
        expect(getAllByRole("cell")[0]).toHaveTextContent("test");
        expect(getAllByRole("cell")[1]).toHaveTextContent("object");
    });

    it("renders arrays as comma-separated values", () => {
        const { getAllByRole } = render(
            <TableResults
                results={{ rows: [{ id: "1", tags: ["fiction", "mystery"] }] }}
            />
        );

        expect(getAllByRole("cell")).toHaveLength(2);
        expect(getAllByRole("cell")[0]).toHaveTextContent("1");
        expect(getAllByRole("cell")[1]).toHaveTextContent("fiction, mystery");
    });

    it("renders arrays of objects as item count", () => {
        const { getAllByRole } = render(
            <TableResults
                results={{ rows: [{ id: "1", authors: [{name: "Author 1"}, {name: "Author 2"}] }] }}
            />
        );

        expect(getAllByRole("cell")).toHaveLength(2);
        expect(getAllByRole("cell")[0]).toHaveTextContent("1");
        expect(getAllByRole("cell")[1]).toHaveTextContent("[2 items]");
    });
});
