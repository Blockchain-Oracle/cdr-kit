"use client";
import { useId, type ReactNode } from "react";

/** Field type — drives which input is rendered. */
export type CdrFieldType = "text" | "textarea" | "email" | "number" | "select" | "radio" | "checkbox";

export interface CdrFieldOption {
  value: string;
  label: string;
}

export interface CdrFieldProps {
  /** Submitted as the FormData key — required for the value to round-trip into `onEncrypt`. */
  name: string;
  /** Visible label rendered above the input. */
  label?: ReactNode;
  /** Renders the matching primitive. Defaults to "text". */
  type?: CdrFieldType;
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
  /** Options for `type="select" | "radio"`. */
  options?: CdrFieldOption[];
  /** Visible help text below the input. */
  hint?: ReactNode;
  /** Pass to the underlying input (e.g. `min`, `step` for number, `rows` for textarea). */
  inputProps?: Record<string, unknown>;
  className?: string;
}

/**
 * Renders a labeled input bound to a FormData key. The `<CdrForm>` parent
 * harvests it via `Object.fromEntries(FormData)` on submit.
 * @param name FormData key — required.
 * @param type Input primitive: text | textarea | email | number | select | radio | checkbox.
 * @param options Required for `select` and `radio`.
 */
export function CdrField({
  name,
  label,
  type = "text",
  placeholder,
  required,
  defaultValue,
  options,
  hint,
  inputProps,
  className,
}: CdrFieldProps) {
  const id = useId();
  const rootClass = ["cdr-forms-field", className].filter(Boolean).join(" ");
  const common = {
    id,
    name,
    required,
    placeholder,
    defaultValue,
    className: "cdr-forms-input",
    ...(inputProps as Record<string, unknown>),
  };

  return (
    <div className={rootClass} data-cdr-field data-type={type}>
      {label !== undefined && (
        <label htmlFor={type === "checkbox" || type === "radio" ? undefined : id} className="cdr-forms-label">
          {label}
          {required && (
            <span aria-hidden="true" className="cdr-forms-required">
              *
            </span>
          )}
        </label>
      )}
      {renderInput(type, name, common, options)}
      {hint !== undefined && <p className="cdr-forms-hint">{hint}</p>}
    </div>
  );
}

function renderInput(
  type: CdrFieldType,
  name: string,
  common: Record<string, unknown>,
  options: CdrFieldOption[] | undefined,
) {
  if (type === "textarea") {
    return <textarea {...common} className="cdr-forms-input cdr-forms-input--textarea" />;
  }
  if (type === "select") {
    return (
      <select {...common} className="cdr-forms-input cdr-forms-input--select">
        {(options ?? []).map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }
  if (type === "radio") {
    const { defaultValue: dv } = common as { defaultValue?: string };
    return (
      <div className="cdr-forms-radiogroup" role="radiogroup">
        {(options ?? []).map((o) => (
          <label key={o.value} className="cdr-forms-radio">
            <input
              type="radio"
              name={name}
              value={o.value}
              defaultChecked={dv === o.value}
              required={common.required as boolean | undefined}
            />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
    );
  }
  if (type === "checkbox") {
    return (
      <label className="cdr-forms-checkbox">
        <input
          type="checkbox"
          name={name}
          required={common.required as boolean | undefined}
          defaultChecked={Boolean(common.defaultValue)}
        />
      </label>
    );
  }
  // text | email | number
  return <input {...common} type={type} />;
}
