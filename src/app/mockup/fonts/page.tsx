'use client'

import React from 'react'
import { Calendar, Moon, Star, Sun, Compass, Info } from 'lucide-react'

export default function FontMockupPage() {
  return (
    <div className="min-h-screen p-8 md:p-16 max-w-6xl mx-auto space-y-12 animate-in fade-in duration-700">
      {/* Header section with premium letter-spacing */}
      <header className="space-y-4">
        <div className="flex items-center gap-2 text-gold tracking-[0.15em] font-medium text-xs uppercase animate-in slide-in-from-left duration-500">
          <Compass className="w-4 h-4" />
          <span>Established 2026</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-display text-primary leading-tight">
          Today at a <span className="italic serif text-gold">glance</span>
        </h1>
        <p className="max-w-xl text-lg text-secondary leading-relaxed">
          Welcome to your celestial dashboard. The alignment of the planets today suggests a 
          sophisticated balance between ancient tradition and modern insight.
        </p>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Chart Card */}
        <div className="md:col-span-2 space-y-6">
          <div className="card-gold p-8 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-display">D9 Navamsha</h2>
              <div className="badge badge-gold tracking-wider">Premium View</div>
            </div>

            {/* Mock Chart Layout */}
            <div className="aspect-square w-full max-w-md mx-auto relative border-[1.5px] border-gold/40 rounded-lg overflow-hidden group">
              {/* Diagonals */}
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_49.5%,rgba(201,168,76,0.3)_50%,transparent_50.5%)]" />
              <div className="absolute inset-0 bg-[linear-gradient(-45deg,transparent_49.5%,rgba(201,168,76,0.3)_50%,transparent_50.5%)]" />
              
              {/* Inner Diamond */}
              <div className="absolute inset-[25%] border-[1.5px] border-gold/40 rotate-45" />

              {/* Labels with body font */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 font-body text-xs text-muted tracking-widest uppercase">Lagna</div>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 font-body text-xs text-muted tracking-widest uppercase">7th House</div>
              
              {/* Mock Planets */}
              <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 py-1 glass rounded text-[10px] font-bold text-gold">Ju</div>
              <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 px-2 py-1 glass rounded text-[10px] font-bold text-gold">Mo</div>
              
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-surface-0/60 backdrop-blur-sm cursor-help">
                <p className="text-sm font-body px-8 text-center leading-relaxed">
                  The Navamsha (D9) chart provides deep insight into your soul's purpose and the fruits of your karma.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="stat-chip">
                <span className="stat-label">Nakshatra</span>
                <span className="stat-value">Bharani</span>
                <span className="stat-sub text-rose">Ugra (Fierce)</span>
              </div>
              <div className="stat-chip">
                <span className="stat-label">Tithi</span>
                <span className="stat-value">Shukla Navami</span>
                <span className="stat-sub text-teal">Auspicious</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="card space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gold-faint flex items-center justify-center text-gold">
                <Star className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-display">Scholarly Insight</h3>
            </div>
            
            <p className="text-sm leading-relaxed text-secondary font-body">
              The use of <span className="sanskrit">Inter</span> as a body font provides a neutral, 
              high-legibility anchor for the more expressive <span className="serif italic text-gold">Playfair Display</span> headings.
            </p>

            <div className="divider" />

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-muted mt-1" />
                <div>
                  <h4 className="font-body font-semibold text-sm">Tomorrow's Transit</h4>
                  <p className="text-xs text-muted">Sun enters Aries (Mesha Sankranti)</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Moon className="w-4 h-4 text-muted mt-1" />
                <div>
                  <h4 className="font-body font-semibold text-sm">Moon Phase</h4>
                  <p className="text-xs text-muted">Waxing Gibbous (82% Visible)</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-accent-glow border-accent/20 p-6 space-y-4">
             <div className="flex items-center gap-2 text-accent font-body font-bold text-xs uppercase tracking-tighter">
               <Info className="w-3 h-3" />
               <span>Typography Tip</span>
             </div>
             <p className="text-sm font-body leading-relaxed italic text-accent-dim">
               "Setting navigation items with a slight letter-spacing (0.05em) creates 
               a breathability that feels inherently premium."
             </p>
          </div>
        </div>

      </div>

      {/* Footer / Navigation Mockup */}
      <nav className="flex flex-wrap justify-center gap-8 py-8 border-t border-border mt-12">
        {['Dashboard', 'Astrology', 'Panchang', 'Settings'].map((item) => (
          <a
            key={item}
            href="#"
            className="text-xs uppercase font-body font-bold tracking-[0.2em] text-muted hover:text-gold transition-colors"
          >
            {item}
          </a>
        ))}
      </nav>
    </div>
  )
}
