/** Regex for valid family / space names (letters, digits, accented chars, hyphens, apostrophes, dots). */
export const VALID_NAME = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ \-'.]+$/;

/** Available emoji icons for rewards in the store. */
export const REWARD_ICONS = [
  '\u{1F381}', '\u{1F355}', '\u{1F3AE}', '\u{1F3AC}',
  '\u{1F366}', '\u{2708}\u{FE0F}', '\u{1F457}', '\u{1F389}',
  '\u{1F3A1}', '\u{1F382}', '\u{1F3C6}', '\u{1F3B5}',
  '\u{1F354}', '\u{26BD}', '\u{1F4DA}', '\u{1F3A8}',
  '\u{1F3D6}\u{FE0F}', '\u{1F3CA}', '\u{1F4B5}',
];

/** Human-readable labels for each reward icon. */
export const ICON_LABELS: Record<string, string> = {
  '\u{1F381}': 'Regalo',
  '\u{1F355}': 'Pizza',
  '\u{1F3AE}': 'Videojuegos',
  '\u{1F3AC}': 'Pelicula',
  '\u{1F366}': 'Helado',
  '\u{2708}\u{FE0F}': 'Viaje',
  '\u{1F457}': 'Ropa',
  '\u{1F389}': 'Celebracion',
  '\u{1F3A1}': 'Parque de atracciones',
  '\u{1F382}': 'Pastel',
  '\u{1F3C6}': 'Trofeo',
  '\u{1F3B5}': 'Musica',
  '\u{1F354}': 'Hamburguesa',
  '\u{26BD}': 'Deporte',
  '\u{1F4DA}': 'Libros',
  '\u{1F3A8}': 'Arte',
  '\u{1F3D6}\u{FE0F}': 'Playa',
  '\u{1F3CA}': 'Piscina',
  '\u{1F4B5}': 'Billetes',
};
