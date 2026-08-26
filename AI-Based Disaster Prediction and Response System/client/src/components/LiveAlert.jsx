import React, { useState, useEffect } from 'react'
import axios from 'axios'

const EMERGENCY_NUMBERS = {
  'India': { police: '100', ambulance: '108', disaster: '1078', fire: '101' },
  'United States': { police: '911', ambulance: '911', disaster: '911', fire: '911' },
  'Japan': { police: '110', ambulance: '119', disaster: '171', fire: '119' },
  'Indonesia': { police: '110', ambulance: '118', disaster: '129', fire: '113' },
  'Bangladesh': { police: '999', ambulance: '999', disaster: '1090', fire: '199' },
  'Nepal': { police: '100', ambulance: '102', disaster: '1155', fire: '101' },
  'Philippines': { police: '911', ambulance: '911', disaster: '911', fire: '911' },
  'Pakistan': { police: '15', ambulance: '115', disaster: '1166', fire: '16' },
  'Sri Lanka': { police: '119', ambulance: '110', disaster: '117', fire: '110' },
  'Myanmar': { police: '199', ambulance: '192', disaster: '199', fire: '191' },
  'Turkey': { police: '155', ambulance: '112', disaster: '122', fire: '110' },
  'Mexico': { police: '911', ambulance: '911', disaster: '911', fire: '911' },
  'default': { police: '112', ambulance: '112', disaster: '112', fire: '112' },
}

const SAFETY_INSTRUCTIONS = {
  earthquake: [
    { title: 'Drop to the ground', desc: 'Get on your hands and knees to prevent being knocked over' },
    { title: 'Take cover', desc: 'Get under a sturdy desk, table, or against an interior wall' },
    { title: 'Hold on until it stops', desc: 'Protect your head and neck, stay in position until shaking ends' },
  ],
  flood: [
    { title: 'Move to higher ground', desc: 'Get to the highest floor or elevated area immediately' },
    { title: 'Do not enter flood water', desc: 'Even shallow water can knock you down or hide hazards' },
    { title: 'Call emergency services', desc: 'Report your location and number of people with you' },
  ],
  cyclone: [
    { title: 'Go to an interior room', desc: 'Stay away from windows, glass doors, and exterior walls' },
    { title: 'Keep emergency supplies ready', desc: 'Water, flashlight, phone charger, first aid kit' },
    { title: 'Follow evacuation orders', desc: 'If authorities say leave, leave immediately' },
  ],
  disaster: [
    { title: 'Stay calm and assess', desc: 'Check yourself and others for injuries before moving' },
    { title: 'Move to safety', desc: 'Get away from damaged buildings and hazardous areas' },
    { title: 'Contact emergency services', desc: 'Call the local disaster helpline for assistance' },
  ],
}

function LiveAlert({ latitude, longitude }) {
  const [alerts, setAlerts] = useState([])
  const [country, setCountry] = useState('')
  const [loading, setLoading] = useState(false)
  const [checked, setChecked] = useState(false)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (!latitude || !longitude) {
      setAlerts([])
      setChecked(false)
      setShowModal(false)
      return
    }

    const check = async () => {
      setLoading(true)
      try {
        const res = await axios.post('http://127.0.0.1:5001/alerts', { latitude, longitude, radius: 300 })
        const newAlerts = res.data.alerts || []
        setAlerts(newAlerts)
        if (newAlerts.length > 0) setShowModal(true)

        try {
          const geo = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=3`,
            { headers: { 'User-Agent': 'AI-DPRS/1.0' } }
          )
          setCountry(geo.data?.address?.country || '')
        } catch { }
      } catch { setAlerts([]) }
      setLoading(false)
      setChecked(true)
    }

    check()
  }, [latitude, longitude])

  if (!checked) return null

  if (loading) {
    return (
      <div className='flex items-center gap-2 px-3 py-2.5 border border-border rounded-lg'>
        <div className='w-1.5 h-1.5 bg-ink-muted rounded-full animate-pulse' />
        <span className='text-[11px] text-ink-muted'>Scanning live disaster feeds...</span>
      </div>
    )
  }

  if (alerts.length === 0) {
    return (
      <div className='flex items-center gap-2 px-3 py-2.5 bg-green-50 border border-green-100 rounded-lg'>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
          <path d="M20 6L9 17l-5-5"/>
        </svg>
        <span className='text-[11px] text-green-800'>No active disasters near this location</span>
      </div>
    )
  }

  const primary = alerts[0]
  const instructions = SAFETY_INSTRUCTIONS[primary.type] || SAFETY_INSTRUCTIONS.disaster
  const numbers = EMERGENCY_NUMBERS[country] || EMERGENCY_NUMBERS['default']

  return (
    <>
      {/* Compact trigger in panel */}
      <button onClick={() => setShowModal(true)}
        className='w-full flex items-center gap-2.5 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-left hover:bg-red-100 transition'>
        <div className='relative'>
          <div className='w-2.5 h-2.5 bg-red-un rounded-full' />
          <div className='w-2.5 h-2.5 bg-red-un rounded-full absolute inset-0 animate-ping opacity-75' />
        </div>
        <div>
          <span className='text-[11px] font-semibold text-red-800 block'>
            {alerts.length} active alert{alerts.length > 1 ? 's' : ''} detected
          </span>
          <span className='text-[10px] text-red-600'>{primary.title.substring(0, 50)}{primary.title.length > 50 ? '...' : ''}</span>
        </div>
      </button>

      {/* Modal */}
      {showModal && (
        <div className='fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm' onClick={() => setShowModal(false)}>
          <div className='bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl' onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className='bg-red-un px-6 py-6 rounded-t-2xl'>
              <div className='flex items-center justify-between mb-4'>
                <div className='flex items-center gap-2'>
                  <AlertIcon type={primary.type} />
                  <span className='text-white/80 text-[11px] uppercase tracking-wider font-medium'>Live Alert</span>
                </div>
                <button onClick={() => setShowModal(false)} className='text-white/60 hover:text-white transition'>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>
              <h2 className='text-white text-xl font-bold capitalize'>{primary.type} Alert</h2>
              <p className='text-white/80 text-sm mt-1'>{primary.title}</p>
              {primary.distance_km > 0 && (
                <p className='text-white/60 text-xs mt-1'>{primary.distance_km} km from selected location</p>
              )}
            </div>

            {/* Instructions */}
            <div className='px-6 py-5 border-b border-border'>
              <h3 className='text-[11px] text-ink-muted uppercase tracking-wider font-medium mb-4'>Immediate Actions</h3>
              <div className='flex flex-col gap-4'>
                {instructions.map((step, i) => (
                  <div key={i} className='flex items-start gap-4'>
                    <div className='w-8 h-8 rounded-full bg-red-50 border border-red-100 flex items-center justify-center shrink-0'>
                      <span className='text-red-un text-xs font-bold'>{i + 1}</span>
                    </div>
                    <div>
                      <p className='text-ink text-[14px] font-semibold'>{step.title}</p>
                      <p className='text-ink-muted text-[12px] mt-0.5'>{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Emergency Numbers */}
            <div className='px-6 py-5 border-b border-border'>
              <h3 className='text-[11px] text-ink-muted uppercase tracking-wider font-medium mb-3'>
                Emergency Numbers {country ? `\u2014 ${country}` : ''}
              </h3>
              <div className='grid grid-cols-2 gap-2'>
                <NumberCard label='Disaster Helpline' number={numbers.disaster} />
                <NumberCard label='Ambulance' number={numbers.ambulance} />
                <NumberCard label='Police' number={numbers.police} />
                <NumberCard label='Fire' number={numbers.fire} />
              </div>
            </div>

            {/* Other alerts */}
            {alerts.length > 1 && (
              <div className='px-6 py-4'>
                <h3 className='text-[11px] text-ink-muted uppercase tracking-wider font-medium mb-2'>Other events nearby</h3>
                {alerts.slice(1, 4).map((a, i) => (
                  <div key={i} className='flex items-center gap-2 py-1.5'>
                    <div className='w-1.5 h-1.5 bg-red-un rounded-full shrink-0' />
                    <span className='text-[11px] text-ink-light line-clamp-1'>{a.title}</span>
                    {a.distance_km > 0 && <span className='text-[10px] text-ink-muted shrink-0'>({a.distance_km} km)</span>}
                  </div>
                ))}
              </div>
            )}

            {/* Footer */}
            <div className='px-6 py-4 border-t border-border'>
              <button onClick={() => setShowModal(false)}
                className='w-full py-3 bg-ink text-white text-sm font-medium rounded-xl hover:bg-ink-light active:scale-[0.99] transition'>
                Dismiss
              </button>
              <p className='text-center text-[10px] text-ink-muted mt-2'>Sources: USGS Earthquake Feed, GDACS</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function AlertIcon({ type }) {
  if (type === 'earthquake') return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
      <path d="M2 12h3l3-9 4 18 4-18 3 9h3"/>
    </svg>
  )
  if (type === 'flood') return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
      <path d="M2 15c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/>
      <path d="M2 19c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/>
      <path d="M12 3v10"/>
      <path d="M9 6l3-3 3 3"/>
    </svg>
  )
  if (type === 'cyclone') return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
      <path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0"/>
      <path d="M12 3c2.5 4 2.5 8 0 12"/>
      <path d="M12 3c-2.5 4-2.5 8 0 12"/>
      <path d="M3 12c4-2.5 8-2.5 12 0"/>
      <path d="M3 12c4 2.5 8 2.5 12 0"/>
    </svg>
  )
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  )
}

function NumberCard({ label, number }) {
  return (
    <a href={`tel:${number}`}
      className='flex flex-col gap-0.5 p-3 bg-cream border border-border rounded-lg hover:border-ink-muted transition'>
      <span className='text-[10px] text-ink-muted uppercase tracking-wider'>{label}</span>
      <span className='text-ink text-lg font-bold'>{number}</span>
    </a>
  )
}

export default LiveAlert
