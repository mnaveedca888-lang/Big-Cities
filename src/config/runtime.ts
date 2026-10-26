const configuredApiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').trim().replace(/\/+$/, '');
const deploymentTarget = import.meta.env.VITE_DEPLOYMENT_TARGET ?? 'development';

if (deploymentTarget === 'production' && (!configuredApiBaseUrl || /staging|preview|candidate/i.test(configuredApiBaseUrl))) {
	throw new Error('Production frontend builds require a dedicated non-staging API origin.');
}

export const apiBaseUrl = configuredApiBaseUrl;
