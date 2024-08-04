import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
 


const firebaseConfig = {
  apiKey: "AIzaSyBJ55LdLCfwseeN2wQs7HuhJb4hClmc0pM",
  authDomain: "inventory-management-5d192.firebaseapp.com",
  projectId: "inventory-management-5d192",
  storageBucket: "inventory-management-5d192.appspot.com",
  messagingSenderId: "741529213972",
  appId: "1:741529213972:web:20ffee19e606b79db29b01",
  measurementId: "G-ZKR1LCB2BE"
};

 

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
const storage = getStorage(app);

 

export { firestore, storage, ref, uploadBytes, getDownloadURL };
