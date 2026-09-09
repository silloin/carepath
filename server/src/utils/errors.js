export function normalizeError(error) {
  if (error?.name === 'ZodError') return { status: 422, message: 'Validation failed', error: error.flatten() }
  if (error?.name === 'MulterError') return { status: 422, message: 'Uploaded file is invalid or too large', error: {} }
  if (error?.code === 'LIMIT_FILE_SIZE') return { status: 422, message: 'Uploaded file is too large', error: {} }
  if (error?.code === 'P2002') {
    const fields = error?.meta?.target || [];
    const target = Array.isArray(fields) ? fields.join(', ') : String(fields || '');
    const fieldMessages = {
      email: 'A user with this email already exists.',
      slug: 'A hospital with a similar name already generated a conflicting URL slug. Try adding a city or suffix to the hospital name.',
      userId: 'This user is already linked to another profile.',
    };
    const specificMessage = target && fieldMessages[target];
    return {
      status: 409,
      message: specificMessage || (target ? `A record with this ${target} already exists.` : 'A record with those details already exists.'),
      error: { target },
    };
  }
  if (error?.code === 'P1000' || error?.code === 'P1001') return { status: 503, message: 'Database is unavailable', error: {} }
  return { status: 500, message: 'Something went wrong', error: {} }
}
