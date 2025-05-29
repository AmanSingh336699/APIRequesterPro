import mongoose, { Schema, Document } from 'mongoose';

export interface IScanResult extends Document {
  url: string;
  results: Array<{
    name: string;
    severity: 'low' | 'medium' | 'high' | 'error';
    description: string;
    recommendation: string;
    fix?: string;
    fixLanguage?: string;
  }>;
  timestamp: Date;
  userId?: string;
}

const ScanResultSchema: Schema = new Schema({
  url: { type: String, required: true },
  results: [
    {
      name: { type: String, required: true },
      severity: { type: String, enum: ['low', 'medium', 'high', 'error'], required: true },
      description: { type: String, required: true },
      recommendation: { type: String, required: true },
      fix: { type: String, default: '' },         
      fixLanguage: { type: String, default: 'plaintext' },
    },
  ],
  timestamp: { type: Date, default: Date.now },
  userId: { type: String, required: false },
});

ScanResultSchema.index({ userId: 1, timestamp: -1 });
ScanResultSchema.index({ _id: 1 });

const ScanResult = mongoose.models.ScanResult || mongoose.model<IScanResult>('ScanResult', ScanResultSchema);

export default ScanResult;
