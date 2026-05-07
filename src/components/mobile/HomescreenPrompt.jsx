import { useEffect, useMemo, useState } from 'react'
import { Button } from 'primereact/button'
import recoveryCenterLogo from '../../assets/recovery_center.png'

const DISMISS_KEY = 'recovery-center-install-prompt-dismissed'

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
}

function isIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent)
}

function isMobileViewport() {
  return window.matchMedia('(max-width: 1120px)').matches
}

export function HomescreenPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!isMobileViewport() || isStandalone() || window.sessionStorage.getItem(DISMISS_KEY) === 'true') {
      return undefined
    }

    const timer = window.setTimeout(() => {
      setVisible(true)
    }, 1000)

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault()
      setDeferredPrompt(event)
      setVisible(true)
    }

    const handleAppInstalled = () => {
      setVisible(false)
      setDeferredPrompt(null)
      window.sessionStorage.setItem(DISMISS_KEY, 'true')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const instructionText = useMemo(() => {
    if (isIos()) {
      return 'Tap Share, then choose Add to Home Screen to save Dobbins Recovery Center on your phone.'
    }

    if (deferredPrompt) {
      return 'Install Dobbins Recovery Center on your home screen for faster access and a cleaner app-style view.'
    }

    return 'Open your browser menu and choose Add to Home screen or Install app to save Dobbins Recovery Center.'
  }, [deferredPrompt])

  if (!visible) {
    return null
  }

  return (
    <div className="homescreen-prompt" role="dialog" aria-label="Save to homescreen">
      <img src={recoveryCenterLogo} alt="Recovery Center logo" className="homescreen-prompt-logo" />
      <div className="homescreen-prompt-copy">
        <strong>Save to Home Screen</strong>
        <p>{instructionText}</p>
      </div>
      <div className="homescreen-prompt-actions">
        {deferredPrompt ? (
          <Button
            label="Save now"
            size="small"
            onClick={async () => {
              deferredPrompt.prompt()
              await deferredPrompt.userChoice
              setVisible(false)
              setDeferredPrompt(null)
              window.sessionStorage.setItem(DISMISS_KEY, 'true')
            }}
          />
        ) : null}
        <Button
          label="Not now"
          text
          size="small"
          onClick={() => {
            window.sessionStorage.setItem(DISMISS_KEY, 'true')
            setVisible(false)
          }}
        />
      </div>
    </div>
  )
}
