# Manual GitHub Deployment Guide

Your Personal Access Token (PAT) appears to be missing the `repo` scope permissions required to push code or create new repositories via the API.

To push your code manually, please follow these steps:

## 1. Create Repository on GitHub
1.  Go to **[GitHub.com/new](https://github.com/new)**.
2.  Create a new repository named **`Smart-QR-Shopping-Website`** (or any name you prefer).
3.  Do **NOT** initialize with README, .gitignore, or License (keep it empty).

## 2. Push Code from Terminal
Open your terminal in the project directory (`/Users/pavan/Desktop/dit`) and run the following commands:

```bash
# Remove the old remote if it exists
git remote remove origin

# Add your new repository as the remote
# Replace <YOUR_REPO_URL> with the URL from GitHub (e.g., https://github.com/Akhil43-design/Smart-QR-Shopping-Website.git)
git remote add origin https://github.com/Akhil43-design/Smart-QR-Shopping-Website.git

# Ensure you are on the main branch
git branch -M main

# Push the code
git push -u origin main
```

## Troubleshooting
If asked for a password, use your **Personal Access Token** (`ghp_...`), NOT your GitHub password.

Ensure your token has the **`repo`** (Full control of private repositories) scope selected in Developer Settings.
