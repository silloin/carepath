import { Server } from 'socket.io'
import { parse } from 'node:querystring'
import { prisma } from '../config/db.js'
import { verifyUserToken } from '../middleware/auth.js'

function cookieValue(cookieHeader, name) {
  const cookies = parse((cookieHeader || '').replaceAll('; ', '&'))
  return cookies[name]
}

export function attachChat(httpServer) {
  const io = new Server(httpServer, { cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true } })
  io.use(async (socket, next) => {
    try {
      const token = cookieValue(socket.handshake.headers.cookie, 'carepath_token')
      if (!token) return next(new Error('Authentication required'))
      const auth = verifyUserToken(token)
      const user = await prisma.user.findUnique({ where: { id: auth.sub }, include: { patient: true, hospital: true } })
      if (!user) return next(new Error('User not found'))
      socket.user = user
      next()
    } catch { next(new Error('Invalid session')) }
  })
  io.on('connection', (socket) => {
    socket.on('conversation:join', async ({ conversationId }) => {
      const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } })
      const allowed = conversation && ((socket.user.patient && conversation.patientId === socket.user.patient.id) || (socket.user.hospital && conversation.hospitalId === socket.user.hospital.id))
      if (!allowed) return socket.emit('chat:error', { message: 'Conversation access denied' })
      socket.join(conversationId)
      socket.emit('conversation:ready', { conversationId })
    })
    socket.on('message:send', async ({ conversationId, content }) => {
      if (typeof content !== 'string' || !content.trim() || content.length > 4000) return socket.emit('chat:error', { message: 'Message must contain 1–4000 characters' })
      const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } })
      const allowed = conversation && ((socket.user.patient && conversation.patientId === socket.user.patient.id) || (socket.user.hospital && conversation.hospitalId === socket.user.hospital.id))
      if (!allowed) return socket.emit('chat:error', { message: 'Conversation access denied' })
      const message = await prisma.message.create({ data: { conversationId, senderId: socket.user.id, content: content.trim() } })
      io.to(conversationId).emit('message:new', message)
    })
  })
  return io
}
