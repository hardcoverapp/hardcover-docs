// cheaty way to have bindable component

import {
  createComponent,
  render,
  renderComponent,
} from "astro/runtime/server/index.js";
import CodeExampleGroup from "@/components/CodeExampleGroup.astro";

export function bindExamples(dir: string) {
  return createComponent(
    (result, props, slots) =>
      render`${renderComponent(result, "CodeExampleGroup", CodeExampleGroup, { dir, ...props }, slots)}`,
  );
}
