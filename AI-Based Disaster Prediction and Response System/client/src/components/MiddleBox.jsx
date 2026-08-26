import React from 'react'

function MiddleBox({ predicated, state }) {

  if (!predicated) {
    return (
      <div className='h-full flex flex-col justify-center'>
        <div className='border-l-2 border-red-un pl-5 mb-8'>
          <p className='text-ink-muted text-sm mb-1'>How it works</p>
          <p className='text-ink text-[15px] leading-relaxed max-w-lg'>
            Choose a disaster type from the panel, enter the required parameters, and submit.
            The system will return an assessment based on a Random Forest model trained on historical records.
          </p>
        </div>
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
          <InfoCard num='01' title='Select' body='Pick earthquake, flood, or cyclone from the tabs.' />
          <InfoCard num='02' title='Input' body='Enter a location by searching or using GPS. Set the date.' />
          <InfoCard num='03' title='Assess' body='Get a magnitude, flood likelihood, or wind speed estimate.' />
        </div>
      </div>
    )
  }

  if (state === 1) {
    const isObject = typeof predicated === 'object'
    const mag = isObject ? predicated.predicted_magnitude : predicated
    const histMax = isObject ? predicated.historical_max : null
    const eventCount = isObject ? predicated.event_count : null
    const risk = isObject ? predicated.risk_level : null
    const activeAlert = isObject ? predicated.active_alert : null

    const riskColor = {
      'Extreme': 'bg-red-100 text-red-700',
      'Very High': 'bg-red-100 text-red-700',
      'High': 'bg-orange-100 text-orange-700',
      'Moderate': 'bg-yellow-100 text-yellow-700',
      'Low': 'bg-green-100 text-green-700',
      'Very Low': 'bg-green-100 text-green-600',
      'Negligible': 'bg-gray-100 text-gray-600',
    }

    return (
      <div className='w-full bg-card border border-border border-l-4 border-l-yellow-600 rounded-xl p-6 lg:p-8 overflow-y-auto'>
        {/* Active Alert Banner */}
        {activeAlert && (
          <div className='bg-red-50 border border-red-200 rounded-lg p-3 mb-4'>
            <div className='flex items-center gap-2 mb-1'>
              <span className='w-2 h-2 bg-red-500 rounded-full animate-pulse' />
              <span className='text-[11px] font-semibold uppercase tracking-wider text-red-700'>Active Seismic Event Detected</span>
            </div>
            <p className='text-[12px] text-red-800 font-medium'>
              M{activeAlert.magnitude} earthquake — {activeAlert.place}
            </p>
            <p className='text-[11px] text-red-600'>{activeAlert.distance_km} km from queried location</p>
          </div>
        )}
        <p className='text-[11px] font-medium text-ink-muted uppercase tracking-wider mb-1'>Earthquake Assessment</p>
        <div className='flex items-baseline gap-2 mb-2'>
          <span className='text-3xl font-serif font-bold text-ink'>{mag}</span>
          <span className='text-sm text-ink-muted'>predicted magnitude</span>
        </div>
        {risk && (
          <div className='flex flex-wrap items-center gap-3 mb-5'>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-md ${riskColor[risk] || riskColor['Moderate']}`}>
              {risk} Risk Zone
            </span>
            {histMax > 0 && (
              <span className='text-xs text-ink-muted'>
                Historical max: {histMax} · {eventCount.toLocaleString()} events recorded
              </span>
            )}
            {histMax === 0 && (
              <span className='text-xs text-ink-muted'>No significant seismic history at this location</span>
            )}
          </div>
        )}
        <p className='text-[13px] text-ink-light leading-relaxed mb-6'>
          {histMax >= 8
            ? `EXTREME DANGER. This region has produced catastrophic earthquakes (magnitude ${histMax}). Major structural damage and loss of life are historically documented here.`
            : histMax >= 7
            ? `This is a very high-risk seismic zone. Earthquakes up to magnitude ${histMax} have been recorded. Significant damage to buildings and infrastructure is expected in a major event.`
            : histMax >= 6
            ? `This region has experienced damaging earthquakes (up to ${histMax}). Structural damage to poorly built buildings is likely during a strong event.`
            : histMax >= 5
            ? `Moderate seismic zone. Earthquakes up to ${histMax} recorded — these can cause minor damage and are widely felt.`
            : histMax >= 4
            ? `Low seismic activity. Historical events up to ${histMax} are light earthquakes — felt by people but rarely cause damage.`
            : histMax > 0
            ? `Very low seismic activity at this location. Only minor tremors recorded historically.`
            : 'No significant seismic activity has been recorded at this location. Risk is negligible based on available data.'}
        </p>
        <div className='border-t border-border pt-5'>
          <p className='text-[11px] font-medium text-ink-muted uppercase tracking-wider mb-3'>Recommended Actions</p>
          <ol className='space-y-2'>
            {['Drop, cover, and hold on during shaking.',
              'Secure heavy furniture to walls in advance.',
              'Keep an emergency kit with water, food, and first aid.',
              'Know your building evacuation routes.',
              'After shaking stops, check for gas leaks and structural damage.'
            ].map((m, i) => (
              <li key={i} className='flex gap-3 text-sm text-ink-light leading-relaxed'>
                <span className='text-ink-muted font-medium shrink-0'>{i + 1}.</span>
                <span>{m}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    )
  }

  if (state === 2) {
    const isObject = typeof predicated === 'object'
    const probability = isObject ? predicated.flood_probability : null
    const risk = isObject ? predicated.risk_level : 'Unknown'
    const pct = probability ? (probability * 100).toFixed(1) : null
    const danger = risk === 'High' || risk === 'Moderate'
    return (
      <ResultCard
        type='Flood'
        color={danger ? 'border-red-un' : 'border-green-600'}
        value={pct ? `${pct}%` : risk}
        unit={pct ? 'flood probability' : ''}
        description={
          danger
            ? 'Based on the environmental and infrastructure factors provided, this region faces elevated flood risk. Immediate preparedness measures are recommended.'
            : 'Based on the provided factors, flood risk for this region is within acceptable levels. Continue monitoring during monsoon season.'
        }
        measures={[
          'Move to higher ground immediately if flooding begins.',
          'Do not walk or drive through flood water.',
          'Disconnect electrical appliances before evacuating.',
          'Keep important documents in waterproof bags.',
          'Follow instructions from local disaster management authorities.',
        ]}
      />
    )
  }

  // Cyclone
  const windSpeed = typeof predicated === 'number' ? predicated : parseFloat(predicated)
  const cycloneCategory = windSpeed >= 137 ? 'Category 5' :
                          windSpeed >= 113 ? 'Category 4' :
                          windSpeed >= 96 ? 'Category 3' :
                          windSpeed >= 83 ? 'Category 2' :
                          windSpeed >= 64 ? 'Category 1' :
                          windSpeed >= 34 ? 'Tropical Storm' : 'Tropical Depression'
  const isSevere = windSpeed >= 64
  const cycloneDesc = isSevere
    ? `If a tropical cyclone system were to develop at this location with the given wind field, the model predicts severe sustained winds of ${cycloneCategory} intensity. This indicates high destructive potential.`
    : `The predicted wind speed indicates a ${cycloneCategory}-level system — a relatively weak or developing disturbance. This location has low historical cyclone intensity based on the given parameters.`

  return (
    <ResultCard
      type='Cyclone'
      color={isSevere ? 'border-red-un' : 'border-green-600'}
      value={windSpeed.toFixed(1)}
      unit={`knots — ${cycloneCategory}`}
      description={cycloneDesc}
      measures={isSevere ? [
        'Board up windows and secure outdoor objects.',
        'Stock water, non-perishable food, and medications for 72 hours.',
        'Identify your nearest storm shelter or evacuation centre.',
        'Charge devices and have a battery-powered radio ready.',
        'Stay away from coastal zones and low-lying areas.',
      ] : [
        'Monitor weather advisories from local meteorological agencies.',
        'Ensure emergency supplies are stocked as a precaution.',
        'Stay informed about developing weather systems in your area.',
        'No immediate action required at this intensity level.',
      ]}
    />
  )
}

function ResultCard({ type, color, value, unit, description, measures }) {
  return (
    <div className={`bg-card border border-border rounded-xl p-6 lg:p-8 border-l-4 ${color}`}>
      <p className='text-[11px] font-medium text-ink-muted uppercase tracking-wider mb-1'>{type} Assessment</p>
      <div className='flex items-baseline gap-2 mb-4'>
        <span className='text-3xl font-serif font-bold text-ink'>{value}</span>
        {unit && <span className='text-sm text-ink-muted'>{unit}</span>}
      </div>
      <p className='text-sm text-ink-light leading-relaxed mb-6'>{description}</p>
      <div className='border-t border-border pt-5'>
        <p className='text-[11px] font-medium text-ink-muted uppercase tracking-wider mb-3'>Recommended Actions</p>
        <ol className='space-y-2'>
          {measures.map((m, i) => (
            <li key={i} className='flex gap-3 text-sm text-ink-light leading-relaxed'>
              <span className='text-ink-muted font-medium shrink-0'>{i + 1}.</span>
              <span>{m}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

function InfoCard({ num, title, body }) {
  return (
    <div className='bg-card border border-border rounded-xl p-5'>
      <span className='text-[11px] font-medium text-ink-muted'>{num}</span>
      <p className='text-sm font-semibold text-ink mt-1 mb-1'>{title}</p>
      <p className='text-xs text-ink-muted leading-relaxed'>{body}</p>
    </div>
  )
}

export default MiddleBox
