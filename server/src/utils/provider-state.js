export function providerState(count) {
  if (count === 0) return { state: 'NONE', comparisonEnabled: false, message: 'No verified hospitals currently offer this treatment.' }
  if (count === 1) return { state: 'SINGLE', comparisonEnabled: false, message: '1 verified hospital currently offers this treatment.' }
  return { state: 'COMPARABLE', comparisonEnabled: true, message: `${count} verified hospitals currently offer this treatment.` }
}
