/**
 * Shares one in-flight async call per key. Callers that arrive while a call
 * for the same key is still running get that same promise instead of starting
 * another. Once it settles (success or failure), the next call runs fresh.
 */
export function createSingleFlight<K, V>() {
  const inFlight = new Map<K, Promise<V>>();
  return (key: K, run: () => Promise<V>): Promise<V> => {
    const existing = inFlight.get(key);
    if (existing) return existing;
    const promise = run().finally(() => inFlight.delete(key));
    inFlight.set(key, promise);
    return promise;
  };
}
