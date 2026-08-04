# SAM — Software Asset Management
Architech internal tool for tracking software licences, renewals, and spend.

## Stack
- **Frontend**: React 18 + Vite + React Query + Recharts
- **Backend**: FastAPI (Python 3.12) + SQLAlchemy ORM
- **Database**: PostgreSQL 16
- **Auth**: JWT (access + refresh tokens), bcrypt passwords
- **Infra**: Docker + Docker Compose; deploy to AWS ECS / Azure Container Apps

---

## Local development (fastest)

```bash
# 1. Clone and enter the repo
git clone <your-repo> && cd sam-app

# 2. Copy env files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 3. Generate a real secret key and put it in backend/.env
openssl rand -hex 32

# 4. Start everything
docker compose up --build
```

- Frontend: http://localhost:3000
- API:      http://localhost:8000
- API docs: http://localhost:8000/docs   ← Swagger UI (FastAPI auto-generates)

Register the first user through the UI — the first account gets admin role automatically (you can change this in `backend/app/routers/auth.py`).

---

## Project structure

```
sam-app/
├── backend/
│   ├── app/
│   │   ├── core/        # config, security, deps
│   │   ├── db/          # SQLAlchemy session
│   │   ├── models/      # ORM models (User, Software, RenewalHistory)
│   │   ├── routers/     # auth, software, users
│   │   ├── schemas/     # Pydantic request/response models
│   │   └── main.py      # FastAPI app + CORS + router mount
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── context/     # AuthContext (JWT storage + refresh)
│   │   ├── services/    # api.js (axios + auto-refresh interceptor)
│   │   ├── pages/       # Dashboard, SoftwareList, Renewals, Spend
│   │   ├── components/  # Layout, sidebar nav
│   │   └── App.jsx      # Router + providers
│   ├── Dockerfile       # Multi-stage: build → nginx
│   └── nginx.conf       # SPA routing + /api proxy
└── docker-compose.yml
```

---

## Deploying to AWS (ECS + RDS)

1. **Database**: Create an RDS PostgreSQL 16 instance. Note the connection string.
2. **Secrets**: Store `SECRET_KEY` and `DATABASE_URL` in AWS Secrets Manager or Parameter Store.
3. **ECR**: Push both Docker images:
   ```bash
   aws ecr create-repository --repository-name sam-backend
   aws ecr create-repository --repository-name sam-frontend
   docker build -t sam-backend ./backend && docker push <ecr-uri>/sam-backend
   docker build -t sam-frontend ./frontend && docker push <ecr-uri>/sam-frontend
   ```
4. **ECS**: Create a Fargate service with two containers (backend + frontend). Set env vars from Secrets Manager. Point an ALB at port 3000 (frontend) and 8000 (backend).
5. **CORS**: Update `allow_origins` in `backend/app/main.py` to your production domain.
6. **Frontend env**: Set `VITE_API_URL` to your ALB URL before building the frontend image.

## Deploying to Azure (Container Apps)

1. Create Azure PostgreSQL Flexible Server.
2. Push images to Azure Container Registry.
3. Create two Container Apps (backend, frontend) in the same environment.
4. Set environment variables via Azure secrets.
5. Use Azure Front Door or Application Gateway to route traffic.

---

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/v1/auth/register | Create account |
| POST | /api/v1/auth/login | Login → tokens |
| POST | /api/v1/auth/refresh | Refresh access token |
| GET  | /api/v1/users/me | Current user |
| GET  | /api/v1/software/dashboard | Stats for dashboard |
| GET  | /api/v1/software/ | List all software (filter: category, status, search) |
| POST | /api/v1/software/ | Add software |
| GET  | /api/v1/software/{id} | Get one |
| PATCH | /api/v1/software/{id} | Update |
| DELETE | /api/v1/software/{id} | Delete |
| POST | /api/v1/software/{id}/renew | Log a renewal action |
| GET  | /api/v1/software/renewals/upcoming | Renewals within N days |

Full interactive docs at `/docs` when the backend is running.

---

## Adding features

- **Email alerts**: Add a background task (FastAPI `BackgroundTasks` or APScheduler) that queries software expiring in 30 days and sends via SendGrid / SES.
- **File attachments**: Add an S3 presigned-URL endpoint and store the URL in `contract_url`.
- **SSO**: Swap the login page for an OAuth2 flow (FastAPI supports it natively).
- **Role-based UI**: The `user.role` field is already in the JWT payload — guard routes in React by checking it.
