import { randomUUID } from 'crypto'
export function versionedName(original: string) {
  const dt = new Date().toISOString().slice(0,10)
  const [base, ...rest] = original.split('.')
  const ext = rest.length ? '.' + rest.pop() : ''
  return `${dt}_${randomUUID()}_${base}${ext}`.replace(/\s+/g,'_')
}