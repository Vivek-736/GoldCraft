export const ADMIN_EMAILS = [
  "vivekvrc777@gmail.com",
  "tishyakolli@gmail.com",
  "revanthkumar3747@gmail.com",
  "nikineha2422@gmail.com"
] as const;

export function isAdminEmail(email?: string | null) {
  if (!email) {
    return false;
  }

  return ADMIN_EMAILS.includes(email.toLowerCase() as (typeof ADMIN_EMAILS)[number]);
}