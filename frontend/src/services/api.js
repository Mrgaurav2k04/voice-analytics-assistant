const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

export async function uploadFile(file) {
  const formData = new FormData()
  formData.append('file', file)
  
  console.log('[API] POST /api/upload', file.name)
  
  const response = await fetch(`${API_BASE}/api/upload`, {
    method: 'POST',
    body: formData,
  })
  
  console.log('[API] Response status:', response.status)
  
  if (!response.ok) {
    const text = await response.text()
    console.error('[API] Error body:', text)
    throw new Error('Failed to upload CSV')
  }
  return await response.json()
}

export async function sendChat(message, fileId) {
  console.log('[API] POST /api/chat', { message, fileId })
  
  const response = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, file_id: fileId }),
  })
  
  console.log('[API] Response status:', response.status)
  
  if (!response.ok) {
    const text = await response.text()
    console.error('[API] Error body:', text)
    throw new Error('Failed to process chat query')
  }
  return await response.json()
}