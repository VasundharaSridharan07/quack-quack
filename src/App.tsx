import { useEffect, useRef, useState } from 'react'
import {
  ModusWcButton,
  ModusWcCard,
  ModusWcNavbar,
  ModusWcNumberInput,
  ModusWcSelect,
  ModusWcSlider,
  ModusWcTextInput,
  ModusWcThemeSwitcher,
  ModusWcTypography,
} from '@trimble-oss/moduswebcomponents-react'
import duckImg from './assets/duck.png'

const GROUND_LEVEL = 24
const MIN_DUCKS = 1
const MAX_DUCKS = 20
const MIN_SCALE = 0.25
const MAX_SCALE = 4
const GROW_FACTOR = 1.4
const SHRINK_FACTOR = 0.7
const DEFAULT_SWATCH = '#facc15'
const DEFAULT_FILTER = 'hue-rotate(0deg)'
const MIN_SPEED = 0.25
const MAX_SPEED = 3
const DEFAULT_SPEED = 1

const DUCK_NAMES = [
  'Daffy', 'Donald', 'Puddles', 'Quackers', 'Waddles', 'Biscuit', 'Feather',
  'Mochi', 'Sunny', 'Pip', 'Nibbles', 'Marshmallow', 'Bubbles', 'Peanut',
  'Ducky', 'Splash', 'Noodle', 'Butters', 'Gus', 'Hazel',
]

function randomDuckName(): string {
  return DUCK_NAMES[Math.floor(Math.random() * DUCK_NAMES.length)]
}

// Columns: distinct hues. Rows: shades from bold (top) to pale tint (bottom).
const HUE_COLUMNS = [
  { name: 'Red', swatchHue: 0, filterHue: 340 },
  { name: 'Orange', swatchHue: 30, filterHue: 25 },
  { name: 'Yellow', swatchHue: 50, filterHue: 0 },
  { name: 'Green', swatchHue: 140, filterHue: 100 },
  { name: 'Teal', swatchHue: 175, filterHue: 160 },
  { name: 'Blue', swatchHue: 215, filterHue: 190 },
  { name: 'Indigo', swatchHue: 245, filterHue: 230 },
  { name: 'Purple', swatchHue: 275, filterHue: 260 },
  { name: 'Pink', swatchHue: 320, filterHue: 300 },
]

const SHADE_ROWS = [
  { saturation: 75, lightness: 45, filterSaturate: 1.4, filterBrightness: 0.95 },
  { saturation: 70, lightness: 58, filterSaturate: 1.15, filterBrightness: 1.15 },
  { saturation: 65, lightness: 68, filterSaturate: 0.95, filterBrightness: 1.3 },
  { saturation: 60, lightness: 77, filterSaturate: 0.75, filterBrightness: 1.45 },
  { saturation: 55, lightness: 85, filterSaturate: 0.55, filterBrightness: 1.6 },
  { saturation: 45, lightness: 92, filterSaturate: 0.35, filterBrightness: 1.75 },
]

const GRAYSCALE_STEPS = [
  { lightness: 8, brightness: 0.15 },
  { lightness: 25, brightness: 0.4 },
  { lightness: 40, brightness: 0.65 },
  { lightness: 55, brightness: 0.9 },
  { lightness: 70, brightness: 1.15 },
  { lightness: 85, brightness: 1.5 },
  { lightness: 95, brightness: 1.9 },
]

const GRAYSCALE_SWATCHES = GRAYSCALE_STEPS.map((step) => ({
  swatch: `hsl(0, 0%, ${step.lightness}%)`,
  filter: `grayscale(1) brightness(${step.brightness})`,
}))

const SHADE_GRID = SHADE_ROWS.map((row) =>
  HUE_COLUMNS.map((col) => ({
    swatch: `hsl(${col.swatchHue}, ${row.saturation}%, ${row.lightness}%)`,
    filter: `hue-rotate(${col.filterHue}deg) saturate(${row.filterSaturate}) brightness(${row.filterBrightness})`,
  })),
)

type Duck = {
  id: number
  name: string
  duration: number
  delay: number
  colorFilter: string
  swatchPreview: string
  scale: number
  paused: boolean
  speed: number
  spinning: boolean
}

let nextDuckId = 0

function makeDuck(): Duck {
  return {
    id: nextDuckId++,
    name: randomDuckName(),
    duration: 24 + Math.random() * 16,
    delay: Math.random() * 6,
    colorFilter: DEFAULT_FILTER,
    swatchPreview: DEFAULT_SWATCH,
    scale: 1,
    paused: false,
    speed: DEFAULT_SPEED,
    spinning: false,
  }
}

function makeDucks(count: number): Duck[] {
  return Array.from({ length: count }, () => makeDuck())
}

function App() {
  const [duckCountInput, setDuckCountInput] = useState(4)
  const [ducks, setDucks] = useState<Duck[]>(() => makeDucks(4))
  const [selectedDuckId, setSelectedDuckId] = useState<number | null>(null)
  const [isPaletteOpen, setIsPaletteOpen] = useState(false)
  const paletteRef = useRef<HTMLDivElement>(null)

  const selectedDuck = ducks.find((d) => d.id === selectedDuckId) ?? null
  const currentSwatch = selectedDuck?.swatchPreview ?? DEFAULT_SWATCH

  useEffect(() => {
    if (!isPaletteOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (paletteRef.current && !paletteRef.current.contains(event.target as Node)) {
        setIsPaletteOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isPaletteOpen])

  const handleSpawn = () => {
    const clamped = Math.min(MAX_DUCKS, Math.max(MIN_DUCKS, Math.round(duckCountInput)))
    setDuckCountInput(clamped)
    setDucks(makeDucks(clamped))
    setSelectedDuckId(null)
  }

  const handleReset = () => {
    setDuckCountInput(1)
    setDucks(makeDucks(1))
    setSelectedDuckId(null)
  }

  const handleDuckClick = (id: number) => {
    setDucks((ds) => ds.map((d) => (d.id === id ? { ...d, paused: true } : d)))
    setSelectedDuckId(id)
  }

  const handleDuckDoubleClick = (id: number) => {
    setDucks((ds) => ds.map((d) => (d.id === id ? { ...d, spinning: true } : d)))
  }

  const handleSpinEnd = (id: number) => {
    setDucks((ds) => ds.map((d) => (d.id === id ? { ...d, spinning: false } : d)))
  }

  const handleNameChange = (name: string) => {
    if (selectedDuckId === null) return
    setDucks((ds) => ds.map((d) => (d.id === selectedDuckId ? { ...d, name } : d)))
  }

  const handleTogglePause = () => {
    if (selectedDuckId === null) return
    setDucks((ds) =>
      ds.map((d) => (d.id === selectedDuckId ? { ...d, paused: !d.paused } : d)),
    )
  }

  const handleSpeedChange = (speed: number) => {
    if (selectedDuckId === null) return
    setDucks((ds) =>
      ds.map((d) => (d.id === selectedDuckId ? { ...d, speed } : d)),
    )
  }

  const handleColorSelect = (filter: string, swatch: string) => {
    if (selectedDuckId === null) return
    setDucks((ds) =>
      ds.map((d) =>
        d.id === selectedDuckId ? { ...d, colorFilter: filter, swatchPreview: swatch } : d,
      ),
    )
    setIsPaletteOpen(false)
  }

  const handleGrow = () => {
    if (selectedDuckId === null) return
    setDucks((ds) =>
      ds.map((d) =>
        d.id === selectedDuckId
          ? { ...d, scale: Math.min(MAX_SCALE, d.scale * GROW_FACTOR) }
          : d,
      ),
    )
  }

  const handleShrink = () => {
    if (selectedDuckId === null) return
    setDucks((ds) =>
      ds.map((d) =>
        d.id === selectedDuckId
          ? { ...d, scale: Math.max(MIN_SCALE, d.scale * SHRINK_FACTOR) }
          : d,
      ),
    )
  }

  const duckSelectOptions = [
    { label: 'None selected', value: '' },
    ...ducks.map((duck) => ({
      label: `${duck.name || `Duck #${duck.id}`}${duck.paused ? ' (paused)' : ''}`,
      value: String(duck.id),
    })),
  ]

  const eventValue = (e: CustomEvent) => e.detail?.target?.value || ''

  return (
    <div className="app-shell">
      <ModusWcNavbar
        logoName="trimble"
        visibility={{
          ai: false,
          apps: false,
          help: false,
          logo: true,
          mainMenu: false,
          notifications: false,
          search: false,
          searchInput: false,
          user: false,
        }}
        userCard={{ name: '', email: '' }}
      >
        <div slot="center">
          <ModusWcTypography hierarchy="h2" label="Quack Quack" weight="semibold" />
        </div>
        <div slot="end" className="navbar-end">
          <ModusWcThemeSwitcher aria-label="Theme toggle" />
          <ModusWcButton
            color="tertiary"
            variant="outlined"
            shape="rectangle"
            size="md"
            type="button"
            onButtonClick={handleReset}
          >
            Reset
          </ModusWcButton>
        </div>
      </ModusWcNavbar>

      <ModusWcCard bordered={false}>
        <div className="config-card">
          <div className="config-stack">
            <div className="config-row">
              <ModusWcNumberInput
                inputId="duck-count"
                label="Number of ducks"
                min={MIN_DUCKS}
                max={MAX_DUCKS}
                value={String(duckCountInput)}
                onInputChange={(e: CustomEvent) => {
                  setDuckCountInput(Number(eventValue(e) || 0))
                }}
              />
              <ModusWcButton
                color="primary"
                variant="filled"
                shape="rectangle"
                size="md"
                type="button"
                onButtonClick={handleSpawn}
              >
                Spawn Ducks
              </ModusWcButton>
            </div>

            <div className="config-row">
              <ModusWcSelect
                inputId="duck-select"
                label="Select duck"
                value={selectedDuckId === null ? '' : String(selectedDuckId)}
                options={duckSelectOptions}
                onInputChange={(e: CustomEvent) => {
                  const value = eventValue(e)
                  setSelectedDuckId(value === '' ? null : Number(value))
                }}
              />
              <ModusWcTextInput
                bordered={false}
                disabled={selectedDuckId === null}
                placeholder="Duck name"
                value={selectedDuck ? selectedDuck.name || `Duck #${selectedDuck.id}` : ''}
                onInputChange={(e: CustomEvent) => handleNameChange(eventValue(e))}
              />
              <div className="relative" ref={paletteRef}>
                <ModusWcButton
                  color="tertiary"
                  variant="outlined"
                  shape="square"
                  size="md"
                  type="button"
                  disabled={selectedDuckId === null}
                  aria-label="Open color palette"
                  aria-expanded={isPaletteOpen}
                  onButtonClick={() => setIsPaletteOpen((open) => !open)}
                >
                  <span
                    className="color-swatch"
                    style={{
                      background: selectedDuck
                        ? currentSwatch
                        : 'var(--modus-wc-color-base-200)',
                    }}
                  />
                </ModusWcButton>

                {isPaletteOpen && (
                  <div className="palette-panel">
                    <div className="swatch-row">
                      {GRAYSCALE_SWATCHES.map((cell) => (
                        <button
                          key={cell.swatch}
                          type="button"
                          title="Grayscale"
                          aria-label="Grayscale swatch"
                          onClick={() => handleColorSelect(cell.filter, cell.swatch)}
                          className={`palette-swatch${
                            selectedDuck?.colorFilter === cell.filter ? ' is-selected' : ''
                          }`}
                          style={{ backgroundColor: cell.swatch }}
                        />
                      ))}
                    </div>

                    {SHADE_GRID.map((row, rowIdx) => (
                      <div key={rowIdx} className="swatch-row">
                        {row.map((cell, colIdx) => (
                          <button
                            key={colIdx}
                            type="button"
                            title={HUE_COLUMNS[colIdx].name}
                            aria-label={HUE_COLUMNS[colIdx].name}
                            onClick={() => handleColorSelect(cell.filter, cell.swatch)}
                            className={`palette-swatch${
                              selectedDuck?.colorFilter === cell.filter ? ' is-selected' : ''
                            }`}
                            style={{ backgroundColor: cell.swatch }}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="config-row">
              <ModusWcButton
                key={selectedDuck?.paused ? 'resume' : 'pause'}
                color="tertiary"
                variant="outlined"
                shape="rectangle"
                size="md"
                type="button"
                disabled={selectedDuckId === null}
                onButtonClick={handleTogglePause}
              >
                {selectedDuck?.paused ? 'Resume' : 'Pause'}
              </ModusWcButton>
              <ModusWcButton
                color="tertiary"
                variant="outlined"
                shape="rectangle"
                size="md"
                type="button"
                disabled={selectedDuckId === null}
                onButtonClick={handleGrow}
              >
                Grow
              </ModusWcButton>
              <ModusWcButton
                color="tertiary"
                variant="outlined"
                shape="rectangle"
                size="md"
                type="button"
                disabled={selectedDuckId === null}
                onButtonClick={handleShrink}
              >
                Shrink
              </ModusWcButton>
            </div>

            <div className="config-row">
              <ModusWcSlider
                inputId="duck-speed"
                label="Speed"
                min={MIN_SPEED}
                max={MAX_SPEED}
                step={0.25}
                value={selectedDuck?.speed ?? DEFAULT_SPEED}
                disabled={selectedDuckId === null}
                onInputChange={(e: CustomEvent) => {
                  handleSpeedChange(Number(eventValue(e)))
                }}
              />
              <ModusWcTypography
                hierarchy="p"
                size="sm"
                label={`${(selectedDuck?.speed ?? DEFAULT_SPEED).toFixed(2)}x`}
              />
            </div>
          </div>
        </div>
      </ModusWcCard>

      <main className="pond">
        <ModusWcTypography hierarchy="h2" label="Welcome!" weight="bold" />

        {ducks.map((duck) => (
          <div
            key={duck.id}
            className="absolute left-0 w-full animate-walk"
            style={{
              bottom: `${GROUND_LEVEL}px`,
              animationDuration: `${duck.duration / duck.speed}s`,
              animationDelay: `${duck.delay}s`,
              animationPlayState: duck.paused ? 'paused' : 'running',
            }}
          >
            <div
              className="duck-size-wrapper"
              style={{ transform: `scale(${duck.scale})` }}
            >
              <img
                src={duckImg}
                alt={duck.name || `Duck #${duck.id}`}
                title={duck.name || `Duck #${duck.id}`}
                onClick={() => handleDuckClick(duck.id)}
                onDoubleClick={() => handleDuckDoubleClick(duck.id)}
                onAnimationEnd={(e) => {
                  if (e.animationName === 'spin') handleSpinEnd(duck.id)
                }}
                className={`w-16 h-16 duck-img${duck.spinning ? ' spinning' : ''}`}
                style={{
                  filter: `${duck.colorFilter} drop-shadow(0 4px 3px rgb(0 0 0 / 0.2))`,
                  animationPlayState:
                    duck.spinning || !duck.paused ? 'running' : 'paused',
                }}
              />
            </div>
          </div>
        ))}
      </main>
    </div>
  )
}

export default App
