import { User } from "../models/user.model.js";

export async function findUserByEmail(email) {
  return User.findOne({ email, isDeleted: false });
}

export async function findUserById(id) {
  return User.findOne({ _id: id, isDeleted: false }, { password: 0 });
}

// only for checking the password
export async function findUserWithPasswordById(id) {
  return User.findOne({ _id: id, isDeleted: false });
}

const isDuplicateUsername = (error) => error?.code === 11000 && Boolean(error.keyPattern?.username);

// creates the user with a username from generate(); two sign-ups can pick the same free name
// at once, so on a clash it tries again with a new one
export async function createUserWithUsername(data, generate) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await User.create({ ...data, username: await generate() });
    } catch (error) {
      if (!isDuplicateUsername(error) || attempt >= 3) throw error;
    }
  }
}

// accounts from before usernames get one when it's first needed
export async function ensureUsername(id, generate) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await User.findOneAndUpdate(
        { _id: id, isDeleted: false, username: { $exists: false } },
        { username: await generate() },
        { returnDocument: "after" },
      );
    } catch (error) {
      if (!isDuplicateUsername(error) || attempt >= 3) throw error;
    }
  }
}

// null if the username is taken (the unique index decides, so two people can't both get it)
export async function updateNameAndUsername(id, changes) {
  try {
    return await User.findOneAndUpdate({ _id: id, isDeleted: false }, changes, {
      returnDocument: "after",
      runValidators: true,
      projection: { name: 1, username: 1 },
    });
  } catch (error) {
    if (isDuplicateUsername(error)) return null;
    throw error;
  }
}

// what's left of a deleted account: nothing that identifies the person. the email is freed,
// so they can sign up again with it
export async function scrubDeletedUser(id) {
  return User.updateOne(
    { _id: id },
    {
      $set: {
        isDeleted: true,
        name: "deleted account",
        email: `deleted-${id}@deleted.invalid`,
        coverImagesPath: [],
        documents: [],
        blockedUsers: [],
        twoStepVerification: false,
      },
      $unset: { password: 1, username: 1, profilePicturePath: 1, dob: 1 },
    },
  );
}

export async function createUser(userData) {
  return User.create(userData);
}

export async function deleteUserById(id) {
  return User.deleteOne({ _id: id });
}

export async function updateUserByEmail(email, updatedData) {
  return User.findOneAndUpdate({ email }, updatedData, {
    returnDocument: "after",
    runValidators: true,
  });
}

export async function replaceUserField(id, field, value) {
  return User.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { [field]: value },
    { returnDocument: "before", runValidators: true, projection: { [field]: 1 } },
  );
}

export async function updateUserById(id, updatedData) {
  return User.findByIdAndUpdate(id, updatedData, {
    returnDocument: "after",
    runValidators: true,
  });
}

// blockedUsers is read only to count it: who they are stays private, even from this user,
// since most were blocked from a note whose sender stayed hidden
const PROFILE_FIELDS = {
  name: 1,
  username: 1,
  provider: 1,
  // only to say whether one is set (Google accounts may have none); never sent
  password: 1,
  email: 1,
  profilePicturePath: 1,
  coverImagesPath: 1,
  documents: 1,
  twoStepVerification: 1,
  blockedUsers: 1,
};
const PUBLIC_PROFILE_FIELDS = { name: 1, username: 1, profilePicturePath: 1, coverImagesPath: 1 };

export async function findProfileById(id) {
  return User.findOne({ _id: id, isDeleted: false }, PROFILE_FIELDS);
}

export async function blockUser(id, blockedId) {
  return User.updateOne({ _id: id }, { $addToSet: { blockedUsers: blockedId } });
}

export async function unblockEveryone(id) {
  return User.updateOne({ _id: id }, { blockedUsers: [] });
}

// true if either of the two blocked the other
export async function isBlockedBetween(userA, userB) {
  const found = await User.exists({
    $or: [
      { _id: userA, blockedUsers: userB },
      { _id: userB, blockedUsers: userA },
    ],
  });
  return Boolean(found);
}

export async function findPublicProfileById(id) {
  return User.findOne({ _id: id, isDeleted: false }, PUBLIC_PROFILE_FIELDS);
}

export async function findPublicProfileByUsername(username) {
  return User.findOne({ username, isDeleted: false }, PUBLIC_PROFILE_FIELDS);
}

// one atomic update: the filter only matches while there's room for all of them,
// so two uploads at once can't go past `max`
export async function addDocuments(id, documents, max) {
  return User.findOneAndUpdate(
    { _id: id, isDeleted: false, [`documents.${max - documents.length}`]: { $exists: false } },
    { $push: { documents: { $each: documents } } },
    { returnDocument: "after", runValidators: true, projection: { documents: 1 } },
  );
}

// returns the removed document, or null if this user has none with that id
export async function removeDocument(id, documentId) {
  const before = await User.findOneAndUpdate(
    { _id: id, isDeleted: false, "documents._id": documentId },
    { $pull: { documents: { _id: documentId } } },
    { returnDocument: "before", projection: { "documents.$": 1 } },
  );
  return before?.documents[0] ?? null;
}
