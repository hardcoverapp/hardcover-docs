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

    it("does not render nested objects", () => {
        const { getAllByRole, getByRole } = render(
            <TableResults
                results={{ rows: [{ cola: "test", colb: { nested: "object" } }] }}
            />
        );

        expect(getAllByRole("log")).toHaveLength(1);
        expect(getByRole("log")).toHaveTextContent("This view is not available for this query's results.");
    });
});
