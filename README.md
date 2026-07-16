<div align="center">

<img src="https://img.shields.io/badge/KAIROS-HIMS-00B4A0?style=for-the-badge&logoColor=white" alt="KAIROS HIMS" height="60"/>

# KAIROS HIMS
### Hospital Incident Management System

*A production-grade, AI-powered Incident & Risk Management platform built for modern hospitals.*

[![React](https://img.shields.io/badge/React_18-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript_5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://prisma.io/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)](https://docker.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

</div>

---

## 📋 Table of Contents
- [Overview](#-overview)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [User Roles & Permissions](#-user-roles--permissions)
- [Incident Lifecycle](#-incident-lifecycle)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Demo Credentials](#-demo-credentials)
- [API Documentation](#-api-documentation)
- [Database Schema](#-database-schema)
- [Team](#-team)
- [Project Status](#-project-status)

---

## 🏥 Overview

**KAIROS HIMS** is a comprehensive, role-based incident and risk management platform designed specifically for hospital environments. It enables frontline staff to report safety incidents, managers to review and act on them through a structured workflow, investigators to conduct root cause analyses, and administrators to gain deep analytical insights — all within a single, secure, and modern web application.

> This is a 3rd-year university group project built from the ground up to production standards.

**The name "KAIROS"** comes from the Greek word for the right, critical, or opportune moment — reflecting our mission to enable hospitals to respond to incidents at exactly the right time.

---

## ✨ Key Features

### 🛡️ Core Incident Management
- **Structured Incident Reporting** — Role-specific forms with file/evidence uploads (images, PDFs)
- **Multi-step Lifecycle Workflow** — From submission to formal closure with full audit trail
- **Department Scoping** — Managers only see incidents from their own department
- **Evidence Management** — Upload, store, and view evidence files for each incident

### 📊 Analytics & Reporting
- **Root Cause Pareto Charts** — Identify the most common failure categories
- **Control Effectiveness Heatmap** — Department x Control Type effectiveness matrix
- **Severity Trend Analysis** — Monthly trend lines and historical comparisons
- **Lessons Learned Knowledge Base** — Searchable library of closure learnings

### 🤖 AI/ML Integration (Phase 2)
- **Incident Clustering** — K-Means + UMAP 2D visualization of similar incidents
- **Risk Prediction** — Severity prediction for new incident reports
- **Similar Incidents** — Vector similarity search using sentence-transformer embeddings
- **AI-Recommended Lessons** — Smart suggestions from historical data

### 👥 User & Access Management
- **5-Role RBAC** — Fine-grained, role-based access control
- **Department-based Scoping** — Users operate within their designated department
- **Audit Trail** — Every action is logged with user, timestamp, and IP address
- **Real-time Chat** — Direct messaging between staff and managers

---

## 🏗️ System Architecture

```
+-------------------------------------------------------------+
|                        CLIENT LAYER                         |
|          React 18 + Vite + TypeScript + Tailwind CSS        |
|              (React Query - Zustand - Recharts)             |
+----------------------------+--------------------------------+
                             |  HTTP / REST API
                             v
+-------------------------------------------------------------+
|                       API GATEWAY                           |
|                    Nginx Reverse Proxy                      |
+-----------+------------------------------+------------------+
            |                              |
            v                              v
+---------------------+        +---------------------------+
|   BACKEND SERVICE   |        |   AI/ML SERVICE (Phase 2) |
|   Node.js + Express |<------>|   Python + FastAPI        |
|   Prisma ORM        | Axios  |   Sentence Transformers   |
|   JWT Auth + Zod    |        |   K-Means + UMAP          |
+----------+----------+        +---------------------------+
           |
           v
+---------------------+
|      DATABASE       |
|  PostgreSQL 16      |
|  + pgvector ext.    |
|  (AI Embeddings)    |
+---------------------+
```

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3 | UI Framework |
| TypeScript | 5.4 | Type Safety |
| Vite | 5.3 | Build Tool |
| Tailwind CSS | 3.4 | Styling |
| TanStack Query | 5.0 | Server State Management |
| Zustand | 4.5 | Client State Management |
| Recharts | 2.12 | Data Visualization |
| Radix UI | Latest | Accessible UI Primitives |
| React Router DOM | 6.23 | Client-side Routing |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 20+ | Runtime |
| Express.js | 4.19 | Web Framework |
| Prisma | 5.14 | ORM |
| PostgreSQL | 16 | Database |
| JWT | 9.0 | Authentication |
| Zod | 3.23 | Schema Validation |
| Bcrypt.js | 2.4 | Password Hashing |
| Multer | 2.1 | File Uploads |
| Helmet | 7.1 | Security Headers |

### AI Service (Phase 2)
| Technology | Purpose |
|------------|---------|
| FastAPI | AI REST API |
| Sentence-Transformers | Text Embeddings (384-dim) |
| pgvector | Vector Storage & Similarity Search |
| UMAP-learn | Dimensionality Reduction |
| Scikit-learn | K-Means Clustering & Severity Classifier |

---

## 👤 User Roles & Permissions

| Role | Description | Key Permissions |
|------|-------------|-----------------|
| **Admin** | Full system access | Everything — all departments, all actions |
| **Department Manager** | Department-scoped management | Accept/Reject incidents, Assign investigators & action owners, Review, Close, Analytics |
| **Investigator** | Incident investigation | Document findings, Root cause analysis, Evidence upload |
| **Action Owner** | Corrective action implementation | Update action status and progress |
| **Staff** | Frontline hospital employees | Submit incident reports, View own submissions only |

---

## 🔄 Incident Lifecycle

```
            +-------------+
            |    OPEN     |  <- Staff submits incident
            +------+------+
                   |  Manager Reviews
        +----------+----------+
        v                     v
+---------------+      +--------------+
|   ACCEPTED    |      |   REJECTED   |  <- With rejection comment
+-------+-------+      +--------------+
        |  Manager assigns Investigator
        v
+------------------+
|  INVESTIGATING   |  <- Investigator documents findings & root cause
+-------+----------+
        |  Manager assigns Action Owner
        v
+------------------+
|  PENDING_ACTION  |  <- Action owner implements corrective actions
+-------+----------+
        |  Manager reviews completed actions
        v
+------------------+
|  UNDER_REVIEW    |  <- Manager formally reviews
+-------+----------+
        |  Manager closes with lessons learned
        v
+------------------+
|     CLOSED       |  <- Full audit trail + lessons stored
+------------------+
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v20+
- [PostgreSQL](https://www.postgresql.org/) 16+
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (recommended)

### Option A — Docker (Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/dev-kithsara/AI-Powered-Incident-Management-Dashboard.git
cd AI-Powered-Incident-Management-Dashboard

# 2. Copy environment file and configure
cp .env.example .env

# 3. Start all services
docker-compose up --build

# 4. Seed the database with demo data
docker-compose exec backend npm run seed
```

The application will be available at:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000/api/v1

### Option B — Manual Setup

```bash
# Clone
git clone https://github.com/dev-kithsara/AI-Powered-Incident-Management-Dashboard.git
cd AI-Powered-Incident-Management-Dashboard

# Backend
cd backend
npm install
cp ../.env.example .env      # Configure DATABASE_URL
npx prisma db push
npm run seed
npm run dev                  # Runs at http://localhost:8000

# Frontend (new terminal)
cd frontend
npm install
npm run dev                  # Runs at http://localhost:3000
```

---

## 🔐 Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Database
DATABASE_URL=postgresql://USER:PASSWORD@127.0.0.1:5432/kairos_hims

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# AI Service (Phase 2)
AI_SERVICE_URL=http://localhost:8001
AI_API_KEY=internal_ai_key

# Application
NODE_ENV=development
PORT=8000
```

---

## 🧪 Demo Credentials

After running `npm run seed`, use these accounts to test:

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@hms.com` | `Admin@123` |
| Manager (ICU) | `manager.icu@hms.com` | `Admin@123` |
| Manager (Emergency) | `manager.ed@hms.com` | `Admin@123` |
| Investigator | `investigator@hms.com` | `Admin@123` |
| Action Owner | `action.owner@hms.com` | `Admin@123` |
| Staff | `staff@hms.com` | `Admin@123` |

---

## 📡 API Documentation

Base URL: `http://localhost:8000/api/v1`

All endpoints (except auth) require: `Authorization: Bearer <token>`

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/login` | Login with email & password |
| `POST` | `/auth/register` | Register new user |
| `GET` | `/auth/me` | Get current user profile |

### Incidents (Key Endpoints)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/incidents` | List incidents (role-scoped) |
| `POST` | `/incidents` | Create new incident |
| `GET` | `/incidents/:id` | Get incident details |
| `POST` | `/incidents/:id/accept` | Accept incident (Manager) |
| `POST` | `/incidents/:id/reject` | Reject with comment (Manager) |
| `POST` | `/incidents/:id/assign-investigator` | Assign investigator (Manager) |
| `POST` | `/incidents/:id/assign-action-owner` | Assign action owner (Manager) |
| `POST` | `/incidents/:id/review` | Submit review (Manager) |
| `POST` | `/incidents/:id/close` | Close incident (Manager) |
| `GET` | `/incidents/:id/timeline` | Full lifecycle timeline |

---

## 🗄️ Database Schema

The system uses **12 core models:**

```
User ─────────────────────── Incident
                                 │
             ┌───────────────────┼────────────────┐
             │                   │                │
   IncidentAction  IncidentInvestigation  IncidentRootCause
   IncidentControl
   IncidentReview
   IncidentClosure
   AiEmbedding (vector 384-dim)
   AuditLog
   ModelMetrics
   ChatMessage
```

---

## 👨‍💻 Team

| Name | Role | Responsibilities |
|------|------|-----------------|
| **Kithsara** | Tech Lead / Main Developer | Backend Architecture, Manager Workflow, Analytics, DevOps |
| **Kasun** | Fullstack Developer | Staff Submission, Incident List, Action Management, User Admin |
| **Chandupa** | Fullstack Developer / AI Lead | Investigation Tools, Review & Closure, Chat, AI/ML (Phase 2) |

---

## 📈 Project Status

### Phase 1 (Current Semester) — Core Platform
- [x] Authentication & JWT Security
- [x] Hospital Domain & 5-Role RBAC
- [x] Incident Submission (Staff)
- [ ] Manager Dashboard & Approval Workflow
- [ ] Investigator RCA Tool
- [ ] Action Owner Task Management
- [ ] Review & Closure Workflow
- [ ] Analytics Dashboard
- [ ] Lessons Learned Library
- [ ] Notifications System
- [ ] Docker & CI/CD Deployment

### Phase 2 (Next Semester) — AI/ML Enhancement (Chandupa leads)
- [ ] AI Incident Clustering (K-Means + UMAP)
- [ ] Predictive Risk Scoring
- [ ] Similar Incident Detection
- [ ] AI-Recommended Lessons Learned

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">

**KAIROS HIMS** — Built with ❤️ for safer hospitals.

*3rd Year University Project — Department of Software Engineering*

</div>
