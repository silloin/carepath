export function DataState({ loading, error, empty, children }) {
  if (loading) return <div className="data-state">Loading care options...</div>
  if (error) return <div className="data-state data-error">{error.response?.data?.message || 'Unable to load this information right now.'}</div>
  const hasContent = Array.isArray(children) ? children.length > 0 : Boolean(children)
  if (!hasContent && empty) return <div className="data-state">{empty}</div>
  return children
}
