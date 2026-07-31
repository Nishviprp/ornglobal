export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim())
}

export function passwordStrength(password) {
  const pwd = String(password || '')
  const checks = {
    length: pwd.length >= 8,
    upper: /[A-Z]/.test(pwd),
    lower: /[a-z]/.test(pwd),
    number: /[0-9]/.test(pwd),
  }
  const score = Object.values(checks).filter(Boolean).length
  return { checks, score, valid: score === 4 }
}

export function isValidOtp(otp) {
  return /^[0-9]{6}$/.test(String(otp || '').trim())
}

export function required(value) {
  return value !== null && value !== undefined && String(value).trim().length > 0
}
