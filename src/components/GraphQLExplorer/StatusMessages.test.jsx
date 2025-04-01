import React from "react";
import { render } from "@testing-library/react";
import {StatusMessages} from "./StatusMessages";
import {expect, it, describe} from "vitest";
import {useTranslation} from "../../lib/utils.js";

describe("StatusMessages", () => {
    it("renders idle message", () => {
        const {getByText} = render(<StatusMessages queryStatus="idle" />);
        expect(getByText(useTranslation("ui.graphQLExplorer.statusMessages.disclaimer", 'en'), {exact: false})).toBeInTheDocument();
    });

    it("renders error message", () => {
        const { getByText } = render(
        <StatusMessages queryStatus="error" queryError="Testing Error" />
        );

        expect(getByText(`useTranslation("ui.graphQLExplorer.statusMessages.error", 'en'):`, {exact: false})).toBeInTheDocument();
        expect(getByText("Testing Error", {exact: false})).toBeInTheDocument();
    });

    it("renders success message", () => {
        const {getByText} = render(<StatusMessages queryStatus="success" />);
        expect(getByText(useTranslation("ui.graphQLExplorer.statusMessages.success", 'en'), {exact: false})).toBeInTheDocument();
    });
});
