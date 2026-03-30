import type { ActionTelemetryEvent } from "@/lib/action-telemetry";

const OTLP_CONTENT_TYPE = "application/json";

function parseOtlpHeaders(rawHeaders: string | undefined): Record<string, string> {
  if (!rawHeaders) {
    return {};
  }

  return rawHeaders
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((headers, entry) => {
      const separatorIndex = entry.indexOf("=");
      if (separatorIndex <= 0) {
        return headers;
      }

      const key = entry.slice(0, separatorIndex).trim();
      const value = entry.slice(separatorIndex + 1).trim();

      if (key.length > 0 && value.length > 0) {
        headers[key] = value;
      }

      return headers;
    }, {});
}

function getOtlpLogsEndpoint(): string | undefined {
  const logsEndpoint = process.env.OTEL_EXPORTER_OTLP_LOGS_ENDPOINT?.trim();
  if (logsEndpoint) {
    return logsEndpoint;
  }

  const baseEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT?.trim();
  if (!baseEndpoint) {
    return undefined;
  }

  return `${baseEndpoint.replace(/\/+$/, "")}/v1/logs`;
}

function toAttributeValue(value: unknown):
  | { stringValue: string }
  | { boolValue: boolean }
  | { doubleValue: number }
  | undefined {
  if (typeof value === "string") {
    return { stringValue: value };
  }

  if (typeof value === "boolean") {
    return { boolValue: value };
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return { doubleValue: value };
  }

  return undefined;
}

function toOtlpAttributes(event: ActionTelemetryEvent) {
  const attributes: Array<{ key: string; value: { stringValue: string } | { boolValue: boolean } | { doubleValue: number } }> = [];

  const coreAttributes: Record<string, unknown> = {
    "kmc.action": event.action,
    "kmc.actor_role": event.actorRole,
    "kmc.actor_id": event.actorId,
    "kmc.school_id": event.schoolId,
    "kmc.target_id": event.targetId,
  };

  for (const [key, value] of Object.entries(coreAttributes)) {
    const attributeValue = toAttributeValue(value);
    if (attributeValue) {
      attributes.push({ key, value: attributeValue });
    }
  }

  if (event.details) {
    for (const [key, value] of Object.entries(event.details)) {
      const attributeValue = toAttributeValue(value);
      if (attributeValue) {
        attributes.push({ key: `kmc.detail.${key}`, value: attributeValue });
      }
    }
  }

  if (event.error) {
    attributes.push({
      key: "kmc.error",
      value: { stringValue: typeof event.error === "string" ? event.error : JSON.stringify(event.error) },
    });
  }

  return attributes;
}

async function exportToOtlp(event: ActionTelemetryEvent) {
  const endpoint = getOtlpLogsEndpoint();
  if (!endpoint) {
    return;
  }

  const timestampMs = Date.parse(event.timestamp);
  const unixNanos = Number.isNaN(timestampMs)
    ? `${Date.now()}000000`
    : `${timestampMs}000000`;
  const serviceName = process.env.OTEL_SERVICE_NAME?.trim() || "kmc-app";

  const payload = {
    resourceLogs: [
      {
        resource: {
          attributes: [{ key: "service.name", value: { stringValue: serviceName } }],
        },
        scopeLogs: [
          {
            scope: { name: "kmc.action-telemetry" },
            logRecords: [
              {
                timeUnixNano: unixNanos,
                severityText: event.level.toUpperCase(),
                body: { stringValue: event.message },
                attributes: toOtlpAttributes(event),
              },
            ],
          },
        ],
      },
    ],
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": OTLP_CONTENT_TYPE,
      ...parseOtlpHeaders(process.env.OTEL_EXPORTER_OTLP_HEADERS),
    },
    cache: "no-store",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`OTLP export failed with status ${response.status}`);
  }
}

async function exportToWebhook(event: ActionTelemetryEvent) {
  const endpoint = process.env.MONITORING_WEBHOOK_URL?.trim();
  if (!endpoint) {
    return;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": OTLP_CONTENT_TYPE },
    cache: "no-store",
    body: JSON.stringify(event),
  });

  if (!response.ok) {
    throw new Error(`Webhook export failed with status ${response.status}`);
  }
}

export async function exportMonitoringEvent(event: ActionTelemetryEvent) {
  const jobs = [exportToOtlp(event), exportToWebhook(event)];
  const results = await Promise.allSettled(jobs);

  for (const result of results) {
    if (result.status === "rejected") {
      console.error(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: "error",
          message: "monitoring_export_failure",
          error: result.reason instanceof Error ? result.reason.message : String(result.reason),
          action: event.action,
          targetId: event.targetId,
        })
      );
    }
  }
}

export function getMonitoringBootstrapInfo() {
  return {
    otlpLogsEndpoint: getOtlpLogsEndpoint() || null,
    webhookEndpointConfigured: Boolean(process.env.MONITORING_WEBHOOK_URL?.trim()),
    serviceName: process.env.OTEL_SERVICE_NAME?.trim() || "kmc-app",
  };
}
