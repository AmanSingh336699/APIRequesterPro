import mongoose from "mongoose";

const variableSchema = new mongoose.Schema({
  key: { type: String, required: true },
  value: { type: String, required: true }
}, { _id: false })
const environmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  name: { type: String, required: true, trim: true },
  variables: [variableSchema],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Environment || mongoose.model("Environment", environmentSchema);