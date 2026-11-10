const url = new URL(process.env.DATABASE_URL || 'postgresql://invalid/invalid');
if (process.env.VERCEL || process.env.CI_PUBLIC_DEPLOY || process.env.AUDIT_LAB_ONLY !== '1') throw new Error('This build is restricted to the isolated local audit environment.');
if (!['database', '127.0.0.1', 'localhost'].includes(url.hostname) || url.pathname !== '/usms_lab') throw new Error('The audit build must use its separate local usms_lab database.');
console.log('Local audit boundary verified.');
