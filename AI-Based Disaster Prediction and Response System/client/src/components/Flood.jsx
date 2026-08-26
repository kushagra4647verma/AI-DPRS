import React, { useState } from 'react'
import axios from 'axios'

const QUESTIONS = [
  {
    key: 'rainfall',
    label: 'How heavy is rainfall in this area?',
    options: [
      { label: 'Very light / Arid', value: 1 },
      { label: 'Light / Occasional rain', value: 3 },
      { label: 'Moderate / Seasonal rain', value: 5 },
      { label: 'Heavy / Monsoon region', value: 7 },
      { label: 'Extreme / Prolonged heavy rain', value: 9 },
    ]
  },
  {
    key: 'terrain',
    label: 'What is the terrain like?',
    options: [
      { label: 'High elevation / Hilltop', value: 2 },
      { label: 'Plateau / Elevated plain', value: 3 },
      { label: 'Flat plains', value: 6 },
      { label: 'River basin / Low-lying', value: 8 },
      { label: 'Coastal / Delta region', value: 9 },
    ]
  },
  {
    key: 'infrastructure',
    label: 'How good is drainage and infrastructure?',
    options: [
      { label: 'Excellent (modern, good drainage)', value: 2 },
      { label: 'Good (some issues in heavy rain)', value: 4 },
      { label: 'Average (waterlogging common)', value: 6 },
      { label: 'Poor (frequent flooding)', value: 8 },
      { label: 'Very poor (no proper drainage)', value: 9 },
    ]
  },
  {
    key: 'environment',
    label: 'Environmental conditions?',
    options: [
      { label: 'Preserved forests and wetlands', value: 2 },
      { label: 'Some deforestation, mostly intact', value: 4 },
      { label: 'Moderate urbanization', value: 6 },
      { label: 'Heavy urbanization, tree loss', value: 7 },
      { label: 'Severe deforestation, no wetlands', value: 9 },
    ]
  },
  {
    key: 'preparedness',
    label: 'Disaster preparedness in the region?',
    options: [
      { label: 'Strong (early warning, trained response)', value: 2 },
      { label: 'Adequate (some systems in place)', value: 4 },
      { label: 'Basic (minimal planning)', value: 6 },
      { label: 'Weak (poor coordination)', value: 8 },
      { label: 'None (no disaster management)', value: 9 },
    ]
  },
]

function mapToModelFeatures(answers) {
  const r = answers.rainfall || 5
  const t = answers.terrain || 5
  const i = answers.infrastructure || 5
  const e = answers.environment || 5
  const p = answers.preparedness || 5

  return {
    MonsoonIntensity: r,
    TopographyDrainage: t,
    RiverManagement: Math.round((i + t) / 2),
    Deforestation: e,
    Urbanization: Math.round((e + i) / 2),
    ClimateChange: Math.min(10, Math.round(r * 0.7 + e * 0.3)),
    DamsQuality: Math.round((i + p) / 2),
    Siltation: Math.round((r + t) / 2.5),
    AgriculturalPractices: Math.round(e * 0.8),
    Encroachments: Math.round((e + i) / 2.5),
    IneffectiveDisasterPreparedness: p,
    DrainageSystems: i,
    CoastalVulnerability: t >= 8 ? Math.round(r * 0.9) : Math.round(t * 0.4),
    Landslides: t <= 3 ? Math.round(r * 0.7) : Math.round(t * 0.3),
    Watersheds: Math.round((e + r) / 2.5),
    DeterioratingInfrastructure: i,
    PopulationScore: Math.round((e + i) / 2),
    WetlandLoss: Math.round(e * 0.8),
    InadequatePlanning: Math.round((p + i) / 2),
    PoliticalFactors: Math.round(p * 0.6),
  }
}

function Flood({ setPredicated, setstate, onLocationChange }) {
  const [answers, setAnswers] = useState({})
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)

  const current = QUESTIONS[step]
  const totalSteps = QUESTIONS.length
  const allAnswered = QUESTIONS.every(q => answers[q.key] !== undefined)

  const setAnswer = (key, value) => {
    setAnswers(a => ({ ...a, [key]: value }))
    // Auto-advance to next question after a short delay
    if (step < totalSteps - 1) {
      setTimeout(() => setStep(s => s + 1), 200)
    }
  }

  const predict = async () => {
    if (!allAnswered) return
    setLoading(true)
    try {
      const factors = mapToModelFeatures(answers)
      const r = await axios.post("http://127.0.0.1:5001/flood", factors)
      setPredicated(r.data)
      setstate(2)
    } catch { /* */ }
    setLoading(false)
  }

  return (
    <div className='p-5 flex flex-col gap-4 h-full'>
      {/* Progress */}
      <div className='flex items-center gap-2'>
        {QUESTIONS.map((q, idx) => (
          <div key={idx}
            className={`h-1 flex-1 rounded-full transition-all ${
              answers[q.key] !== undefined ? 'bg-ink' :
              idx === step ? 'bg-ink/40' : 'bg-border'
            }`}
          />
        ))}
      </div>
      <span className='text-[11px] text-ink-muted'>Question {step + 1} of {totalSteps}</span>

      {/* Question */}
      <div className='flex-1 flex flex-col gap-3'>
        <p className='text-[13px] font-medium text-ink leading-snug'>{current.label}</p>
        <div className='flex flex-col gap-1.5'>
          {current.options.map(opt => (
            <button
              key={opt.value}
              onClick={() => setAnswer(current.key, opt.value)}
              className={`text-left text-[12px] px-3.5 py-2.5 rounded-lg border transition
                ${answers[current.key] === opt.value
                  ? 'border-ink bg-ink text-white'
                  : 'border-border bg-white text-ink-light hover:border-ink-muted'
                }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className='flex items-center justify-between pt-2 border-t border-border'>
        <button
          onClick={() => setStep(s => Math.max(0, s - 1))}
          disabled={step === 0}
          className='text-[12px] text-ink-muted hover:text-ink transition disabled:opacity-30 disabled:cursor-not-allowed'
        >
          &larr; Back
        </button>

        {step < totalSteps - 1 ? (
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={!answers[current.key]}
            className='text-[12px] text-ink font-medium hover:text-ink-light transition disabled:opacity-30 disabled:cursor-not-allowed'
          >
            Next &rarr;
          </button>
        ) : (
          <button onClick={predict} disabled={loading || !allAnswered}
            className='text-[12px] font-medium px-4 py-2 bg-ink text-white rounded-lg hover:bg-ink-light active:scale-[0.98] transition disabled:opacity-30 disabled:cursor-not-allowed'>
            {loading ? 'Analyzing...' : 'Predict Risk'}
          </button>
        )}
      </div>
    </div>
  )
}

export default Flood
