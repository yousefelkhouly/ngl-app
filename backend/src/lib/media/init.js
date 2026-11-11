import { env } from "../config/env.js";
import { createStorage } from "../../pkg/media/storage.js";

// Cloudinary when CLOUDINARY_URL is set, the local uploads folder otherwise
export const storage = createStorage(env.storage);
