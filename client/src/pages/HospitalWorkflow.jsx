import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { io } from 'socket.io-client'
import { ArrowRight, FileText } from 'lucide-react'
import { confirmAppointment, getHospitalCases, sendHospitalResponse, updateCaseStatus, updateAppointmentDateTime } from '../api'
import { DataState } from '../components/DataState'
import { useAuth } from '../store/auth'
import { DashboardShell } from '../App.jsx'

function HospitalChat({ conversation }) {
  const { user } = useAuth()
  const [allMessages, setAllMessages] = useState([])
  const [content, setContent] = useState('')
  
  // Initialize messages from database when conversation loads
  useEffect(() => {
    if (conversation?.messages) {
      setAllMessages(conversation.messages)
    }
  }, [conversation?.messages])

  useEffect(() => { 
    if (!conversation?.id) return undefined; 
    const socket = io('/', { withCredentials: true }); 
    socket.emit('conversation:join', { conversationId: conversation.id }); 
    // Add new messages to the combined list to avoid duplicates
    socket.on('message:new', (message) => setAllMessages((items) => {
      // Check if message already exists to prevent duplicates
      if (items.find(m => m.id === message.id)) return items
      return [...items, message]
    })); 
    return () => socket.disconnect() 
  }, [conversation?.id])
  
  const send = () => { 
    if (!content.trim() || !conversation?.id) return; 
    const socket = io('/', { withCredentials: true }); 
    socket.emit('conversation:join', { conversationId: conversation.id }); 
    socket.emit('message:send', { conversationId: conversation.id, content }); 
    setContent(''); 
    setTimeout(() => socket.disconnect(), 400) 
  }
  
  return <div className="chat-panel"><h3>Patient chat</h3><div className="chat-messages">{allMessages.map((message) => <p key={message.id}><strong>{message.senderId === user?.id ? 'You' : 'Patient'}:</strong> {message.content}</p>)}</div><div className="chat-compose"><input value={content} onChange={(event) => setContent(event.target.value)} placeholder="Reply to patient" /><button className="button button-dark" onClick={send}>Send</button></div></div>
}

export function HospitalCaseManagement() {
  const query = useQuery({ queryKey: ['hospital-cases'], queryFn: getHospitalCases })
  const [responses, setResponses] = useState({})
  const [appointmentEdits, setAppointmentEdits] = useState({})
  const update = (id, key, value) => setResponses({ ...responses, [id]: { ...responses[id], [key]: value } })
  const updateAppointmentEdit = (appointmentId, value) => setAppointmentEdits({ ...appointmentEdits, [appointmentId]: value })
  
  return <DashboardShell role="HOSPITAL" title="Assigned patient cases." description="Only cases submitted to your hospital are visible here. Medical reports remain private and authorized to this hospital only."><DataState loading={query.isLoading} error={query.error} empty="No patient cases have been assigned."><div className="hospital-case-list">{query.data?.map((item) => { const form = responses[item.id] || {}; return <article className="dashboard-panel hospital-case-card" key={item.id}><div className="panel-heading"><div><span className="status-pill">{item.status}</span><h2>{item.treatment.name}</h2><p>{item.patient.firstName} {item.patient.lastName} · {new Date(item.createdAt).toLocaleDateString()}</p></div><select value={item.status} onChange={async (event) => { await updateCaseStatus(item.id, event.target.value); query.refetch() }}><option value="SUBMITTED">Submitted</option><option value="UNDER_REVIEW">Under review</option><option value="RESPONDED">Responded</option><option value="COMPLETED">Completed</option><option value="CANCELLED">Cancelled</option></select></div><div className="report-list"><strong><FileText size={15} /> Authorized reports</strong>{item.reports?.map((report) => <p key={report.id}><a href={`/api/hospital/cases/${item.id}/reports/${report.id}`} target="_blank" rel="noopener noreferrer" className="report-link">{report.originalName} · {report.category}</a></p>)}</div><form className="case-form" onSubmit={async (event) => { event.preventDefault(); await sendHospitalResponse(item.id, form); query.refetch() }}><label>Case summary<textarea required value={form.summary || ''} onChange={(event) => update(item.id, 'summary', event.target.value)} /></label><label>Recommended next step<textarea required value={form.recommendedNextStep || ''} onChange={(event) => update(item.id, 'recommendedNextStep', event.target.value)} /></label><div className="form-grid"><label>Estimated cost<input type="number" min="0" value={form.estimatedTreatmentCost || ''} onChange={(event) => update(item.id, 'estimatedTreatmentCost', event.target.value)} /></label><label>Estimated stay<input value={form.estimatedHospitalStay || ''} onChange={(event) => update(item.id, 'estimatedHospitalStay', event.target.value)} /></label></div><button className="button button-coral">Send response <ArrowRight size={16} /></button></form>{item.appointments?.filter(Boolean).map((appointment) => {
    if (!appointment?.id || !appointment?.preferredAt) return null;
    const editedDateTime = appointmentEdits[appointment.id] || '';
    return <div className="appointment-row" key={appointment.id}>
      <span>Appointment request: {new Date(appointment.preferredAt).toLocaleString()}</span>
      <span style={{marginTop: '10px'}}>Current status: <strong>{appointment.status || 'PENDING'}</strong></span>
      <div style={{marginTop: '10px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center'}}>
        {appointment.status !== 'CONFIRMED' && appointment.status !== 'CANCELLED' && (
          <>
            <button className="button button-dark button-small" onClick={async () => { await confirmAppointment(appointment.id, 'CONFIRMED'); query.refetch() }}>Accept</button>
            <button className="button button-small" style={{backgroundColor: '#ef4444', color: 'white'}} onClick={async () => { await confirmAppointment(appointment.id, 'CANCELLED'); query.refetch() }}>Reject</button>
            <input 
              type="datetime-local" 
              value={editedDateTime}
              onChange={(e) => updateAppointmentEdit(appointment.id, e.target.value)}
              style={{padding: '5px', minWidth: '200px'}}
            />
            {editedDateTime && <button 
              className="button button-dark button-small" 
              onClick={async () => { 
                await updateAppointmentDateTime(appointment.id, editedDateTime); 
                setAppointmentEdits({ ...appointmentEdits, [appointment.id]: '' });
                query.refetch(); 
              }}
            >Update date/time</button>}
          </>
        )}
      </div>
    </div>
  })}<HospitalChat conversation={item.conversation} /><Link className="inline-link" to={`/hospital/cases/${item.id}`}>Open case details <ArrowRight size={15} /></Link></article> })}</div></DataState></DashboardShell>
}