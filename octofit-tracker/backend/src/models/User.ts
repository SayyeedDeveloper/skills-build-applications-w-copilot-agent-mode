import { Schema, model } from 'mongoose';

export const FITNESS_GOALS = ['endurance', 'strength', 'mobility', 'weight loss', 'general fitness'] as const;

const userSchema = new Schema(
  {
    name: { type: String, required: [true, 'User name is required'], trim: true },
    email: {
      type: String,
      required: [true, 'User email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'User email must be a valid email address'],
    },
    team: { type: Schema.Types.ObjectId, ref: 'Team' },
    fitnessGoal: { type: String, required: [true, 'User fitness goal is required'], enum: FITNESS_GOALS },
  },
  { timestamps: true },
);

export const User = model('User', userSchema);
