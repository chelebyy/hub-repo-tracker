# NPM Publishing Instructions

To enable automatic NPM publishing via GitHub Actions, please follow these steps:

1. Generate an **NPM Access Token** if you haven't already:
    * Log in to npmjs.com.
    * Go to **Access Tokens**.
    * Click **Generate New Token** (Classic Token).
    * Select **Automation** type.
    * Copy the token.

2. Add the token to your GitHub Repository Secrets:
    * Go to your repository on GitHub.
    * Click **Settings** > **Secrets and variables** > **Actions**.
    * Click **New repository secret**.
    * **Name:** `NPM_TOKEN`
    * **Value:** (Paste your token)
    * Click **Add secret**.

3. Once the secret is added, you can trigger the release by creating a new tag:

    ```bash
    git tag v1.0.9
    git push origin v1.0.9
    ```

    GitHub Actions will then build and publish the package to NPM automatically.
