import jwt from 'jsonwebtoken'

const secret = process.env.JWT_SECRET || 'development-only-secret'

export function verifyUserToken(token) {
  return jwt.verify(token, secret)
}

export function signUser(user) {
  return jwt.sign({ sub: user.id, role: user.role }, secret, { expiresIn: '7d' })
}

export function requireAuth(request, response, next) {
  const authHeader = request.headers.authorization
  const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  const token = request.cookies?.carepath_token || bearerToken
  if (!token) return response.status(401).json({ success: false, message: 'Authentication required', error: {} })
  try {
    request.auth = verifyUserToken(token)
    next()
  } catch {
    return response.status(401).json({ success: false, message: 'Session expired', error: {} })
  }
}

export function requireRole(...roles) {
  return (request, response, next) => {
    if (!request.auth || !roles.includes(request.auth.role)) return response.status(403).json({ success: false, message: 'Forbidden', error: {} })
    next()
  }
}
