import { HttpContextToken } from '@angular/common/http';

/**
 * Pass this token in HttpContext to prevent the error interceptor
 * from redirecting to login on 403 errors.
 *
 * Use for domain-level 403s (e.g. EMAIL_MISMATCH on invitation process)
 * where the user IS authenticated but the operation is simply not allowed.
 *
 * Example:
 *   this.http.post(url, body, {
 *     context: new HttpContext().set(SKIP_AUTH_REDIRECT_ON_403, true)
 *   });
 */
export const SKIP_AUTH_REDIRECT_ON_403 = new HttpContextToken<boolean>(() => false);
