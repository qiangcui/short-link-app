const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

exports.redirectShortLink = functions.https.onRequest(async (req, res) => {
  const code = req.path.substring(1); // Remove leading slash
  
  if (!code) {
    res.status(404).send('Link not found');
    return;
  }

  try {
    const db = admin.firestore();
    const publicLinkRef = db.collection('publicLinks').doc(code);
    const publicLinkSnap = await publicLinkRef.get();

    if (!publicLinkSnap.exists) {
      res.status(404).send('Link not found');
      return;
    }

    const publicData = publicLinkSnap.data();
    const { originalUrl, userId, shortLinkId } = publicData;

    // Increment click count asynchronously (don't wait)
    if (userId && shortLinkId) {
      const shortLinkRef = db.collection('users').doc(userId)
        .collection('shortLinks').doc(shortLinkId);
      shortLinkRef.update({
        clicks: admin.firestore.FieldValue.increment(1)
      }).catch(err => {
        console.error("Error updating clicks:", err);
      });
    }

    // Perform 301 permanent redirect (instant, no page load)
    res.redirect(301, originalUrl);
  } catch (error) {
    console.error("Redirect error:", error);
    res.status(500).send('Error retrieving link');
  }
});

