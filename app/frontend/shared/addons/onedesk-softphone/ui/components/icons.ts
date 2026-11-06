// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Se distribuye bajo AGPL-3.0 como parte de esta versión modificada de Zammad. Ver MODIFICATIONS.md.

// Iconos de trazo del diseño (docs/design/Telefono.html), del estilo de Lucide, como datos: cada
// icono es la lista de elementos SVG que lo forman. Sin v-html ni ficheros externos (CSP).

interface IconShape {
  tag: 'path' | 'line' | 'circle' | 'rect' | 'polyline' | 'polygon'
  attrs: Readonly<Record<string, string>>
}

const path = (d: string): IconShape => ({ tag: 'path', attrs: { d } })
const line = (x1: string, y1: string, x2: string, y2: string): IconShape => ({
  tag: 'line',
  attrs: { x1, y1, x2, y2 },
})

const PHONE =
  'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z'

export const ICONS = {
  redial: [
    path('m17 2 4 4-4 4'),
    path('M3 11v-1a4 4 0 0 1 4-4h14'),
    path('m7 22-4-4 4-4'),
    path('M21 13v1a4 4 0 0 1-4 4H3'),
  ],
  'bell-off': [
    path('M8.7 3A6 6 0 0 1 18 8a21 21 0 0 0 .6 5'),
    path('M17 17H3s3-2 3-9a4.7 4.7 0 0 1 .3-2'),
    path('M10.3 21a1.94 1.94 0 0 0 3.4 0'),
    path('m2 2 20 20'),
  ],
  pause: [
    { tag: 'rect', attrs: { x: '6', y: '4', width: '4', height: '16', rx: '1' } },
    { tag: 'rect', attrs: { x: '14', y: '4', width: '4', height: '16', rx: '1' } },
  ],
  play: [{ tag: 'polygon', attrs: { points: '6 3 20 12 6 21 6 3' } }],
  exit: [
    path('M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4'),
    { tag: 'polyline', attrs: { points: '16 17 21 12 16 7' } },
    line('21', '12', '9', '12'),
  ],
  phone: [path(PHONE)],
  'phone-off': [
    path(
      'M10.7 13.3a16 16 0 0 0 3.4 2.6l1.3-1.3a2 2 0 0 1 2.1-.4c.8.3 1.7.5 2.6.6A2 2 0 0 1 22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-3.3-2.6M5.2 13.1A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.4 2.1L8 9.7',
    ),
    line('22', '2', '2', '22'),
  ],
  users: [
    { tag: 'circle', attrs: { cx: '12', cy: '7', r: '3' } },
    path('M7 21v-2a5 5 0 0 1 10 0v2'),
    { tag: 'circle', attrs: { cx: '5', cy: '10', r: '2' } },
    { tag: 'circle', attrs: { cx: '19', cy: '10', r: '2' } },
    path('M2 19v-1a3 3 0 0 1 3-3'),
    path('M22 19v-1a3 3 0 0 0-3-3'),
  ],
  transfer: [path('m16 3 4 4-4 4'), path('M20 7H4'), path('m8 21-4-4 4-4'), path('M4 17h16')],
  mic: [
    path('M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z'),
    path('M19 10v2a7 7 0 0 1-14 0v-2'),
    line('12', '19', '12', '22'),
  ],
  'mic-off': [
    line('2', '2', '22', '22'),
    path('M18.89 13.23A7.12 7.12 0 0 0 19 12v-2'),
    path('M5 10v2a7 7 0 0 0 12 5'),
    path('M15 9.34V5a3 3 0 0 0-5.68-1.33'),
    path('M9 9v3a3 3 0 0 0 5.12 2.12'),
    line('12', '19', '12', '22'),
  ],
  // Panel de supervisión (cabecera) y Escuchar.
  eye: [
    path('M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z'),
    { tag: 'circle', attrs: { cx: '12', cy: '12', r: '3' } },
  ],
  headphones: [
    path(
      'M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3',
    ),
  ],
  close: [path('M18 6 6 18'), path('m6 6 12 12')],
  'chevron-down': [{ tag: 'polyline', attrs: { points: '6 9 12 15 18 9' } }],
  'chevron-left': [{ tag: 'polyline', attrs: { points: '15 18 9 12 15 6' } }],
} as const satisfies Record<string, readonly IconShape[]>

export type IconName = keyof typeof ICONS
