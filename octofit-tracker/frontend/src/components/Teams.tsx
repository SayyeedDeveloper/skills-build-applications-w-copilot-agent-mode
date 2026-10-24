import { getJson } from '../api/client.js';
import { useApiData } from '../api/useApiData.js';
import { ApiStateView, CapabilityCard } from './CapabilityCard.js';

type Team = { _id?: string; name: string; mascot?: string; members: string[] };

export default function Teams() {
  const state = useApiData(() => getJson<{ teams: Team[] }>('/api/teams').then((body) => body.teams), []);

  return (
    <CapabilityCard title="Teams" description="Manage teams and members.">
      <ApiStateView state={state} resource="teams" isEmpty={(teams) => teams.length === 0} emptyMessage="No teams have been created yet.">
        {(teams) => (
          <table className="table table-striped align-middle">
            <thead>
              <tr>
                <th scope="col">Team</th>
                <th scope="col">Mascot</th>
                <th scope="col">Members</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team, index) => (
                <tr key={team._id ?? index}>
                  <td>{team.name}</td>
                  <td>{team.mascot ?? '—'}</td>
                  <td>{team.members.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </ApiStateView>
    </CapabilityCard>
  );
}
