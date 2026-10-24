import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';
import { ACTIVITY_POINTS_PER_MINUTE, ACTIVITY_TYPES, type ActivityType } from '../models/Activity.js';

// Errors carry the HTTP status the route should return; the app error handler reads it.
export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const badRequest = (message: string) => new HttpError(400, message);
const notFound = (message: string) => new HttpError(404, message);

function asRecord(input: unknown): Record<string, unknown> {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) throw badRequest('Request body must be a JSON object');
  return input as Record<string, unknown>;
}

function requireObjectId(value: unknown, field: string) {
  if (typeof value !== 'string' || !/^[a-f\d]{24}$/i.test(value)) throw badRequest(`${field} must be a valid id`);
  return new mongoose.Types.ObjectId(value);
}

function requireText(value: unknown, field: string) {
  if (typeof value !== 'string' || value.trim() === '') throw badRequest(`${field} is required`);
  return value.trim();
}

// Points reward both duration and intensity of the activity type.
export function calculatePoints(type: ActivityType, minutes: number) {
  return Math.round(minutes * ACTIVITY_POINTS_PER_MINUTE[type]);
}

export async function listActivities() {
  return Activity.find().sort({ occurredAt: -1 }).lean();
}

export async function createActivity(input: unknown) {
  const body = asRecord(input);
  const userId = requireObjectId(body.userId, 'userId');
  const teamId = requireObjectId(body.teamId, 'teamId');
  const type = requireText(body.type, 'type').toLowerCase();
  if (!ACTIVITY_TYPES.includes(type as ActivityType)) throw badRequest(`type must be one of: ${ACTIVITY_TYPES.join(', ')}`);
  const minutes = Number(body.minutes);
  if (!Number.isFinite(minutes) || minutes <= 0) throw badRequest('minutes must be a positive number');

  const [user, team] = await Promise.all([User.findById(userId).lean(), Team.findById(teamId).lean()]);
  if (!user) throw notFound('User not found');
  if (!team) throw notFound('Team not found');
  const isMember = team.members.some((member) => member.toString() === userId.toString());
  if (!isMember) throw badRequest('User is not a member of this team');

  const activity = await Activity.create({
    user: userId,
    team: teamId,
    type,
    minutes,
    points: calculatePoints(type as ActivityType, minutes),
    occurredAt: new Date(),
  });
  return activity.toObject();
}

export async function listTeams() {
  return Team.find().sort({ name: 1 }).lean();
}

export async function createTeam(input: unknown) {
  const body = asRecord(input);
  const name = requireText(body.name, 'name');
  const mascot = requireText(body.mascot, 'mascot');
  if (body.members !== undefined && !Array.isArray(body.members)) throw badRequest('members must be an array of user ids');
  const members = ((body.members as unknown[] | undefined) ?? []).map((id) => requireObjectId(id, 'members'));

  if (members.length > 0) {
    const found = await User.countDocuments({ _id: { $in: members } });
    if (found !== new Set(members.map(String)).size) throw notFound('One or more members were not found');
  }

  const team = await Team.create({ name, mascot, members });
  if (members.length > 0) {
    // Keep each member's team reference in sync and remove them from their previous team.
    await Team.updateMany({ _id: { $ne: team._id } }, { $pull: { members: { $in: members } } });
    await User.updateMany({ _id: { $in: members } }, { $set: { team: team._id } });
  }
  return team.toObject();
}

export async function getLeaderboard() {
  const totals = await Activity.aggregate<{ _id: mongoose.Types.ObjectId; totalPoints: number }>([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
  ]);
  const pointsByTeam = new Map(totals.map((entry) => [entry._id.toString(), entry.totalPoints]));
  const teams = await Team.find().select('name').lean();

  return teams
    .map((team) => ({ teamId: team._id.toString(), teamName: team.name, totalPoints: pointsByTeam.get(team._id.toString()) ?? 0 }))
    .sort((a, b) => b.totalPoints - a.totalPoints || a.teamName.localeCompare(b.teamName))
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

// Which workout focus each activity type builds.
const FOCUS_BY_ACTIVITY: Record<string, string> = {
  run: 'endurance',
  cycle: 'endurance',
  swim: 'endurance',
  walk: 'endurance',
  strength: 'strength',
  yoga: 'mobility',
};

export async function suggestWorkouts(userEmail: string) {
  const email = userEmail.trim().toLowerCase();
  const user = await User.findOne({ email }).lean();
  if (!user) throw notFound(`No user found with email ${email}`);

  const recent = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(10).lean();
  const focusCounts = new Map<string, number>();
  for (const activity of recent) {
    const focus = FOCUS_BY_ACTIVITY[activity.type];
    if (focus) focusCounts.set(focus, (focusCounts.get(focus) ?? 0) + 1);
  }
  const [topFocus] = [...focusCounts.entries()].sort((a, b) => b[1] - a[1]);
  const focus = topFocus?.[0] ?? user.fitnessGoal;
  const recentTypes = [...new Set(recent.map((activity) => activity.type))];

  const workouts = await Workout.find().sort({ difficulty: 1, title: 1 }).lean();
  const score = (workoutFocus: string) => (workoutFocus === focus ? 2 : workoutFocus === user.fitnessGoal ? 1 : 0);

  return workouts
    .sort((a, b) => score(b.focus) - score(a.focus))
    .map((workout) => ({
      ...workout,
      reason:
        workout.focus === focus && recentTypes.length > 0
          ? `Your recent activity (${recentTypes.join(', ')}) builds ${focus}, so this ${workout.focus} workout keeps that momentum.`
          : workout.focus === user.fitnessGoal
            ? `Matches your ${user.fitnessGoal} fitness goal.`
            : `Adds ${workout.focus} variety to balance your training.`,
    }));
}

export { User };
