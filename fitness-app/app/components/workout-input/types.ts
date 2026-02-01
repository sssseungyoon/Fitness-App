export interface SetData {
  setNumber: number;
  weight: number;
  reps: number;
  halfReps: number;
}

export interface PreviousSetData {
  setNumber: number;
  weight: number;
  reps: number;
  halfReps: number;
  date: string;
}

export interface ExerciseRecord {
  exerciseId: number;
  exerciseName: string;
  equipmentType: string;
  sets: SetData[];
  previousSets: PreviousSetData[];
}
