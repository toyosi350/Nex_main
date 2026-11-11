import { useState } from 'react'
import { PageHeader, Card } from '../../components/common/Card.jsx'
import { Button } from '../../components/common/Button.jsx'
import { useToast } from '../../hooks/useToast.js'
import { MdSettings } from 'react-icons/md'

const ACCENTS = [
  { name: 'Indigo', value: '#4f46e5' },
  { name: 'Blue', value: '#2563eb' },
  { name: 'Green', value: '#16a34a' },
  { name: 'Amber', value: '#d97706' },
  { name: 'Rose', value: '#e11d48' },
]

export function PreferencesPage() {
  const [accent, setAccent] = useState(() => localStorage.getItem('nexiv.accent') || ACCENTS[0].value)
  const [compact, setCompact] = useState(() => localStorage.getItem('nexiv.compact') === '1')
  const toast = useToast()

  const applyAccent = (value) => {
    setAccent(value)
    localStorage.setItem('nexiv.accent', value)
    document.documentElement.style.setProperty('--brand', value)
    toast.success('Theme accent updated')
  }

  const toggleCompact = (v) => {
    setCompact(v)
    localStorage.setItem('nexiv.compact', v ? '1' : '0')
    document.body.classList.toggle('compact-density', v)
    toast.success(v ? 'Compact density on' : 'Default density')
  }

  return (
    <div className="stack">
      <PageHeader title="Preferences" subtitle="Tune the interface to your taste" icon={<MdSettings />} />
      <div className="doc-detail">
        <div className="doc-detail-main">
          <Card title="Accent color">
            <div className="flex items-center gap-2">
              {ACCENTS.map((a) => (
                <button
                  key={a.value}
                  title={a.name}
                  className={`swatch ${accent === a.value ? 'swatch-active' : ''}`}
                  style={{ background: a.value }}
                  onClick={() => applyAccent(a.value)}
                  aria-label={a.name}
                />
              ))}
            </div>
            <p className="muted text-sm mt-2">Stored in your browser.</p>
          </Card>
          <Card title="Density">
            <div className="flex items-center gap-3">
              <Button variant={compact ? 'ghost' : 'primary'} onClick={() => toggleCompact(false)}>Default</Button>
              <Button variant={compact ? 'primary' : 'ghost'} onClick={() => toggleCompact(true)}>Compact</Button>
            </div>
            <p className="muted text-sm mt-2">Compact density reduces row spacing.</p>
          </Card>
        </div>
        <aside className="doc-detail-side">
          <Card title="About this app">
            <p className="muted text-sm">Nex-IV Business Suite — an all-in-one ERP with CRM, sales, inventory, purchasing, finances, HR, projects and support.</p>
            <p className="muted text-sm mt-2">Version 0.1.0 (demo)</p>
          </Card>
        </aside>
      </div>
    </div>
  )
}

export default PreferencesPage