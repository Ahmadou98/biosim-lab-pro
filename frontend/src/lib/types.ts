export type BatchStatus = 'READY' | 'RUNNING' | 'AWAITING_QC' | 'ON_HOLD' | 'SIMULATED_RELEASED';
export interface TrainingBatch {
  id: number; batchCode: string; scenario: 'bioreactor' | 'purification' | 'fillfinish' | string; status: BatchStatus;
  phase: string; step: number; progressPercent: number; temperatureSetpointIndex: number; agitationSetpointIndex: number; gasTransferSetpointIndex: number;
  temperatureActualIndex: number; agitationActualIndex: number; gasTransferActualIndex: number; qualityTrendIndex: number; alarmCount: number; createdAt: string; updatedAt: string;
}
export interface SimulationEvent { id: number; batchCode: string; severity: 'INFO' | 'WARN' | 'ALARM'; category: string; message: string; stepNumber: number; createdAt: string; }
export interface QualityTest { id: number; batchCode: string; testId: string; name: string; resultValue: number; unit: string; criterion: string; resultStatus: 'CONFORME' | 'HORS_LIMITE'; interpretation: string; createdAt: string; }
export interface TrainingDeviation { id: number; batchCode: string; title: string; severity: 'MINEURE' | 'MAJEURE' | 'CRITIQUE'; status: 'OPEN' | 'CAPA_IN_PROGRESS' | 'CLOSED'; action: string; createdAt: string; updatedAt: string; }
export interface SimulationSnapshot { batch: TrainingBatch; events: SimulationEvent[]; qualityTests: QualityTest[]; deviations: TrainingDeviation[]; telemetry: TelemetrySample[]; }
export interface DashboardSummary { batchCode: string; status: BatchStatus; progressPercent: number; completedSteps: number; totalSteps: number; alarmCount: number; testsExecuted: number; testsPassed: number; openDeviations: number; qualityTrendIndex: number; }
export interface ReleaseResult { passed: boolean; disposition: string; blockers: string[]; message: string; }
export interface TelemetrySample { id: number; batchCode: string; stepNumber: number; temperatureIndex: number; agitationIndex: number; gasTransferIndex: number; qualityTrendIndex: number; createdAt: string; }
