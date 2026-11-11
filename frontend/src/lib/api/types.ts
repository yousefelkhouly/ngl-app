// shapes returned by the backend (backend/src), kept in one place

export type RequestStatus = "pending" | "accepted" | "declined";

// what the API shows about another user: never their email or files
export interface PublicUser {
  _id: string;
  name: string;
  profilePicturePath?: string;
}

// someone's profile as anyone with their link sees it
export interface PublicProfile {
  _id: string;
  name: string;
  profilePicturePath?: string;
  coverImagesPath: string[];
}

// a file in the user's personal information
export interface UserDocument {
  _id: string;
  // the name the file had on the user's device
  name: string;
  path: string;
  mimetype: string;
  size: number;
  uploadedAt: string;
}

// your own profile, from /user/me
export interface Profile extends PublicProfile {
  email: string;
  documents: UserDocument[];
}

// the logged-in user, read from the access token by /api/auth/session
export interface SessionUser {
  id: string;
  name: string;
  email: string;
}

export interface InboxMessage {
  _id: string;
  content: string;
  receiver: string;
  createdAt: string;
  // null until the receiver accepts the message's request
  sender: PublicUser | null;
  // null for messages sent without an account: those can never be revealed
  request: { _id: string; status: RequestStatus } | null;
}

export interface ConversationMessage {
  _id: string;
  // null if the message document was removed
  msgId: { _id: string; content: string; createdAt: string } | null;
  sender: string;
  // client-only: shown before the backend confirmed it
  pending?: boolean;
}

export interface Conversation {
  _id: string;
  sender: PublicUser;
  receiver: PublicUser;
  messages: ConversationMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface SentMessage {
  _id: string;
  content: string;
  receiver: string;
  sender?: string;
  createdAt: string;
}

export interface AcceptResult {
  request: { _id: string; status: RequestStatus };
  conversation: { _id: string };
}

export interface DeclineResult {
  _id: string;
  status: RequestStatus;
}
