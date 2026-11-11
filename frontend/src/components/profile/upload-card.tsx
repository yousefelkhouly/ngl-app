"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Upload } from "lucide-react";
import { errorMessage } from "@/lib/api/client";
import { fileProblem } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/common/form-field";
import { PaperNote } from "@/components/brand/paper-note";

// pick → check → upload one kind of file. the backend checks the real type again from the bytes
export function UploadCard({
  title,
  description,
  upload,
  allowedTypes,
  accept,
  maxFiles = 1,
  previewImages = false,
  disabled = false,
  children,
}: {
  title: string;
  description: string;
  upload: (files: File[]) => Promise<unknown>;
  allowedTypes: string[];
  accept: string;
  maxFiles?: number;
  previewImages?: boolean;
  // e.g. no room for more files; the reason goes in the description or children
  disabled?: boolean;
  // shown between the description and the picker, e.g. what's saved already
  children?: React.ReactNode;
}) {
  const inputId = useId();
  const input = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [problem, setProblem] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => upload(files),
    onSuccess: () => {
      toast.success(`${title} saved.`);
      setFiles([]);
      if (input.current) input.current.value = "";
    },
  });

  // local previews of the picked images, released when they're replaced
  const previews = useMemo(
    () => (previewImages ? files.map((file) => URL.createObjectURL(file)) : []),
    [files, previewImages],
  );
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  const pick = (list: FileList | null) => {
    mutation.reset();
    const picked = Array.from(list ?? []);
    if (picked.length > maxFiles) {
      setProblem(`Pick up to ${maxFiles} files.`);
      setFiles([]);
      return;
    }
    const firstProblem = picked.map((file) => fileProblem(file, allowedTypes)).find(Boolean) ?? null;
    setProblem(firstProblem);
    setFiles(firstProblem ? [] : picked);
  };

  return (
    <PaperNote as="section" aria-labelledby={`${inputId}-title`} className="flex flex-col gap-4 p-5 sm:p-6">
      <div className="flex flex-col gap-1">
        <h2 id={`${inputId}-title`} className="text-2xl font-extrabold tracking-tight">
          {title}
        </h2>
        <p className="text-base text-ink-soft">{description}</p>
      </div>

      {children}

      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={input}
          id={inputId}
          type="file"
          accept={accept}
          multiple={maxFiles > 1}
          disabled={disabled}
          onChange={(event) => pick(event.target.files)}
          className="peer sr-only"
        />
        {/* the label is the visible control, the real input stays keyboard-focusable */}
        <label
          htmlFor={inputId}
          className="inline-flex h-11 cursor-pointer items-center peer-disabled:cursor-not-allowed peer-disabled:opacity-50 rounded-full border-2 border-ink bg-paper px-4 text-sm font-bold text-ink shadow-hard-sm peer-focus-visible:outline-3 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-ink"
        >
          {maxFiles > 1 ? "Choose files" : "Choose a file"}
        </label>
        <span className="min-w-0 truncate text-sm font-semibold text-ink-soft" aria-live="polite">
          {files.length === 0 ? "Nothing chosen" : files.map((file) => file.name).join(", ")}
        </span>
      </div>

      {previews.length > 0 && (
        <ul className="flex flex-wrap gap-3" aria-label="Preview">
          {previews.map((url, index) => (
            <li key={url} className="overflow-hidden rounded-md border-2 border-ink">
              <Image src={url} alt={files[index]?.name ?? ""} width={96} height={96} unoptimized className="size-24 object-cover" />
            </li>
          ))}
        </ul>
      )}

      <FormError message={problem ?? (mutation.error ? errorMessage(mutation.error) : null)} />

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="default" size="sm" onClick={() => mutation.mutate()} disabled={disabled || files.length === 0 || mutation.isPending}>
          <Upload aria-hidden="true" /> {mutation.isPending ? "Uploading…" : "Upload"}
        </Button>
        {mutation.isSuccess && (
          <span role="status" className="inline-flex items-center gap-1.5 text-sm font-bold">
            <Check aria-hidden="true" className="size-4" /> Saved
          </span>
        )}
      </div>
    </PaperNote>
  );
}
