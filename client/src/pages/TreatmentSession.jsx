import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, BadgeCheck, Search, Stethoscope, Heart, Brain, Bone, Activity, Eye, Baby, Sparkles } from 'lucide-react'
import { getTreatments, getHospitals } from '../api'
import { DataState } from '../components/DataState'

const specialtyIcons = {
  'Cardiology': Heart,
  'Neurology': Brain,
  'Orthopedics': Bone,
  'General Surgery': Activity,
  'Ophthalmology': Eye,
  'Fertility': Baby,
  'Cosmetic Surgery': Sparkles,
  'default': Stethoscope
}

export function TreatmentSession() {
  const [search, setSearch] = useState('')
  const [submitted, setSubmitted] = useState('')
  
  const treatmentsQuery = useQuery({ 
    queryKey: ['treatments', submitted], 
    queryFn: () => getTreatments(submitted) 
  })
  
  const hospitalsQuery = useQuery({
    queryKey: ['hospitals'],
    queryFn: () => getHospitals()
  })

  const treatments = treatmentsQuery.data || []
  const hospitals = hospitalsQuery.data || []

  // Group treatments by specialty for columns
  const specialties = [...new Map(treatments.map(t => [t.specialty.name, t.specialty])).values()]
  
  // Get top treatments by hospital count
  const topTreatments = [...treatments]
    .sort((a, b) => (b.hospitalCount || 0) - (a.hospitalCount || 0))
    .slice(0, 6)

  // Get top hospitals
  const topHospitals = [...hospitals]
    .slice(0, 6)

  return (
    <>
      <SessionHeader />
      <main className="treatment-session-page">
        <div className="session-intro">
          <span className="kicker">Treatment Session</span>
          <h1>Explore Top Treatments by Category</h1>
          <p>Discover the most sought-after treatments across specialties, with verified hospital providers and transparent cost estimates.</p>
          
          <form className="search-box" onSubmit={(e) => { e.preventDefault(); setSubmitted(search) }}>
            <Search size={20} />
            <input 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              placeholder="Search treatments or specialties..." 
            />
            <button className="button button-coral" type="submit">
              Search <ArrowRight size={17} />
            </button>
          </form>
        </div>

        {/* Top Treatments Column */}
        <section className="session-section">
          <div className="section-header">
            <h2>Top Treatments</h2>
            <p>Most popular treatments based on hospital availability</p>
          </div>
          <div className="treatment-columns">
            <div className="treatment-column">
              <div className="column-header">
                <Activity size={20} />
                <span>Most Requested</span>
              </div>
              <DataState loading={treatmentsQuery.isLoading} error={treatmentsQuery.error}>
                {topTreatments.slice(0, 3).map((treatment, index) => (
                  <TreatmentCard key={treatment.id} treatment={treatment} rank={index + 1} />
                ))}
              </DataState>
            </div>

            <div className="treatment-column">
              <div className="column-header">
                <Heart size={20} />
                <span>Cardiac Care</span>
              </div>
              <DataState loading={treatmentsQuery.isLoading} error={treatmentsQuery.error}>
                {treatments
                  .filter(t => t.specialty.name === 'Cardiology')
                  .slice(0, 3)
                  .map((treatment, index) => (
                    <TreatmentCard key={treatment.id} treatment={treatment} />
                  ))}
              </DataState>
            </div>

            <div className="treatment-column">
              <div className="column-header">
                <Bone size={20} />
                <span>Orthopedics</span>
              </div>
              <DataState loading={treatmentsQuery.isLoading} error={treatmentsQuery.error}>
                {treatments
                  .filter(t => t.specialty.name === 'Orthopedics')
                  .slice(0, 3)
                  .map((treatment, index) => (
                    <TreatmentCard key={treatment.id} treatment={treatment} />
                  ))}
              </DataState>
            </div>

            <div className="treatment-column">
              <div className="column-header">
                <Brain size={20} />
                <span>Neurology</span>
              </div>
              <DataState loading={treatmentsQuery.isLoading} error={treatmentsQuery.error}>
                {treatments
                  .filter(t => t.specialty.name === 'Neurology')
                  .slice(0, 3)
                  .map((treatment, index) => (
                    <TreatmentCard key={treatment.id} treatment={treatment} />
                  ))}
              </DataState>
            </div>
          </div>
        </section>

        {/* Top Hospitals Column */}
        <section className="session-section">
          <div className="section-header">
            <h2>Top Hospitals</h2>
            <p>Leading verified providers across India</p>
          </div>
          <div className="hospital-columns">
            {topHospitals.map((hospital, index) => (
              <HospitalCard key={hospital.id} hospital={hospital} rank={index + 1} />
            ))}
          </div>
        </section>

        {/* Specialty Breakdown */}
        <section className="session-section">
          <div className="section-header">
            <h2>Treatments by Specialty</h2>
            <p>Browse treatments organized by medical specialty</p>
          </div>
          <div className="specialty-grid">
            {specialties.map((specialty) => {
              const Icon = specialtyIcons[specialty.name] || specialtyIcons.default
              const specialtyTreatments = treatments.filter(t => t.specialty.name === specialty.name)
              return (
                <Link 
                  key={specialty.id} 
                  className="specialty-card"
                  to={`/treatments?search=${specialty.name}`}
                >
                  <div className="specialty-icon">
                    <Icon size={24} />
                  </div>
                  <h3>{specialty.name}</h3>
                  <p>{specialtyTreatments.length} treatments</p>
                  <ArrowRight size={18} className="arrow-icon" />
                </Link>
              )
            })}
          </div>
        </section>
      </main>
      <SessionFooter />
    </>
  )
}

function TreatmentCard({ treatment, rank }) {
  const Icon = specialtyIcons[treatment.specialty.name] || specialtyIcons.default
  
  return (
    <Link to={`/treatments/${treatment.slug}`} className="treatment-list-card">
      {rank && <span className="rank-badge">{rank}</span>}
      <div className="card-icon-small">
        <Icon size={16} />
      </div>
      <div className="card-content">
        <span className="specialty-tag">{treatment.specialty.name}</span>
        <h4>{treatment.name}</h4>
        <div className="card-stats">
          <span className="hospital-count">
            <BadgeCheck size={12} />
            {treatment.hospitalCount || 0} hospitals
          </span>
        </div>
      </div>
      <ArrowRight size={16} className="card-arrow" />
    </Link>
  )
}

function HospitalCard({ hospital, rank }) {
  return (
    <Link to={`/hospitals/${hospital.slug}`} className="hospital-list-card">
      {rank && <span className="rank-badge">{rank}</span>}
      <div className="hospital-info">
        <h4>{hospital.name}</h4>
        <p>{hospital.city}, {hospital.country}</p>
        <span className="verified-badge">
          <BadgeCheck size={12} />
          Verified
        </span>
      </div>
      <ArrowRight size={16} className="card-arrow" />
    </Link>
  )
}

function SessionHeader() {
  return (
    <header className="site-header">
      <Link className="brand" to="/">
        <span className="brand-mark">CP</span>
        <span>carepath</span>
      </Link>
      <nav>
        <Link to="/treatments">Treatments</Link>
        <Link to="/hospitals">Hospitals</Link>
        <Link to="/treatment-session" className="active">Treatment Session</Link>
        <Link to="/cost-calculator">Cost estimate</Link>
      </nav>
      <div className="header-actions">
        <Link className="text-button" to="/login">Log in</Link>
        <Link className="button button-dark button-small" to="/register">
          Get started <ArrowRight size={15} />
        </Link>
      </div>
    </header>
  )
}

function SessionFooter() {
  return (
    <footer>
      <div className="footer-top">
        <Link className="brand" to="/">
          <span className="brand-mark">CP</span>
          <span>carepath</span>
        </Link>
        <p>Clarity for your care journey.</p>
        <div className="footer-links">
          <Link to="/treatments">Treatments</Link>
          <Link to="/hospitals">Hospitals</Link>
          <Link to="/treatment-session">Treatment Session</Link>
          <Link to="/register">Patients</Link>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 Carepath. Independent healthcare navigation.</span>
        <span>Medical information is not a diagnosis or medical advice.</span>
      </div>
    </footer>
  )
}
