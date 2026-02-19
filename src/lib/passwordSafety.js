// src/lib/passwordSafety.js
// ═══════════════════════════════════════════════════════════════
// Check passwords against HaveIBeenPwned's Pwned Passwords API.
// Uses k-anonymity: only the first 5 chars of the SHA-1 hash
// are sent to the API, so the full password is NEVER transmitted.
// Free, no API key needed, same API Supabase Pro uses.
// ═══════════════════════════════════════════════════════════════

/**
 * Check if a password has appeared in known data breaches.
 *
 * @param {string} password - The password to check
 * @returns {Promise<{ leaked: boolean, count: number }>}
 *   leaked: true if the password was found in breaches
 *   count: how many times it appeared (0 if not found)
 *
 * Usage:
 *   const result = await checkLeakedPassword("mypassword123");
 *   if (result.leaked) {
 *     alert(`This password appeared in ${result.count} data breaches. Pick a different one.`);
 *   }
 */
export async function checkLeakedPassword(password) {
  try {
    // 1. SHA-1 hash the password
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-1", data);

    // 2. Convert to uppercase hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();

    // 3. Split: first 5 chars (prefix) + rest (suffix)
    const prefix = hashHex.slice(0, 5);
    const suffix = hashHex.slice(5);

    // 4. Query HIBP API with only the prefix (k-anonymity)
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { "Add-Padding": "true" }, // padding prevents response-length analysis
    });

    if (!response.ok) {
      console.warn("HIBP API error:", response.status);
      return { leaked: false, count: 0 }; // fail open — don't block signups if API is down
    }

    // 5. Check if our suffix is in the response
    const text = await response.text();
    const lines = text.split("\n");

    for (const line of lines) {
      const [hashSuffix, countStr] = line.split(":");
      if (hashSuffix.trim() === suffix) {
        const count = parseInt(countStr.trim(), 10) || 0;
        return { leaked: count > 0, count };
      }
    }

    return { leaked: false, count: 0 };
  } catch (err) {
    console.warn("Password check failed:", err);
    return { leaked: false, count: 0 }; // fail open
  }
}

/**
 * Validate password strength + leak check combined.
 * Returns an object with all validation results.
 *
 * @param {string} password
 * @returns {Promise<{ valid: boolean, errors: string[] }>}
 */
export async function validatePassword(password) {
  const errors = [];

  // Length
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters");
  }

  // Complexity (at least 2 of: uppercase, lowercase, number, special)
  let complexity = 0;
  if (/[a-z]/.test(password)) complexity++;
  if (/[A-Z]/.test(password)) complexity++;
  if (/[0-9]/.test(password)) complexity++;
  if (/[^a-zA-Z0-9]/.test(password)) complexity++;

  if (complexity < 2) {
    errors.push("Include at least two of: uppercase, lowercase, number, special character");
  }

  // Common passwords (quick local check before hitting API)
  const common = [
    "password", "12345678", "123456789", "qwerty123", "password1",
    "iloveyou", "admin123", "welcome1", "letmein12", "monkey123",
  ];
  if (common.includes(password.toLowerCase())) {
    errors.push("This is a commonly used password");
  }

  // Leaked password check (only if no errors so far, to avoid unnecessary API calls)
  if (errors.length === 0) {
    const { leaked, count } = await checkLeakedPassword(password);
    if (leaked) {
      errors.push(
        count > 1000
          ? `This password has appeared in ${count.toLocaleString()} data breaches — pick a different one`
          : "This password was found in a data breach — pick a different one"
      );
    }
  }

  return { valid: errors.length === 0, errors };
}