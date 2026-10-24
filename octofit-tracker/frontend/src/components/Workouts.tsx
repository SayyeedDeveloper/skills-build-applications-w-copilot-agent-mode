import { type FormEvent, useState } from 'react';
import { getJson } from '../api/client.js';
import { useApiData } from '../api/useApiData.js';
import { ApiStateView, CapabilityCard } from './CapabilityCard.js';

type Suggestion = { _id?: string; title: string; focus?: string; minutes?: number; difficulty?: string; reason: string };

const DEFAULT_EMAIL = 'mona@example.com';

export default function Workouts() {
  const [email, setEmail] = useState(DEFAULT_EMAIL);
  const [draft, setDraft] = useState(DEFAULT_EMAIL);
  const state = useApiData(
    () => getJson<{ suggestions: Suggestion[] }>(`/api/workouts/suggestions/${encodeURIComponent(email)}`).then((body) => body.suggestions),
    [email],
  );

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (draft.trim()) setEmail(draft.trim());
  }

  return (
    <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns.">
      <form className="row g-2 align-items-end mb-3" onSubmit={handleSubmit}>
        <div className="col-sm-8">
          <label htmlFor="suggestion-email" className="form-label">Student email</label>
          <input id="suggestion-email" type="email" className="form-control" value={draft} onChange={(event) => setDraft(event.target.value)} />
        </div>
        <div className="col-sm-4">
          <button type="submit" className="btn btn-primary w-100">Get suggestions</button>
        </div>
      </form>
      <ApiStateView state={state} resource={`workout suggestions for ${email}`} isEmpty={(suggestions) => suggestions.length === 0} emptyMessage="No workout suggestions available yet.">
        {(suggestions) => (
          <ul className="list-group">
            {suggestions.map((suggestion, index) => (
              <li key={suggestion._id ?? index} className="list-group-item">
                <div className="d-flex justify-content-between flex-wrap gap-2">
                  <strong>{suggestion.title}</strong>
                  {suggestion.focus && (
                    <span className="badge text-bg-info text-capitalize">
                      {suggestion.focus}
                      {suggestion.minutes ? ` · ${suggestion.minutes} min` : ''}
                      {suggestion.difficulty ? ` · ${suggestion.difficulty}` : ''}
                    </span>
                  )}
                </div>
                <p className="mb-0 small text-body-secondary">{suggestion.reason}</p>
              </li>
            ))}
          </ul>
        )}
      </ApiStateView>
    </CapabilityCard>
  );
}
