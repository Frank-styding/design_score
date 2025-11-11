/* eslint-disable react/forbid-dom-props */
"use client";

interface SyncToggleProps {
  isSynced: boolean;
  onToggle: (synced: boolean) => void;
}

export default function SyncToggle({ isSynced, onToggle }: SyncToggleProps) {
  const handleToggle = () => {
    onToggle(!isSynced);
  };

  return (
    <div className="fixed top-20 right-4 z-50">
      <label className="flex items-center gap-3 bg-white/95 backdrop-blur-sm px-4 py-3 rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-all border border-gray-200">
        {/* Checkbox personalizado */}
        <div className="relative">
          <input
            type="checkbox"
            checked={isSynced}
            onChange={handleToggle}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
        </div>

        {/* Texto e icono */}
        <div className="flex items-center gap-2">
          <svg
            className={`w-5 h-5 transition-colors ${
              isSynced ? "text-black" : "text-gray-400"
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>
          <span
            className={`text-sm font-medium transition-colors ${
              isSynced ? "text-black" : "text-gray-600"
            }`}
          >
            {isSynced ? "Modelos sincronizados" : "Sincronizar modelos"}
          </span>
        </div>
      </label>

      {/* Indicador visual cuando está activo */}
      {isSynced && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-full px-4">
          <div className="h-1 bg-gradient-to-r from-transparent via-black to-transparent rounded-full"></div>
        </div>
      )}
    </div>
  );
}
