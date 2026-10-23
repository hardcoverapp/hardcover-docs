// Escape hides an open scope tooltip without moving the pointer or focus
// (WCAG 1.4.13). Installed once per page, by the first pill.
let installed = false;

export function dismissTooltipsOnEscape(): void {
  if (installed || typeof document === "undefined") return;
  installed = true;

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;

    document.querySelectorAll(".scope-pill:hover, .scope-pill:focus-visible").forEach((pill) => {
      pill.classList.add("is-dismissed");

      const reset = () => pill.classList.remove("is-dismissed");
      pill.addEventListener("pointerleave", reset, { once: true });
      pill.addEventListener("blur", reset, { once: true });
    });
  });
}
