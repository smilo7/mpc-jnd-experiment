export interface AudioPair {
    id: number;
    audio1: string;
    audio2: string;
  }
  
  export interface ExperimentResult {
    participant_name: string;
    responses: {
      pair_id: number;
      is_same: boolean;
    }[];
  }