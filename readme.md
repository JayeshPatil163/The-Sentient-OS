# The Sentient OS | AI-Powered CPU Scheduling Simulator | ADRR AI-Powered Scheduling algorithm
A full-stack, AI-enhanced simulation platform designed to visualize and compare CPU scheduling algorithms. This project features a custom-built ADRR (AI-Powered) algorithm alongside traditional models like Round Robin and Shortest Job First. It uses ADRR for optimal scheduling and allows user to simulate scheduling using different scheduling algorithms, and compare them.

---

# Features

- **ADRR(Adaptive Dynamic Round Robin):** Utilizes a trained machine learning model to predict process burst times for more efficient execution. Then finds optimal dynamic time quantum for round robin scheduling.

- **Real-Time Gantt Charts:** Dynamic, sequential visualization of process execution timelines.

- **Comparison Engine:** Compare Average Waiting Time and Turnaround Time across multiple algorithms simultaneously.

- **Clean, Minimalist UI:** A modern interface inspired by high-end design aesthetics for better readability and user experience.

# Technology Stack
## Frontend
- **React (Vite):** For a fast, modern single-page application.

- **Tailwind CSS & Shadcn UI:** For a polished, responsive interface.

- **Chart.js:** powers the Gantt chart visualizations.

- **Framer Motion:** Smooth animations and transitions.

## Backend
- **FastAPI:** A high-performance Python framework for handling simulation requests.

- **Scikit-Learn:** Used for the predictive burst-time engine.

- **Docker:** Containerized deployment for environment consistency.

# Project Structure (Monorepo)
```
The Sentient OS/
├── Frontend/             # React + Vite application
├── Backend/              # FastAPI + Simulation Core
│   ├── api/              # API routes and CORS config
│   ├── simulation_core/  # RR, SJF, and ADRR logic
│   └── predictive_engine/# ML model and prediction scripts
└── .gitignore            # Monorepo git configuration
```

# Local Setup
## Backend
**Navigate to the folder:**
```
cd Backend.
```

**Create and activate a virtual environment:**
```
python -m venv venv && source venv/bin/activate.
```

**Install dependencies:**
```
pip install -r requirements.txt.
```

**Start the server:**
```
uvicorn api.main:app --reload --port 8000.
```

## Frontend
**Navigate to the folder:**
```
cd Frontend.
```

**Install dependencies:**
```
npm install.
```

**Create a .env.local file:**
```
VITE_API_URL=http://localhost:8000.
```

**Run development mode:**
```
npm run dev.
```

# Deployment
## Backend: Deployed on Google Cloud Run using a containerized Docker image.\
[Backend](https://sentientos-backend-79744057263.us-central1.run.app)\

## Frontend: Hosted on Vercel with automatic GitHub deployments.
[Backend](https://thesentientos.vercel.app/)\

# Screenshots

### Scheduling simulation dashboard:

<img width="460" height="825" alt="Screenshot 2026-02-07 at 12 53 12 AM" src="https://github.com/user-attachments/assets/07b05c39-f37b-429b-ada6-3d95fbd8d844" />


### Backend API:

<img width="1710" height="1073" alt="Screenshot 2026-02-05 at 7 42 47 PM" src="https://github.com/user-attachments/assets/7db39211-ea32-4ec1-9f84-e2d37d5dd734" />
<img width="1710" height="1074" alt="Screenshot 2026-02-05 at 7 42 56 PM" src="https://github.com/user-attachments/assets/d8276aa6-430e-4836-ab08-344faa257a74" />
<img width="1710" height="1071" alt="Screenshot 2026-02-05 at 7 43 04 PM" src="https://github.com/user-attachments/assets/3f2efae7-c018-4c8d-813e-56a41b561f45" />


Jayesh Patil