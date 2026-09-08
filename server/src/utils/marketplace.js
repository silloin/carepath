export const approvedAvailableProviderWhere = {
  availability: 'AVAILABLE',
  approvalStatus: 'APPROVED',
  hospital: { status: 'VERIFIED' },
}

export function isPublicProvider(record) {
  return record.approvalStatus === 'APPROVED' && record.availability === 'AVAILABLE' && record.hospital?.status === 'VERIFIED'
}
