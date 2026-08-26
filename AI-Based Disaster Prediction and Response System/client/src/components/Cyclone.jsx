import React, { useState, useRef } from 'react'
import axios from 'axios'

function Cyclone({ setPredicated, setstate, onLocationChange }) {
  const [data, setData] = useState({
    latitude: '', longitude: '',
    moderate_wind_ne: '', moderate_wind_se: '', moderate_wind_sw: '', moderate_wind_nw: '',
    year: new Date().getFullYear(), month: new Date().getMonth() + 1, day: new Date().getDate()
  })
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [locLabel, setLocLabel] = useState('')
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

  const update = (key, val) => setData(d => ({ ...d, [key]: Number(val) || '' }))

  const predict = async () => {
    if (!data.latitude || !data.longitude) return
    setLoading(true)
    try {
      const payload = { ...data,
        moderate_wind_ne: data.moderate_wind_ne || 0, moderate_wind_se: data.moderate_wind_se || 0,
        moderate_wind_sw: data.moderate_wind_sw || 0, moderate_wind_nw: data.moderate_wind_nw || 0 }
      const r = await axios.post("http://127.0.0.1:5001/hurri", payload)
      setPredicated(r.data.predicted_max_wind)
      setstate(3)
    } catch { /* */ }
    setLoading(false)
  }

  const fmtDate = `${data.year}-${String(data.month).padStart(2,'0')}-${String(data.day).padStart(2,'0')}`

  return (
    <div className='p-5 flex flex-col gap-5'>
      <Field label='Location'>
        <div className='relative'>
          <input type='text' value={query} onChange={e => search(e.target.value)}
            placeholder='Search coastal city or region' className='input-field' />
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
          {locLabel && <span className='text-[11px] text-ink-muted truncate max-w-[180px]'>{locLabel}</span>}
        </div>
      </Field>

      <Field label='Wind radii (nautical miles)'>
        <div className='grid grid-cols-2 gap-2'>
          {[['moderate_wind_ne','NE'],['moderate_wind_se','SE'],['moderate_wind_sw','SW'],['moderate_wind_nw','NW']].map(([key, label]) => (
            <input key={key} type='number' value={data[key]} onChange={e => update(key, e.target.value)}
              placeholder={label} className='input-field text-center' />
          ))}
        </div>
        <p className='text-[11px] text-ink-muted mt-1'>50-knot wind extent in each quadrant. Leave blank if unknown.</p>
      </Field>

      <Field label='Date'>
        <input type='date' value={fmtDate}
          onChange={e => { const d = new Date(e.target.value); if(!isNaN(d)) setData(x => ({...x, year:d.getFullYear(), month:d.getMonth()+1, day:d.getDate()})) }}
          className='input-field w-auto' />
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

export default Cyclone
