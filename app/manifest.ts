import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Bodega Jormard',
    short_name: 'Jormard',
    description: 'Tu tienda de confianza. Pide tus productos y recíbelos en casa.',
    start_url: '/cliente/catalogo',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#ffffff',
    theme_color: '#0284C7',
    lang: 'es-PE',
    categories: ['shopping', 'food'],
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Ofertas del día', url: '/cliente/catalogo?seccion=ofertas' },
      { name: 'Mis pedidos', url: '/cliente/catalogo?vista=orders' },
    ],
  };
}
