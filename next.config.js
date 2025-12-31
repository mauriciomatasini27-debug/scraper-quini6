/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // TypeScript ya está configurado, solo necesitamos habilitar estricto
  typescript: {
    ignoreBuildErrors: false,
  },
  // Optimizaciones para producción
  // swcMinify está habilitado por defecto en Next.js 15, no es necesario especificarlo
  // Configuración de imágenes si las usamos
  images: {
    domains: [],
  },
  // Configuración de paths
  transpilePackages: [],
}

module.exports = nextConfig
