/** Thai mobile numbers: 06 / 08 / 09 followed by 8 digits. */

const LOCAL_MOBILE = /^0[689]\d{8}$/

export function digitsOnly(input: string) {
  return input.replace(/\D/g, "")
}

export function isThaiMobile(value: string) {
  return LOCAL_MOBILE.test(value)
}

/**
 * Normalize user input to a 10-digit local mobile number (`0xxxxxxxxx`).
 * Accepts spaces, dashes, a leading `+66`, and a 9-digit number missing the trunk `0`.
 */
export function normalizeThaiMobile(input: string): string | null {
  let digits = digitsOnly(input)

  if (digits.startsWith("66")) {
    if (digits.length === 12 && digits.startsWith("660")) {
      digits = digits.slice(2)
    } else if (digits.length === 11) {
      digits = `0${digits.slice(2)}`
    }
  }

  if (digits.length === 9 && /^[689]\d{8}$/.test(digits)) {
    digits = `0${digits}`
  }

  return isThaiMobile(digits) ? digits : null
}

export function formatThaiMobile(phone: string): string {
  if (phone.length !== 10) return phone
  return `${phone.slice(0, 3)}-${phone.slice(3, 6)}-${phone.slice(6)}`
}

/** Format as the guest types, and collapse a full `+66` paste into local form. */
export function maskPhoneInput(raw: string): string {
  const digits = digitsOnly(raw)
  const normalized = normalizeThaiMobile(raw)
  if (normalized && digits.length >= 10) return formatThaiMobile(normalized)

  if (digits.startsWith("66")) {
    const international = digits.slice(0, 12)
    return international ? `+${international}` : ""
  }

  const local = digits.slice(0, 10)
  if (local.length <= 3) return local
  if (local.length <= 6) return `${local.slice(0, 3)}-${local.slice(3)}`
  return `${local.slice(0, 3)}-${local.slice(3, 6)}-${local.slice(6)}`
}
