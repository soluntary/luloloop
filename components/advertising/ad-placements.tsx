import { AdBanner } from "./ad-banner"
import { sampleAds } from "./sample-ads"

// Leaderboard Banner (728x90) - Header/Footer
export function LeaderboardAd({ className }: { className?: string }) {
  return (
    <div className={`flex justify-center ${className}`}>
      <AdBanner format="leaderboard" ads={sampleAds.leaderboard} rotationInterval={5000} />
    </div>
  )
}

// Billboard Banner (970x250) - Header
export function BillboardAd({ className }: { className?: string }) {
  return (
    <div className={`flex justify-center ${className}`}>
      <AdBanner format="billboard" ads={sampleAds.gaming} rotationInterval={6000} />
    </div>
  )
}

// Medium Rectangle (300x250) - Content areas
export function MediumRectangleAd({ className }: { className?: string }) {
  return <AdBanner format="medium-rectangle" ads={sampleAds.content} rotationInterval={4000} className={className} />
}

// Wide Skyscraper (160x600) - Sidebar
export function WideSkyscraperAd({ className }: { className?: string }) {
  return <AdBanner format="wide-skyscraper" ads={sampleAds.sidebar} rotationInterval={7000} className={className} />
}

// Skyscraper (120x600) - Sidebar
export function SkyscraperAd({ className }: { className?: string }) {
  return <AdBanner format="skyscraper" ads={sampleAds.sidebar} rotationInterval={5500} className={className} />
}

// Halfpage Ad (300x600) - Sidebar
export function HalfpageAd({ className }: { className?: string }) {
  return <AdBanner format="halfpage" ads={sampleAds.sidebar} rotationInterval={8000} className={className} />
}
