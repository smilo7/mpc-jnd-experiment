import mongoose, { Document, Model } from 'mongoose';

// Define the TypeScript interface for type safety
export interface IExperimentResult extends Document {
  participantName: string;
  audioComparisons: Array<{
    audioFile1: string;
    audioFile2: string;
    isSame: boolean;
  }>;
  completedAt: Date;
}

// Create the Mongoose schema
const ExperimentResultSchema = new mongoose.Schema<IExperimentResult>({
  participantName: { type: String, required: true },
  audioComparisons: [
    {
      audioFile1: { type: String, required: true },
      audioFile2: { type: String, required: true },
      isSame: { type: Boolean, required: true },
    },
  ],
  completedAt: { type: Date, default: Date.now },
});

// Export the model, ensuring we handle reinitialization in development
const ExperimentResult: Model<IExperimentResult> =
  mongoose.models.ExperimentResult || mongoose.model<IExperimentResult>('ExperimentResult', ExperimentResultSchema);

export default ExperimentResult;
