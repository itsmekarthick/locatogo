// Client-side mirrors of the rules the auth server actions enforce; the server stays the source of truth.

export const MIN_PASSWORD = 8;
export const MAX_NAME = 120;
export const MIN_NAME = 2;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function emailError(value: string) {
  const email = value.trim();
  if (!email) return "Enter your email address.";
  if (!EMAIL.test(email)) return "Enter a valid email, like name@company.com.";
  return undefined;
}

export function passwordError(value: string) {
  if (!value) return "Enter your password.";
  if (value.length < MIN_PASSWORD) return `Use at least ${MIN_PASSWORD} characters.`;
  return undefined;
}

export function nameError(value: string) {
  const name = value.trim();
  if (!name) return "Enter your full name.";
  if (name.length < MIN_NAME) return `Name must be at least ${MIN_NAME} characters.`;
  if (name.length > MAX_NAME) return `Name must be ${MAX_NAME} characters or fewer.`;
  return undefined;
}

export function confirmError(password: string, confirm: string) {
  if (!confirm) return "Re-enter your new password.";
  if (password !== confirm) return "Passwords do not match.";
  return undefined;
}
