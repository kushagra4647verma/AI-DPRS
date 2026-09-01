import React, { useState, useRef } from 'react'
import axios from 'axios'

function Earthquake({ setPredicated, setstate, onLocationChange }) {
  const [data, setData] = useState({
    latitude: '', longitude: '', depth: 33,
    year: new Date().getFullYear(), month: new Date().getMonth() + 1,
    day: new Date().getDate(), hour: new Date().getHours()
  })
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [locLabel, setLocLabel] = useState('')
  const [useNow, setUseNow] = useState(true)
  const [loading, setLoading] = useState(false)
  const [geoLoading, setGeoLoading] = useState(false)
  const timer = useRef(null)

  const search = (q) => {
    setQuery(q); setLocLabel('')
    if (timer.current) clearTimeout(timer.current)
    if (q.length < 3) { setSuggestions([]); return }
    timer.current = setTimeout(async () => {
      try {
        const r = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5`)
        setSuggestions(r.data)
      } catch { setSuggestions([]) }
    }, 400)
  }

  const pick = (p) => {
    const lat = parseFloat(p.lat), lon = parseFloat(p.lon)
    setData(d => ({ ...d, latitude: lat, longitude: lon }))
    setLocLabel(p.display_name); setQuery(p.display_name); setSuggestions([])
    if (onLocationChange) onLocationChange({ latitude: lat, longitude: lon })
  }

  const geolocate = () => {
    if (!navigator.geolocation) return
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude, lon = pos.coords.longitude
        setData(d => ({ ...d, latitude: lat, longitude: lon }))
        setLocLabel(`${lat.toFixed(4)}, ${lon.toFixed(4)}`)
        setQuery(''); setSuggestions([]); setGeoLoading(false)
        if (onLocationChange) onLocationChange({ latitude: lat, longitude: lon })
      },
      () => setGeoLoading(false),
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  const setNow = () => {
    const n = new Date()
    setData(d => ({ ...d, year: n.getFullYear(), month: n.getMonth() + 1, day: n.getDate(), hour: n.getHours() }))
    setUseNow(true)
  }

  const predict = async () => {
    if (!data.latitude || !data.longitude) return
    setLoading(true)
    try {
      const r = await axios.post("/earth", data)
      setPredicated(r.data)
      setstate(1)
    } catch { /* */ }
    setLoading(false)
  }

  const fmtDate = `${data.year}-${String(data.month).padStart(2,'0')}-${String(data.day).padStart(2,'0')}`
  const fmtTime = `${String(data.hour).padStart(2,'0')}:00`

  return (
    <div className='flex flex-col gap-5 p-5'>
      <Field label='Location'>
        <div className='relative'>
          <input type='text' value={query} onChange={e => search(e.target.value)}
            placeholder='Search city, region, or coordinates'
            className='input-field' />
          {suggestions.length > 0 && (
            <ul className='absolute z-50 w-full mt-1 bg-white border border-border rounded-lg shadow-lg overflow-hidden'>
              {suggestions.map((p, i) => (
                <li key={i} onClick={() => pick(p)}
                  className='px-3 py-2.5 text-xs text-ink-light cursor-pointer hover:bg-cream border-b border-border/50 last:border-0 truncate'>
                  {p.display_name}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className='flex items-center gap-3 mt-1.5'>
          <button onClick={geolocate} disabled={geoLoading}
            className='text-[11px] text-blue-un hover:underline disabled:text-ink-muted'>
            {geoLoading ? 'Getting location...' : 'Use my location'}
          </button>
          {locLabel && <span className='text-[11px] text-ink-muted truncate max-w-[200px]'>{locLabel}</span>}
        </div>
      </Field>

      <Field label='When'>
        <div className='flex items-center gap-2 flex-wrap'>
          <input type='date' value={fmtDate}
            onChange={e => { const d = new Date(e.target.value); if(!isNaN(d)) { setData(x => ({...x, year:d.getFullYear(), month:d.getMonth()+1, day:d.getDate()})); setUseNow(false) }}}
            className='input-field w-auto' />
          <input type='time' value={fmtTime}
            onChange={e => { const [h] = e.target.value.split(':'); setData(x => ({...x, hour: parseInt(h)||0})); setUseNow(false) }}
            className='input-field w-auto' />
          <button onClick={setNow}
            className={`text-[11px] px-3 py-2 rounded-md border transition
              ${useNow ? 'bg-ink text-white border-ink' : 'bg-white text-ink-muted border-border hover:border-ink-light'}`}>
            Right now
          </button>
        </div>
      </Field>

      <button onClick={predict} disabled={loading || !data.latitude}
        className='w-full py-3 bg-ink text-white text-sm font-medium rounded-lg hover:bg-ink-light active:scale-[0.99] transition disabled:opacity-30 disabled:cursor-not-allowed'>
        {loading ? 'Running model...' : 'Run prediction'}
      </button>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div className='flex flex-col gap-1.5'>
      <label className='text-[11px] font-medium text-ink-muted uppercase tracking-wider'>{label}</label>
      {children}
    </div>
  )
}

export default Earthquake
