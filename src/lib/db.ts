import mongoose from 'mongoose';

const MONGODB_URI = import.meta.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

let isConnected = false; // Track connection status

export async function connectToDatabase() {
  if (!isConnected) {
    try {
      await mongoose.connect(MONGODB_URI);
      isConnected = true;
      console.log('Connected to MongoDB');
    } catch (err) {
      console.error('Error connecting to MongoDB:', err);
      throw err;
    }
  }
}


// const connectDB = async () => {
//     if (mongoose.connection.readyState === 0) {
//       await mongoose.connect(MONGODB_URI);
//     }
//   };

// async function connectDB(){
//     const conn = await mongoose.connect(MONGODB_URI);s
//     console.log(conn);
//     return conn
// }

// let cached = global.mongoose;

// if (!cached) {
//   cached = global.mongoose = { conn: null, promise: null };
// }

// async function connectDB() {
//   if (cached.conn) {
//     return cached.conn;
//   }

//   if (!cached.promise) {
//     const opts = {
//       bufferCommands: false,
//     };

//     cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
//       return mongoose;
//     });
//   }

//   try {
//     cached.conn = await cached.promise;
//     return cached.conn;
//   } catch (e) {
//     cached.promise = null;
//     throw e;
//   }
// }

export default connectToDatabase;