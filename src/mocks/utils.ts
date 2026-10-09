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

/** ID dùng cho khách chưa đăng nhập — không khớp bản ghi nào nên không lộ dữ liệu cá nhân. */
export const GUEST_VIEWER_ID = 'guest';

/** Identity from an actual mock token. Sample preview never grants write access. */
export function getAuthenticatedViewerId(request: Request): string {
  const authHeader = request.headers.get('Authorization') || '';
  return /^Bearer mock_jwt_token_([^\s]+)$/.exec(authHeader)?.[1] ?? GUEST_VIEWER_ID;
}

/**
 * Lấy ID người xem từ token mock.
 * - Có token → ID trong token.
 * - Khách đang xem bản xem trước làm mờ (header X-Demo-Sample) → dữ liệu mẫu của `sampleFallback`.
 * - Khách thường → GUEST_VIEWER_ID.
 */
export function getViewerId(request: Request, sampleFallback = 'usr_student_01'): string {
  const id = getAuthenticatedViewerId(request);
  if (id !== GUEST_VIEWER_ID) return id;
  return request.headers.get('X-Demo-Sample') === '1' ? sampleFallback : GUEST_VIEWER_ID;
}
