import { getJson } from '../api/client.js';
import { useApiData } from '../api/useApiData.js';
import { ApiStateView, CapabilityCard } from './CapabilityCard.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };

export default function Leaderboard() {
  const state = useApiData(() => getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard').then((body) => body.leaderboard), []);

  return (
    <CapabilityCard title="Leaderboard" description="Compare team point totals.">
      <ApiStateView state={state} resource="the leaderboard" isEmpty={(entries) => entries.length === 0} emptyMessage="No leaderboard entries yet. Log an activity to get on the board!">
        {(entries) => (
          <table className="table table-striped align-middle">
            <thead>
              <tr>
                <th scope="col">Rank</th>
                <th scope="col">Team</th>
                <th scope="col">Total points</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.teamName}>
                  <td>#{entry.rank}</td>
                  <td>{entry.teamName}</td>
                  <td>{entry.totalPoints}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </ApiStateView>
    </CapabilityCard>
  );
}
