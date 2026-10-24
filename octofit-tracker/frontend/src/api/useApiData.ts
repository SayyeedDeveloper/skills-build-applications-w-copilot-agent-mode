import { type DependencyList, useEffect, useState } from 'react';

export type ApiState<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: T };

// Runs an API loader (built on getJson) and tracks its loading, error and success states.
// Responses that arrive after the component unmounts or the dependencies change are ignored.
export function useApiData<T>(loader: () => Promise<T>, deps: DependencyList): ApiState<T> {
  const [state, setState] = useState<ApiState<T>>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    setState({ status: 'loading' });
    loader()
      .then((data) => active && setState({ status: 'success', data }))
      .catch((error: unknown) => active && setState({ status: 'error', message: error instanceof Error ? error.message : 'Unknown error' }));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}
