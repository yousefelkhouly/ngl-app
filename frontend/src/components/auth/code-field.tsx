"use client";

import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";
import { FormField } from "@/components/common/form-field";
import { CodeInput } from "./code-input";

// the "Code" field of every step that takes an emailed code
export function CodeField<T extends FieldValues>({
  id,
  control,
  name,
  error,
  disabled,
  onComplete,
}: {
  id: string;
  control: Control<T>;
  name: Path<T>;
  error?: string;
  disabled?: boolean;
  onComplete?: () => void;
}) {
  return (
    <FormField id={id} label="Code" error={error}>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <CodeInput
            id={id}
            value={field.value as string}
            onChange={field.onChange}
            onComplete={onComplete}
            invalid={Boolean(error)}
            disabled={disabled}
          />
        )}
      />
    </FormField>
  );
}
