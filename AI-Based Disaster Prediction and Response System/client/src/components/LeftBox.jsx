import React, { useState } from 'react'
import Earthquake from './Earthquake'
import Flood from './Flood'
import Cyclone from './Cyclone'
import LiveAlert from './LiveAlert'

function LeftBox({ setPredicated, setstate }) {
  const [active, setActive] = useState('earthquake')
  const [alertLocation, setAlertLocation] = useState({ latitude: null, longitude: null })

  const tabs = [
    { id: 'earthquake', label: 'Earthquake' },
    { id: 'flood', label: 'Flood' },
    { id: 'cyclone', label: 'Cyclone' },
  ]

  return (
    <div className='bg-card border border-border rounded-xl overflow-hidden shadow-sm flex flex-col'>
      {/* Tabs */}
      <div className='flex border-b border-border'>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActive(tab.id)}
            className={`flex-1 py-3 text-xs font-medium transition
              ${active === tab.id
                ? 'text-ink border-b-2 border-ink -mb-[1px]'
                : 'text-ink-muted hover:text-ink'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Live Alert (shows when any location is selected) */}
      {alertLocation.latitude && (
        <div className='px-4 pt-3'>
          <LiveAlert latitude={alertLocation.latitude} longitude={alertLocation.longitude} />
        </div>
      )}

      {/* Form */}
      <div>
        {active === 'earthquake' && <Earthquake setPredicated={setPredicated} setstate={setstate} onLocationChange={setAlertLocation} />}
        {active === 'flood' && <Flood setPredicated={setPredicated} setstate={setstate} onLocationChange={setAlertLocation} />}
        {active === 'cyclone' && <Cyclone setPredicated={setPredicated} setstate={setstate} onLocationChange={setAlertLocation} />}
      </div>
    </div>
  )
}

export default LeftBox
