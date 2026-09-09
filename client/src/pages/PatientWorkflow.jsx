import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { io } from 'socket.io-client'
import { ArrowRight, Bell, FileUp, Send, Home } from 'lucide-react'
import { createCase, getCase, getCases, getHospitals, getNotifications, getTreatments, requestAppointment, submitReview, uploadReport, deleteReport } from '../api'
import { DataState } from '../components/DataState'
import { DashboardShell } from '../App'
import { useAuth } from '../store/auth'

export function PatientDashboardWorkflow() {
  const cases = useQuery({ queryKey: ['patient-cases'], queryFn: getCases })
  const notifications = useQuery({ queryKey: ['patient-notifications'], queryFn: getNotifications })
  const treatments = useQuery({ queryKey: ['case-treatments'], queryFn: () => getTreatments(), cacheTime: 0, staleTime: 0, refetchOnMount: 'always' })
  const [form, setForm] = useState({ treatmentId: '', hospitalId: '', description: '' })
  const hospitals = useQuery({ queryKey: ['case-hospitals', form.treatmentId], queryFn: () => getHospitals({ treatmentId: form.treatmentId }), enabled: Boolean(form.treatmentId) })
  const submit = async (event) => { event.preventDefault(); await createCase(form); setForm({ treatmentId: '', hospitalId: '', description: '' }); cases.refetch(); notifications.refetch() }
  return (
    <DashboardShell 
      role="PATIENT" 
      title="Your care journey." 
      description="Choose a treatment and verified hospital, then keep reports, responses, appointments, and messages together."
    >
      {treatments.error && <div style={{color: 'red'}}>Treatments error: {treatments.error.message}</div>}
      {hospitals.error && <div style={{color: 'red'}}>Hospitals error: {hospitals.error.message}</div>}
      <div className="workflow-grid">
        <section className="dashboard-panel">
          <div className="panel-heading">
            <h2>Create a case</h2>
          </div>
          <form className="case-form workflow-form" onSubmit={submit}>
            <label>Treatment
              <select required value={form.treatmentId} onChange={(event) => setForm({ ...form, treatmentId: event.target.value, hospitalId: '' })}>
                <option value="">Select treatment</option>
                {treatments.data?.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
              </select>
            </label>
            <label>Verified hospital
              <select required value={form.hospitalId} onChange={(event) => setForm({ ...form, hospitalId: event.target.value })} disabled={!form.treatmentId}>
                <option value="">Select hospital</option>
                {hospitals.data?.map((item) => <option value={item.id} key={item.id}>{item.name} · {item.city}</option>)}
              </select>
            </label>
            <label>What would you like the hospital to know?
              <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} maxLength="5000" />
            </label>
            <button className="button button-coral">Submit case <ArrowRight size={16} /></button>
          </form>
        </section>
        <section className="dashboard-panel">
          <div className="panel-heading">
            <h2><Bell size={18} /> Notifications</h2>
          </div>
          <DataState loading={notifications.isLoading} error={notifications.error} empty="No notifications yet.">
            {notifications.data?.slice(0, 5).map((item) => <div className="notification-row" key={item.id}><strong>{item.title}</strong><p>{item.body}</p></div>)}
          </DataState>
        </section>
      </div>
      <section className="dashboard-panel workflow-cases">
        <div className="panel-heading">
          <h2>My cases</h2>
        </div>
        <DataState loading={cases.isLoading} error={cases.error} empty="Your submitted cases will appear here.">
          {cases.data?.map((item) => <Link className="case-row" to={`/patient/cases/${item.id}`} key={item.id}>
            <div>
              <span className="status-pill">{item.status}</span>
              <h3>{item.treatment.name}</h3>
              <p>{item.hospital.name} · {new Date(item.createdAt).toLocaleDateString()}</p>
            </div>
            <ArrowRight size={18} />
          </Link>)}
        </DataState>
      </section>
    </DashboardShell>
  )
}

export function PatientCaseDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const query = useQuery({ queryKey: ['patient-case', id], queryFn: () => getCase(id) })
  const [category, setCategory] = useState('OTHER')
  const [message, setMessage] = useState('')
  const [appointment, setAppointment] = useState({ preferredAt: '', type: 'HOSPITAL_CONSULTATION' })
  const [review, setReview] = useState({ overallRating: 5, hospitalRating: 5, communicationRating: 5, treatmentExperience: 5, writtenReview: '' })
  const [allChatMessages, setAllChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  
  // Initialize chat messages from database when query loads
  useEffect(() => {
    if (query.data?.conversation?.messages) {
      setAllChatMessages(query.data.conversation.messages)
    }
  }, [query.data?.conversation?.messages])

  useEffect(() => { 
    if (!query.data?.conversation?.id) return undefined; 
    const socket = io('/', { withCredentials: true }); 
    socket.on('connect', () => socket.emit('conversation:join', { conversationId: query.data.conversation.id })); 
    // Add new messages to the combined list to avoid duplicates and "New:" labels
    socket.on('message:new', (item) => setAllChatMessages((items) => {
      // Check if message already exists to prevent duplicates
      if (items.find(m => m.id === item.id)) return items
      return [...items, item]
    })); 
    return () => socket.disconnect() 
  }, [query.data?.conversation?.id])

  const sendMessage = () => { 
    if (!chatInput.trim() || !query.data?.conversation?.id) return; 
    const socket = io('/', { withCredentials: true }); 
    socket.emit('conversation:join', { conversationId: query.data.conversation.id }); 
    socket.emit('message:send', { conversationId: query.data.conversation.id, content: chatInput }); 
    setChatInput(''); 
    setTimeout(() => socket.disconnect(), 400) 
  }
  
  return <main className="detail-page workflow-page"><Link className="inline-link" to="/patient/dashboard">Back to dashboard <ArrowRight size={15} /></Link><DataState loading={query.isLoading} error={query.error} empty="Case not found.">{query.data && <><span className="kicker">Private patient case</span><h1>{query.data.treatment.name}</h1><p className="detail-lede">{query.data.hospital.name} · <span className="status-pill">{query.data.status}</span></p><div className="workflow-grid"><section className="dashboard-panel"><h2>Medical reports</h2><p className="muted-copy">Reports are stored privately and can only be accessed by you and the assigned hospital.</p><div className="case-form"><label>Report category<select value={category} onChange={(event) => setCategory(event.target.value)}><option>OTHER</option><option>MEDICAL_REPORT</option><option>LAB_REPORT</option><option>MRI</option><option>CT</option><option>PRESCRIPTION</option></select></label><input type="file" accept="application/pdf,image/jpeg,image/png" onChange={async (event) => { if (event.target.files[0]) { await uploadReport(id, event.target.files[0], category); query.refetch() } }} /><FileUp size={18} />{query.data.reports?.map((report) => <div className="report-row" key={report.id}>{report.originalName}<span>{report.category}</span><button onClick={async () => { await deleteReport(id, report.id); query.refetch(); }} style={{marginLeft: '10px', color: 'red', background: 'none', border: 'none', cursor: 'pointer'}}>Delete</button></div>)}</div><h2>Hospital responses</h2>{query.data.responses?.map((response) => <div className="response-box" key={response.id}><strong>{response.recommendedNextStep}</strong><p>{response.summary}</p></div>)}</section><section className="dashboard-panel"><h2>Appointment</h2><form className="case-form" onSubmit={async (event) => { event.preventDefault(); await requestAppointment(id, appointment); query.refetch() }}><label>Preferred date and time<input type="datetime-local" required value={appointment.preferredAt} onChange={(event) => setAppointment({ ...appointment, preferredAt: event.target.value })} /></label><button className="button button-dark">Request appointment</button></form>{query.data.appointments?.map((item) => <div className="notification-row" key={item.id}><strong>{item.status}</strong><p>{new Date(item.preferredAt).toLocaleString()}</p></div>)}</section></div><section className="dashboard-panel chat-panel"><h2>Patient ↔ Hospital chat</h2><div className="chat-messages">
{allChatMessages.map((item) => <p key={item.id}><strong>{item.senderId === user?.id ? 'You' : 'Hospital'}:</strong> {item.content}</p>)}</div><div className="chat-compose"><input value={chatInput} onChange={(event) => setChatInput(event.target.value)} placeholder="Write a message" /><button className="button button-dark" onClick={sendMessage}><Send size={16} /></button></div></section></>}</DataState></main>
}