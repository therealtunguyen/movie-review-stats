const MODES = ['points', 'trend', 'both']

export default function ChartControls({ displayMode, setDisplayMode, onDownload }) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex rounded-lg overflow-hidden border border-gray-700" role="group" aria-label="Chart display mode">
        {MODES.map((mode) => (
          <button
            key={mode}
            onClick={() => setDisplayMode(mode)}
            className={`px-3 py-1.5 text-sm capitalize transition-colors ${
              displayMode === mode
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
            aria-pressed={displayMode === mode}
          >
            {mode}
          </button>
        ))}
      </div>
      <button
        onClick={onDownload}
        className="px-3 py-1.5 text-sm bg-gray-800 text-gray-300 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors"
        aria-label="Download chart as PNG"
      >
        Download PNG
      </button>
    </div>
  )
}
