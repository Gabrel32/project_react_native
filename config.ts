// config.ts
type EnvVars = {
  BASE_URL?: string; // Opcional
  API_URL?: string; // Opcional
};

const ENV: {
  development: EnvVars;
  production: EnvVars;
} = {
  development: {
    BASE_URL: 'https://api.mangadex.org',
  },
  production: {
    API_URL: 'https://prod.api.com',
  },
};

const getEnvVars = (): EnvVars => {
  return __DEV__ ? ENV.development : ENV.production;
};

export default getEnvVars();