import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { v2 as cloudinary } from "cloudinary";
import { UPLOADS_DIR } from "./multer.js";
import { EXTENSIONS } from "./file.validation.js";

// where uploaded files live once they're accepted. multer always writes them to UPLOADS_DIR first
// (that's where they're checked); then:
// - local: they stay there and the backend serves them at /uploads (development, tests)
// - cloudinary: they're sent to Cloudinary and the local copy is deleted. hosts like Render
//   wipe their disk on every restart, so files kept there would disappear

const localUrl = (file) => `/uploads/${file.filename}`;
const localPath = (url) => path.join(UPLOADS_DIR, path.basename(url));

const removeLocal = (paths) => Promise.all(paths.map((p) => fs.rm(p, { force: true })));

// "Alice CV 2026.pdf" → "Alice_CV_2026": the last part of a raw file's id is the name a browser
// gives it when downloading, since cross-origin links ignore the download attribute. kept to
// characters every Cloudinary id accepts; a name with none of them becomes "document"
// (the app still shows the full original name)
function safeBaseName(originalName) {
  const base = path.parse(Buffer.from(originalName, "latin1").toString("utf8")).name;
  const cleaned = base
    .replace(/\s+/g, "_")
    .replace(/[^A-Za-z0-9._-]/g, "")
    .replace(/^[._-]+|[._-]+$/g, "")
    .slice(0, 80);
  return cleaned || "document";
}

class LocalStorage {
  async save(files) {
    return files.map(localUrl);
  }

  async remove(urls) {
    await removeLocal(urls.filter((url) => url?.startsWith("/uploads/")).map(localPath));
  }
}

class CloudinaryStorage {
  constructor(folder) {
    // reads CLOUDINARY_URL (cloudinary://<key>:<secret>@<cloud name>) from the environment
    cloudinary.config({ secure: true });
    this.folder = folder;
  }

  async #upload(file) {
    const isImage = file.mimetype.startsWith("image/");
    const result = await cloudinary.uploader.upload(file.path, {
      resource_type: isImage ? "image" : "raw",
      // documents keep their name (see safeBaseName); a random folder keeps the url unguessable
      public_id: isImage
        ? `${this.folder}/${crypto.randomUUID()}`
        : `${this.folder}/${crypto.randomUUID()}/${safeBaseName(file.originalname)}${EXTENSIONS[file.mimetype]}`,
      overwrite: false,
    });
    return result.secure_url;
  }

  // all or nothing: if one upload fails, the ones that worked are removed again
  async save(files) {
    try {
      const results = await Promise.allSettled(files.map((file) => this.#upload(file)));
      const failed = results.find((result) => result.status === "rejected");
      if (failed) {
        await this.remove(results.filter((r) => r.status === "fulfilled").map((r) => r.value));
        throw failed.reason;
      }
      return results.map((result) => result.value);
    } finally {
      await removeLocal(files.map((file) => file.path));
    }
  }

  // https://res.cloudinary.com/<cloud>/<image|raw>/upload/v123/<public id>[.ext for images]
  #parse(url) {
    const match = /\/(image|raw)\/upload\/(?:v\d+\/)?(.+)$/.exec(new URL(url).pathname);
    if (!match) return null;
    const [, resourceType, rest] = match;
    const publicId = decodeURIComponent(resourceType === "image" ? rest.replace(/\.[^./]+$/, "") : rest);
    return { resourceType, publicId };
  }

  async remove(urls) {
    await Promise.all(
      urls
        .filter((url) => url?.startsWith("https://"))
        .map((url) => this.#parse(url))
        .filter(Boolean)
        .map(({ resourceType, publicId }) =>
          // a file that can't be removed is only wasted space: the user's request already worked
          cloudinary.uploader.destroy(publicId, { resource_type: resourceType }).catch(() => {}),
        ),
    );
  }
}

export function createStorage({ cloudinaryUrl, folder }) {
  return cloudinaryUrl ? new CloudinaryStorage(folder) : new LocalStorage();
}

// files multer saved that never made it into storage (a rejected request)
export const discardUploads = (files) => removeLocal(files.map((file) => file.path));
