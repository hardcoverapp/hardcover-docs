import React from "react";
import { expect, it, describe } from "vitest";
import { render } from "@testing-library/react";
import { JSONResults } from "./JSONResults";

describe("JSONResults", () => {
    it("renders JSON results", () => {
        const { getByRole } = render(
            <JSONResults
                results={{ data: { test: "test" } }}
            />
        );

        expect(getByRole("log")).toBeInTheDocument();
        expect(getByRole("log")).toHaveTextContent('{ "data": { "test": "test" } }');
    });

    it("renders no results", () => {
        const { getByRole } = render(
            <JSONResults results={undefined} />
        );

        expect(getByRole("log")).toBeInTheDocument();
        expect(getByRole("log")).toHaveTextContent("No results found");
    });
});
