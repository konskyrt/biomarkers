import React from 'react';
import { DocumentTextIcon } from '@heroicons/react/24/outline';

export default function Notes() {
  return (
    <div className="bg-white shadow rounded-lg p-4">
      <div className="flex items-center mb-2">
        <DocumentTextIcon className="h-5 w-5 text-blue-500 mr-2" />
        <h3 className="text-lg font-medium">Notizen</h3>
      </div>
      <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
        <li>Sanitär hat bereits zum Projektstart eine hohe Menge von Bauteilen verbaut.</li>
        <li>Heizung erfolgt erst gegen Ende der Bauplanung.</li>
      </ul>
    </div>
  );
} 