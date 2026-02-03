export interface SetData {
  setNumber: number;
  weight: number;
  reps: number;
  halfReps: number;
  leftReps?: number;   // For isolation exercises
  rightReps?: number;  // For isolation exercises
}

export interface PreviousSetData {
  setNumber: number;
  weight: number;
  reps: number;
  halfReps: number;
  leftReps?: number;   // For isolation exercises
  rightReps?: number;  // For isolation exercises
  date: string;
}

export interface ExerciseRecord {
  exerciseId: number;
  exerciseName: string;
  equipmentType: string;
  sets: SetData[];
  previousSets: PreviousSetData[];
  isIsolation: boolean;
}
