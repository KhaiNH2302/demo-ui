export function isDemoEnvironment(env: { DEV?: boolean; VITE_USE_MOCK?: string }): boolean {
  return env.DEV === true || env.VITE_USE_MOCK === 'true';
}
export const isDemoMode = isDemoEnvironment(import.meta.env);
