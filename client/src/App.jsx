import { useEffect, useState } from 'react'
import { Link, Navigate, Route, Routes, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, BadgeCheck, FileText, HeartPulse, Search, ShieldCheck, Stethoscope } from 'lucide-react'
import { api, createCase, getCases, getHospital, getHospitals, getTreatment, getTreatments, registerHospital, getHospitalTreatments, getHospitalCases } from './api'
import { useAuth } from './store/auth'
import { DataState } from './components/DataState'
import { HospitalMarketplace, PublicHospitalDetail } from './pages/HospitalMarketplace'
import { AdminMarketplace, AdminPatients, AdminCases, AdminAppointments, AdminReviews, AdminTreatments } from './pages/AdminMarketplace'
import { AdminHospitals } from './pages/AdminHospitals'

import { TreatmentDirectory, HospitalDirectory } from './pages/PatientDiscovery'
import { CostCalculator } from './pages/CostCalculator'
import { HospitalComparison } from './pages/HospitalComparison'
import { PatientDashboardWorkflow, PatientCaseDetail } from './pages/PatientWorkflow'
import { HospitalCaseManagement } from './pages/HospitalWorkflow'
import { AdminTreatmentModeration } from './pages/AdminTreatmentModeration'
import { TreatmentSessionColumns } from './components/TreatmentSessionColumns'

export function Header() {
  const { user, signOut } = useAuth()
  return <header className="site-header"><Link className="brand" to="/"><span className="brand-mark"><HeartPulse size={20} /></span><span>carepath</span></Link><nav><Link to="/treatments">Treatments</Link><Link to="/hospitals">Hospitals</Link><a href="/#how-it-works">How it works</a><Link to="/cost-calculator">Cost estimate</Link></nav><div className="header-actions">{user ? <><Link className="text-button" to={user.role === 'PATIENT' ? '/patient/dashboard' : user.role === 'HOSPITAL' ? '/hospital/dashboard' : '/admin/dashboard'}>Dashboard</Link><button className="text-button plain-button" onClick={signOut}>Log out</button></> : <><Link className="text-button" to="/login">Log in</Link><Link className="button button-dark button-small" to="/register">Get started <ArrowRight size={15} /></Link></>}</div></header>
}

function ProtectedRoute({ role, children }) {
  const user = useAuth((state) => state.user)
  const hydrated = useAuth((state) => state.hydrated)
  if (!hydrated) return <main className="simple-page"><div className="data-state">Loading protected workspace...</div></main>
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to="/forbidden" replace />
  return children
}

export function DashboardShell({ role, title, description, children }) {
  const links = role === 'PATIENT' ? [['/patient/dashboard', 'Overview'], ['/patient/cases', 'My cases']] : role === 'HOSPITAL' ? [['/hospital/dashboard', 'Overview'], ['/hospital/profile', 'My profile'], ['/hospital/verification', 'Verification'], ['/hospital/treatments', 'Treatments'], ['/hospital/treatments/new', 'Add treatment']] : [['/admin/dashboard', 'Overview'], ['/admin/hospitals', 'Hospitals'], ['/admin/treatments', 'Treatments'], ['/admin/hospital-treatments', 'Hospital Treatment Moderation'], ['/admin/patients', 'Patients'], ['/admin/cases', 'Patient Cases'], ['/admin/appointments', 'Appointments'], ['/admin/reviews', 'Reviews']]
  return <><Header /><main className="dashboard-page"><div className="dashboard-layout"><aside className="dashboard-nav"><span className="kicker">{role} workspace</span><strong>Carepath</strong>{links.map(([href, label]) => <Link to={href} key={href}>{label}</Link>)}</aside><section className="dashboard-main">{role !== 'ADMIN' && <><span className="kicker">Protected workspace</span><h1>{title}</h1><p className="detail-lede">{description}</p></>}{children}</section></div></main><Footer /></>
}

function SearchBox() { const [query, setQuery] = useState(''); const navigate = useNavigate(); return <form className="search-box" onSubmit={(event) => { event.preventDefault(); navigate(`/treatments${query ? `?search=${encodeURIComponent(query)}` : ''}`) }}><Search size={20} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search a treatment, specialty or condition" /><button className="button button-coral" type="submit">Find care <ArrowRight size={17} /></button></form> }

const backgroundImages = ['/hero-images/AI2.jpg', '/hero-images/doc.jpg', '/hero-images/tele.jpg']

const getTreatmentImage = (treatment, index) => {
  console.log('Treatment name:', treatment.name, 'Index:', index)
  // First try to use exact treatment name as image filename (lowercase) - exactly what the user asked for
  const exactImageName = treatment.name.toLowerCase() + '.jpg'
  console.log('Exact image name:', exactImageName)
  // Check if this exact image name exists in our known existing images
  const existingImages = ['acl.jpg', 'angioplasty.jpg', 'brain tumor.jpg', 'cancer treatment.jpg', 'doc.jpg', 'ai2.jpg', 'tele.jpg']
  if (existingImages.includes(exactImageName)) {
    console.log('Using exact image:', `/images/${exactImageName}`)
    return `/images/${exactImageName}`
  }
  // If exact match not found, use available existing images in rotation for the first 4 treatments
  const availableFallbackImages = ['ai2.jpg', 'tele.jpg', 'doc.jpg', 'angioplasty.jpg']
  if (index < availableFallbackImages.length) {
    const fallbackImg = availableFallbackImages[index]
    console.log('Using fallback image for treatment', treatment.name, ':', `/images/${fallbackImg}`)
    return `/images/${fallbackImg}`
  }
  // Default fallback if all else fails
  console.log('Using default fallback image: /images/doc.jpg')
  return '/images/doc.jpg'
}

const SPECIALTY_GRID = [
  { name: 'Bariatric & Metabolic Surgery', icon: '⚖️' },
  { name: 'Cardiac Surgery', icon: '❤️' },
  { name: 'Pediatric Cardiac Surgery', icon: '🧒' },
  { name: 'Cardiology', icon: '💓' },
  { name: 'Cosmetic & Plastic Surgery', icon: '✨' },
  { name: 'Dentistry', icon: '🦷' },
  { name: 'Dermatology', icon: '🧴' },
  { name: 'ENT', icon: '👂' },
  { name: 'Endocrinology & Diabetology', icon: '🧪' },
];

const JOURNEY_STEPS = [
  { num: 1, icon: '📋', title: 'Share Your Reports', text: 'Share your complete medical history and medical complaints with a patient counselor. This will help you get proper treatment plan.' },
  { num: 2, icon: '🏥', title: 'Compare Treatment Plans', text: 'Receive up to 3 personalised treatment plans from top specialists. Compare hospitals, doctors, costs, and outcomes — then choose what\'s right for you.' },
  { num: 3, icon: '✈️', title: 'Visa & Travel Assistance', text: 'We handle your medical visa invitation, help plan your travel, and arrange comfortable accommodation near your hospital for you and your family.' },
  { num: 4, icon: '👨‍⚕️', title: 'Hospital Care & Support', text: 'A dedicated coordinator stays with you throughout — from admission to discharge. Round-the-clock support, translation, and daily updates to your family.' },
  { num: 5, icon: '🏨', title: 'Recover & Rest', text: 'Post-discharge stay at a nearby hotel with regular check-ups. Our team ensures your recovery is on track before you travel home.' },
  { num: 6, icon: '🏠', title: 'Ongoing Follow-Up', text: 'Virtual consultations with your doctor after you return home. Ongoing medical support and health management for long-term recovery.' },
];

const TRUST_POINTS = [
  { title: 'Free patient counselling', text: 'We never charge patients and add no markup — you pay the hospital exactly what you would pay on your own.' },
  { title: 'One counsellor, start to finish', text: 'The same person handles your medical opinion, visa letter, arrival, treatment and follow-up back home.' },
  { title: 'Accredited hospitals only', text: 'Every hospital we work with is accredited by NABH or JCI — and we suggest one only after we understand your case.' },
  { title: 'Medically reviewed content', text: 'Our treatment guides are reviewed by named specialists before publication.' },
];

const COUNTRY_GUIDES = [
  { country: 'Zimbabwe', from: 'Harare', to: 'India' },
  { country: 'Nigeria', from: 'Lagos', to: 'India' },
  { country: 'Kenya', from: 'Nairobi', to: 'India' },
  { country: 'Ethiopia', from: 'Addis Ababa', to: 'India' },
  { country: 'Tanzania', from: 'Dar es Salaam', to: 'India' },
];

function Home() {
  const treatments = useQuery({ queryKey: ['treatments'], queryFn: () => getTreatments() });
  const hospitals = useQuery({ queryKey: ['hospitals'], queryFn: () => getHospitals() });
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setCurrentImage(p => (p + 1) % backgroundImages.length), 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Header />
      <main>
        <section className="hero hero-slideshow">
          {backgroundImages.map((src, index) => (
            <div
              key={src}
              className={`hero-background ${index === currentImage ? 'active' : ''}`}
              style={{ backgroundImage: `url(${src})` }}
            />
          ))}
          <div className="hero-overlay" />
          <div className="hero-copy">
            <div className="eyebrow" style={{ color: 'white' }}><span className="eyebrow-dot" />A clearer way to plan care abroad</div>
            <h1 style={{ color: 'white' }}>Good care starts with a <em>better</em> next step.</h1>
            <p className="hero-lede" style={{ color: 'white' }}>Discover verified hospitals in India, compare real treatment estimates</p>
            <SearchBox />
            <div className="hero-trust">
              <span className="trust-chip"><ShieldCheck size={15} /> Verified providers</span>
              <span className="trust-chip"><BadgeCheck size={15} /> Private case journey</span>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-photo">
              <div className="hero-photo-copy">
                <span>CAREPATH / 01</span>
                <strong>Clarity for the<br /><em>journey ahead.</em></strong>
                <small>One place to discover, compare and move forward.</small>
              </div>
              <div className="photo-caption">
                <span className="live-dot" />International patient desk
                <div><strong>24/7</strong><small>here to help</small></div>
              </div>
            </div>
          </div>
        </section>

        <section className="trust-strip">
          <span>Built for decisions that feel human</span>
          <div><span><BadgeCheck size={17} /> Real provider data</span></div>
        </section>

        <section className="section split-section" id="how-it-works">
          <div className="split-image">
            <div className="journey-graphic"><span>DISCOVER</span><strong>→</strong><span>COMPARE</span><strong>→</strong><span>PLAN</span><div className="journey-orbit" /></div>
            <div className="image-tag"><HeartPulse size={18} /> Care that travels with you</div>
          </div>
          <div className="split-copy">
            <span className="kicker">Less searching. More certainty.</span>
            <h2>Compare the details that actually matter.</h2>
            <p>Every provider shares treatment-specific estimates, availability, stay guidance and international patient support, so you can make a considered choice.</p>
            <div className="steps">
              <div><span>01</span><p><strong>Find your treatment</strong><small>Start with the care you need, not a maze of hospital websites.</small></p></div>
              <div><span>02</span><p><strong>Compare real options</strong><small>Comparison activates only when multiple verified providers exist.</small></p></div>
              <div><span>03</span><p><strong>Move forward privately</strong><small>Share reports securely and hear back from your chosen hospital.</small></p></div>
            </div>
            <Link className="button button-dark" to="/hospitals">Explore hospitals <ArrowRight size={17} /></Link>
          </div>
        </section>

        <section className="section specialty-section">
          <div className="section-heading">
            <span className="kicker">Browse by Specialty</span>
            <h2>Doctors by Specialty</h2>
            <p className="section-lede">Find Top Doctors in India for all major specialties</p>
          </div>
          <div className="specialty-grid">
            {SPECIALTY_GRID.map((s) => (
              <Link key={s.name} className="specialty-card" to={`/treatments?search=${encodeURIComponent(s.name)}`}>
                <div className="specialty-icon">{s.icon}</div>
                <div className="specialty-name">{s.name}</div>
              </Link>
            ))}
          </div>
          <div className="section-footer-link">
            <Link className="inline-link" to="/treatments">View more specialties <ArrowRight size={15} /></Link>
          </div>
        </section>

        <section className="section journey-section">
          <div className="section-heading">
            <span className="kicker">How it works</span>
            <h2>Your Medical Journey, Simplified</h2>
            <p className="section-lede">From your first enquiry to recovery back home — we manage every detail so you can focus on getting better.</p>
          </div>
          <div className="journey-grid">
            {JOURNEY_STEPS.map((step) => (
              <div className="journey-card" key={step.num}>
                <div className="journey-card-top">
                  <span className="journey-num">{step.num}</span>
                  <span className="journey-icon">{step.icon}</span>
                </div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            ))}
          </div>
          <div className="section-footer-link">
            <Link className="inline-link" to="/register">Learn More <ArrowRight size={15} /></Link>
          </div>
        </section>

        <section className="section trust-section">
          <div className="section-heading">
            <span className="kicker">Why Ginger Healthcare</span>
            <h2>Why Patients Trust Us</h2>
            <p className="section-lede">We're not a booking platform. We're the team that plans your treatment with you — and we're paid by hospitals, never by you.</p>
          </div>
          <div className="trust-grid">
            {TRUST_POINTS.map((point) => (
              <div className="trust-card" key={point.title}>
                <h3>{point.title}</h3>
                <p>{point.text}</p>
              </div>
            ))}
          </div>
          <div className="section-footer-link">
            <Link className="inline-link" to="/treatments">Read our editorial policy <ArrowRight size={15} /></Link>
          </div>
        </section>



        <section className="cta-band">
          <div>
            <span className="kicker">For hospitals building trust</span>
            <h2>Make your expertise easier to find.</h2>
            <p>Join a network designed for transparent treatment discovery and international patient care.</p>
          </div>
        </section>
      </main>
      <TreatmentSessionColumns treatments={treatments.data} hospitals={hospitals.data} />
      <Footer />
    </>
  );
}

function HospitalCard({ hospital }) { return <article className="hospital-card"><div className="hospital-image hospital-placeholder"><span className="verified"><BadgeCheck size={14} /> Verified</span><BuildingGlyph /></div><div className="hospital-content"><div className="hospital-meta"><span>{hospital.city}, {hospital.country}</span><span>Verified provider</span></div><h3>{hospital.name}</h3><p>{hospital.description || 'International patient support and treatment planning.'}</p><Link to={`/hospitals/${hospital.slug}`} className="inline-link">View hospital <ArrowRight size={15} /></Link></div></article> }
function BuildingGlyph() { return <div className="building-glyph"><span /><span /><span /><span /><span /><span /></div> }

function Directory({ type }) { const isHospital = type === 'hospitals'; const [searchParams] = useSearchParams(); const [search, setSearch] = useState(searchParams.get('search') || ''); const query = useQuery({ queryKey: [type, search], queryFn: () => isHospital ? getHospitals(search ? { city: search } : {}) : getTreatments(search) }); return <><Header /><main className="directory-page"><div className="page-intro"><span className="kicker">Carepath directory</span><h1>{isHospital ? 'Find a hospital that fits your journey.' : 'Start with the treatment you need.'}</h1><p>{isHospital ? 'Explore verified providers, their specialties and the support they offer international patients.' : 'Browse treatment information and see real hospitals with current estimated costs.'}</p><form className="search-box" onSubmit={(event) => { event.preventDefault(); setSearch(event.currentTarget.elements.search.value) }}><Search size={20} /><input name="search" defaultValue={search} placeholder={isHospital ? 'Search by city' : 'Search by treatment or specialty'} /><button className="button button-coral" type="submit">Search <ArrowRight size={17} /></button></form></div><div className="directory-content"><aside><strong>Verified marketplace</strong><p>Only approved hospital providers and available treatment records appear here.</p><label>City <select><option>All cities</option><option>New Delhi</option><option>Chennai</option></select></label><label>Specialty <select><option>All specialties</option><option>Cardiology</option><option>Orthopedics</option></select></label></aside><div className="directory-results"><DataState loading={query.isLoading} error={query.error} empty={isHospital ? 'No verified hospitals found.' : 'No treatments found.'}>{isHospital ? query.data?.map((hospital) => <HospitalCard hospital={hospital} key={hospital.id} />) : query.data?.map((treatment) => <Link className="result-card treatment-result coral" key={treatment.id} to={`/treatments/${treatment.slug}`}><div className="card-icon"><Stethoscope size={20} /></div><div><span className="specialty">{treatment.specialty.name}</span><h3>{treatment.name}</h3><p>{treatment.hospitalCount} verified hospitals currently offer this treatment</p></div><ArrowRight size={19} /></Link>)}</DataState></div></div></main><Footer /></> }

function TreatmentDetail() { const { slug } = useParams(); const query = useQuery({ queryKey: ['treatment', slug], queryFn: () => getTreatment(slug) }); return <><Header /><main className="detail-page"><DataState loading={query.isLoading} error={query.error} empty="Treatment not found.">{query.data && <><span className="kicker">{query.data.specialty.name}</span><h1>{query.data.name}</h1><p className="detail-lede">Explore verified hospital providers and current treatment-specific estimates. Prices are estimates, not a final medical quotation.</p><div className="provider-summary"><strong>{query.data.availableHospitalCount === 0 ? 'No verified hospitals currently offer this treatment.' : `${query.data.availableHospitalCount} verified hospital${query.data.availableHospitalCount > 1 ? 's' : ''} currently offer this treatment.`}</strong>{query.data.comparisonEnabled && <Link className="button button-dark" to={`/compare/hospitals?treatmentId=${query.data.id}`}>Compare hospitals <ArrowRight size={17} /></Link>}</div><div className="provider-list">{query.data.hospitals.map((provider) => <article className="provider-card" key={provider.id}><div><span className="verified-inline"><BadgeCheck size={14} /> Verified hospital</span><h3>{provider.hospital.name}</h3><p>{provider.hospital.city}, {provider.hospital.country} · {provider.hospitalStay || 'Stay estimate available on request'}</p></div><div className="provider-price"><strong>{provider.minEstimatedCost ? `₹${Number(provider.minEstimatedCost).toLocaleString('en-IN')} – ₹${Number(provider.maxEstimatedCost || provider.minEstimatedCost).toLocaleString('en-IN')}` : 'Estimate on request'}</strong><small>Estimated cost</small><Link className="inline-link" to={`/hospitals/${provider.hospital.slug}`}>View hospital <ArrowRight size={15} /></Link></div></article>)}</div>{query.data.availableHospitalCount < 2 && <div className="assistance-box"><div><strong>{query.data.availableHospitalCount === 0 ? 'Need help finding a provider?' : 'Want more options?'}</strong><p>Our care team can help you understand what is currently available.</p></div><Link className="button button-coral" to="/register">Request assistance</Link></div>}</>}</DataState></main><Footer /></> }

function ComparePage() { const [params] = useSearchParams(); const treatmentId = params.get('treatmentId'); const query = useQuery({ queryKey: ['compare', treatmentId], queryFn: async () => (await api.get('/public/compare/hospitals', { params: { treatmentId } })).data.data, enabled: Boolean(treatmentId) }); return <><Header /><main className="detail-page"><span className="kicker">Transparent comparison</span><h1>Compare verified hospitals.</h1><p className="detail-lede">This view only compares real providers offering the selected treatment. It is not medical advice and the lowest estimate is not a quality ranking.</p><DataState loading={query.isLoading} error={query.error} empty="Select a treatment with available providers to compare.">{query.data?.comparisonEnabled ? <div className="comparison-table"><div className="comparison-head"><span>Care detail</span>{query.data.hospitals.map((entry) => <strong key={entry.id}>{entry.hospital.name}</strong>)}</div>{[['City', (entry) => entry.hospital.city], ['Estimated cost', (entry) => entry.minEstimatedCost ? `₹${Number(entry.minEstimatedCost).toLocaleString('en-IN')} – ₹${Number(entry.maxEstimatedCost || entry.minEstimatedCost).toLocaleString('en-IN')}` : 'On request'], ['Hospital stay', (entry) => entry.hospitalStay || 'On request'], ['Availability', () => 'Available'], ['Support', (entry) => entry.hospital.internationalSupport ? 'International desk' : 'Contact hospital']].map(([label, value]) => <div className="comparison-row" key={label}><span>{label}</span>{query.data.hospitals.map((entry) => <div key={entry.id}>{value(entry)}</div>)}</div>)}</div> : <div className="data-state">Only one verified hospital currently offers this treatment. Comparison is disabled.</div>}</DataState></main><Footer /></> }

function AuthPage({ mode = 'login', expectedRole }) { const isRegister = mode === 'register'; const { signIn, signUp, loading, error } = useAuth(); const navigate = useNavigate(); const [localError, setLocalError] = useState(''); const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', country: '' }); const update = (event) => setForm({ ...form, [event.target.name]: event.target.value }); return <><Header /><main className="form-page"><form className="auth-form" onSubmit={async (event) => { event.preventDefault(); setLocalError(''); try { const user = isRegister ? await signUp(form) : await signIn({ email: form.email, password: form.password }); if (expectedRole && user.role !== expectedRole) { setLocalError(`This account is not a ${expectedRole.toLowerCase()} account.`); return } navigate(user.role === 'PATIENT' ? '/patient/dashboard' : user.role === 'HOSPITAL' ? '/hospital/dashboard' : '/admin/dashboard') } catch {} }}><span className="kicker">Carepath account</span><h1>{isRegister ? 'Start your care journey.' : expectedRole ? `${expectedRole[0]}${expectedRole.slice(1).toLowerCase()} sign in.` : 'Welcome back.'}</h1><p>{isRegister ? 'Create an account to save cases and share reports securely.' : 'Sign in to continue to your protected workspace.'}</p>{isRegister && <div className="form-grid"><label>First name<input name="firstName" required value={form.firstName} onChange={update} /></label><label>Last name<input name="lastName" required value={form.lastName} onChange={update} /></label><label>Country<input name="country" value={form.country} onChange={update} placeholder="India" /></label></div>}<label>Email<input name="email" type="email" required value={form.email} onChange={update} /></label><label>Password<input name="password" type="password" minLength="8" required value={form.password} onChange={update} /></label>{(error || localError) && <div className="form-error">{localError || error}</div>}<button className="button button-dark" disabled={loading}>{loading ? 'Working...' : isRegister ? 'Create patient account' : 'Sign in'} <ArrowRight size={17} /></button><small>{isRegister ? 'Already registered? ' : 'New to Carepath? '}<Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Sign in' : 'Create an account'}</Link></small></form></main><Footer /></> }

function HospitalRegister() { const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', city: '', country: 'India', address: '', description: '' }); const [message, setMessage] = useState(''); const [error, setError] = useState(''); const update = (event) => setForm({ ...form, [event.target.name]: event.target.value }); return <><Header /><main className="form-page"><form className="auth-form wide-form" onSubmit={async (event) => { event.preventDefault(); setError(''); try { await registerHospital(form); setMessage('Registration submitted. An admin will review your hospital before it appears publicly.'); } catch (requestError) { setError(requestError.response?.data?.message || 'Unable to submit registration') } }}><span className="kicker">For verified providers</span><h1>Bring your hospital to the right patients.</h1><p>Submit your profile for review. Approval is required before any hospital appears as verified.</p><div className="form-grid"><label>Hospital name<input name="name" required value={form.name} onChange={update} /></label><label>Work email<input name="email" type="email" required value={form.email} onChange={update} /></label><label>Password<input name="password" type="password" minLength="8" required value={form.password} onChange={update} /></label><label>Phone<input name="phone" required value={form.phone} onChange={update} /></label><label>City<input name="city" required value={form.city} onChange={update} /></label><label>Country<input name="country" required value={form.country} onChange={update} /></label></div><label>Address<textarea name="address" required value={form.address} onChange={update} /></label><label>About the hospital<textarea name="description" value={form.description} onChange={update} /></label>{message && <div className="form-success">{message}</div>}{error && <div className="form-error">{error}</div>}<button className="button button-coral">Submit for verification <ArrowRight size={17} /></button></form></main><Footer /></> }

function PatientDashboard() { const query = useQuery({ queryKey: ['cases'], queryFn: getCases }); const [showForm, setShowForm] = useState(false); const [form, setForm] = useState({ hospitalId: '', treatmentId: '', description: '' }); return <><Header /><main className="dashboard-page"><span className="kicker">Patient workspace</span><h1>Your care journey.</h1><p className="detail-lede">Cases, hospital responses and next steps in one private place.</p><div className="dashboard-grid"><section className="dashboard-panel"><div className="panel-heading"><h2>My cases</h2><button className="button button-dark button-small" onClick={() => setShowForm(!showForm)}>Create case <ArrowRight size={15} /></button></div>{showForm && <form className="case-form" onSubmit={async (event) => { event.preventDefault(); await createCase(form); setShowForm(false); query.refetch() }}><input placeholder="Hospital ID" required onChange={(event) => setForm({ ...form, hospitalId: event.target.value })} /><input placeholder="Treatment ID" required onChange={(event) => setForm({ ...form, treatmentId: event.target.value })} /><textarea placeholder="Tell the hospital what you need help with" onChange={(event) => setForm({ ...form, description: event.target.value })} /><button className="button button-coral">Submit case</button></form>}<DataState loading={query.isLoading} error={query.error} empty="Your submitted cases will appear here.">{query.data?.map((item) => <div className="case-row" key={item.id}><div><span className="status-pill">{item.status}</span><h3>{item.treatment.name}</h3><p>{item.hospital.name} · {new Date(item.createdAt).toLocaleDateString()}</p></div><ArrowRight size={18} /></div>)}</DataState></section><aside className="journey-panel"><h2>Journey progress</h2><div className="journey-step done">Case created</div><div className="journey-step">Reports uploaded</div><div className="journey-step">Hospital review</div><div className="journey-step">Appointment</div></aside></div></main><Footer /></> }

function SimplePage({ title, description }) { return <><Header /><main className="simple-page"><div className="simple-panel"><span className="kicker">Carepath</span><h1>{title}</h1><p>{description}</p><Link className="button button-dark" to="/">Back to home <ArrowRight size={17} /></Link></div></main><Footer /></> }
export function Footer() { return <footer><div className="footer-top"><Link className="brand" to="/"><span className="brand-mark"><HeartPulse size={20} /></span><span>carepath</span></Link><p>Clarity for your care journey.</p><div className="footer-links"><Link to="/treatments">Treatments</Link><Link to="/hospitals">Hospitals</Link><Link to="/register">Patients</Link><Link to="/hospital/register">Hospitals</Link></div></div><div className="footer-bottom"><span>© 2026 Carepath. Independent healthcare navigation.</span><span>Medical information is not a diagnosis or medical advice.</span></div></footer> }

function Forbidden() { return <SimplePage title="You do not have access to this workspace." description="Your account role does not authorize this area." /> }
function AdminDashboard() { return <DashboardShell role="ADMIN" title="Platform foundation." description="Manage role access and prepare the platform for verified providers."><div className="dashboard-grid"><div className="dashboard-panel"><h2>Admin controls</h2><p>Hospital verification, treatment catalog and platform administration are protected by the ADMIN role.</p></div><div className="dashboard-panel"><h2>Release 1</h2><p>Authentication, sessions and role isolation are active.</p></div></div></DashboardShell> }
function HospitalDashboard() {
  const query = useQuery({ queryKey: ['hospital-cases'], queryFn: getHospitalCases });
  return <DashboardShell role="HOSPITAL" title="Your hospital workspace." description="View patient cases, authorized medical reports, and manage submissions."><div className="dashboard-grid"><div className="dashboard-panel full-width"><span className="kicker">Assigned patient cases</span><h2>Active patient submissions</h2><p className="detail-lede">Only cases submitted to your hospital are visible here. Medical reports remain private and authorized to this hospital only.</p><DataState loading={query.isLoading} error={query.error} empty="No patient cases have been assigned yet."><div className="hospital-case-list">{query.data?.slice(0, 5).map((item) => <article className="dashboard-panel hospital-case-card" key={item.id}><div className="panel-heading"><div><span className="status-pill">{item.status}</span><h3>{item.treatment.name}</h3><p>{item.patient.firstName} {item.patient.lastName} · {new Date(item.createdAt).toLocaleDateString()}</p></div></div><div className="report-list"><strong><FileText size={15} /> Authorized reports</strong>{item.reports?.length > 0 ? item.reports.map((report) => <p key={report.id}><a href={`/api/hospital/cases/${item.id}/reports/${report.id}`} target="_blank" rel="noopener noreferrer" className="report-link">{report.originalName} · {report.category}</a></p>) : <p>No reports uploaded yet for this case.</p>}</div><Link className="inline-link" to={`/hospital/cases/${item.id}`}>View full case details <ArrowRight size={15} /></Link></article>)}</div></DataState></div></div></DashboardShell> }

function HospitalProfilePage() { return <DashboardShell role="HOSPITAL" title="My profile" description="Update your hospital's profile information, contact details, and business settings."><div className="dashboard-grid"><div className="dashboard-panel"><h2>Profile management</h2><p>Edit your hospital's public profile, contact information, and operational details.</p></div></div></DashboardShell> }

function HospitalVerificationPage() { return <DashboardShell role="HOSPITAL" title="Verification" description="Track your hospital's verification status and submit required documentation for admin approval."><div className="dashboard-grid"><div className="dashboard-panel"><h2>Verification status</h2><p>Your hospital's verification progress and pending requirements.</p></div></div></DashboardShell> }

function HospitalTreatmentsPage() {
  const treatments = useQuery({ queryKey: ['hospital-treatments'], queryFn: getHospitalTreatments });
  return <DashboardShell role="HOSPITAL" title="Treatments" description="Manage your hospital's treatment catalog, pricing, and availability settings."><div className="dashboard-grid"><div className="dashboard-panel"><span className="kicker">Your offerings</span><h2>Treatment management</h2><DataState loading={treatments.isLoading} error={treatments.error} empty="You haven't added any treatments yet. Click 'Add treatment' in the sidebar to get started."><p className="detail-lede">You currently offer <strong>{treatments.data?.length}</strong> treatment{treatments.data?.length !== 1 ? 's' : ''} to patients:</p><div className="treatment-list">{treatments.data?.map((item) => <article className="marketplace-treatment" key={item.id}><div><span className="specialty">{item.treatment.specialty.name}</span><h3>{item.treatment.name}</h3><p>{item.minEstimatedCost ? `${item.currency} ${Number(item.minEstimatedCost).toLocaleString('en-IN')} – ${Number(item.maxEstimatedCost || item.minEstimatedCost).toLocaleString('en-IN')}` : 'Estimate on request'}{item.hospitalStay ? ` · ${item.hospitalStay} hospital stay` : ''}</p></div><span className={`status-pill status-${item.availability.toLowerCase()}`}>{item.availability.replaceAll('_', ' ')}</span></article>)}</div></DataState></div></div></DashboardShell>
}
function HospitalDetailPage() { const { slug } = useParams(); const query = useQuery({ queryKey: ['hospital', slug], queryFn: () => getHospital(slug) }); return <><Header /><PublicHospitalDetail hospital={query.data} treatments={query.data?.treatments} loading={query.isLoading} error={query.error} /><Footer /></> }

export default function App() { const hydrate = useAuth((state) => state.hydrate); useEffect(() => { hydrate() }, [hydrate]); return <Routes><Route path="/" element={<Home />} /><Route path="/treatments" element={<TreatmentDirectory />} /><Route path="/treatments/:slug" element={<TreatmentDetail />} /><Route path="/hospitals" element={<HospitalDirectory />} /><Route path="/hospitals/:slug" element={<HospitalDetailPage />} /><Route path="/compare/hospitals" element={<><Header /><HospitalComparison /><Footer /></>} /><Route path="/cost-calculator" element={<><Header /><CostCalculator /><Footer /></>} /><Route path="/login" element={<AuthPage />} /><Route path="/hospital/login" element={<AuthPage expectedRole="HOSPITAL" />} /><Route path="/admin/login" element={<AuthPage expectedRole="ADMIN" />} /><Route path="/register" element={<AuthPage mode="register" />} /><Route/><Route path="/forbidden" element={<Forbidden />} /><Route path="/patient/dashboard" element={<ProtectedRoute role="PATIENT"><PatientDashboardWorkflow /></ProtectedRoute>} /><Route path="/patient/cases" element={<ProtectedRoute role="PATIENT"><PatientDashboardWorkflow /></ProtectedRoute>} /><Route path="/patient/cases/:id" element={<ProtectedRoute role="PATIENT"><PatientCaseDetail /></ProtectedRoute>} /><Route path="/hospital/dashboard" element={<ProtectedRoute role="HOSPITAL"><HospitalCaseManagement /></ProtectedRoute>} /><Route path="/hospital/profile" element={<ProtectedRoute role="HOSPITAL"><HospitalProfilePage /></ProtectedRoute>} /><Route path="/hospital/verification" element={<ProtectedRoute role="HOSPITAL"><HospitalVerificationPage /></ProtectedRoute>} /><Route path="/hospital/treatments" element={<ProtectedRoute role="HOSPITAL"><HospitalTreatmentsPage /></ProtectedRoute>} /><Route path="/hospital/treatments/new" element={<ProtectedRoute role="HOSPITAL"><HospitalMarketplace /></ProtectedRoute>} /><Route path="/hospital/treatments/:id/edit" element={<ProtectedRoute role="HOSPITAL"><HospitalMarketplace /></ProtectedRoute>} /><Route path="/hospital/cases" element={<ProtectedRoute role="HOSPITAL"><HospitalCaseManagement /></ProtectedRoute>} /><Route path="/hospital/cases/:id" element={<ProtectedRoute role="HOSPITAL"><HospitalCaseManagement /></ProtectedRoute>} /><Route path="/admin/dashboard" element={<ProtectedRoute role="ADMIN"><AdminMarketplace /></ProtectedRoute>} /><Route path="/admin/hospitals" element={<ProtectedRoute role="ADMIN"><DashboardShell role="ADMIN" title="Hospital Management" description="Manage hospital accounts and their status."><AdminHospitals /></DashboardShell></ProtectedRoute>} /><Route path="/admin/treatments" element={<ProtectedRoute role="ADMIN"><AdminTreatments /></ProtectedRoute>} /><Route path="/admin/hospital-treatments" element={<ProtectedRoute role="ADMIN"><DashboardShell role="ADMIN" title="Hospital Treatment Moderation" description="Review and moderate hospital treatment submissions."><AdminTreatmentModeration /></DashboardShell></ProtectedRoute>} /><Route path="/admin/patients" element={<ProtectedRoute role="ADMIN"><DashboardShell role="ADMIN" title="Registered Patients" description="Overview of registered patient accounts on the platform."><AdminPatients /></DashboardShell></ProtectedRoute>} /><Route path="/admin/cases" element={<ProtectedRoute role="ADMIN"><DashboardShell role="ADMIN" title="Patient Cases" description="Overview of all patient cases submitted to hospitals."><AdminCases /></DashboardShell></ProtectedRoute>} /><Route path="/admin/appointments" element={<ProtectedRoute role="ADMIN"><DashboardShell role="ADMIN" title="Appointments" description="Overview of all requested, confirmed, and completed appointments."><AdminAppointments /></DashboardShell></ProtectedRoute>} /><Route path="/admin/reviews" element={<ProtectedRoute role="ADMIN"><AdminReviews /></ProtectedRoute>} /></Routes> }