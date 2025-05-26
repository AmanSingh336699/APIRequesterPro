import mongoose from "mongoose";

const requestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  collectionId: { type: mongoose.Schema.Types.ObjectId, ref: "Collection", required: true, index: true },
  name: { type: String, required: true },
  method: { type: String, required: true },
  url: { type: String, required: true },
  headers: [{ key: String, value: String, _id: false }],
  body: { type: String },
  createdAt: { type: Date, default: Date.now, index: true },
});

const Request = mongoose.models.Request || mongoose.model("Request", requestSchema);
export default Request