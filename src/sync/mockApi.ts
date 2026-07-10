import type { TriageSubmissionPayload } from '../types/triage';

export class MockApiService {
  private failureRate: number = 0.0; // 0 to 1
  private delayMs: number = 2000;    // required 2s delay

  constructor(failureRate = 0.0, delayMs = 2000) {
    this.failureRate = failureRate;
    this.delayMs = delayMs;
  }

  setFailureRate(rate: number) {
    this.failureRate = Math.max(0, Math.min(1, rate));
  }

  async submitTriage(payload: TriageSubmissionPayload): Promise<{ success: boolean; serverId: string }> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() < this.failureRate) {
          return reject(new Error('[MockAPI] Simulated network failure'));
        }
        resolve({
          success: true,
          serverId: `srv_${payload.id}`,
        });
      }, this.delayMs);
    });
  }
}

export const mockApi = new MockApiService();