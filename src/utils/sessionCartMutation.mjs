import { sessionLifecycle, isSessionSuperseded, SessionSupersededError } from "./sessionLifecycle.mjs";

// Capture at mutate(), before React Query can pause the mutation in its line
// queue. The internal envelope never becomes an HTTP payload.
export function captureCartMutation(variables, lifecycle = sessionLifecycle) {
  return { variables, generation: lifecycle.generation(), permitted: lifecycle.ready() };
}
export function sessionCartOptions(options, lifecycle = sessionLifecycle) {
  const current = (request) => lifecycle.current(request.generation) && lifecycle.ready();
  return {
    ...options,
    mutationFn: async (request) => {
      if (!request.permitted) throw new SessionSupersededError();
      lifecycle.assertCurrent(request.generation, true);
      const data = await options.mutationFn(request.variables);
      await lifecycle.waitUntilReady(request.generation);
      return data;
    },
    onSuccess: (data, request, ...rest) => {
      if (current(request)) return options.onSuccess?.(data, request.variables, ...rest);
    },
    onError: (error, request, ...rest) => {
      if (current(request) && !isSessionSuperseded(error)) return options.onError?.(error, request.variables, ...rest);
    },
    onSettled: (data, error, request, ...rest) => {
      if (current(request) && !isSessionSuperseded(error)) return options.onSettled?.(data, error, request.variables, ...rest);
    },
  };
}
export function cartMutationCallbacks(callbacks, request, lifecycle = sessionLifecycle) {
  if (!callbacks) return callbacks;
  const current = () => lifecycle.current(request.generation) && lifecycle.ready();
  return {
    ...callbacks,
    onSuccess: (data, _request, ...rest) => { if (current()) callbacks.onSuccess?.(data, request.variables, ...rest); },
    onError: (error, _request, ...rest) => { if (current() && !isSessionSuperseded(error)) callbacks.onError?.(error, request.variables, ...rest); },
    // Current callers use this only to release the line's local pending guard.
    // It must run even when a queued operation is discarded, never strand it.
    onSettled: (data, error, _request, ...rest) => callbacks.onSettled?.(data, error, request.variables, ...rest),
  };
}
