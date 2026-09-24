export function mockDelay(min = 100, max = 300): Promise<void> {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isScenarioActive(scenarioKey: string): boolean {
  try {
    const raw = localStorage.getItem('scs_mock_scenarios');
    if (!raw) return false;
    const scenarios = JSON.parse(raw);
    return !!scenarios[scenarioKey];
  } catch {
    return false;
  }
}

export function setScenarioActive(scenarioKey: string, active: boolean): void {
  try {
    const raw = localStorage.getItem('scs_mock_scenarios');
    const scenarios = raw ? JSON.parse(raw) : {};
    scenarios[scenarioKey] = active;
    localStorage.setItem('scs_mock_scenarios', JSON.stringify(scenarios));
  } catch {
    // ignore
  }
}
