import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const app = express()
app.use(cors())
app.use(express.json())

// ── DB connection (cached for serverless cold starts) ────────────────────────
let cachedConn = null
async function connectDB() {
  if (cachedConn) return cachedConn
  cachedConn = await mongoose.connect(process.env.MONGO_URI)
  return cachedConn
}

// ── Models ───────────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  email:    { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
})
const User = mongoose.models.User || mongoose.model('User', userSchema)

const ticketSchema = new mongoose.Schema({
  ticket_id:      { type: String, unique: true, required: true },
  customer_name:  { type: String, required: true },
  customer_email: { type: String, required: true },
  subject:        { type: String, required: true },
  description:    { type: String, required: true },
  status:         { type: String, enum: ['Open', 'In Progress', 'Closed'], default: 'Open' },
  priority:       { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  created_at:     { type: Date, default: Date.now },
  updated_at:     { type: Date, default: Date.now },
})
const Ticket = mongoose.models.Ticket || mongoose.model('Ticket', ticketSchema)

const noteSchema = new mongoose.Schema({
  ticket_id: { type: String, required: true, ref: 'Ticket' },
  note_text: { type: String, required: true },
  author:    { type: String, default: 'Agent' },
  created_at: { type: Date, default: Date.now },
})
const Note = mongoose.models.Note || mongoose.model('Note', noteSchema)

// ── Auth middleware ──────────────────────────────────────────────────────────
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' })
  }
  const token = authHeader.split(' ')[1]
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

// helper: generate ticket ID like TKT-0042
async function genTicketId() {
  const count = await Ticket.countDocuments()
  return `TKT-${String(count + 1).padStart(4, '0')}`
}

// ── Auth routes ──────────────────────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  await connectDB()
  const { name, email, password } = req.body
  if (!name || !email || !password)
    return res.status(400).json({ error: 'All fields required' })

  const exists = await User.findOne({ email })
  if (exists) return res.status(409).json({ error: 'Email already registered' })

  const hashed = await bcrypt.hash(password, 10)
  const user = await User.create({ name, email, password: hashed })
  const token = jwt.sign({ id: user._id, name: user.name, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' })
  res.status(201).json({ token, user: { name: user.name, email: user.email } })
})

app.post('/api/auth/login', async (req, res) => {
  await connectDB()
  const { email, password } = req.body
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password required' })

  const user = await User.findOne({ email })
  if (!user) return res.status(401).json({ error: 'Invalid credentials' })

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' })

  const token = jwt.sign({ id: user._id, name: user.name, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' })
  res.json({ token, user: { name: user.name, email: user.email } })
})

// ── Ticket routes (all protected) ────────────────────────────────────────────
// GET /api/tickets?status=Open&search=john
app.get('/api/tickets', verifyToken, async (req, res) => {
  await connectDB()
  const { status, search } = req.query
  const filter = {}

  if (status && status !== 'All') filter.status = status

  if (search) {
    const re = new RegExp(search, 'i')
    filter.$or = [
      { customer_name: re },
      { customer_email: re },
      { subject: re },
      { ticket_id: re },
      { description: re },
    ]
  }

  const tickets = await Ticket.find(filter).sort({ created_at: -1 }).limit(100)
  res.json(tickets)
})

// POST /api/tickets
app.post('/api/tickets', verifyToken, async (req, res) => {
  await connectDB()
  const { customer_name, customer_email, subject, description, priority } = req.body
  if (!customer_name || !customer_email || !subject || !description)
    return res.status(400).json({ error: 'Required fields missing' })

  const ticket_id = await genTicketId()
  const ticket = await Ticket.create({
    ticket_id,
    customer_name,
    customer_email,
    subject,
    description,
    priority: priority || 'Medium',
  })
  res.status(201).json({ ticket_id: ticket.ticket_id, created_at: ticket.created_at })
})

// GET /api/tickets/:ticket_id
app.get('/api/tickets/:ticket_id', verifyToken, async (req, res) => {
  await connectDB()
  const ticket = await Ticket.findOne({ ticket_id: req.params.ticket_id })
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' })

  const notes = await Note.find({ ticket_id: req.params.ticket_id }).sort({ created_at: 1 })
  res.json({ ...ticket.toObject(), notes })
})

// PUT /api/tickets/:ticket_id
app.put('/api/tickets/:ticket_id', verifyToken, async (req, res) => {
  await connectDB()
  const { status, note_text } = req.body

  const ticket = await Ticket.findOne({ ticket_id: req.params.ticket_id })
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' })

  if (status) {
    ticket.status = status
    ticket.updated_at = new Date()
    await ticket.save()
  }

  if (note_text?.trim()) {
    const author = req.user.name || 'Agent'
    await Note.create({ ticket_id: req.params.ticket_id, note_text: note_text.trim(), author })
  }

  res.json({ success: true, updated_at: ticket.updated_at })
})

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
})

// ── Export for Vercel serverless ─────────────────────────────────────────────
export default app
