import React, { useState, useEffect } from 'react';
import { VideoPreview } from './components/VideoPreview';
import type { OverlayItem } from './types';
import { initDB, getOverlays, saveOverlaysFromCSV } from './lib/db';

function App() {
  const [csvContent, setCsvContent] = useState<string>('');
  const [overlayItems, setOverlayItems] = useState<OverlayItem[]>([]);

  useEffect(() => {
    // Inicializar la base de datos y cargar los overlays
    const loadData = async () => {
      await initDB();
      const items = await getOverlays();
      setOverlayItems(items);
    };
    loadData();
  }, []);

  const normalizeValue = (value: string, type: 'fondo' | 'transicion'): string => {
    const normalized = value.toLowerCase().trim();
    if (type === 'fondo') {
      return normalized === 'opacidad' ? 'opacidad' : 'transparente';
    }
    return normalized === 'lateral' ? 'lateral' : 'difuminado';
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        setCsvContent(text);
        
        // Parse CSV
        const lines = text.split('\n');
        const headers = lines[0].split(',');
        const items: OverlayItem[] = lines
          .slice(1)
          .filter(line => line.trim())
          .map(line => {
            const values = line.split(',').map(v => v.trim());
            return {
              url_imagen: values[0],
              posicion_x: Number(values[1]),
              posicion_y: Number(values[2]),
              ancho: Number(values[3]),
              tiempo_inicio: Number(values[4]),
              duracion: Number(values[5]),
              fondo: normalizeValue(values[6], 'fondo') as 'transparente' | 'opacidad',
              transicion: normalizeValue(values[7], 'transicion') as 'difuminado' | 'lateral'
            };
          });

        // Guardar en la base de datos
        await saveOverlaysFromCSV(items);
        setOverlayItems(items);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Video Overlay Preview</h1>
        <div>Debemos tener un archivo inicial con los datos, se puede generar desde la hoja de video</div>
        <div className="mb-8">
          <label className="block mb-2 text-sm font-medium">
            Upload CSV File:
          </label>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
        </div>

        {overlayItems.length > 0 && (
          <VideoPreview overlayItems={overlayItems} />
        )}

        {csvContent && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Loaded Overlay Items:</h2>
            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Image</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Width</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Settings</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {overlayItems.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4">
                        <img 
                          src={item.url_imagen} 
                          alt="Preview" 
                          className="h-8 w-auto"
                        />
                      </td>
                      <td className="px-6 py-4">
                        X: {item.posicion_x}, Y: {item.posicion_y}
                      </td>
                      <td className="px-6 py-4">
                        {item.ancho}px
                      </td>
                      <td className="px-6 py-4">
                        {item.tiempo_inicio}s - {item.tiempo_inicio + item.duracion}s
                      </td>
                      <td className="px-6 py-4">
                        {item.fondo}, {item.transicion}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
