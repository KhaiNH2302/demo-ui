import type { QueryClient } from '@tanstack/react-query';

/** Prefixes also refresh cards, request history and navigation badges. */
export function invalidateGroupQueries(queryClient: QueryClient) {
  return Promise.all([
    ['groups'], ['group-invitations'], ['chat'], ['notifications'], ['nav'], ['requests'],
  ].map((queryKey) => queryClient.invalidateQueries({ queryKey })));
}
