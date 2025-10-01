import { parsePhoneNumberFromString } from 'libphonenumber-js'
export function isValidTRPhone(input?: string | null) {
  if (!input) return true
  const pn = parsePhoneNumberFromString(input, 'TR')
  return !!pn?.isValid()
}
