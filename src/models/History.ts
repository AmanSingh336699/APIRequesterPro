import mongoose from "mongoose";

const historySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  method: { type: String, required: true },
  url: { type: String, required: true },
  headers: [{ key: String, value: String, _id: false }],
  body: { type: String },
  response: { type: Object },
  status: { type: Number },
  duration: { type: Number },
  createdAt: { type: Date, default: Date.now, index: true },
});

export default mongoose.models.History || mongoose.model("History", historySchema);