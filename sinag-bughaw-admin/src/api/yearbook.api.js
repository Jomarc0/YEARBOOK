import api from "@/services/api";

export const announcementsApi = {
  list: (params = {}) => api.get("/announcements", { params }),
  recipientCount: (params = {}) => api.get("/announcements/recipients/count", { params }),
  create: (payload) => api.post("/announcements", payload),
  update: (id, payload) => api.put(`/announcements/${id}`, payload),
  delete: (id) => api.delete(`/announcements/${id}`),
};
