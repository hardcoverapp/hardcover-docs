import { useContext } from "react";
import { ExplorerContext, type ExplorerContextValue } from "./ExplorerProvider";

/**
 * Access the surrounding explorer.
 *
 * Every part of the explorer reads what it needs from here, which is what
 * removed the four-level `locale` prop drill (Astro -> Runner -> QueryBuilder ->
 * FieldTree) the previous structure required.
 */
export const useExplorer = (): ExplorerContextValue => {
  const value = useContext(ExplorerContext);

  if (!value) {
    throw new Error("useExplorer must be used inside an ExplorerProvider");
  }

  return value;
};

/** Convenience for the many components that only need the active locale. */
export const useExplorerLocale = (): string => useExplorer().config.locale;
