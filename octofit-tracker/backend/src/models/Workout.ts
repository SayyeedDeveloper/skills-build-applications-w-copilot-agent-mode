import { Schema, model } from 'mongoose';

export const WORKOUT_FOCUSES = ['endurance', 'strength', 'mobility'] as const;
export const WORKOUT_DIFFICULTIES = ['easy', 'moderate', 'hard'] as const;

const workoutSchema = new Schema(
  {
    title: { type: String, required: [true, 'Workout title is required'], trim: true },
    focus: { type: String, required: [true, 'Workout focus is required'], enum: WORKOUT_FOCUSES },
    minutes: { type: Number, required: [true, 'Workout minutes are required'], min: [1, 'Workout must last at least 1 minute'] },
    difficulty: { type: String, required: [true, 'Workout difficulty is required'], enum: WORKOUT_DIFFICULTIES },
  },
  { timestamps: true },
);

export const Workout = model('Workout', workoutSchema);
