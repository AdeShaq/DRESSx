/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
        // This is a workaround for a build error in the `@opentelemetry/sdk-node` package.
        // The `TracerProviderWithEnvExporter` tries to import an optional dependency (`@opentelemetry/exporter-jaeger`)
        // that isn't included, causing the build to fail. We can safely ignore it.
        config.externals.push('@opentelemetry/exporter-jaeger');
        config.externals.push('@opentelemetry/exporter-zipkin');
    }
    return config;
  },
};

module.exports = nextConfig;
