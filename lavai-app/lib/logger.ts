// Structured logging utility — replaces console.log in all API routes

type LogLevel = 'info' | 'warn' | 'error'

function log(level: LogLevel, event: string, data?: any, err?: any) {
  const entry: Record<string, any> = {
    level,
    event,
    ts: Date.now(),
    iso: new Date().toISOString(),
  }
  if (data !== undefined) entry.data = data
  if (err !== undefined) {
    entry.error = err instanceof Error
      ? { message: err.message, stack: err.stack }
      : String(err)
  }
  const serialized = JSON.stringify(entry)
  if (level === 'error') console.error(serialized)
  else if (level === 'warn') console.warn(serialized)
  else console.log(serialized)
}

export const logger = {
  info: (event: string, data?: any) => log('info', event, data),
  warn: (event: string, data?: any) => log('warn', event, data),
  error: (event: string, err: any, data?: any) => log('error', event, data, err),
}
