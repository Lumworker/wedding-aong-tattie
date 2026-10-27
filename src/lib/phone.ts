/** Thai mobile numbers: 06 / 08 / 09 followed by 8 digits. */

const LOCAL_MOBILE = /^0[689]\d{8}$/

export function digitsOnly(input: string): string {
  return input.replace(/\D/g, "")
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

  if (!LOCAL_MOBILE.test(digits)) return null
  return digits
}

export function formatThaiMobile(phone: string): string {
  if (phone.length !== 10) return phone
  return `${phone.slice(0, 3)}-${phone.slice(3, 6)}-${phone.slice(6)}`
}

/** Digits only while typing a code — never a phone-shaped mask that looks pre-filled. */
export function maskInviteInput(raw: string): string {
  const digits = digitsOnly(raw)
  if (digits.startsWith("66") && digits.length >= 11) {
    const local = normalizeThaiMobile(raw)
    return local ?? digits.slice(0, 12)
  }
  return digits.slice(0, 10)
}
