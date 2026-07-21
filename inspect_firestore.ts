import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";

async function main() {
  const firebaseConfig = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf8"));
  const app = initializeApp(firebaseConfig);
  const db = firebaseConfig.firestoreDatabaseId
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);

  console.log("Connecting to database: " + firebaseConfig.firestoreDatabaseId);
  try {
    const querySnapshot = await getDocs(collection(db, "products"));
    console.log(`Found ${querySnapshot.size} products inside Firestore.`);
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const imageUrlLength = data.imageUrl ? data.imageUrl.length : 0;
      const isBase64 = data.imageUrl?.startsWith("data:image/");
      console.log(`- Product ID: ${doc.id}`);
      console.log(`  Name: ${data.name}`);
      console.log(`  Goal: ${data.goal}`);
      console.log(`  Base price: ${data.basePrice}`);
      console.log(`  Image URL length: ${imageUrlLength} (isBase64: ${isBase64})`);
      console.log(`  Image URL starts with: ${data.imageUrl?.substring(0, 80)}`);
      console.log(`  Has sizes: ${Array.isArray(data.sizes)} (count: ${data.sizes?.length})`);
    });
  } catch (err) {
    console.error("Failed to read products from Firestore: ", err);
  }
}

main();
