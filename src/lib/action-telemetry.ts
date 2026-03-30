import { exportMonitoringEvent } from "@/lib/monitoring-export";

export type TelemetryLevel = "info" | "error";

export interface ActionTelemetryMeta {
  action: string;
  actorRole?: string;
  actorId?: string;
  schoolId?: string;
  targetId?: string;
  details?: Record<string, unknown>;
}

export interface ActionTelemetryEvent extends ActionTelemetryMeta {
  timestamp: string;
  level: TelemetryLevel;
  message: string;
  error?: unknown;
}

function emit(level: TelemetryLevel, message: string, meta: ActionTelemetryMeta, error?: unknown) {
  const payload: ActionTelemetryEvent = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
    ...(error
      ? {
          error:
            error instanceof Error
              ? {
                  name: error.name,
                  message: error.message,
                }
              : String(error),
        }
      : {}),
  };

  const serialized = JSON.stringify(payload);

  if (level === "error") {
    console.error(serialized);
    void exportMonitoringEvent(payload);
    return;
  }

  console.info(serialized);
  void exportMonitoringEvent(payload);
}

export function logActionSuccess(meta: ActionTelemetryMeta) {
  emit("info", "action_success", meta);
}

export function logActionFailure(meta: ActionTelemetryMeta, error: unknown) {
  emit("error", "action_failure", meta, error);
}
