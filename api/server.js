// local dev server — not used in production (Vercel handles that via api/index.js)
import 'dotenv/config'
import app from './index.js'

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`)
})
