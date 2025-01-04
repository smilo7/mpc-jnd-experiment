import mongoose, { Document, Model } from 'mongoose';

export interface IExperimentResult extends Document {
  participantName: string;
  audioComparisons: Array<{
    audioFile1: string;
    audioFile2: string;
    isSame: boolean;
    playCountFile1: number;
    playCountFile2: number;
  }>;
  startedAt: Date;
  completedAt: Date;
}

const ExperimentResultSchema = new mongoose.Schema<IExperimentResult>({
  participantName: { type: String, required: true },
  audioComparisons: [
    {
      audioFile1: { type: String, required: true },
      audioFile2: { type: String, required: true },
      isSame: { type: Boolean, required: true },
      playCountFile1: { type: Number, required: true, default: 0 },
      playCountFile2: { type: Number, required: true, default: 0 }
    }
  ],
  startedAt: { type: Date },
  completedAt: { type: Date, default: Date.now },
});

const ExperimentResult: Model<IExperimentResult> =
  mongoose.models.ExperimentResult || mongoose.model<IExperimentResult>('ExperimentResult', ExperimentResultSchema);

export default ExperimentResult;
