export const queryKeys = {
  session: ["session"] as const,
  inbox: ["inbox"] as const,
  conversations: ["conversations"] as const,
  conversation: (id: string) => ["conversations", id] as const,
};
