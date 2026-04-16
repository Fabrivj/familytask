export const SUGGESTION_CATEGORIES = [
  { value: 'HIGIENE_PERSONAL', label: 'Higiene personal' },
  { value: 'ORDEN_Y_LIMPIEZA', label: 'Orden y limpieza' },
  { value: 'ALIMENTACION', label: 'Alimentación' },
  { value: 'ESTUDIO_Y_LECTURA', label: 'Estudio y lectura' },
  { value: 'ACTIVIDAD_FISICA', label: 'Actividad física' },
  { value: 'RESPONSABILIDAD_FAMILIAR', label: 'Responsabilidad familiar' },
  { value: 'AUTOCUIDADO_EMOCIONAL', label: 'Autocuidado emocional' },
  { value: 'CREATIVIDAD', label: 'Creatividad' },
  { value: 'TECNOLOGIA_RESPONSABLE', label: 'Tecnología responsable' },
] as const;

export type SuggestionCategory = (typeof SUGGESTION_CATEGORIES)[number]['value'];

export interface SuggestionRequest {
  familyId: number;
  category: SuggestionCategory | string;
  memberUserId: number;
  excludedSuggestionNames?: string[];
}

export interface SuggestionItem {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: 'tarea' | 'habito' | string;
  frecuencia: 'DAILY' | 'WEEKLY' | 'WEEKDAYS' | 'WEEKENDS' | 'MONTHLY' | string;
  complejidad: 'Baja' | 'Media' | 'Alta' | string;
  monedas: number;
  exp: number;
  mensajeMotivador: string;
}

export interface SuggestionListResponse {
  sugerencias: SuggestionItem[];
  mensaje?: string;
  categoria: string;
}
