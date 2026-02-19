# NPM Publishing Instructions (Granular Access Token)

Since "Classic Tokens" are deprecated, you must use a **Granular Access Token** with specific settings to allow CI/CD automation.

## ✅ FIX: Generate a Granular Access Token

1. Log in to [npmjs.com](https://www.npmjs.com/).
2. Go to **Access Tokens**.
3. Click **Generate New Token** (Granular Access Token).
4. **Token Name:** Enter a name (e.g., "GitHub Actions CI").
5. **Expiration:** Select the maximum allowed (usually 90 days). *Note: You will need to rotate this token when it expires.*
6. **Permissions:**
    * **Packages:** Select **Read and write**.
    * **Scope:** Select **All packages** (or restrict to your specific package/org if preferred).
7. **Security (CRITICAL):**
    * You MUST check the box **"Bypass two-factor authentication (2FA)"** or **"Automation"** (wording may vary).
    * *Without this check, the token will fail in CI/CD with the OTP error.*
8. **Generate** and copy the token.

## Update GitHub Secret

1. Go to your GitHub Repository > **Settings** > **Secrets and variables** > **Actions**.
2. Update the `NPM_TOKEN` secret with the new Granular Token.

## Retry Release

Go to GitHub **Actions**, select the failed workflow, and click **Re-run jobs**.
