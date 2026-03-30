import { getMonitoringBootstrapInfo } from "@/lib/monitoring-export";

export function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  const info = getMonitoringBootstrapInfo();
  console.info(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "info",
      message: "monitoring_bootstrap",
      details: info,
    })
  );
}
