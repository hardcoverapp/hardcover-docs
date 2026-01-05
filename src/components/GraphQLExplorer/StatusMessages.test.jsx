import React from "react";
import { render } from "@testing-library/react";
import { StatusMessages } from "./StatusMessages";
import { expect, it, describe } from "vitest";

describe("StatusMessages", () => {
    it("renders idle message", () => {
        const {getByText} = render(<StatusMessages queryStatus="idle" />);
        expect(getByText("This will run against your account. You are responsible for the content of any queries ran on your account.", {exact: false})).toBeInTheDocument();
    });

    it("renders error message", () => {
        const { getByText } = render(
        <StatusMessages queryStatus="error" queryError="Testing Error" />
        );

        expect(getByText("Error", {exact: true})).toBeInTheDocument();
        expect(getByText("Testing Error")).toBeInTheDocument();
    });

    it("renders success message", () => {
        const {getByText} = render(<StatusMessages queryStatus="success" />);
        expect(getByText("Success!", {exact: false})).toBeInTheDocument();
    });
});

