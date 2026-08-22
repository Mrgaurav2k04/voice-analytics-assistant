import { http, HttpResponse } from 'msw'

export const handlers = [
  http.post('/api/upload', async ({ request }) => {
    const formData = await request.formData()
    const file = formData.get('file')
    await new Promise(r => setTimeout(r, 800))
    return HttpResponse.json({
      file_id: 'mock-file-123',
      filename: file?.name || 'data.csv',
      columns: 5,
      rows: 1240,
      missing_values: 12,
      values_imputed: 12,
      message: 'File processed successfully'
    })
  }),

  http.post('/api/chat', async ({ request }) => {
    const { message } = await request.json()
    await new Promise(r => setTimeout(r, 1200))
    
    const chartData = []
    const baseDate = new Date('2026-01-01')
    
    for (let i = 0; i < 50; i++) {
      const date = new Date(baseDate)
      date.setMonth(date.getMonth() + i)
      chartData.push({
        date: date.toISOString().split('T')[0],
        historical: i < 45 ? 100 + i * 2 + Math.random() * 10 : null,
        imputed: i >= 45 ? 190 + (i-45) * 2 : null,
        forecast: null,
        lower_bound: null,
        upper_bound: null
      })
    }
    
    for (let i = 0; i < 6; i++) {
      const date = new Date(baseDate)
      date.setMonth(date.getMonth() + 50 + i)
      const val = 200 + i * 3
      chartData.push({
        date: date.toISOString().split('T')[0],
        historical: null,
        imputed: null,
        forecast: val,
        lower_bound: val - 10,
        upper_bound: val + 10
      })
    }
    
    const audioBase64 = 'SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAACAAABhAAAABAAAABAAAAA'
    
    return HttpResponse.json({
      text: `I analyzed: "${message}". Here's the 6-period forecast.`,
      chart_payload: { data: chartData },
      audio_base64: audioBase64
    })
  })
]