// require('dotenv').config({path: "./env"})

//Load dotenv as soon as index loads
import dotenv from "dotenv";
import connectDB from "./db/index.js";
import app from "./app.js";

//important to tel location of env
dotenv.config({
  path: "./env",
});

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () =>{
        console.log(`Server is running at: ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.log(`Error connecting to MongoDB: ${error}`);
  });
















// Old Approch

// import express from "express";
// const app = express();
// (async () => {
//   try {
//     await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
//     app.on("error", (error) => {
//       console.log("MongoDB connection error: ", error);
//       throw error;
//     });

//     app.listen(process.env.PORT, ()=>{
//         console.log(`Server running on port ${process.env.PORT}`);
//       });
//     }

//   catch (error) {
//     console.log("ERROR: ", error);
//   }
// })();
