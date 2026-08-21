const API_BASE = "http://localhost:8000";

export async function uploadFile(file) {
  const formData = new FormData();
  formData.append("file", file);
  
  const response = await fetch(`${API_BASE}/api/upload`, {
    method: "POST",
    body: formData,
  });
  
  if (!response.ok) throw new Error("Failed to upload CSV");
  return await response.json(); // returns { file_id, filename, columns }
}

export async function sendChat(message, fileId) {
  const response = await fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, file_id: fileId }),
  });
  
  if (!response.ok) throw new Error("Failed to process chat query");
  return await response.json(); // returns { text, chart_payload: { data: [...] }, audio_base64 }
}