"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Download, FileSpreadsheet, FileText, Presentation, Trash2 } from "lucide-react";
import type { UserDocument } from "@/lib/api/types";
import { errorMessage } from "@/lib/api/client";
import { fileSize, timeAgo } from "@/lib/format";
import {
  DOCUMENT_ACCEPT,
  DOCUMENT_TYPES,
  DOCUMENTS_PER_UPLOAD,
  MAX_DOCUMENTS,
  MAX_UPLOAD_MB,
} from "@/lib/validation";
import { useDeleteDocument, useUploadDocuments } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import { UploadCard } from "./upload-card";

// personal information: a list of documents the user keeps, added to rather than replaced
export function DocumentsCard({ documents }: { documents: UserDocument[] }) {
  const upload = useUploadDocuments();
  const room = MAX_DOCUMENTS - documents.length;

  return (
    <UploadCard
      title="Personal information"
      description={`PDF, Word, Excel, PowerPoint or text files, up to ${MAX_UPLOAD_MB} MB each. Keep up to ${MAX_DOCUMENTS}; only you can see this list.`}
      upload={upload}
      allowedTypes={DOCUMENT_TYPES}
      accept={DOCUMENT_ACCEPT}
      maxFiles={Math.max(1, Math.min(DOCUMENTS_PER_UPLOAD, room))}
      disabled={room <= 0}
    >
      {documents.length === 0 ? (
        <p className="rounded-md border-2 border-dashed border-ink p-4 text-sm font-semibold text-ink-soft">
          No documents yet.
        </p>
      ) : (
        <ul className="flex flex-col divide-y-2 divide-rule rounded-md border-2 border-ink" aria-label="Your documents">
          {documents.map((document) => (
            <DocumentRow key={document._id} document={document} />
          ))}
        </ul>
      )}
      {room <= 0 && (
        <p className="text-sm font-bold">You have {MAX_DOCUMENTS} documents. Delete one to add another.</p>
      )}
    </UploadCard>
  );
}

function DocumentIcon({ mimetype }: { mimetype: string }) {
  const className = "size-6 shrink-0";
  if (mimetype.includes("spreadsheetml")) return <FileSpreadsheet aria-hidden="true" className={className} />;
  if (mimetype.includes("presentationml")) return <Presentation aria-hidden="true" className={className} />;
  return <FileText aria-hidden="true" className={className} />;
}

function DocumentRow({ document }: { document: UserDocument }) {
  const remove = useDeleteDocument();
  // deleting takes two clicks: the first only asks
  const [confirming, setConfirming] = useState(false);

  const onDelete = () => {
    if (!confirming) return setConfirming(true);
    remove.mutate(document._id, {
      onSuccess: () => toast.success(`${document.name} deleted.`),
      onError: (error) => {
        toast.error(errorMessage(error));
        setConfirming(false);
      },
    });
  };

  return (
    <li className="flex flex-wrap items-center gap-3 p-3">
      <DocumentIcon mimetype={document.mimetype} />
      <div className="flex min-w-0 flex-1 flex-col">
        {/* same origin through the /uploads proxy, so the browser keeps the original name */}
        <a
          href={document.path}
          download={document.name}
          className="truncate font-bold underline decoration-2 underline-offset-4 hover:decoration-pop"
        >
          {/* isolated, so a right-to-left name (Arabic, Hebrew) keeps its extension on the correct side */}
          <bdi>{document.name}</bdi>
        </a>
        <span className="font-mono text-xs font-bold text-ink-soft">
          {fileSize(document.size)} · {timeAgo(document.uploadedAt)}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon-sm">
          <a href={document.path} download={document.name} aria-label={`Download ${document.name}`}>
            <Download aria-hidden="true" />
          </a>
        </Button>
        <Button
          variant={confirming ? "destructive" : "ghost"}
          size={confirming ? "sm" : "icon-sm"}
          onClick={onDelete}
          onBlur={() => !remove.isPending && setConfirming(false)}
          disabled={remove.isPending}
          aria-label={confirming ? `Delete ${document.name}? Press again to confirm` : `Delete ${document.name}`}
        >
          <Trash2 aria-hidden="true" />
          {confirming && (remove.isPending ? "Deleting…" : "Delete?")}
        </Button>
      </div>
    </li>
  );
}
