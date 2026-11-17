"use client";

import { LogOut, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { UseMutationResult } from "@tanstack/react-query";
import { IMAGE_ACCEPT, IMAGE_TYPES, MAX_COVER_IMAGES, MAX_UPLOAD_MB } from "@/lib/validation";
import { errorMessage } from "@/lib/api/client";
import { useLogout } from "@/hooks/use-session";
import {
  useProfile,
  useRemoveCoverImages,
  useRemoveProfilePicture,
  useUploadCoverImages,
  useUploadProfilePicture,
} from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/common/states";
import { FormError } from "@/components/common/form-field";
import { AppPage } from "@/components/layout/app-page";
import { ProfileHeader, ProfileHeaderSkeleton } from "./profile-header";
import { UploadCard } from "./upload-card";
import { DocumentsCard } from "./documents-card";
import { SecurityCard } from "./security-card";
import { AccountCard } from "./account-card";

// takes off what's saved; shown only while there is something
function RemoveButton({
  label,
  done,
  remove,
}: {
  label: string;
  done: string;
  remove: UseMutationResult<unknown, Error, void>;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div>
        <Button
          variant="destructive"
          size="sm"
          disabled={remove.isPending}
          onClick={() => remove.mutate(undefined, { onSuccess: () => toast.success(done) })}
        >
          <Trash2 aria-hidden="true" /> {remove.isPending ? "Removing…" : label}
        </Button>
      </div>
      <FormError message={remove.error ? errorMessage(remove.error) : null} />
    </div>
  );
}

export function ProfileView() {
  const profile = useProfile();
  const logout = useLogout();
  const uploadPicture = useUploadProfilePicture();
  const uploadCovers = useUploadCoverImages();
  const removePicture = useRemoveProfilePicture();
  const removeCovers = useRemoveCoverImages();

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
      >
        {profile.data?.profilePicturePath && (
          <RemoveButton label="Remove picture" done="Picture removed." remove={removePicture} />
        )}
      </UploadCard>
      <UploadCard
        title="Cover images"
        description={`Shown across the top of your profile. Up to ${MAX_COVER_IMAGES} JPG or PNG images, ${MAX_UPLOAD_MB} MB each. New ones replace the old set.`}
        upload={uploadCovers}
        allowedTypes={IMAGE_TYPES}
        accept={IMAGE_ACCEPT}
        maxFiles={MAX_COVER_IMAGES}
        previewImages
      >
        {(profile.data?.coverImagesPath?.length ?? 0) > 0 && (
          <RemoveButton label="Remove cover images" done="Cover images removed." remove={removeCovers} />
        )}
      </UploadCard>
      {profile.data && <DocumentsCard documents={profile.data.documents ?? []} />}
      {profile.data && <SecurityCard profile={profile.data} />}
      {profile.data && <AccountCard profile={profile.data} />}
    </AppPage>
  );
}
