/**
 * Returns a short display name: "FirstName L." when a last name exists,
 * otherwise just the first name.
 */
export function memberShortName(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length > 1) return `${parts[0]} ${parts[parts.length - 1][0]}.`;
  return parts[0];
}
