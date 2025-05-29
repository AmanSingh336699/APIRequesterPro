import mongoose from "mongoose";
import Request from "./Request"

const collectionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  name: { type: String, required: true, trim: true },
  requests: [{ type: mongoose.Schema.Types.ObjectId, ref: "Request" }],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Collection || mongoose.model("Collection", collectionSchema);