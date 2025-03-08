import React, { useState, useRef, useEffect } from 'react';
import type { OverlayItem } from '../types';
import { Grid, Download, Edit2, Save, MousePointer2, Upload, Check, Square, Send, Trash2, Video } from 'lucide-react';

interface ImageDimensions {
  width: number;
  height: number;
}

interface Props {
  overlayItems: OverlayItem[];
}

export function VideoPreview({ overlayItems: initialOverlayItems }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const itemsContainerRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  const [imageDimensions, setImageDimensions] = useState<Record<string, ImageDimensions>>({});
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoDimensions, setVideoDimensions] = useState({ width: 1920, height: 1080 });
  const [videoDuration, setVideoDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showGrid, setShowGrid] = useState(true);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [overlayItems, setOverlayItems] = useState(initialOverlayItems);
  const [editingItem, setEditingItem] = useState<number | null>(null);
  const [tempEditValues, setTempEditValues] = useState<Partial<OverlayItem> | null>(null);
  const [scale, setScale] = useState(1);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [targetHeight, setTargetHeight] = useState<number>(0);
  const [newImageUrl, setNewImageUrl] = useState<string>('');
  const [videoInfo, setVideoInfo] = useState<{
    name: string;
    duration: number;
    dimensions: { width: number; height: number };
  } | null>(null);

  useEffect(() => {
    setOverlayItems(initialOverlayItems);
  }, [initialOverlayItems]);

  useEffect(() => {
    const loadImageDimensions = async () => {
      const dimensions: Record<string, ImageDimensions> = {};
      for (const item of overlayItems) {
        if (!imageDimensions[item.url_imagen]) {
          try {
            const img = new Image();
            img.src = item.url_imagen;
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
            });
            dimensions[item.url_imagen] = {
              width: img.naturalWidth,
              height: img.naturalHeight
            };
          } catch (error) {
            console.error('Error loading image dimensions:', error);
          }
        }
      }
      setImageDimensions(prev => ({ ...prev, ...dimensions }));
    };
    loadImageDimensions();
  }, [overlayItems]);

  const handleAddNewImage = () => {
    if (!newImageUrl) return;

    const newItem: OverlayItem = {
      url_imagen: newImageUrl,
      posicion_x: 50,
      posicion_y: 10,
      ancho: 300,
      tiempo_inicio: 2,
      duracion: 8,
      fondo: 'opacidad',
      transicion: 'difuminado'
    };

    setOverlayItems(prev => [...prev, newItem]);
    setNewImageUrl('');
    setEditingItem(overlayItems.length);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setVideoInfo(null);
    }
  };

  const handleVideoLoad = () => {
    if (videoRef.current && videoFile) {
      const width = videoRef.current.videoWidth || 1920;
      const height = videoRef.current.videoHeight || 1080;
      const duration = videoRef.current.duration;
      
      setVideoDimensions({ width, height });
      setVideoDuration(duration);
      setVideoInfo({
        name: videoFile.name,
        duration: duration,
        dimensions: { width, height }
      });
      updateScale();
    }
  };

  const updateScale = () => {
    if (wrapperRef.current) {
      const wrapperWidth = wrapperRef.current.clientWidth;
      setScale(wrapperWidth / videoDimensions.width);
    }
  };

  const handleTimeUpdate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.round((e.clientX - rect.left) / scale);
      const y = Math.round((e.clientY - rect.top) / scale);
      setMousePosition({ x, y });
    }
  };

  const jumpToItemTime = (item: OverlayItem) => {
    setCurrentTime(item.tiempo_inicio);
    if (videoRef.current) {
      videoRef.current.currentTime = item.tiempo_inicio;
    }
  };

  const handleEditStart = (index: number) => {
    setEditingItem(index);
    setTempEditValues(null);
  };

  const handleEditCancel = () => {
    setEditingItem(null);
    setTempEditValues(null);
  };

  const handleEditSave = (index: number) => {
    if (tempEditValues) {
      const newItems = [...overlayItems];
      newItems[index] = { ...newItems[index], ...tempEditValues };
      setOverlayItems(newItems.sort((a, b) => a.tiempo_inicio - b.tiempo_inicio));
    }
    setEditingItem(null);
    setTempEditValues(null);
  };

  const handleItemUpdate = (index: number, updates: Partial<OverlayItem>) => {
    setTempEditValues(prev => ({ ...prev, ...updates }));
  };

  const handleItemSelect = (index: number) => {
    setSelectedItems(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      }
      return [...prev, index];
    });
  };

  const handleDeleteItem = (index: number) => {
    const newItems = [...overlayItems];
    newItems.splice(index, 1);
    setOverlayItems(newItems);
    if (editingItem === index) {
      setEditingItem(null);
      setTempEditValues(null);
    }
  };

  const applyTargetHeight = () => {
    if (targetHeight <= 0 || selectedItems.length === 0) return;

    const newItems = [...overlayItems];
    selectedItems.forEach(index => {
      const item = newItems[index];
      const dimensions = imageDimensions[item.url_imagen];
      if (dimensions) {
        const newWidth = Math.round((targetHeight * dimensions.width) / dimensions.height);
        newItems[index] = {
          ...item,
          ancho: newWidth
        };
      }
    });
    setOverlayItems(newItems);
    setSelectedItems([]);
    setTargetHeight(0);
  };

  const downloadCSV = () => {
    const headers = ['url_imagen', 'posicion_x', 'posicion_y', 'ancho', 'tiempo_inicio', 'duracion', 'fondo', 'transicion'];
    const csvContent = [
      headers.join(','),
      ...overlayItems.map(item => [
        item.url_imagen,
        item.posicion_x,
        item.posicion_y,
        item.ancho,
        item.tiempo_inicio,
        item.duracion,
        item.fondo,
        item.transicion
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'overlays.csv';
    link.click();
  };

  const visibleOverlays = overlayItems.filter(
    item => 
      currentTime >= item.tiempo_inicio && 
      currentTime <= (item.tiempo_inicio + item.duracion)
  );

  const getOverlayStyle = (item: OverlayItem) => {
    const timeSinceStart = currentTime - item.tiempo_inicio;
    const fadeInDuration = 1;
    
    let opacity = 1;
    let transform = 'translateX(0)';
    
    if (timeSinceStart < fadeInDuration) {
      if (item.transicion === 'difuminado') {
        opacity = timeSinceStart / fadeInDuration;
      } else if (item.transicion === 'lateral') {
        const progress = timeSinceStart / fadeInDuration;
        transform = `translateX(${(1 - progress) * 100}%)`;
      }
    }

    return {
      position: 'absolute' as const,
      left: `${item.posicion_x}px`,
      top: `${item.posicion_y}px`,
      width: `${item.ancho}px`,
      height: 'auto',
      opacity: item.fondo === 'opacidad' ? 0.7 * opacity : opacity,
      transform,
      transition: 'transform 0.3s ease-out, opacity 0.3s ease-out',
    };
  };

  const sortedOverlayItems = [...overlayItems].sort((a, b) => a.tiempo_inicio - b.tiempo_inicio);

  useEffect(() => {
    const handleResize = () => {
      updateScale();
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [videoDimensions.width]);

  return (
    <div className="w-full max-w-full flex flex-col">
      {videoInfo && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 flex items-center gap-3">
          <Video className="text-green-600" size={24} />
          <div className="text-green-800">
            <p className="font-medium">Video cargado: {videoInfo.name}</p>
            <p className="text-sm">
              Dimensiones: {videoInfo.dimensions.width}x{videoInfo.dimensions.height}px | 
              Duración: {videoInfo.duration.toFixed(1)} segundos
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-4 items-center p-4">
        <label 
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600"
        >
          <Upload className="mr-2" size={20} />
          Seleccionar Video
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        <button
          onClick={() => setShowGrid(!showGrid)}
          className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors ${
            showGrid ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          <Grid className="mr-2" size={20} />
          {showGrid ? 'Ocultar Cuadrícula' : 'Mostrar Cuadrícula'}
        </button>

        <button
          onClick={downloadCSV}
          className="inline-flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          <Download className="mr-2" size={20} />
          Descargar CSV
        </button>

        <div className="ml-auto flex items-center gap-2 text-sm text-gray-600">
          <MousePointer2 size={16} />
          <span>X: {mousePosition.x}, Y: {mousePosition.y}</span>
        </div>
      </div>

      <div className="flex flex-col">
        <div className="bg-gray-800 flex items-center gap-2 h-8">
          <input
            type="range"
            min="0"
            max={videoDuration || 300}
            step="0.1"
            value={currentTime}
            onChange={handleTimeUpdate}
            className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer mx-2"
          />
          <div className="flex items-center gap-1 px-2 border-l border-gray-700">
            <input
              type="number"
              value={currentTime}
              onChange={(e) => handleTimeUpdate(e)}
              step="0.1"
              className="w-16 px-2 py-0.5 bg-gray-700 text-white border-gray-600 rounded text-sm"
            />
            <span className="text-sm font-mono text-gray-300">s</span>
          </div>
        </div>

        <div ref={wrapperRef} className="w-full bg-gray-900">
          <div 
            ref={containerRef}
            onMouseMove={handleMouseMove}
            className="relative"
            style={{ 
              width: '100%',
              paddingTop: `${(videoDimensions.height / videoDimensions.width) * 100}%`,
              backgroundImage: showGrid ? `
                linear-gradient(to right, rgba(255,255,255,.1) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(255,255,255,.1) 1px, transparent 1px)
              ` : 'none',
              backgroundSize: `${100 * scale}px ${100 * scale}px`
            }}
          >
            <div 
              className="absolute inset-0"
              style={{
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
                width: videoDimensions.width,
                height: videoDimensions.height
              }}
            >
              {videoFile && (
                <video
                  ref={videoRef}
                  src={URL.createObjectURL(videoFile)}
                  className="absolute inset-0 w-full h-full opacity-20"
                  onLoadedMetadata={handleVideoLoad}
                  playsInline
                />
              )}

              {visibleOverlays.map((item, index) => (
                <img
                  key={index}
                  src={item.url_imagen}
                  alt={`Overlay ${index}`}
                  style={getOverlayStyle(item)}
                  className="pointer-events-none"
                />
              ))}
              
              {showGrid && (
                <>
                  {Array.from({ length: Math.floor(videoDimensions.width / 100) + 1 }).map((_, i) => (
                    <div
                      key={`x-${i}`}
                      className="absolute top-0 text-xs text-white opacity-50"
                      style={{ left: `${i * 100}px` }}
                    >
                      {i * 100}
                    </div>
                  ))}
                  {Array.from({ length: Math.floor(videoDimensions.height / 100) + 1 }).map((_, i) => (
                    <div
                      key={`y-${i}`}
                      className="absolute left-0 text-xs text-white opacity-50"
                      style={{ top: `${i * 100}px` }}
                    >
                      {i * 100}
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div ref={tableRef} className="bg-white rounded-lg shadow overflow-x-auto mt-8">
        <div className="p-4 border-b">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={targetHeight}
                onChange={(e) => setTargetHeight(Math.max(0, Number(e.target.value)))}
                placeholder="Altura objetivo (px)"
                className="w-32 border rounded px-2 py-1"
              />
              <button
                onClick={applyTargetHeight}
                disabled={targetHeight <= 0 || selectedItems.length === 0}
                className="px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Aplicar altura
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="URL de la imagen"
                className="w-64 border rounded px-2 py-1"
              />
              <button
                onClick={handleAddNewImage}
                disabled={!newImageUrl}
                className="px-4 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                <Send size={16} />
                Añadir
              </button>
            </div>
            <span className="text-sm text-gray-500 ml-auto">
              {selectedItems.length} elementos seleccionados
            </span>
          </div>
        </div>

        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Select</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Image</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Width</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Settings</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedOverlayItems.map((item, index) => {
              const isEditing = editingItem === index;
              const editValues = isEditing && tempEditValues ? { ...item, ...tempEditValues } : item;
              const isActive = currentTime >= item.tiempo_inicio && currentTime <= (item.tiempo_inicio + item.duracion);
              const isSelected = selectedItems.includes(index);
              const dimensions = imageDimensions[item.url_imagen];
              const calculatedHeight = dimensions ? Math.round((item.ancho * dimensions.height) / dimensions.width) : null;

              return (
                <tr 
                  key={index}
                  className={`transition-colors duration-300 ${
                    isEditing ? 'bg-blue-50' : 
                    isActive ? 'bg-green-50' :
                    isSelected ? 'bg-yellow-50' : ''
                  }`}
                >
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleItemSelect(index)}
                      className={`p-1.5 rounded ${
                        isSelected ? 'text-blue-500' : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      {isSelected ? <Check size={20} /> : <Square size={20} />}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <img 
                      src={item.url_imagen} 
                      alt="Preview" 
                      className="h-8 w-auto"
                    />
                  </td>
                  <td className="px-6 py-4">
                    {isEditing ? (
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={editValues.posicion_x}
                          onChange={(e) => handleItemUpdate(index, { posicion_x: Number(e.target.value) })}
                          className="w-20 border rounded px-2 py-1"
                        />
                        <input
                          type="number"
                          value={editValues.posicion_y}
                          onChange={(e) => handleItemUpdate(index, { posicion_y: Number(e.target.value) })}
                          className="w-20 border rounded px-2 py-1"
                        />
                      </div>
                    ) : (
                      <span>X: {item.posicion_x}, Y: {item.posicion_y}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {isEditing ? (
                      <input
                        type="number"
                        value={editValues.ancho}
                        onChange={(e) => handleItemUpdate(index, { ancho: Number(e.target.value) })}
                        className="w-20 border rounded px-2 py-1"
                      />
                    ) : (
                      <div>
                        <div>{item.ancho}px</div>
                        {calculatedHeight && (
                          <div className="text-xs text-gray-500 mt-1">
                            Alto: {calculatedHeight}px
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div 
                      className="cursor-pointer hover:text-blue-600"
                      onClick={() => jumpToItemTime(item)}
                    >
                      {isEditing ? (
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={editValues.tiempo_inicio}
                            onChange={(e) => handleItemUpdate(index, { tiempo_inicio: Number(e.target.value) })}
                            step="0.1"
                            className="w-20 border rounded px-2 py-1"
                          />
                          <input
                            type="number"
                            value={editValues.duracion}
                            onChange={(e) => handleItemUpdate(index, { duracion: Number(e.target.value) })}
                            step="0.1"
                            className="w-20 border rounded px-2 py-1"
                          />
                        </div>
                      ) : (
                        <span>
                          {item.tiempo_inicio}s - {(item.tiempo_inicio + item.duracion).toFixed(1)}s
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {isEditing ? (
                      <div className="flex gap-2">
                        <select
                          value={editValues.fondo}
                          onChange={(e) => handleItemUpdate(index, { fondo: e.target.value as 'transparente' | 'opacidad' })}
                          className="border rounded px-2 py-1"
                        >
                          <option value="transparente">Transparente</option>
                          <option value="opacidad">Opacidad</option>
                        </select>
                        <select
                          value={editValues.transicion}
                          onChange={(e) => handleItemUpdate(index, { transicion: e.target.value as 'difuminado' | 'lateral' })}
                          className="border rounded px-2 py-1"
                        >
                          <option value="difuminado">Difuminado</option>
                          <option value="lateral">Lateral</option>
                        </select>
                      </div>
                    ) : (
                      <span>{item.fondo}, {item.transicion}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => handleEditSave(index)}
                            className="p-1.5 bg-green-500 hover:bg-green-600 rounded-full text-white"
                            title="Guardar cambios"
                          >
                            <Save size={16} />
                          </button>
                          <button
                            onClick={handleEditCancel}
                            className="p-1.5 bg-red-500 hover:bg-red-600 rounded-full text-white"
                            title="Cancelar"
                          >
                            <Edit2 size={16} className="rotate-45" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEditStart(index)}
                            className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600"
                            title="Editar"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(index)}
                            className="p-1.5 bg-red-100 hover:bg-red-200 rounded-full text-red-600"
                            title="Eliminar"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}