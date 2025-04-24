import { json } from '@remix-run/cloudflare';
import type { LoaderFunctionArgs } from '@remix-run/cloudflare';

export async function loader({ request }: LoaderFunctionArgs) {
  const instanceId = process.env.INSTANCE_ID || 'default';
  const startTime = global.__startTime || Date.now();
  const uptime = Date.now() - startTime;
  
  return json({
    status: 'ok',
    version: process.env.npm_package_version || '0.0.0',
    instanceId,
    uptime,
    timestamp: new Date().toISOString()
  });
}