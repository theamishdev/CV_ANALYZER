# Deployment Guide: CV Analyzer on Render

This guide provides step-by-step instructions for deploying the **CV Analyzer** project (MongoDB + Node.js/Python Backend + Angular Frontend) on [Render](https://render.com).

---

## 🏗️ Architecture Overview

| Component | Platform | Runtime | Notes |
| :--- | :--- | :--- | :--- |
| **Database** | MongoDB Atlas (Free Tier) | Managed DB | Required because Render does not host native managed MongoDB |
| **Backend** | Render Web Service | Docker (`backend/Dockerfile`) | Bundles Node.js 22, Python 3 ML models, and Chromium/Puppeteer |
| **Frontend** | Render Web Service | Docker (`frontend/Dockerfile`) | Serves Angular build with Nginx (`envsubst` for dynamic API proxying) |

---

## 🚀 Deployment Steps

### Step 1: Set Up MongoDB Atlas (Database)

1. Sign up / log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a free **M0 Cluster**.
3. Under **Database Access**, create a database user (note down the `username` and `password`).
4. Under **Network Access**, click **Add IP Address** and select **Allow Access from Anywhere** (`0.0.0.0/0`) so Render services can connect.
5. Click **Connect** → **Drivers** and copy your connection string:
   ```text
   mongodb+srv://<username>:<password>@cluster0.mongodb.net/cv_analyzer?retryWrites=true&w=majority
   ```

---

### Step 2: Deploy Backend Web Service

1. Push your updated project repository to GitHub or GitLab.
2. Log in to [Render Dashboard](https://dashboard.render.com/) → **New +** → **Web Service**.
3. Connect your repository.
4. Configure service settings:
   - **Name**: `cv-analyzer-backend`
   - **Region**: Choose your preferred region.
   - **Branch**: `main`
   - **Root Directory**: `backend`  *(⚠️ Crucial: setting this makes Render locate `backend/Dockerfile`)*
   - **Runtime**: **Docker**
   - **Dockerfile Path**: `Dockerfile`
   - **Instance Type**: **Free**
   - **Health Check Path**: `/health`

5. Add **Environment Variables**:

| Variable Name | Value |
| :--- | :--- |
| `PORT` | `3000` |
| `NODE_ENV` | `production` |
| `MONGODB_URI` | Your MongoDB Atlas connection string from Step 1 |
| `SESSION_SECRET` | A long random secret string (e.g. `secret_key_cv_analyzer_2026`) |
| `CORS_ORIGIN` | Your frontend Render URL (e.g. `https://cv-analyzer-frontend.onrender.com,http://localhost:4200`) |
| `XAI_API_KEY` | *(Optional)* Your xAI Grok API key |

6. Click **Create Web Service**. Note down your backend service URL (e.g. `https://cv-analyzer-backend.onrender.com`).

---

### Step 3: Deploy Frontend Web Service

1. On Render Dashboard, click **New +** → **Web Service**.
2. Connect your repository.
3. Configure service settings:
   - **Name**: `cv-analyzer-frontend`
   - **Branch**: `main`
   - **Root Directory**: `frontend` *(⚠️ Crucial: setting this makes Render locate `frontend/Dockerfile`)*
   - **Runtime**: **Docker**
   - **Dockerfile Path**: `Dockerfile`
   - **Instance Type**: **Free**

4. Under **Environment Variables**, add:

| Variable Name | Value | Notes |
| :--- | :--- | :--- |
| `BACKEND_URL` | `http://cv-analyzer-backend:3000/api/` | Connects via Render's Private Network, OR use `https://cv-analyzer-backend.onrender.com/api/` |

5. Click **Create Web Service**.
6. Once deployed, copy your frontend URL (e.g., `https://cv-analyzer-frontend.onrender.com`).
7. Update `cv-analyzer-backend` environment variable `CORS_ORIGIN` to include `https://cv-analyzer-frontend.onrender.com`.

---

## ⚡ Option 2: 1-Click Deployment Using Render Blueprint (`render.yaml`)

We have included an updated [`render.yaml`](file:///c:/Users/Amish%20Verma/Desktop/Home/Projects/CV%20ANalyzer/render.yaml) file in the project root:

1. Push your repository to GitHub.
2. Open [Render Dashboard](https://dashboard.render.com/) → **New +** → **Blueprint**.
3. Select your repository. Render automatically reads `render.yaml` and sets up both Backend and Frontend Docker services without any path errors!
4. Fill in `MONGODB_URI` and click **Apply**.

---

## 🔧 Troubleshooting Docker Path Errors

If Render gives the error `failed to read dockerfile: open Dockerfile.: no such file or directory`:

- **Fix**: Ensure **Root Directory** in Render settings is set to `backend` (for backend) or `frontend` (for frontend).
- **Alternative**: If Root Directory is left empty, set **Docker Context** to `backend` and **Dockerfile Path** to `backend/Dockerfile`.
