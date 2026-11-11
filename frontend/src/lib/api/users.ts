import { apiRequest, type ApiEnvelope } from "./client";
import type { Profile, PublicProfile, UserDocument } from "./types";

// backend/src/app/user/user.route.js

export async function getProfile(): Promise<Profile> {
  const response = await apiRequest<ApiEnvelope<Profile>>("/user/me", { auth: true });
  return response.data as Profile;
}

export async function getPublicProfile(id: string): Promise<PublicProfile> {
  const response = await apiRequest<ApiEnvelope<PublicProfile>>(`/user/${id}`);
  return response.data as PublicProfile;
}

function formOf(field: string, files: File[]) {
  const form = new FormData();
  for (const file of files) form.append(field, file);
  return form;
}

export async function uploadProfilePicture(file: File): Promise<string> {
  const response = await apiRequest<ApiEnvelope<{ profilePicturePath: string }>>("/user/upload-profile-picture", {
    method: "POST",
    body: formOf("profilePicture", [file]),
    auth: true,
  });
  return response.data!.profilePicturePath;
}

// replaces the whole set
export async function uploadCoverImages(files: File[]): Promise<string[]> {
  const response = await apiRequest<ApiEnvelope<{ coverImagesPath: string[] }>>("/user/upload-cover-images", {
    method: "POST",
    body: formOf("cover-images", files),
    auth: true,
  });
  return response.data!.coverImagesPath;
}

// adds to the list; answers with the whole list
export async function uploadDocuments(files: File[]): Promise<UserDocument[]> {
  const response = await apiRequest<ApiEnvelope<{ documents: UserDocument[] }>>("/user/documents", {
    method: "POST",
    body: formOf("documents", files),
    auth: true,
  });
  return response.data!.documents;
}

export function deleteDocument(id: string) {
  return apiRequest(`/user/documents/${id}`, { method: "DELETE", auth: true });
}
