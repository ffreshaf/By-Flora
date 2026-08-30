import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase.js';

export async function testFirebase() {
  try {
    const docRef = await addDoc(collection(db, 'test'), {
      message: 'Hello from By Flora!',
      createdAt: serverTimestamp()
    });

    console.log('Firebase works! Document ID:', docRef.id);
  } catch (error) {
    console.error('Firebase test failed:', error);
  }
}