import { AppError } from "../errors/appError.js";
import { OAuth2Client } from "google-auth-library";
import { env } from "../config/env.js";

const client = new OAuth2Client();

export async function verifyGoogleToken(idToken) {
  try {
    const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: [env.google.webClientId, env.google.iosClientId],
    });
    const payload = ticket.getPayload();
    return payload;
  } catch (error) {
    throw new AppError("Invalid Google token", 403);
  }
}
