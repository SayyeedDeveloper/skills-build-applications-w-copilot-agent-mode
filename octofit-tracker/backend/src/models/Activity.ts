import { Schema, model } from 'mongoose';

// Points earned per minute for each activity type.
export const ACTIVITY_POINTS_PER_MINUTE = {
  run: 1.2,
  cycle: 1,
  swim: 1.3,
  walk: 0.6,
  strength: 1.1,
  yoga: 0.8,
} as const;

export type ActivityType = keyof typeof ACTIVITY_POINTS_PER_MINUTE;
export const ACTIVITY_TYPES = Object.keys(ACTIVITY_POINTS_PER_MINUTE) as ActivityType[];

const activitySchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: [true, 'Activity user is required'] },
    team: { type: Schema.Types.ObjectId, ref: 'Team', required: [true, 'Activity team is required'] },
    type: { type: String, required: [true, 'Activity type is required'], enum: ACTIVITY_TYPES },
    minutes: { type: Number, required: [true, 'Activity minutes are required'], min: [1, 'Activity must last at least 1 minute'] },
    points: { type: Number, required: [true, 'Activity points are required'], min: [0, 'Activity points cannot be negative'] },
    occurredAt: { type: Date, required: [true, 'Activity date is required'] },
  },
  { timestamps: true },
);

export const Activity = model('Activity', activitySchema);
