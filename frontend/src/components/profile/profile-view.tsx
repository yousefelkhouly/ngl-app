"use client";

import { LogOut } from "lucide-react";
import { IMAGE_ACCEPT, IMAGE_TYPES, MAX_COVER_IMAGES, MAX_UPLOAD_MB } from "@/lib/validation";
import { errorMessage } from "@/lib/api/client";
import { useLogout } from "@/hooks/use-session";
import { useProfile, useUploadCoverImages, useUploadProfilePicture } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/common/states";
import { AppPage } from "@/components/layout/app-page";
import { ProfileHeader, ProfileHeaderSkeleton } from "./profile-header";
import { UploadCard } from "./upload-card";
import { DocumentsCard } from "./documents-card";

export function ProfileView() {
  const profile = useProfile();
  const logout = useLogout();
  const uploadPicture = useUploadProfilePicture();
  const uploadCovers = useUploadCoverImages();

  return (
    <AppPage title="Profile">
      {profile.isPending ? (
        <ProfileHeaderSkeleton />
      ) : profile.isError ? (
        <ErrorState message={errorMessage(profile.error)} onRetry={() => profile.refetch()} />
      ) : (
        <ProfileHeader
          profile={profile.data}
          details={<p className="truncate font-mono text-sm font-bold text-ink-soft">{profile.data.email}</p>}
          actions={
            <Button variant="outline" size="sm" onClick={() => logout.mutate()} disabled={logout.isPending}>
              <LogOut aria-hidden="true" /> Sign out
            </Button>
          }
        />
      )}

      <UploadCard
        title="Profile picture"
        description={`Shown on your profile and to people you chat with. JPG or PNG, up to ${MAX_UPLOAD_MB} MB.`}
        upload={uploadPicture}
        allowedTypes={IMAGE_TYPES}
        accept={IMAGE_ACCEPT}
        previewImages
      />
      <UploadCard
        title="Cover images"
        description={`Shown across the top of your profile. Up to ${MAX_COVER_IMAGES} JPG or PNG images, ${MAX_UPLOAD_MB} MB each. New ones replace the old set.`}
        upload={uploadCovers}
        allowedTypes={IMAGE_TYPES}
        accept={IMAGE_ACCEPT}
        maxFiles={MAX_COVER_IMAGES}
        previewImages
      />
      {profile.data && <DocumentsCard documents={profile.data.documents ?? []} />}
    </AppPage>
  );
}
