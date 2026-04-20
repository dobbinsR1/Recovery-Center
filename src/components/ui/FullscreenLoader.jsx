import { ProgressSpinner } from 'primereact/progressspinner'
import recoveryCenterLogo from '../../assets/recovery_center.png'

export function FullscreenLoader({ label = 'Loading Recovery Center…', fixed = true }) {
  return (
    <div className={`fullscreen-loader ${fixed ? 'fixed' : ''}`} role="status" aria-live="polite" aria-label={label}>
      <div className="fullscreen-loader-backdrop" />
      <div className="fullscreen-loader-card">
        <img src={recoveryCenterLogo} alt="Recovery Center logo" className="fullscreen-loader-logo" />
        <ProgressSpinner strokeWidth="4" animationDuration=".9s" />
        <div className="fullscreen-loader-copy">
          <strong>Recovery Center</strong>
          <span>{label}</span>
        </div>
      </div>
    </div>
  )
}
