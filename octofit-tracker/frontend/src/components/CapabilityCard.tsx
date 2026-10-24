import type { ReactNode } from 'react';
import type { ApiState } from '../api/useApiData.js';

type Props = { title: string; description: string; children?: ReactNode };

export function CapabilityCard({ title, description, children }: Props) {
  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p className="text-body-secondary">{description}</p>
        {children}
      </div>
    </section>
  );
}

type StateViewProps<T> = {
  state: ApiState<T>;
  resource: string;
  isEmpty: (data: T) => boolean;
  emptyMessage: string;
  children: (data: T) => ReactNode;
};

// Shared loading, error and empty states so every route announces them the same way.
export function ApiStateView<T>({ state, resource, isEmpty, emptyMessage, children }: StateViewProps<T>) {
  if (state.status === 'loading') {
    return (
      <p role="status" className="text-body-secondary">
        <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
        Loading {resource}…
      </p>
    );
  }
  if (state.status === 'error') {
    return (
      <div role="alert" className="alert alert-danger">
        Unable to load {resource}. Please try again later. ({state.message})
      </div>
    );
  }
  if (isEmpty(state.data)) {
    return <p className="alert alert-secondary">{emptyMessage}</p>;
  }
  return <>{children(state.data)}</>;
}
