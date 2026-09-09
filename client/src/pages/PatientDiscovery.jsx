import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, BadgeCheck, Search, Stethoscope } from 'lucide-react'
import { getHospitals, getTreatments } from '../api'
import { DataState } from '../components/DataState'
import { Header, Footer } from '../App'

export function TreatmentDirectory() {
  const [search, setSearch] = useState('')
  const [submitted, setSubmitted] = useState('')
  const query = useQuery({ 
    queryKey: ['release3-treatments', submitted], 
    queryFn: () => getTreatments(submitted) 
  })
  
  return (
    <>
      <Header />
      <main className="directory-page">
        <DirectoryIntro 
          title="Start with the treatment you need." 
          description="Search the central treatment catalog and see only real verified providers with current treatment records." 
          value={search} 
          setValue={setSearch} 
          submit={() => setSubmitted(search)} 
          placeholder="Search treatment or specialty" 
        />
        <div className="directory-content">
          <aside>
            <strong>Search results</strong>
            <p>Every treatment remains visible even when no verified hospital currently offers it.</p>
          </aside>
          <div className="directory-results">
            <DataState 
              loading={query.isLoading} 
              error={query.error} 
              empty="No treatments found."
            >
              {query.data?.map((treatment) => (
                <Link 
                  className="result-card treatment-result coral" 
                  key={treatment.id} 
                  to={`/treatments/${treatment.slug}`}
                >
                  <div className="card-icon">
                    <Stethoscope size={20} />
                  </div>
                  <div>
                    <span className="specialty">{treatment.specialty.name}</span>
                    <h3>{treatment.name}</h3>
                    <p>
                      {treatment.hospitalCount} approved verified hospital
                      {treatment.hospitalCount === 1 ? '' : 's'} currently available
                    </p>
                  </div>
                  <ArrowRight size={19} />
                </Link>
              ))}
            </DataState>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

export function HospitalDirectory() {
  const [filters, setFilters] = useState({ 
    search: '', 
    city: '', 
    treatmentId: '', 
    specialtyId: '', 
    availability: 'AVAILABLE', 
    accreditation: '' 
  })
  const [submitted, setSubmitted] = useState(filters)
  const treatments = useQuery({ 
    queryKey: ['directory-treatments'], 
    queryFn: () => getTreatments() 
  })
  const query = useQuery({ 
    queryKey: ['release3-hospitals', submitted], 
    queryFn: () => getHospitals(submitted) 
  })
  
  const update = (event) => setFilters({ 
    ...filters, 
    [event.target.name]: event.target.value 
  })
  
  return (
    <>
      <Header />
      <main className="directory-page">
        <span className="kicker">Verified provider directory</span>
        <h1>Find a hospital that fits your journey.</h1>
        <p className="directory-lede">
          Filter verified hospitals by city, treatment, specialty, accreditation, and availability.
        </p>
        <form 
          className="filter-bar" 
          onSubmit={(event) => { 
            event.preventDefault()
            setSubmitted(filters) 
          }}
        >
          <label>
            Search
            <input 
              name="search" 
              value={filters.search} 
              onChange={update} 
              placeholder="Hospital name" 
            />
          </label>
          <label>
            City
            <input 
              name="city" 
              value={filters.city} 
              onChange={update} 
              placeholder="New Delhi" 
            />
          </label>
          <label>
            Treatment
            <select 
              name="treatmentId" 
              value={filters.treatmentId} 
              onChange={update}
            >
              <option value="">All treatments</option>
              {treatments.data?.map((item) => (
                <option value={item.id} key={item.id}>{item.name}</option>
              ))}
            </select>
          </label>
          <label>
            Specialty
            <select 
              name="specialtyId" 
              value={filters.specialtyId} 
              onChange={update}
            >
              <option value="">All specialties</option>
              {[...new Map(
                treatments.data?.map((item) => [item.specialty.id, item.specialty]) || []
              ).values()].map((item) => (
                <option value={item.id} key={item.id}>{item.name}</option>
              ))}
            </select>
          </label>
          <label>
            Availability
            <select 
              name="availability" 
              value={filters.availability} 
              onChange={update}
            >
              <option value="AVAILABLE">Available</option>
              <option value="TEMPORARILY_UNAVAILABLE">Temporarily unavailable</option>
              <option value="COMING_SOON">Coming soon</option>
            </select>
          </label>
          <button className="button button-coral">
            Apply filters <Search size={16} />
          </button>
        </form>
        <div className="directory-results hospital-directory-results">
          <DataState 
            loading={query.isLoading} 
            error={query.error} 
            empty="No verified hospitals match these filters."
          >
            {query.data?.map((hospital) => (
              <article className="hospital-card" key={hospital.id}>
                <div className="hospital-image hospital-placeholder">
                  <span className="verified">
                    <BadgeCheck size={14} /> Verified
                  </span>
                  <div className="building-glyph">
                    <span /><span /><span /><span /><span /><span />
                  </div>
                </div>
                <div className="hospital-content">
                  <div className="hospital-meta">
                    <span>{hospital.city}, {hospital.country}</span>
                    <span>{hospital.treatments.length} treatments</span>
                  </div>
                  <h3>{hospital.name}</h3>
                  <p>
                    {hospital.description || 'Verified provider with treatment information available.'}
                  </p>
                  <div className="hospital-treatment-tags">
                    {[...new Map(
                      hospital.treatments.map(item => [item.treatment.id, item])
                    ).values()].slice(0, 3).map((item) => (
                      <span key={item.id}>{item.treatment.name}</span>
                    ))}
                  </div>
                  <Link to={`/hospitals/${hospital.slug}`} className="inline-link">
                    View hospital <ArrowRight size={15} />
                  </Link>
                </div>
              </article>
            ))}
          </DataState>
        </div>
      </main>
      <Footer />
    </>
  )
}

function DirectoryIntro({ title, description, value, setValue, submit, placeholder }) { 
  return (
    <div className="page-intro">
      <span className="kicker">Carepath directory</span>
      <h1>{title}</h1>
      <p>{description}</p>
      <form 
        className="search-box" 
        onSubmit={(event) => { 
          event.preventDefault()
          submit() 
        }}
      >
        <Search size={20} />
        <input 
          value={value} 
          onChange={(e) => setValue(e.target.value)} 
          placeholder={placeholder} 
        />
        <button className="button button-coral">
          Search <ArrowRight size={17} />
        </button>
      </form>
    </div>
  )
}