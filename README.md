<div align="center">

# 🏥 KAIROS HIMS

### Hospital Incident Management System

**A production-grade, full-stack platform for real-time hospital safety incident tracking, investigation, and resolution.**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io/)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#️-tech-stack)
- [Architecture](#-architecture)
- [Quick Start](#-quick-start)
  - [Option A: Docker (Recommended)](#option-a-docker-recommended-)
  - [Option B: Local Development](#option-b-local-development)
- [Demo Credentials](#-demo-credentials)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Database Schema](#️-database-schema)
- [Project Roadmap](#-project-roadmap)

---

## 🔍 Overview

KAIROS HIMS is a comprehensive **Hospital Incident Management System** built as an enterprise-grade university project. It enables healthcare organizations to:

- 📝 **Report** safety incidents with evidence attachments
- 🔍 **Investigate** root causes through a structured workflow
- ✅ **Resolve** incidents with corrective actions and closure tracking
- 📊 **Analyze** incident trends via an executive analytics dashboard

The system enforces a strict **role-based access control (RBAC)** model across four distinct user roles, each with a dedicated workspace and permissions.

---

## ✨ Features

| Feature                   | Status     | Description                                      |
| ------------------------- | ---------- | ------------------------------------------------ |
| Staff Incident Submission | ✅ Live    | Form with file uploads, Zod validation, JWT auth |
| Manager Approval Workflow | ✅ Live    | Accept / Reject / Assign / Close pipeline        |
| Investigator Workspace    | ✅ Live    | Root Cause Analysis (RCA) submission             |
| Action Owner Workspace    | ✅ Live    | Corrective action tracking                       |
| Analytics Dashboard       | ✅ Live    | Severity breakdown, status distribution charts   |
| Docker Compose Deployment | ✅ Live    | One-command full-stack deployment                |
| AI Incident Analytics     | 🔄 Planned | Severity prediction & vector similarity search   |

---

## 🛠️ Tech Stack

### Frontend

| Technology           | Version | Purpose                            |
| -------------------- | ------- | ---------------------------------- |
| React                | 19      | UI framework                       |
| TypeScript           | 5.4     | Type safety                        |
| Vite                 | 8       | Build tool (with Rolldown bundler) |
| Tailwind CSS         | 3.4     | Utility-first styling              |
| TanStack React Query | v5      | Server state management & caching  |
| React Router DOM     | v7      | Client-side routing                |
| Recharts             | 2.x     | Analytics charts & graphs          |
| Lucide React         | latest  | Icon library                       |

### Backend

| Technology      | Version | Purpose                        |
| --------------- | ------- | ------------------------------ |
| Node.js         | 20+     | JavaScript runtime             |
| Express.js      | 4.19    | HTTP framework                 |
| TypeScript      | 5.7     | Type safety                    |
| Prisma ORM      | 5.22    | Database access & migrations   |
| PostgreSQL      | 16      | Primary relational database    |
| Multer          | 1.4     | Multipart file upload handling |
| Zod             | 3.24    | Runtime schema validation      |
| JSON Web Tokens | latest  | Stateless authentication       |
| bcryptjs        | latest  | Password hashing               |

### Infrastructure

| Technology              | Purpose                      |
| ----------------------- | ---------------------------- |
| Docker + Docker Compose | Container orchestration      |
| NGINX (Alpine)          | Frontend static file serving |
| node:20-alpine          | Backend container base image |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          PRESENTATION LAYER                             │
│                    React 19 + TypeScript + Vite 8                       │
│         Dashboard │ Incidents │ Analytics Hub │ Lessons Library         │
│              (TanStack React Query for server state)                    │
└────────────────────────────┬────────────────────────────────────────────┘
                             │  REST API (JSON over HTTP)
                             │  http://localhost:5000/api/v1
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           API LAYER (Express.js)                        │
│                     Route → Middleware → Controller                     │
│              JWT Auth Guard │ Zod Validation │ catchAsync               │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         SERVICE + REPOSITORY LAYER                      │
│               Business Logic │ Prisma ORM │ Repository Pattern          │
└────────────────────────────┬────────────────────────────────────────────┘
                             │  Prisma Client Queries
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            DATABASE LAYER                               │
│                        PostgreSQL 16 Database                           │
│          User │ Department │ Incident │ IncidentAttachment              │
└─────────────────────────────────────────────────────────────────────────┘
```

### Role-Based Workflow

```
[Staff] → Submit Incident
              ↓
[Manager] → Accept / Reject
              ↓ (if accepted)
[Manager] → Assign Investigator
              ↓
[Investigator] → Submit Root Cause Analysis
              ↓
[Manager] → Assign Action Owner
              ↓
[Action Owner] → Submit Corrective Action
              ↓
[Manager] → Review → Close ✅
```

---

## 🚀 Quick Start

### Prerequisites

- **Docker Desktop** v4.x or higher _(for Docker option)_
- **Node.js** v20.0 or higher _(for local option)_
- **npm** v10.0 or higher _(for local option)_

---

### Option A: Docker (Recommended) 🐳

The fastest way to get the full stack running with a single command.

**Step 1 — Build the frontend locally** _(one-time, required before Docker)_

```bash
cd frontend
npm install
npm run build
cd ..
```

> **Why?** Vite 8 uses `rolldown` (a Rust-based bundler) with platform-specific native binaries. Building locally avoids cross-platform binary issues inside Docker.

**Step 2 — Start all services**

```bash
docker-compose up -d --build
```

**Step 3 — Run database migrations**

```bash
docker exec kairos_backend npx prisma migrate deploy
docker exec kairos_backend npx prisma db seed
```

**Access the application:**

| Service        | URL                          |
| -------------- | ---------------------------- |
| 🌐 Frontend    | http://localhost             |
| ⚙️ Backend API | http://localhost:5000/api/v1 |
| 🐘 PostgreSQL  | localhost:5432               |

**Useful Docker commands:**

```bash
# View running containers
docker ps

# View backend logs
docker logs kairos_backend -f

# Stop all containers
docker-compose down

# Rebuild after code changes (frontend must be rebuilt first)
cd frontend && npm run build && cd ..
docker-compose up -d --build
```

---

### Option B: Local Development

**Step 1 — Backend Setup**

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Create .env file (see Environment Variables section)
# Update DATABASE_URL with your local PostgreSQL credentials

# Run database migrations
npx prisma migrate deploy

# Seed demo data
npx prisma db seed

# Start backend dev server (Port 5000)
npm run dev
```

**Step 2 — Frontend Setup**

```bash
# Open a new terminal
cd frontend

# Install dependencies
npm install

# Start Vite dev server (Port 5173)
npm run dev
```

**Application URLs (Local):**

| Page                | URL                                   |
| ------------------- | ------------------------------------- |
| Manager Dashboard   | http://localhost:5173/dashboard       |
| Incident Submission | http://localhost:5173/submit-incident |
| Analytics Hub       | http://localhost:5173/analytics       |

---

## 🧪 Demo Credentials

Use these after running `npx prisma db seed`:

| Role                   | Email                       | Password      | Access                                              |
| ---------------------- | --------------------------- | ------------- | --------------------------------------------------- |
| **Department Manager** | `manager@hospital.com`      | `password123` | Dashboard, approval workflow, assignment & closure  |
| **Frontline Staff**    | `staff@hospital.com`        | `password123` | Submit incident reports with evidence attachments   |
| **Investigator**       | `investigator@hospital.com` | `password123` | Root Cause Analysis (RCA) & investigation workspace |
| **Action Owner**       | `actionowner@hospital.com`  | `password123` | Corrective action implementation & status updates   |

---

## 🔐 Environment Variables

Create a `.env` file inside the `backend/` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Connection (PostgreSQL)
DATABASE_URL="postgresql://postgres:rootpassword@localhost:5432/kairos_hims?schema=public"

# JWT Authentication
JWT_SECRET=kairos_super_secret_key_2026
JWT_EXPIRES_IN=7d

# File Upload
UPLOAD_DIR=uploads

# AI Service Gateway (Phase 2)
AI_SERVICE_URL=http://localhost:8001
AI_API_KEY=internal_ai_key
```

> ⚠️ **Never commit your `.env` file.** It is already listed in `.gitignore`.

---

## 📡 API Reference

**Base URL:** `http://localhost:5000/api/v1`

All protected endpoints require: `Authorization: Bearer <JWT_TOKEN>`

### Authentication

| Method | Route            | Description                 | Auth Required |
| ------ | ---------------- | --------------------------- | ------------- |
| `POST` | `/auth/login`    | Login and receive JWT token | ❌            |
| `POST` | `/auth/register` | Register a new user         | ❌            |

### Incidents

| Method  | Route                                | Description                    | Auth Required   |
| ------- | ------------------------------------ | ------------------------------ | --------------- |
| `POST`  | `/incidents`                         | Submit a new incident report   | ✅              |
| `GET`   | `/incidents/department/:id`          | Get incidents for a department | ✅              |
| `GET`   | `/incidents/:id`                     | Get a single incident by ID    | ✅              |
| `PATCH` | `/incidents/:id/accept`              | Accept an OPEN incident        | ✅ Manager      |
| `PATCH` | `/incidents/:id/reject`              | Reject with reason             | ✅ Manager      |
| `PATCH` | `/incidents/:id/assign-investigator` | Assign investigator            | ✅ Manager      |
| `PATCH` | `/incidents/:id/assign-action-owner` | Assign action owner            | ✅ Manager      |
| `PATCH` | `/incidents/:id/review`              | Mark as UNDER_REVIEW           | ✅ Manager      |
| `PATCH` | `/incidents/:id/close`               | Close an incident              | ✅ Manager      |
| `GET`   | `/incidents/assigned`                | Get investigator's incidents   | ✅ Investigator |
| `PATCH` | `/incidents/:id/root-cause`          | Submit RCA findings            | ✅ Investigator |
| `PATCH` | `/incidents/:id/corrective-action`   | Submit corrective action       | ✅ Action Owner |

---

## 🗄️ Database Schema

### Core Models

```prisma
enum IncidentStatus {
  OPEN | ACCEPTED | REJECTED | INVESTIGATING |
  PENDING_ACTION | UNDER_REVIEW | CLOSED
}

enum Severity { LOW | MEDIUM | HIGH | CRITICAL }

model User {
  id         Int     @id @default(autoincrement())
  name       String
  email      String  @unique
  password   String
  role       Role    @default(STAFF)
  department Department @relation(...)
}

model Incident {
  id              Int            @id @default(autoincrement())
  title           String
  description     String
  severity        Severity
  category        String
  location        String
  status          IncidentStatus @default(OPEN)
  rejectionReason String?
  rootCause       String?
  correctiveAction String?
  reporterId      Int
  investigatorId  Int?
  actionOwnerId   Int?
  departmentId    Int
  attachments     IncidentAttachment[]
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
}
```

---

## 📈 Project Roadmap

- [x] **Feature 1 — Staff Incident Submission**: Incident creation form with file upload support & Zod validation
- [x] **Feature 2 — Manager Approval Workflow**: Accept/Reject, Investigator assignment, Action Owner assignment, Review & Close
- [x] **Feature 3 — Department Scoping**: Department-scoped querying and clean repository pattern
- [x] **Feature 4 — Investigator Workspace**: Root Cause Analysis (RCA) submission and investigation tracking
- [x] **Feature 5 — Action Owner Workspace**: Corrective action implementation and progress updates
- [x] **Feature 6 — Analytics Dashboard**: Severity breakdown, status distribution charts (Recharts)
- [x] **Docker Compose Deployment**: Full containerized deployment (Frontend + Backend + PostgreSQL)
- [x] **JWT Authentication & RBAC**: Secure login, role guards, and middleware protection
- [ ] **Feature 7 — AI Incident Analytics**: Severity prediction & vector similarity search (Phase 2)
- [ ] **Feature 8 — Lessons Library**: Knowledge base from past incidents

---

## 👥 Team

| Name | Role |
| ---- | ---- |

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">

**KAIROS HIMS** — _Empowering safer hospital care through real-time incident intelligence._

Made with ❤️ for better healthcare safety

</div>
