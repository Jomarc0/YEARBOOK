import api from "@/services/api";

export const announcementsApi = {
  list: (params = {}) => api.get("/announcements", { params }),
  recipientCount: () => api.get("/announcements/recipients/count"),
  create: (payload) => api.post("/announcements", payload),
  delete: (id) => api.delete(`/announcements/${id}`),
};
