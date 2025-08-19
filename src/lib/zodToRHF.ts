// lib/zodToRHF.ts
import { ZodError } from "zod";
import { FieldValues, UseFormSetError } from "react-hook-form";

export function applyZodErrors<T extends FieldValues>(
  err: ZodError,
  setError: UseFormSetError<T>
) {
  err.issues.forEach((i) => {
    const name = (i.path.join(".") || "root") as any;
    setError(name, { type: "zod", message: i.message });
  });
}
