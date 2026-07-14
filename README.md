# Smart Attendance System Using Face Recognition

A real-time, AI-powered attendance management system that automatically detects and recognizes faces to mark student attendance — eliminating manual roll calls and proxy attendance.

## 📌 Features

- Real-time face capture via webcam in "Burst Mode" for higher accuracy
- AI-based face recognition using DeepFace (VGG-Face / GhostFaceNet models)
- Smart Scheduling — checks time/day before marking attendance
- Automatic attendance logging with student profiles
- Face embeddings stored securely in the database
- Dashboard to view attendance records

## 🛠️ Tech Stack

| Layer | Technology | Role |
|---|---|---|
| **Frontend** | React.js (Vite) + Tailwind CSS | Captures live camera feed & displays dashboard |
| **Backend** | Node.js + Express.js | The "brain" of the system — handles smart scheduling & routing |
| **AI Service** | Python + DeepFace + OpenCV | Dedicated image processing; matches faces using  GhostFaceNet models |
| **Database** | MongoDB (NoSQL) | Stores student profiles and face embeddings |

## 🏗️ System Architecture

```
Frontend (React + Tailwind)
        │  sends images in Burst Mode
        ▼
Backend (Node.js + Express.js)
        │
        ├──► AI Service (Python + DeepFace + OpenCV)
        │        - Matches faces via VGG-Face / GhostFaceNet
        │
        └──► Database (MongoDB)
                 - Stores profiles & face embeddings
```

## 📂 Project Structure

```
Smart-Attendance-System/
│
├── frontend/                      # React + Vite + Tailwind frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── App.jsx
│   └── package.json
│
├── backend/                      # Node.js + Express backend
│   ├── routes/
│   ├── controllers/
│   ├── models/                  # MongoDB schemas (Student, Attendance)
│   └── server.js
│
├── python-face-api/                  # Python + DeepFace + OpenCV
│   ├── app.py             # Face matching logic (VGG-Face / GhostFaceNet)
│   ├               # Stored face embeddings
│   └── requirements.txt
│
├── .env.example
└── README.md
```

## ⚙️ Installation

### 1. Clone the repository
```bash
git clone https://github.com/your-username/smart-attendance-system.git
cd smart-attendance-system
```

### 2. Frontend setup
```bash
cd frontend
npm install
npm run dev
```

### 3. Backend setup
```bash
cd backend
npm install
npm start
```

### 4. AI Service setup
```bash
cd python-face-api
pip install -r requirements.txt
python app.py
```

### 5. Database
- Ensure MongoDB is running locally or set your connection string (`MONGO_URI`) in `.env`

## ▶️ Usage

1. Start MongoDB, then run the AI service, backend, and frontend (in that order).
2. Register students with their face data through the frontend.
3. The frontend captures live frames in burst mode and sends them to the backend.
4. The backend forwards frames to the AI service for recognition.
5. On a match, attendance is marked automatically (subject to smart scheduling rules) and stored in MongoDB.
6. View attendance records on the dashboard.

## 🔑 Environment Variables (`.env`)

```
MONGO_URI=your_mongodb_connection_string
PORT=5000
AI_SERVICE_URL=http://localhost:8000
```

## 🚀 Future Improvements

- Mask detection compatibility
- Cloud deployment (AWS/Render/Vercel)
- Mobile app support
- Multi-camera support for large classrooms
- Email/SMS notifications to absentees

