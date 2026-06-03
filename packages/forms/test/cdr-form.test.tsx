import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { CdrForm } from "../src/cdr-form.js";
import { CdrField } from "../src/cdr-field.js";
import { CdrSubmitButton } from "../src/cdr-submit-button.js";

describe("<CdrForm>", () => {
  it("renders children inside a form with data-cdr-form attribute", () => {
    const { container } = render(
      <CdrForm onEncrypt={async () => 1}>
        <CdrField name="name" label="Name" />
        <CdrSubmitButton>Submit</CdrSubmitButton>
      </CdrForm>,
    );
    expect(container.querySelector("form[data-cdr-form]")).not.toBeNull();
    expect(screen.getByLabelText("Name")).toBeDefined();
  });

  it("posts every CdrField value to onEncrypt as a Record<string, FormDataEntryValue>", async () => {
    const onEncrypt = vi.fn(async () => 7);
    render(
      <CdrForm onEncrypt={onEncrypt}>
        <CdrField name="mood" label="Mood" />
        <CdrField name="note" label="Note" type="textarea" />
        <CdrSubmitButton>Submit</CdrSubmitButton>
      </CdrForm>,
    );

    fireEvent.change(screen.getByLabelText("Mood"), { target: { value: "8" } });
    fireEvent.change(screen.getByLabelText("Note"), { target: { value: "hello" } });
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));

    await waitFor(() => expect(onEncrypt).toHaveBeenCalledOnce());
    expect(onEncrypt).toHaveBeenCalledWith({ mood: "8", note: "hello" });
  });

  it("CdrSubmitButton renders Submitted ✓ after a successful submit", async () => {
    render(
      <CdrForm onEncrypt={async () => 11}>
        <CdrSubmitButton>Submit securely</CdrSubmitButton>
      </CdrForm>,
    );
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));
    await waitFor(() => expect(screen.getByText("Submitted ✓")).toBeDefined());
  });
});

describe("<CdrField>", () => {
  it("renders each type with the right input element", () => {
    const { rerender } = render(<CdrField name="x" label="X" type="text" />);
    expect(screen.getByLabelText("X").tagName).toBe("INPUT");

    rerender(<CdrField name="x" label="X" type="textarea" />);
    expect(screen.getByLabelText("X").tagName).toBe("TEXTAREA");

    rerender(
      <CdrField
        name="x"
        label="X"
        type="select"
        options={[{ value: "a", label: "A" }]}
      />,
    );
    expect(screen.getByLabelText("X").tagName).toBe("SELECT");
  });

  it("renders radio options when type=radio", () => {
    render(
      <CdrField
        name="size"
        type="radio"
        options={[
          { value: "s", label: "Small" },
          { value: "m", label: "Medium" },
        ]}
      />,
    );
    expect(screen.getByLabelText("Small")).toBeDefined();
    expect(screen.getByLabelText("Medium")).toBeDefined();
  });
});
