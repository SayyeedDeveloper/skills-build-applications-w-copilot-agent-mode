import { Schema, model } from 'mongoose';

const teamSchema = new Schema(
  {
    name: { type: String, required: [true, 'Team name is required'], trim: true },
    mascot: { type: String, required: [true, 'Team mascot is required'], trim: true },
    members: { type: [{ type: Schema.Types.ObjectId, ref: 'User' }], default: [] },
  },
  { timestamps: true },
);

export const Team = model('Team', teamSchema);
