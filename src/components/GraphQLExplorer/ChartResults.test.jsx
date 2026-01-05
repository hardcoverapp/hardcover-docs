import React from "react";
import { expect, it, describe } from "vitest";
import { render } from "@testing-library/react";
import { ChartResults } from "./ChartResults";

describe("ChartResults", () => {
    it("renders chart with flat numeric data", () => {
        const { getByText } = render(
            <ChartResults
                results={{
                    books: [
                        { title: "Book 1", pages: 300, rating: 4.5 },
                        { title: "Book 2", pages: 250, rating: 4.0 },
                        { title: "Book 3", pages: 400, rating: 4.8 }
                    ]
                }}
            />
        );

        expect(getByText("Chart Results")).toBeInTheDocument();
        expect(getByText(/Showing.*pages.*rating/i)).toBeInTheDocument();
    });

    it("renders chart with nested data structure", () => {
        const { getByText } = render(
            <ChartResults
                results={{
                    user_books: [
                        {
                            book: {
                                title: "Jurassic Park",
                                pages: 805,
                                release_date: "1990-01-01"
                            }
                        },
                        {
                            book: {
                                title: "Xenocide",
                                pages: 416,
                                release_date: "1991-01-01"
                            }
                        },
                        {
                            book: {
                                title: "Fang",
                                pages: 336,
                                release_date: "2010-01-01"
                            }
                        }
                    ]
                }}
            />
        );

        expect(getByText("Chart Results")).toBeInTheDocument();
        // Should flatten nested structure and detect book.pages
        expect(getByText(/book\.pages/i)).toBeInTheDocument();
    });

    it("detects timeseries data and shows appropriate label", () => {
        const { getByText } = render(
            <ChartResults
                results={{
                    stats: [
                        { date: "2024-01-01", count: 10 },
                        { date: "2024-01-02", count: 15 }
                    ]
                }}
            />
        );

        expect(getByText(/timeseries/i)).toBeInTheDocument();
    });

    it("shows error message when data has no numeric fields", () => {
        const { getByRole } = render(
            <ChartResults
                results={{
                    books: [
                        { title: "Book 1", author: "Author 1" },
                        { title: "Book 2", author: "Author 2" }
                    ]
                }}
            />
        );

        expect(getByRole("log")).toBeInTheDocument();
        expect(getByRole("log")).toHaveTextContent("No numeric fields found for charting");
    });

    it("shows error message when insufficient data points", () => {
        const { getByRole } = render(
            <ChartResults
                results={{
                    books: [
                        { title: "Book 1", pages: 300 }
                    ]
                }}
            />
        );

        expect(getByRole("log")).toBeInTheDocument();
        expect(getByRole("log")).toHaveTextContent("Insufficient data points");
    });

    it("shows error message when no results provided", () => {
        const { getByRole } = render(
            <ChartResults results={undefined} />
        );

        expect(getByRole("log")).toBeInTheDocument();
        expect(getByRole("log")).toHaveTextContent("No results to chart");
    });

    it("handles empty arrays", () => {
        const { getByRole } = render(
            <ChartResults
                results={{ books: [] }}
            />
        );

        expect(getByRole("log")).toBeInTheDocument();
        expect(getByRole("log")).toHaveTextContent("Insufficient data points");
    });

    it("detects categorical data type for non-date strings", () => {
        const { getByText } = render(
            <ChartResults
                results={{
                    stats: [
                        { genre: "Fiction", count: 150 },
                        { genre: "Mystery", count: 80 },
                        { genre: "SciFi", count: 120 }
                    ]
                }}
            />
        );

        expect(getByText("Chart Results")).toBeInTheDocument();
        expect(getByText(/categorical/i)).toBeInTheDocument();
    });

    it("formats nested field labels correctly", () => {
        const { getByText } = render(
            <ChartResults
                results={{
                    items: [
                        {
                            book: {
                                stats: {
                                    pages: 300
                                }
                            }
                        },
                        {
                            book: {
                                stats: {
                                    pages: 400
                                }
                            }
                        }
                    ]
                }}
            />
        );

        // Should format "book.stats.pages" as readable label
        expect(getByText(/Book Stats Pages/i)).toBeInTheDocument();
    });
});
