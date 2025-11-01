import mongoose from "mongoose";

mongoose.connect("mongodb://127.0.0.1:27017/mini-project1", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB connected successfully"))
.catch(err => console.error("❌ MongoDB connection error:", err));

const userSchema = new mongoose.Schema({
  userName: String,
  name: String,
  age: Number,
  email: String,
  password: String,
  posts: [
    {type: mongoose.Schema.Types.ObjectId, ref: "Post"}
  ]
}, { timestamps: true }); 

export const User = mongoose.model("User", userSchema);
