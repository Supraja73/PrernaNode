// Fail-fast startup environment validation. Runs synchronously before connectDB() /
// app.listen() so a misconfigured deployment gets one clear error instead of a
// mysterious runtime crash three requests later. This is deliberately separate from
// scripts/healthCheck.js (a standalone, manually-run/CI pre-deploy check that also
// pings MongoDB) — this module is the in-process guard that runs every single boot.

const REQUIRED_VARS = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'CLIENT_URL'];
const DEFAULT_DEV_MONGO_URI = 'mongodb://127.0.0.1:27017/prernanode';

// Vars that unlock specific optional features. Missing ones don't stop the server —
// they disable exactly the feature that needs them, and the relevant service/route
// already reports that clearly (e.g. aiService's 503, uploads' multer error).
const RECOMMENDED_GROUPS = [
  { vars: ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'], feature: 'transactional email (verification, password reset, digests)' },
  { vars: ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'], feature: 'image/avatar uploads' },
];

const validateAIConfig = () => {
  const provider = (process.env.AI_PROVIDER || 'anthropic').toLowerCase();
  const validProviders = ['anthropic', 'gemini', 'openai'];

  if (!validProviders.includes(provider)) {
    throw new Error(
      `Invalid AI_PROVIDER "${provider}". Must be one of: ${validProviders.join(', ')}.`
    );
  }

  // Backward-compatible key lookup: a generic AI_API_KEY works for any provider;
  // provider-specific legacy names (from before multi-provider support) still work too.
  const legacyKeyVar = { anthropic: 'ANTHROPIC_API_KEY', gemini: 'GEMINI_API_KEY', openai: 'OPENAI_API_KEY' }[provider];
  const hasKey = !!(process.env.AI_API_KEY || process.env[legacyKeyVar]);

  if (!hasKey) {
    console.warn(
      `⚠️  AI features disabled: no API key found for AI_PROVIDER="${provider}". ` +
        `Set AI_API_KEY (or ${legacyKeyVar}) to enable /api/ai/* career and story endpoints.`
    );
  }

  return { provider, configured: hasKey };
};

const validateEnv = () => {
  const missingRequired = REQUIRED_VARS.filter((v) => !process.env[v]);
  if (missingRequired.length) {
    // Throwing here (rather than console.error + process.exit) lets server.js decide
    // how to surface this — but in practice an unhandled throw at require-time is
    // exactly the fail-fast behavior we want: the process never finishes booting.
    throw new Error(
      `Missing required environment variables: ${missingRequired.join(', ')}. ` +
        `Copy server/.env.example to server/.env and fill these in before starting the server.`
    );
  }

  if (!process.env.MONGO_URI && process.env.NODE_ENV !== 'production') {
    console.warn(`⚠️  MONGO_URI is not set. Falling back to local development MongoDB at ${DEFAULT_DEV_MONGO_URI}.`);
  }

  if (process.env.NODE_ENV === 'production') {
    if (process.env.JWT_ACCESS_SECRET.length < 32 || process.env.JWT_REFRESH_SECRET.length < 32) {
      throw new Error(
        'JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be at least 32 characters in production. ' +
          'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"'
      );
    }
    if (process.env.JWT_ACCESS_SECRET === process.env.JWT_REFRESH_SECRET) {
      throw new Error('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must not be the same value.');
    }
  }

  RECOMMENDED_GROUPS.forEach(({ vars, feature }) => {
    const missing = vars.filter((v) => !process.env[v]);
    if (missing.length && missing.length < vars.length) {
      // Partial config is almost always a mistake (e.g. host set, password forgotten) —
      // worth a louder warning than "fully unset", which is a legitimate "not using this" choice.
      console.warn(`⚠️  Partial config for ${feature}: missing ${missing.join(', ')}. This feature will not work correctly.`);
    } else if (missing.length === vars.length) {
      console.warn(`⚠️  ${feature} is not configured (${vars.join(', ')} unset) — this feature will be disabled.`);
    }
  });

  const ai = validateAIConfig();

  console.log(`✅ Environment validated (NODE_ENV=${process.env.NODE_ENV || 'development'}, AI_PROVIDER=${ai.provider}${ai.configured ? '' : ', unconfigured'})`);

  return { ai };
};

module.exports = validateEnv;
