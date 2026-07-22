const AUTH_GLOBAL = '__JEST_E2E_AUTH__';
const DEFAULT_VERCEL_URL_PATTERNS = ['*.vercel.app', '*.vercel.sh'];

const isPlainObject = (value) =>
  value !== null &&
  typeof value === 'object' &&
  !Array.isArray(value);

const compactObject = (value = {}) => {
  if (!isPlainObject(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined && entryValue !== null)
  );
};

const firstNonEmpty = (...values) => values.find((value) => value !== undefined && value !== null && value !== '');

const parseJsonEnv = (name, fallback, env = process.env) => {
  const raw = env[name];
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`Invalid JSON in ${name}: ${error.message}`);
  }
};

const splitPatterns = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string') {
    return value.split(',').map((pattern) => pattern.trim()).filter(Boolean);
  }
  return [];
};

const normalizeCookies = (cookies) => {
  if (!cookies) return [];
  if (Array.isArray(cookies)) return cookies.filter(isPlainObject);
  if (isPlainObject(cookies)) return [cookies];
  return [];
};

const normalizeAuthInput = (authConfig, env = process.env) => {
  if (authConfig === false) return [];

  const envConfig = parseJsonEnv('JEST_E2E_AUTH_CONFIG', null, env);
  if (authConfig === undefined || authConfig === null) {
    if (envConfig) return Array.isArray(envConfig) ? envConfig : [envConfig];
    return [{}];
  }

  if (Array.isArray(authConfig)) return authConfig;
  return [authConfig];
};

const getProvider = (authConfig, env = process.env) => {
  if (typeof authConfig === 'string') return authConfig.toLowerCase();
  return String(
    authConfig?.provider ||
      env.JEST_E2E_AUTH_PROVIDER ||
      (env.VERCEL_AUTOMATION_BYPASS_SECRET ? 'vercel' : 'generic')
  ).toLowerCase();
};

const getUrlPatterns = (authConfig, env = process.env, defaults = ['*']) => {
  const explicitPatterns = splitPatterns(authConfig?.urlPatterns || authConfig?.urlPattern);
  if (explicitPatterns.length > 0) return explicitPatterns;

  const envPatterns = splitPatterns(env.JEST_E2E_AUTH_URL_PATTERNS);
  if (envPatterns.length > 0) return envPatterns;

  return defaults;
};

const buildTokenHeaderValue = (token, prefix) => {
  if (!prefix) return token;
  return `${prefix} ${token}`;
};

const resolveVercelAuth = (authConfig = {}, env = process.env, providerWasExplicit = false) => {
  const token = firstNonEmpty(
    authConfig.token,
    authConfig.key,
    authConfig.secret,
    env.VERCEL_AUTOMATION_BYPASS_SECRET,
    env.JEST_E2E_AUTOMATION_KEY,
    env.JEST_E2E_AUTH_TOKEN
  );

  if (!token) {
    if (providerWasExplicit) {
      throw new Error(
        'Vercel auth requires VERCEL_AUTOMATION_BYPASS_SECRET, JEST_E2E_AUTOMATION_KEY, or auth.token.'
      );
    }
    return null;
  }

  const transport = String(
    authConfig.transport ||
      env.JEST_E2E_VERCEL_BYPASS_TRANSPORT ||
      env.JEST_E2E_AUTH_TRANSPORT ||
      'header'
  ).toLowerCase();

  const setBypassCookie = firstNonEmpty(
    authConfig.setBypassCookie,
    env.JEST_E2E_VERCEL_SET_BYPASS_COOKIE,
    'true'
  );
  const shouldSetBypassCookie = setBypassCookie !== false && setBypassCookie !== 'false';

  const headers = compactObject({ ...(authConfig.headers || {}) });
  const queryParams = compactObject({ ...(authConfig.queryParams || {}) });

  if (transport === 'header' || transport === 'headers' || transport === 'both') {
    headers['x-vercel-protection-bypass'] = token;
    if (shouldSetBypassCookie) {
      headers['x-vercel-set-bypass-cookie'] = String(setBypassCookie);
    }
  }

  if (transport === 'query' || transport === 'params' || transport === 'both') {
    queryParams['x-vercel-protection-bypass'] = token;
    if (shouldSetBypassCookie) {
      queryParams['x-vercel-set-bypass-cookie'] = String(setBypassCookie);
    }
  }

  if (Object.keys(headers).length === 0 && Object.keys(queryParams).length === 0) {
    throw new Error(`Unsupported Vercel auth transport "${transport}". Use "header", "query", or "both".`);
  }

  return {
    provider: 'vercel',
    headers,
    queryParams,
    cookies: normalizeCookies(authConfig.cookies),
    urlPatterns: getUrlPatterns(authConfig, env, DEFAULT_VERCEL_URL_PATTERNS),
  };
};

const resolveGenericAuth = (authConfig = {}, env = process.env, providerWasExplicit = false) => {
  const envHeaders = parseJsonEnv('JEST_E2E_AUTH_HEADERS', {}, env);
  const envQueryParams = parseJsonEnv('JEST_E2E_AUTH_QUERY_PARAMS', {}, env);
  const envCookies = parseJsonEnv('JEST_E2E_AUTH_COOKIES', [], env);

  const headers = {
    ...compactObject(envHeaders),
    ...compactObject(authConfig.headers),
  };

  const headerName = firstNonEmpty(authConfig.headerName, env.JEST_E2E_AUTH_HEADER_NAME);
  const headerValue = firstNonEmpty(authConfig.headerValue, env.JEST_E2E_AUTH_HEADER_VALUE);
  const token = firstNonEmpty(authConfig.token, authConfig.key, env.JEST_E2E_AUTH_TOKEN, env.JEST_E2E_AUTOMATION_KEY);

  if (headerName && (headerValue || token)) {
    headers[headerName] = headerValue || buildTokenHeaderValue(token, firstNonEmpty(authConfig.headerPrefix, env.JEST_E2E_AUTH_HEADER_PREFIX, ''));
  } else if (!headerName && token && authConfig.token) {
    headers.Authorization = buildTokenHeaderValue(token, firstNonEmpty(authConfig.headerPrefix, env.JEST_E2E_AUTH_HEADER_PREFIX, 'Bearer'));
  }

  const queryParams = {
    ...compactObject(envQueryParams),
    ...compactObject(authConfig.queryParams),
  };

  const cookies = [
    ...normalizeCookies(envCookies),
    ...normalizeCookies(authConfig.cookies),
  ];

  if (Object.keys(headers).length === 0 && Object.keys(queryParams).length === 0 && cookies.length === 0) {
    if (providerWasExplicit || Object.keys(authConfig).length > 0) {
      throw new Error(
        'Auth config must provide headers, cookies, queryParams, or a token/headerName pair.'
      );
    }
    return null;
  }

  return {
    provider: 'generic',
    headers,
    queryParams,
    cookies,
    urlPatterns: getUrlPatterns(authConfig, env),
  };
};

const resolveAuthRule = (authConfig, env = process.env) => {
  if (authConfig === false || authConfig === null) return null;
  const normalized = typeof authConfig === 'string' ? { provider: authConfig } : authConfig;
  const provider = getProvider(normalized, env);
  const providerWasExplicit = Boolean(normalized?.provider || typeof authConfig === 'string' || env.JEST_E2E_AUTH_PROVIDER);

  if (provider === 'vercel') {
    return resolveVercelAuth(normalized, env, providerWasExplicit);
  }

  return resolveGenericAuth(normalized, env, providerWasExplicit);
};

function resolveAuthConfig(authConfig, env = process.env) {
  return normalizeAuthInput(authConfig, env)
    .map((entry) => resolveAuthRule(entry, env))
    .filter(Boolean);
}

const getGlobalAuthRules = () => {
  const rules = globalThis[AUTH_GLOBAL];
  return Array.isArray(rules) ? rules : [];
};

function setGlobalAuthConfig(authConfig, env = process.env) {
  const rules = resolveAuthConfig(authConfig, env);
  if (rules.length > 0) {
    globalThis[AUTH_GLOBAL] = rules;
  } else {
    delete globalThis[AUTH_GLOBAL];
  }
  return rules;
}

const escapeRegex = (value) => value.replace(/[|\\{}()[\]^$+?.]/g, '\\$&');

const wildcardToRegex = (pattern) => new RegExp(`^${escapeRegex(pattern).replace(/\*/g, '.*')}$`, 'i');

const toUrl = (url, pageInstance) => {
  try {
    return new URL(url);
  } catch (_) {
    try {
      const base = pageInstance && typeof pageInstance.url === 'function'
        ? pageInstance.url()
        : 'http://localhost';
      return new URL(url, base);
    } catch (_) {
      return null;
    }
  }
};

function authRuleMatchesUrl(rule, url, pageInstance) {
  const parsedUrl = toUrl(url, pageInstance);
  if (!parsedUrl) return true;

  return (rule.urlPatterns || ['*']).some((pattern) => {
    if (pattern === '*') return true;
    const testValue = pattern.startsWith('http') ? parsedUrl.href : parsedUrl.hostname;
    return wildcardToRegex(pattern).test(testValue);
  });
}

function applyQueryParams(url, queryParams = {}, pageInstance) {
  const parsedUrl = toUrl(url, pageInstance);
  if (!parsedUrl || Object.keys(queryParams).length === 0) return url;

  Object.entries(queryParams).forEach(([name, value]) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      parsedUrl.searchParams.delete(name);
      value.forEach((entry) => parsedUrl.searchParams.append(name, String(entry)));
      return;
    }
    parsedUrl.searchParams.set(name, String(value));
  });

  return parsedUrl.toString();
}

const cookieForUrl = (cookie, url, pageInstance) => {
  const parsedUrl = toUrl(url, pageInstance);
  if (!parsedUrl || cookie.url || cookie.domain) return cookie;
  return { ...cookie, url: parsedUrl.origin };
};

async function prepareAuthenticatedNavigation(pageInstance, url, navigationAuth) {
  if (!pageInstance || navigationAuth === false) {
    return { url };
  }

  const globalRules = getGlobalAuthRules();
  const navigationRules = navigationAuth
    ? resolveAuthConfig(navigationAuth)
    : [];
  const hasAuthConfiguration = globalRules.length > 0 || navigationRules.length > 0;
  const rules = [...globalRules, ...navigationRules].filter((rule) =>
    authRuleMatchesUrl(rule, url, pageInstance)
  );

  if (rules.length === 0) {
    if (hasAuthConfiguration && typeof pageInstance.setExtraHTTPHeaders === 'function') {
      await pageInstance.setExtraHTTPHeaders({});
    }
    return { url };
  }

  const headers = Object.assign({}, ...rules.map((rule) => rule.headers || {}));
  const queryParams = Object.assign({}, ...rules.map((rule) => rule.queryParams || {}));
  const cookies = rules.flatMap((rule) => rule.cookies || []);

  if (cookies.length > 0 && typeof pageInstance.setCookie === 'function') {
    await pageInstance.setCookie(...cookies.map((cookie) => cookieForUrl(cookie, url, pageInstance)));
  }

  if (typeof pageInstance.setExtraHTTPHeaders === 'function') {
    await pageInstance.setExtraHTTPHeaders(headers);
  }

  return {
    url: applyQueryParams(url, queryParams, pageInstance),
  };
}

export {
  AUTH_GLOBAL,
  applyQueryParams,
  authRuleMatchesUrl,
  prepareAuthenticatedNavigation,
  resolveAuthConfig,
  setGlobalAuthConfig,
};
