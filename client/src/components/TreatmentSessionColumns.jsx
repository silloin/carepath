import { Link } from 'react-router-dom'
import { ArrowRight, BadgeCheck, Activity, Heart, Bone, Brain } from 'lucide-react'

const specialtyIcons = {
  'Cardiology': Heart,
  'Neurology': Brain,
  'Orthopedics': Bone,
  'General Surgery': Activity,
  'default': Activity
}

export function TreatmentSessionColumns({ treatments, hospitals }) {
  const specialties = [...new Map(treatments?.map(t => [t.specialty.name, t.specialty]) || []).values()]
  
  const topTreatments = [...(treatments || [])]
    .sort((a, b) => (b.hospitalCount || 0) - (a.hospitalCount || 0))
    .slice(0, 6)

  const topHospitals = [...(hospitals || [])]
    .slice(0, 6)

  return (
    <section className="treatment-session-section">
      <div className="session-header">
        <span className="kicker">Treatment Session</span>
        <h2>Explore Top Treatments by Category</h2>
        <p>Discover the most sought-after treatments across specialties with verified hospital providers</p>
      </div>

      <div className="treatment-columns">
        <div className="treatment-column">
          <div className="column-header">
            <Activity size={20} />
            <span>Most Requested</span>
          </div>
          {topTreatments.slice(0, 3).map((treatment, index) => (
            <TreatmentCard key={treatment.id} treatment={treatment} rank={index + 1} />
          ))}
        </div>

        <div className="treatment-column">
          <div className="column-header">
            <Heart size={20} />
            <span>Cardiac Care</span>
          </div>
          {treatments
            ?.filter(t => t.specialty.name === 'Cardiology')
            .slice(0, 3)
            .map((treatment, index) => (
              <TreatmentCard key={treatment.id} treatment={treatment} />
            ))}
        </div>

        <div className="treatment-column">
          <div className="column-header">
            <Bone size={20} />
            <span>Orthopedics</span>
          </div>
          {treatments
            ?.filter(t => t.specialty.name === 'Orthopedics')
            .slice(0, 3)
            .map((treatment, index) => (
              <TreatmentCard key={treatment.id} treatment={treatment} />
            ))}
        </div>

        <div className="treatment-column">
          <div className="column-header">
            <Brain size={20} />
            <span>Neurology</span>
          </div>
          {treatments
            ?.filter(t => t.specialty.name === 'Neurology')
            .slice(0, 3)
            .map((treatment, index) => (
              <TreatmentCard key={treatment.id} treatment={treatment} />
            ))}
        </div>
      </div>

      <div className="session-header hospitals-header">
        <h2>Top Hospitals</h2>
        <p>Leading verified providers across India</p>
      </div>

      <div className="hospital-columns">
        {topHospitals.map((hospital, index) => (
          <HospitalCard key={hospital.id} hospital={hospital} rank={index + 1} />
        ))}
      </div>
    </section>
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
