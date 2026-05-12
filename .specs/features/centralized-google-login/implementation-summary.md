# Centralized Google Login Implementation Summary

## Completed

- Added `AUTH_BASE_URL` and reserved `auth`/`api` tenant subdomain defaults.
- Added signed tenant OAuth state with `tenantId`, `tenantSlug`, `returnTo`, `nonce`, `iat`, and `exp`.
- Moved tenant OAuth start to the central auth host and fixed callback URL usage to the configured central Google callback.
- Completed tenant callback from validated state instead of request tenant context.
- Added tenant-slug redirect builder for `tenant.<ROOT_DOMAIN>` frontend redirects.
- Added root-domain session cookies while omitting cookie domain on plain `localhost`.
- Updated frontend tenant login URL generation to use `VITE_AUTH_API_BASE_URL` or the configured API base URL.
- Kept protected tenant calls on the central API host; the backend resolves tenant context from the tenant frontend `Origin` when requests arrive on the reserved API host.
- Preserved system auth flow and system-session cookie behavior with updated cookie options.

## Verification

- `pnpm --filter @pong-ping/api test` passed: 32 files, 143 tests.
- `pnpm --filter @pong-ping/frontend test` passed: 7 files, 29 tests.
- `pnpm --filter @pong-ping/api build` passed.
- `pnpm --filter @pong-ping/frontend build` passed.

## Manual Environment Notes

- Local development uses fake hosts mapped in `/etc/hosts`, for example `api.localhost.me` and `teste.localhost.me`.
- Google Console tenant OAuth redirect should match `http://api.localhost.me:3001/v1/auth/google/callback` for the current local setup.
- Cookies use `Domain=.localhost.me` so `api.localhost.me` can set a session read by tenant hosts such as `teste.localhost.me`.
