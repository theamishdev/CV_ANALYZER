# Deployment Guide: CV Analyzer on Render

This guide provides step-by-step instructions for deploying the **CV Analyzer** project (MongoDB + Node.js/Python Backend + Angular Frontend) on [Render](https://render.com).

---

## 🏗️ Architecture Overview

| Component | Platform | Runtime | Notes |
| :--- | :--- | :--- | :--- |
| **Database** | MongoDB Atlas (Free Tier) | Managed DB | Required because Render does not host native managed MongoDB |
| **Backend** | Render Web Service | Docker (`backend/Dockerfile`) | Uses Docker to bundle Python 3, ML dependencies, and Chromium/Puppeteer |
| **Frontend** | Render Web Service | Docker (`frontend/Dockerfile`) | Uses Docker + Nginx to serve the built Angular app and reverse-proxy API calls |

---

## 🚀 Deployment Steps

### Step 1: Set Up MongoDB Atlas (Database)

1. Sign up / log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a free **M0 Cluster**.
3. Under **Database Access**, create a database user (note down the `username` and `password`).
4. Under **Network Access**, click **Add IP Address** and select **Allow Access from Anywhere** (`0.0.0.0/0`) so Render services can connect.
5. Click **Connect** → **Drivers** and copy your connection string. It will look like:
   ```text
   mongodb+srv://<username>:<password>@cluster0.mongodb.net/cv_analyzer?retryWrites=true&w=majority
   ```

---

### Step 2: Deploy Backend Web Service

1. Push your project repository to GitHub or GitLab.
2. Log in to your [Render Dashboard](https://dashboard.render.com/) and click **New +** → **Web Service**.
3. Connect your GitHub/GitLab repository.
4. Configure the service settings:
   - **Name**: `cv-analyzer-backend`
   - **Region**: Choose the region closest to your MongoDB Atlas cluster.
   - **Branch**: `main` (or your active branch)
   - **Root Directory**: `backend`
   - **Runtime**: **Docker**
   - **Dockerfile Path**: `./Dockerfile` (or `Dockerfile`)
   - **Instance Type**: **Free**
   - **Health Check Path**: `/health`

5. Add the following **Environment Variables**:

| Variable Name | Value / Description |
| :--- | :--- |
| `PORT` | `3000` |
| `NODE_ENV` | `production` |
| `MONGODB_URI` | Your MongoDB Atlas connection string from Step 1 |
| `SESSION_SECRET` | A long random secret string (e.g. `secret_key_cv_analyzer_2026`) |
| `CORS_ORIGIN` | Your frontend Render URL (e.g. `https://cv-analyzer-frontend.onrender.com,http://localhost:4200`) |
| `XAI_API_KEY` | *(Optional)* Your xAI Grok API key for LLM analysis |

6. Click **Create Web Service**. Render will build the Docker container and start your backend service. Once deployed, note down your backend URL (e.g., `https://cv-analyzer-backend.onrender.com`).

---

### Step 3: Deploy Frontend Web Service

1. On your Render Dashboard, click **New +** → **Web Service**.
2. Connect your repository.
3. Configure the service settings:
   - **Name**: `cv-analyzer-frontend`
   - **Branch**: `main`
   - **Root Directory**: `frontend`
   - **Runtime**: **Docker**
   - **Dockerfile Path**: `./Dockerfile`
   - **Instance Type**: **Free**

4. Click **Create Web Service**. Render will build the Angular application and deploy it behind Nginx.
5. Once deployed, copy your frontend URL (e.g., `https://cv-analyzer-frontend.onrender.com`).
6. Update your **Backend Service Environment Variable**:
   - Go back to your `cv-analyzer-backend` Web Service on Render → **Environment**.
   - Set `CORS_ORIGIN` to include your frontend URL: `https://cv-analyzer-frontend.onrender.com`.
   - Save changes (this will trigger a seamless restart of the backend).

---

## ⚡ Option 2: 1-Click Deployment Using Render Blueprint (`render.yaml`)

We have included a [`render.yaml`](file:///c:/Users/Amish%20Verma/Desktop/Home/Projects/CV%20ANalyzer/render.yaml) file in the project root. You can deploy both services automatically:

1. Push your repository to GitHub/GitLab.
2. Open [Render Dashboard](https://dashboard.render.com/) → **New +** → **Blueprint**.
3. Select your repository. Render will automatically parse `render.yaml` and prompt you to fill in required environment variables (`MONGODB_URI` and `CORS_ORIGIN`).
4. Click **Apply**. Both backend and frontend services will be deployed automatically!

---

## 🔍 Verification & Health Check

- **Backend Health Check**: Open `https://<your-backend-name>.onrender.com/health` in your browser. It should return:
  ```json
  { "status": "ok", "timestamp": "..." }
  ```
- **Prediction Test**: Send a POST request to `https://<your-backend-name>.onrender.com/api/auth/predict` to verify the local Python ML classification model.
- **Frontend App**: Open your frontend URL to register/log in, paste job descriptions, analyze CVs, and export PDFs via Puppeteer.

---

## 📌 Important Tips for Free Tier on Render

- **Cold Starts**: Render's Free Instance spins down after 15 minutes of inactivity. The first request after spin-down may take ~30–50 seconds to boot the Docker container.
- **Memory Limit (512MB)**: Puppeteer browser instances run in headful/headless mode inside the Docker container. Flags like `--disable-dev-shm-usage` and `--no-sandbox` have been configured in [`backend/services/pdfGeneratorService.js`](file:///c:/Users/Amish%20Verma/Desktop/Home/Projects/CV%20ANalyzer/backend/services/pdfGeneratorService.js) to stay within free memory limits.
