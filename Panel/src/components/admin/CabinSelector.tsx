'use client';

import type { Cabin } from '@/lib/types';
import { useCabins } from '@/hooks/useImages';

interface CabinSelectorProps {
  selectedCabinId: string | null;
  onSelect: (cabin: Cabin | null) => void;
}

export default function CabinSelector({ selectedCabinId, onSelect }: CabinSelectorProps) {
  const { cabins, loading, error } = useCabins();

  if (loading) {
    return (
      <div className="animate-pulse space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 bg-gray-200 rounded" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-4 bg-red-50 rounded">
        Error cargando cabañas: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-gray-700">Cabañas</h3>
      <div className="space-y-1">
        <button
          onClick={() => onSelect(null)}
          className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
            selectedCabinId === null
              ? 'bg-blue-100 text-blue-800 font-medium'
              : 'hover:bg-gray-100 text-gray-700'
          }`}
        >
          Todas
        </button>
        {cabins.map((cabin) => (
          <button
            key={cabin.id}
            onClick={() => onSelect(cabin)}
            className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
              selectedCabinId === cabin.id
                ? 'bg-blue-100 text-blue-800 font-medium'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            {cabin.title}
          </button>
        ))}
        {cabins.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-4">
            No hay cabañas configuradas.
          </p>
        )}
      </div>
    </div>
  );
}
