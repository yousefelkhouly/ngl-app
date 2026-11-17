"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  deleteDocument,
  getProfile,
  getPublicProfile,
  removeCoverImages,
  removeProfilePicture,
  unblockEveryone,
  updateProfile,
  uploadCoverImages,
  uploadDocuments,
  uploadProfilePicture,
} from "@/lib/api/users";
import { queryKeys } from "@/lib/query-keys";
import {
  changePassword,
  confirmEmailChange,
  deleteAccount,
  requestEmailChange,
  setTwoStepVerification,
} from "@/lib/api/auth";
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

export function useSetTwoStep() {
  const update = useProfileUpdate();
  return useMutation({
    mutationFn: ({ enabled, code }: { enabled: boolean; code: string }) => setTwoStepVerification(enabled, code),
    onSuccess: (_result, { enabled }) => update({ twoStepVerification: enabled }),
  });
}

export function useUnblockEveryone() {
  const queryClient = useQueryClient();
  const update = useProfileUpdate();
  return useMutation({
    mutationFn: unblockEveryone,
    onSuccess: async () => {
      update({ blockedCount: 0 });
      // chats with them come back
      await queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
    },
  });
}

// the session (read from the access token) carries the name and email: after a change
// the backend set new cookies, so it's read again
function useRefreshSession() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.session });
}

export function useUpdateProfile() {
  const update = useProfileUpdate();
  const refreshSession = useRefreshSession();
  return useMutation({
    mutationFn: updateProfile,
    onSuccess: async (saved) => {
      update(saved);
      await refreshSession();
    },
  });
}

export function useRemoveProfilePicture() {
  const update = useProfileUpdate();
  return useMutation({
    mutationFn: removeProfilePicture,
    onSuccess: () => update({ profilePicturePath: undefined }),
  });
}

export function useRemoveCoverImages() {
  const update = useProfileUpdate();
  return useMutation({
    mutationFn: removeCoverImages,
    onSuccess: () => update({ coverImagesPath: [] }),
  });
}

export function useChangePassword() {
  const update = useProfileUpdate();
  return useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword?: string; newPassword: string }) =>
      changePassword(currentPassword, newPassword),
    onSuccess: () => update({ hasPassword: true }),
  });
}

export function useRequestEmailChange() {
  return useMutation({ mutationFn: requestEmailChange });
}

export function useConfirmEmailChange() {
  const queryClient = useQueryClient();
  const refreshSession = useRefreshSession();
  return useMutation({
    mutationFn: confirmEmailChange,
    onSuccess: async () => {
      await Promise.all([queryClient.invalidateQueries({ queryKey: queryKeys.profile }), refreshSession()]);
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      queryClient.clear();
      queryClient.setQueryData(queryKeys.session, null);
      router.replace("/");
    },
  });
}
