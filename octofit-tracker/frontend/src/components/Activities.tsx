import { getJson } from '../api/client.js';
import { useApiData } from '../api/useApiData.js';
import { ApiStateView, CapabilityCard } from './CapabilityCard.js';

type Activity = { _id?: string; type: string; minutes: number; points: number; occurredAt?: string };

export default function Activities() {
  const state = useApiData(() => getJson<{ activities: Activity[] }>('/api/activities').then((body) => body.activities), []);

  return (
    <CapabilityCard title="Activities" description="Track student activity minutes and points.">
      <ApiStateView state={state} resource="activities" isEmpty={(activities) => activities.length === 0} emptyMessage="No activities logged yet.">
        {(activities) => (
          <table className="table table-striped align-middle">
            <thead>
              <tr>
                <th scope="col">Type</th>
                <th scope="col">Minutes</th>
                <th scope="col">Points</th>
                <th scope="col">Date</th>
              </tr>
            </thead>
            <tbody>
              {activities.map((activity, index) => (
                <tr key={activity._id ?? index}>
                  <td className="text-capitalize">{activity.type}</td>
                  <td>{activity.minutes}</td>
                  <td>{activity.points}</td>
                  <td>{activity.occurredAt ? new Date(activity.occurredAt).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </ApiStateView>
    </CapabilityCard>
  );
}
