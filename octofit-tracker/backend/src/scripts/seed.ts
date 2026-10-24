import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { Activity, Team, User, Workout } from '../models/index.js';

type TeamId = InstanceType<typeof Team>['_id'];
type UserDocument = InstanceType<typeof User>;

// Seed stable demo records without clearing data owned by the application.
// Every fixture is keyed by a stable value (team name, user email, workout title,
// or user + team + type + timestamp for activities) and written with upserts,
// so running the seed again updates the same records instead of duplicating them.

async function upsertDemoTeam(name: string, mascot: string) {
  return Team.findOneAndUpdate(
    { name },
    { $set: { name, mascot } },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
  );
}

async function upsertDemoUser(name: string, email: string, teamId: TeamId, fitnessGoal: string) {
  const previousUser = await User.findOne({ email }).select('_id team');
  if (previousUser?.team && previousUser.team.toString() !== teamId.toString()) {
    await Team.updateOne({ _id: previousUser.team }, { $pull: { members: previousUser._id } });
  }
  const user = await User.findOneAndUpdate(
    { email },
    { $set: { name, email, team: teamId, fitnessGoal } },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
  );
  await Team.updateOne({ _id: teamId }, { $addToSet: { members: user._id } });
  return user;
}

async function upsertDemoActivity(user: UserDocument, teamId: TeamId, type: string, minutes: number, points: number, occurredAt: Date) {
  await Activity.updateOne(
    { user: user._id, team: teamId, type, occurredAt },
    { $set: { user: user._id, team: teamId, type, minutes, points, occurredAt } },
    { upsert: true, runValidators: true },
  );
}

async function upsertDemoWorkout(title: string, focus: string, minutes: number, difficulty: string) {
  await Workout.updateOne(
    { title },
    { $set: { title, focus, minutes, difficulty } },
    { upsert: true, runValidators: true },
  );
}

export async function seed() {
  await connectDatabase();
  try {
    const octocats = await upsertDemoTeam('Octocats', 'Mona');
    const robocats = await upsertDemoTeam('Robocats', 'Hubot');
    const codecats = await upsertDemoTeam('Codecats', 'Copilot');

    const mona = await upsertDemoUser('Mona', 'mona@example.com', octocats._id, 'endurance');
    const hubot = await upsertDemoUser('Hubot', 'hubot@example.com', robocats._id, 'strength');
    const octavia = await upsertDemoUser('Octavia', 'octavia@example.com', codecats._id, 'mobility');
    const ducky = await upsertDemoUser('Ducky', 'ducky@example.com', octocats._id, 'strength');

    await upsertDemoActivity(mona, octocats._id, 'run', 40, 48, new Date('2026-01-10T12:00:00.000Z'));
    await upsertDemoActivity(mona, octocats._id, 'swim', 30, 39, new Date('2026-01-12T07:30:00.000Z'));
    await upsertDemoActivity(hubot, robocats._id, 'cycle', 25, 25, new Date('2026-01-11T12:00:00.000Z'));
    await upsertDemoActivity(hubot, robocats._id, 'strength', 35, 39, new Date('2026-01-13T17:00:00.000Z'));
    await upsertDemoActivity(octavia, codecats._id, 'yoga', 45, 36, new Date('2026-01-12T18:00:00.000Z'));
    await upsertDemoActivity(ducky, octocats._id, 'strength', 20, 22, new Date('2026-01-14T16:00:00.000Z'));

    await upsertDemoWorkout('Intervals', 'endurance', 30, 'moderate');
    await upsertDemoWorkout('Long Easy Run', 'endurance', 45, 'easy');
    await upsertDemoWorkout('Strength Circuit', 'strength', 30, 'moderate');
    await upsertDemoWorkout('Bodyweight Basics', 'strength', 20, 'easy');
    await upsertDemoWorkout('Mobility Flow', 'mobility', 25, 'easy');
  } finally {
    await disconnectDatabase();
  }
}

if (process.argv[1]?.endsWith('seed.ts')) {
  await seed();
}
