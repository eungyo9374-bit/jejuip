import { useEffect, useState } from 'react'
import { Spinner } from 'react-bootstrap'
import { fetchWeather } from '../api/client'

const ICON = { 맑음: 'sun', 구름많음: 'cloud-sun', 흐림: 'clouds' }

export default function WeatherBadge({ place = '제주시' }) {
  const [w, setW] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchWeather(place).then((list) => setW(list[0])).catch((e) => setError(e.message))
  }, [place])

  if (error) return <span className="weather-pill text-danger">날씨를 불러오지 못했어요</span>
  if (!w) return <Spinner size="sm" />
  const icon = w.rain !== '없음' ? 'cloud-rain' : ICON[w.sky] ?? 'cloud'
  return (
    <span className="weather-pill">
      <i className={`bi bi-${icon}`} />{place} {w.temp}℃ {w.sky} · 강수 {w.pop}%
    </span>
  )
}
