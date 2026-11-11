"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteDocument,
  getProfile,
  getPublicProfile,
  uploadCoverImages,
  uploadDocuments,
  uploadProfilePicture,
} from "@/lib/api/users";
import { queryKeys } from "@/lib/query-keys";
import type { Profile } from "@/lib/api/types";

export function useProfile() {
  return useQuery({ queryKey: queryKeys.profile, queryFn: getProfile });
}

export function usePublicProfile(id: string) {
  return useQuery({ queryKey: queryKeys.publicProfile(id), queryFn: () => getPublicProfile(id) });
}

// every upload answers with what it saved, so the profile updates without asking again
function useProfileUpdate() {
  const queryClient = useQueryClient();
  return (change: Partial<Profile>) =>
    queryClient.setQueryData<Profile>(queryKeys.profile, (profile) => profile && { ...profile, ...change });
}

export function useUploadProfilePicture() {
  const update = useProfileUpdate();
  return (files: File[]) =>
    uploadProfilePicture(files[0]).then((profilePicturePath) => update({ profilePicturePath }));
}

export function useUploadCoverImages() {
  const update = useProfileUpdate();
  return (files: File[]) => uploadCoverImages(files).then((coverImagesPath) => update({ coverImagesPath }));
}

export function useUploadDocuments() {
  const update = useProfileUpdate();
  return (files: File[]) => uploadDocuments(files).then((documents) => update({ documents }));
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteDocument,
    onSuccess: (_, id) =>
      queryClient.setQueryData<Profile>(
        queryKeys.profile,
        (profile) => profile && { ...profile, documents: profile.documents.filter((doc) => doc._id !== id) },
      ),
  });
}
