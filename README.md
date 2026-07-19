# CV Analyzer

CV Analyzer is a web application designed to analyze CVs and Resumes. It features a modern Angular frontend and a robust Node.js/Express backend, configured with a modular structure for authentication, services, and routing.

---

## 📁 Project Directory Structure

```text
cv_analyzer/
├── frontend/
│   ├── src/
│   │   ├── index.html
│   │   ├── main.ts
│   │   ├── app/
│   │   │   ├── core/
│   │   │   │   ├── services/
│   │   │   │   │   └── auth.service.ts
│   │   │   │   ├── interceptors/
│   │   │   │   │   └── auth.interceptor.ts
│   │   │   │   └── guards/
│   │   │   │       └── auth.guard.ts
│   │   │   ├── shared/
│   │   │   │   ├── components/
│   │   │   │   │   └── toast/ (Custom Toast/Notification component)
│   │   │   │   ├── models/
│   │   │   │   │   └── user.model.ts
│   │   │   ├── features/
│   │   │   │   ├── auth/
│   │   │   │   │   ├── login/
│   │   │   │   │   │   ├── login.component.ts
│   │   │   │   │   │   ├── login.component.html
│   │   │   │   │   │   └── login.component.scss
│   │   │   │   │   └── signup/
│   │   │   │   │       ├── signup.component.ts
│   │   │   │   │       ├── signup.component.html
│   │   │   │   │       └── signup.component.scss
│   │   │   ├── pages/
│   │   │   │   └── home/
│   │   │   │       ├── home.component.ts
│   │   │   │       ├── home.component.html
│   │   │   │       └── home.component.scss
│   │   │   ├── app.routes.ts
│   │   │   ├── app.component.ts
│   │   │   └── app.config.ts
├── backend/
│   ├── controllers/
│   │   └── authController.js
│   ├── routes/
│   │   └── authRoutes.js
│   ├── middleware/
│   │   └── errorHandler.js
│   ├── utils/
│   │   └── validation.js
│   ├── app.js
│   ├── server.js
│   ├── package.json
│   └── .env
```

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Angular v20
- **Language**: TypeScript
- **Styling**: SCSS (Sassy CSS)
- **State/Async**: RxJS

### Backend
- **Framework**: Express.js (Node.js)
- **Security**: bcryptjs (Password hashing)
- **Validation**: validator
- **Configuration**: dotenv
- **Development Tool**: nodemon (Auto-restarts server on changes)

---

## 🚀 Getting Started

Follow the instructions below to get your local environment set up.

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.x or later recommended)
- [npm](https://www.npmjs.com/) (Node Package Manager)

---

### 1. Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Create a `.env` file in the `backend/` root (or configure the existing one) with the following content:
   ```env
   PORT=5000
   # Add database configuration and token secret keys here
   ```

4. **Start the backend development server:**
   ```bash
   npm run dev
   ```
   The backend server will run on the port specified in `.env` (default is `5000`).

---

### 2. Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the frontend development server:**
   ```bash
   npm start
   ```
   Open your browser and navigate to `http://localhost:4200/`.

---

## 📝 Ongoing Updates
This README serves as the baseline for the CV Analyzer repository. As features are added, directories are extended, or new technologies are integrated, this file should be updated accordingly.
