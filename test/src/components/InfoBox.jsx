import React from 'react';
import { LightBulbIcon } from '@heroicons/react/24/outline';

export default function InfoBox() {
  return (
    <div className="bg-white shadow rounded-lg p-4">
      <div className="flex items-center mb-2">
        <LightBulbIcon className="h-5 w-5 text-yellow-500 mr-2" />
        <h3 className="text-lg font-medium">Information</h3>
      </div>
      <p className="text-sm text-gray-600">
        Info: Grafik soll zeigen wann wie viel Menge Bauteile pro Gewerk über den ganzen Baubetrieb verbaut werden.
      </p>
    </div>
  );
} 