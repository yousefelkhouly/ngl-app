import { apiRequest } from "./client";

// backend/src/app/user/user.route.js. the backend answers with a message only,
// it doesn't return the saved file's path

export type UploadKind = "profilePicture" | "cv" | "coverImages";

const routes: Record<UploadKind, { path: string; field: string }> = {
  profilePicture: { path: "/user/upload-profile-picture", field: "profilePicture" },
  cv: { path: "/user/upload-cv", field: "cv" },
  coverImages: { path: "/user/upload-cover-images", field: "cover-images" },
};

export function uploadFiles(kind: UploadKind, files: File[]) {
  const { path, field } = routes[kind];
  const form = new FormData();
  for (const file of files) form.append(field, file);
  return apiRequest(path, { method: "POST", body: form, auth: true });
}
