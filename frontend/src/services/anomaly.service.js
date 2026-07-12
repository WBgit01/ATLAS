import api from "@/lib/api"

export async function fetchAnomalies(params = {}) {
  const { data } = await api.get("/imports/anomalies/list", { params })
  return data
}

export async function resolveAnomaly(anomalyId, payload) {
  const { data } = await api.patch(`/imports/anomalies/${anomalyId}`, payload)
  return data
}
