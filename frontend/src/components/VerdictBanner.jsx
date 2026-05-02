import './VerdictBanner.css'

function getVerdictState(probability, prediction) {
  // Borderline: 35-65% range (regardless of prediction label)
  if (probability >= 35 && probability <= 65) {
    return 'borderline'
  }
  // Otherwise use the prediction label
  return prediction === 'BBB+' ? 'positive' : 'negative'
}

function getConfidenceTier(probability) {
  if (probability > 85 || probability < 15) return 'HIGH CONFIDENCE'
  if (probability > 65 && probability < 85) return 'MODERATE'
  if (probability > 15 && probability < 35) return 'MODERATE'
  return 'BORDERLINE'
}

const VERDICT_CONFIG = {
  positive: {
    gradient: 'linear-gradient(90deg, #065f46 0%, #047857 100%)',
    icon: '✅',
    mainText: 'PENETRATES BLOOD-BRAIN BARRIER',
    subText: 'This compound is predicted to reach the brain'
  },
  negative: {
    gradient: 'linear-gradient(90deg, #7f1d1d 0%, #991b1b 100%)',
    icon: '🚫',
    mainText: 'BLOCKED AT BLOOD-BRAIN BARRIER',
    subText: 'This compound is unlikely to reach the brain'
  },
  borderline: {
    gradient: 'linear-gradient(90deg, #92400e 0%, #b45309 100%)',
    icon: '⚠️',
    mainText: 'UNCERTAIN — MAY PARTIALLY PENETRATE',
    subText: 'Prediction confidence is moderate — interpret with caution'
  }
}

export default function VerdictBanner({ probability, prediction, animKey }) {
  const state = getVerdictState(probability, prediction)
  const config = VERDICT_CONFIG[state]
  const confidenceTier = getConfidenceTier(probability)

  return (
    <div
      key={animKey}
      className="verdict-banner"
      style={{ background: config.gradient }}
    >
      <div className="verdict-banner-shimmer" />

      <div className="verdict-banner-content">
        <div className="verdict-banner-main">
          <div className="verdict-banner-text-wrapper">
            <div className="verdict-banner-main-text">
              <span className="verdict-banner-icon">{config.icon}</span>
              {config.mainText}
            </div>
            <div className="verdict-banner-sub-text">
              {config.subText}
            </div>
          </div>
        </div>

        <div className="verdict-banner-badge">
          {confidenceTier}
        </div>
      </div>
    </div>
  )
}
