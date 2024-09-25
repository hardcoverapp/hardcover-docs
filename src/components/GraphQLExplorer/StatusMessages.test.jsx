import React from "react";
import { render } from "@testing-library/react";
import {StatusMessages} from "./StatusMessages";
import {expect, it, describe} from "vitest";

describe("StatusMessages", () => {
    it("renders idle message", () => {
        const {getByText} = render(<StatusMessages queryStatus="idle" />);
        expect(getByText("This will run against your account.", {exact: false})).toBeInTheDocument();
    });

    it("renders error message", () => {
        const { getByText } = render(
        <StatusMessages queryStatus="error" queryError="Testing Error" />
        );

        expect(getByText("Error:", {exact: false})).toBeInTheDocument();
        expect(getByText("Testing Error", {exact: false})).toBeInTheDocument();
    });

    it("renders success message", () => {
        const {getByText} = render(<StatusMessages queryStatus="success" />);
        expect(getByText("Success!", {exact: false})).toBeInTheDocument();
    });
});
