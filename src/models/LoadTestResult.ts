import mongoose, { Schema } from "mongoose";

const loadTestResultSchema = new Schema({
    userId: { type: String, required: true, index: true },
    requestId: { type: String }, 
    collectionId: { type: String },
    concurrency: { type: Number, required: true },
    iterations: { type: Number, required: true },
    results: [
        {
            requestIndex: { type: Number }, 
            status: { type: Number },
            time: { type: Number }, 
            error: { type: String },
        },
    ],
    metrics: {
        avgResponseTime: { type: Number },
        minResponseTime: { type: Number },
        maxResponseTime: { type: Number },
        errorRate: { type: Number },
        throughput: { type: Number },
    },
    createdAt: { type: Date, default: Date.now, index: true },
});

const LoadTestResult = mongoose.models.LoadTestResult || mongoose.model("LoadTestResult", loadTestResultSchema);
export default LoadTestResult