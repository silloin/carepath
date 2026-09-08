import test from 'node:test'
import assert from 'node:assert/strict'
import { providerState } from '../src/utils/provider-state.js'
import { signUser, verifyUserToken } from '../src/middleware/auth.js'
import { requireRole } from '../src/middleware/auth.js'
import { isPublicProvider } from '../src/utils/marketplace.js'

test('provider state disables comparison for zero and one provider', () => {
  assert.deepEqual(providerState(0), { state: 'NONE', comparisonEnabled: false, message: 'No verified hospitals currently offer this treatment.' })
  assert.deepEqual(providerState(1), { state: 'SINGLE', comparisonEnabled: false, message: '1 verified hospital currently offers this treatment.' })
})

test('provider state enables comparison only for multiple providers', () => {
  const state = providerState(2)
  assert.equal(state.state, 'COMPARABLE')
  assert.equal(state.comparisonEnabled, true)
})

test('JWT preserves role claims for authorization', () => {
  const token = signUser({ id: 'user-a', role: 'PATIENT' })
  const claims = verifyUserToken(token)
  assert.equal(claims.sub, 'user-a')
  assert.equal(claims.role, 'PATIENT')
  assert.equal(typeof claims.exp, 'number')
})

function roleCheck(role, allowedRole) {
  let status = 200
  let nextCalled = false
  const response = { status: (value) => { status = value; return response }, json: () => response }
  requireRole(allowedRole)({ auth: role ? { role } : undefined }, response, () => { nextCalled = true })
  return { status, nextCalled }
}

test('only admins can approve moderation actions', () => {
  assert.deepEqual(roleCheck('ADMIN', 'ADMIN'), { status: 200, nextCalled: true })
  assert.deepEqual(roleCheck('HOSPITAL', 'ADMIN'), { status: 403, nextCalled: false })
  assert.deepEqual(roleCheck('PATIENT', 'ADMIN'), { status: 403, nextCalled: false })
  assert.deepEqual(roleCheck(null, 'ADMIN'), { status: 403, nextCalled: false })
})

test('public provider rules require approved, available, verified records', () => {
  const base = { approvalStatus: 'APPROVED', availability: 'AVAILABLE', hospital: { status: 'VERIFIED' } }
  assert.equal(isPublicProvider(base), true)
  assert.equal(isPublicProvider({ ...base, approvalStatus: 'PENDING' }), false)
  assert.equal(isPublicProvider({ ...base, approvalStatus: 'REJECTED' }), false)
  assert.equal(isPublicProvider({ ...base, hospital: { status: 'SUSPENDED' } }), false)
  assert.equal(isPublicProvider({ ...base, availability: 'TEMPORARILY_UNAVAILABLE' }), false)
})
