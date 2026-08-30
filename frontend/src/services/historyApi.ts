import { apiGet, apiPost, apiPatch, apiDelete } from "./api";
import type { HistoryItem, HistoryPayload } from "../types/history";

export const historyApi = {
  getAll: () => apiGet<HistoryItem[]>("/history"),

  add: (data: HistoryPayload) => apiPost<HistoryItem>("/history", data),

  update: (
    id: string,
    data: { progress?: number; duration?: number; completed?: boolean },
  ) => apiPatch<HistoryItem>(`/history/${id}`, data),

  remove: (id: string) => apiDelete(`/history/${id}`),

  clear: () => apiDelete("/history/clear"),
};
