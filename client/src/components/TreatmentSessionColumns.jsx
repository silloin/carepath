import { Link } from 'react-router-dom'
import { ArrowRight, BadgeCheck } from 'lucide-react'

const TREATMENT_IMAGE_MAP = {
  'Hair Transplant': '/treatment-images/hair transplant.jpg',
  'Invisalign Treatment': '/treatment-images/invisalign.jpg',
  'IVF (In-Vitro Fertilization) Treatment': '/treatment-images/ivf.jpg',
  'Rhinoplasty (Nose Job)': '/treatment-images/rhinoplasty.jpg',
  'Dental Implants': '/treatment-images/dental implants.jpg',
  'ACL Reconstruction': '/treatment-images/acl.jpg',
  'Angioplasty': '/treatment-images/angioplasty.jpg',
  'Brain Tumor Surgery': '/treatment-images/brain tumor.jpg',
  'Cancer Treatment': '/treatment-images/cancer treatment.jpg',
}

const FALLBACK_IMAGES = ['acl.jpg', 'angioplasty.jpg', 'brain tumor.jpg', 'cancer treatment.jpg']

function getTreatmentImage(treatment, index) {
  const exactName = treatment.name.toLowerCase() + '.jpg'
  if (TREATMENT_IMAGE_MAP[treatment.name]) {
    return TREATMENT_IMAGE_MAP[treatment.name]
  }
  const fallback = FALLBACK_IMAGES[index % FALLBACK_IMAGES.length]
  return `/treatment-images/${fallback}`
}

function formatCost(treatment) {
  const min = treatment.minEstimatedCost
  const max = treatment.maxEstimatedCost || treatment.minEstimatedCost
  if (!min) return null
  const fmt = (n) => `$${(Number(n) / 80).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
  if (max && Number(max) !== Number(min)) {
    return `${fmt(min)} – ${fmt(max)} · in India`
  }
  return `${fmt(min)} · in India`
}

const DEFAULT_FEATURED = [
  {
    slug: 'hair-transplant',
    name: 'Hair Transplant',
    specialty: { name: 'Cosmetic & Plastic Surgery' },
    description: 'Check out the best doctors, hospitals & cost of Hair Transplant in India',
    cost: '$1,500 – $4,000 · in India',
  },
  {
    slug: 'invisalign-treatment',
    name: 'Invisalign Treatment',
    specialty: { name: 'Dentistry' },
    description: 'Check out the best doctors, hospitals & cost of Invisalign Treatment in India',
    cost: '$1,500 – $5,000 · in India',
  },
  {
    slug: 'ivf-treatment',
    name: 'IVF (In-Vitro Fertilization) Treatment',
    specialty: { name: 'Infertility & IVF' },
    description: 'Check out the best doctors, hospitals & cost of IVF Treatment in India',
    cost: '$4,000 – $5,000 · in India',
  },
  {
    slug: 'rhinoplasty',
    name: 'Rhinoplasty (Nose Job)',
    specialty: { name: 'Cosmetic & Plastic Surgery' },
    description: 'Check out the best doctors, hospitals & cost of Rhinoplasty in India',
    cost: '$4,000 – $6,000 · in India',
  },
  {
    slug: 'dental-implants',
    name: 'Dental Implants',
    specialty: { name: 'Dentistry' },
    description: 'Check out the best doctors, hospitals & cost of Dental Implants in India',
    cost: '$1,000 – $6,000 · in India',
  },
]

export function TreatmentSessionColumns({ treatments, hospitals }) {
  const topTreatments = [...(treatments || [])]
    .sort((a, b) => (b.hospitalCount || 0) - (a.hospitalCount || 0))
    .slice(0, 5)

  const displayTreatments = topTreatments.length >= 3
    ? topTreatments
    : DEFAULT_FEATURED

  return (
    <section className="featured-treatments">
      <span className="ft-kicker">Most Sought-After Procedures</span>
      <h2 className="ft-title">Featured <em>Treatments</em></h2>
      <p className="ft-subtitle">The treatments international patients most often travel to India for</p>

      <div className="ft-scroller">
        {displayTreatments.map((treatment, index) => {
          const costText = treatment.cost || formatCost(treatment)
          const descText = treatment.description ||
            `Check out the best doctors, hospitals & cost of ${treatment.name} in India`
          return (
            <Link
              key={treatment.id || treatment.slug || index}
              to={`/treatments/${treatment.slug}`}
              className="ft-card"
            >
              <div className="ft-image-wrap">
                <img
                  src={getTreatmentImage(treatment, index)}
                  alt={treatment.name}
                  className="ft-image"
                  onError={(e) => {
                    const fallbackIdx = index % FALLBACK_IMAGES.length
                    e.currentTarget.src = `/treatment-images/${FALLBACK_IMAGES[fallbackIdx]}`
                  }}
                />
                <span className="ft-rank">{index + 1}</span>
              </div>
              <div className="ft-body">
                <span className="ft-specialty">{treatment.specialty?.name || 'Featured'}</span>
                <h3 className="ft-name">{treatment.name}</h3>
                <p className="ft-desc">{descText}</p>
                {costText && <div className="ft-cost"><span>{costText}</span></div>}
                <span className="ft-cta">
                  View Treatment <ArrowRight size={14} />
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

export default TreatmentSessionColumns
