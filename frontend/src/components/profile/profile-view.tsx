"use client";

import { LogOut } from "lucide-react";
import {
  DOCUMENT_ACCEPT,
  DOCUMENT_TYPES,
  IMAGE_ACCEPT,
  IMAGE_TYPES,
  MAX_COVER_IMAGES,
  MAX_UPLOAD_MB,
} from "@/lib/validation";
import { useCurrentUser, useLogout } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/common/avatar";
import { PaperNote } from "@/components/brand/paper-note";
import { AppPage } from "@/components/layout/app-page";
import { UploadCard } from "./upload-card";

export function ProfileView() {
  const me = useCurrentUser();
  const logout = useLogout();

  return (
    <AppPage title="Profile">
      <PaperNote className="flex flex-wrap items-center gap-5 p-5 sm:p-6">
        <Avatar id={me.id} name={me.name} size="lg" />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="truncate text-3xl font-extrabold tracking-tight">{me.name}</p>
          <p className="truncate font-mono text-sm font-bold text-ink-soft">{me.email}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => logout.mutate()} disabled={logout.isPending}>
          <LogOut aria-hidden="true" /> Sign out
        </Button>
      </PaperNote>

      <UploadCard
        kind="profilePicture"
        title="Profile picture"
        description={`Shown to people you chat with. JPG or PNG, up to ${MAX_UPLOAD_MB} MB.`}
        allowedTypes={IMAGE_TYPES}
        accept={IMAGE_ACCEPT}
        previewImages
      />
      <UploadCard
        kind="coverImages"
        title="Cover images"
        description={`Up to ${MAX_COVER_IMAGES} JPG or PNG images, ${MAX_UPLOAD_MB} MB each. New ones replace the old set.`}
        allowedTypes={IMAGE_TYPES}
        accept={IMAGE_ACCEPT}
        maxFiles={MAX_COVER_IMAGES}
        previewImages
      />
      <UploadCard
        kind="cv"
        title="CV"
        description={`PDF or Word (.docx), up to ${MAX_UPLOAD_MB} MB. Replaces your previous CV.`}
        allowedTypes={DOCUMENT_TYPES}
        accept={DOCUMENT_ACCEPT}
      />
    </AppPage>
  );
}
