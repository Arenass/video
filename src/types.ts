export interface OverlayItem {
  url_imagen: string;
  posicion_x: number;
  posicion_y: number;
  ancho: number;
  tiempo_inicio: number;
  duracion: number;
  fondo: 'transparente' | 'opacidad';
  transicion: 'difuminado' | 'lateral';
}

export interface VideoState {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
}