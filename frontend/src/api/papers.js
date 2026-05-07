import client from "./client";

export function getLibrary() {
  return client.get("/api/library");
}

export function uploadPaper(formData) {
  return client.postForm("/api/upload", formData);
}

export function comparePapers(paperIds) {
  return client.post("/api/compare", { paper_ids: paperIds });
}

export function generateReview(topic, paperIds) {
  return client.post("/api/generate-review", { topic, paper_ids: paperIds });
}

export function deletePaper(paperId) {
  return client.del(`/api/papers/${paperId}`);
}

export function searchPapers(query = "", year = "", page = 1, pageSize = 20) {
  return client.post("/api/search", { query, year, page, page_size: pageSize });
}
