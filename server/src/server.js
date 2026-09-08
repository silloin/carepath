import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import { createServer } from 'node:http'
import api from './routes/api.js'
import { normalizeError } from './utils/errors.js'
import { attachChat } from './sockets/chat.js'

const app = express()
const port = Number(process.env.PORT || 4000)

app.use(helmet())
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }))
app.use(express.json())
app.use(cookieParser())
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false }))
app.use(morgan('dev'))

app.get('/api/health', (_request, response) => response.json({ success: true, message: 'Carepath API is running', data: { status: 'ok' } }))
app.use('/api', api)
app.use((error, _request, response, _next) => { console.error(error); const normalized = normalizeError(error); response.status(normalized.status).json({ success: false, message: normalized.message, error: normalized.error }) })

const httpServer = createServer(app)
attachChat(httpServer)
if (process.env.NODE_ENV !== 'test') {
  httpServer.listen(port, () => console.log(`Carepath API listening on http://localhost:${port}`))
}

export { app }