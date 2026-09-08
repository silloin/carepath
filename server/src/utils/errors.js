export function normalizeError(error) {
  if (error?.name === 'ZodError') return { status: 422, message: 'Validation failed', error: error.flatten() }
  if (error?.name === 'MulterError') return { status: 422, message: 'Uploaded file is invalid or too large', error: {} }
  if (error?.code === 'LIMIT_FILE_SIZE') return { status: 422, message: 'Uploaded file is too large', error: {} }
  if (error?.code === 'P2002') return { status: 409, message: 'A record with those details already exists', error: {} }
  if (error?.code === 'P1000' || error?.code === 'P1001') return { status: 503, message: 'Database is unavailable', error: {} }
  return { status: 500, message: 'Something went wrong', error: {} }
}
