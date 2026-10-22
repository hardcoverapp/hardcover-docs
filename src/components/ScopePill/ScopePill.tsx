import { useEffect, useId } from "react";
import { scopeInfo } from "@/data/scopes";
import { dismissTooltipsOnEscape } from "./dismiss";
import "./ScopePill.css";

/**
 * A scope, with what it allows in a tooltip (on hover or keyboard focus).
 * Rendered as static HTML on doc pages and inside the SDK explorer.
 */
export const ScopePill = ({ scope }: { scope: string }) => {
  const tipId = useId();
  const info = scopeInfo(scope);

  // In the SDK explorer (a React island); doc pages install it from ScopePill.astro.
  useEffect(dismissTooltipsOnEscape, []);

  return (
    <span className="scope-pill" data-kind={info.kind ?? undefined} tabIndex={0} aria-describedby={tipId}>
      <code className="scope-pill-name">{scope}</code>

      {/* Spans throughout: the tooltip sits inside inline text. */}
      <span role="tooltip" id={tipId} className="scope-pill-tip">
        <span className="scope-pill-tip-head">
          <code>{scope}</code>
          {info.kind && <span className="scope-pill-tip-kind">{info.kind === "read" ? "Read access" : "Write access"}</span>}
        </span>

        <span className="scope-pill-tip-body">{sentence(info.description || "A scope your token needs")}</span>

        {info.grantedBy.length > 0 && (
          <span className="scope-pill-tip-foot">
            Also granted by{" "}
            {info.grantedBy.map((other, i) => (
              <span key={other}>
                {i > 0 && (i === info.grantedBy.length - 1 ? " or " : ", ")}
                <code>{other}</code>
              </span>
            ))}
          </span>
        )}
      </span>
    </span>
  );
};

// Descriptions in capabilities.json have no closing period.
const sentence = (text: string) => (/[.!?]$/.test(text) ? text : `${text}.`);
