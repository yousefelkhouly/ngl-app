import { config } from "dotenv";
import mongoose from "mongoose";
config();
mongoose.connect(process.env.MONGODB_URL);
console.log(process.env.MONGODB_URL);
