const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");
const { withoutEmail } = require("./access");
initializeApp();
exports.deleteMyAccount = onCall(
  { region: "europe-west1" },
  async (request) => {
    if (!request.auth)
      throw new HttpsError("unauthenticated", "Önce giriş yap.");
    const { uid, token } = request.auth;
    if (
      typeof token.auth_time !== "number" ||
      Date.now() / 1000 - token.auth_time > 300
    )
      throw new HttpsError(
        "failed-precondition",
        "Hesabını silmek için yeniden giriş yap.",
      );
    const email = token.email;
    // Never accept a UID or email from the request body: users may only delete themselves.
    if (typeof email === "string")
      await getFirestore().runTransaction(async (tx) => {
        const ref = getFirestore().doc("config/access");
        const snap = await tx.get(ref);
        if (snap.exists) tx.update(ref, withoutEmail(snap.data(), email));
      });
    try {
      await getAuth().deleteUser(uid);
    } catch (error) {
      if (error.code !== "auth/user-not-found")
        throw new HttpsError("internal", "Hesap silinemedi. Yeniden dene.");
    }
    return { deleted: true };
  },
);
