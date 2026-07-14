# 🎓 Smart Attendance System

<div align="center">

![React](https://img.shields.io/badge/Frontend-React.js-61DAFB?style=for-the-badge&logo=react)
![Node.js](https://img.shields.io/badge/Backend-Node.js-339933?style=for-the-badge&logo=node.js)
![Express.js](https://img.shields.io/badge/Framework-Express.js-black?style=for-the-badge&logo=express)
![Python](https://img.shields.io/badge/AI-Python-3776AB?style=for-the-badge&logo=python)
![OpenCV](https://img.shields.io/badge/OpenCV-Computer%20Vision-5C3EE8?style=for-the-badge&logo=opencv)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?style=for-the-badge&logo=mongodb)

### 📸 AI-Powered Smart Attendance System using Face Recognition

An intelligent attendance management system that automatically detects and recognizes students' faces to mark attendance accurately, securely, and efficiently.

</div>

---

# 📖 Overview

The **Smart Attendance System** is a modern web-based attendance management platform that uses **Artificial Intelligence** and **Face Recognition** to automate the attendance process.

The system captures live images from the camera, detects and recognizes registered students, verifies schedules, and automatically marks attendance in the database. It eliminates manual attendance, reduces proxy attendance, and provides teachers with an efficient and user-friendly attendance management solution.

---

# ✨ Features

- ✅ AI-based Face Recognition Attendance
- ✅ Live Camera Detection
- ✅ Student Registration & Profile Management
- ✅ Teacher Dashboard
- ✅ Student Dashboard
- ✅ Attendance Reports
- ✅ Manual Attendance Entry
- ✅ Subject Management
- ✅ Class Scheduling
- ✅ Authentication & Secure Login
- ✅ Real-time Attendance Processing
- ✅ MongoDB Database Storage
- ✅ Modern Responsive User Interface

---

# 🚀 Technologies Used

## 🎨 Frontend

- React.js (Vite)
- Tailwind CSS
- JavaScript
- HTML5
- CSS3

---

## ⚙️ Backend

- Node.js
- Express.js
- REST API

---

## 🤖 AI Face Recognition Service

- Python
- DeepFace
- OpenCV
- GhostFaceNet
- VGG-Face

---

## 🗄 Database

- MongoDB

---

## 🛠 Development Tools

- VS Code
- Git
- GitHub
- npm

---

# 🏗 System Architecture

```text
                    User
                      │
                      ▼
        React.js + Tailwind CSS (Frontend)
                      │
                      ▼
          Node.js + Express.js Backend
              (Business Logic & APIs)
              │                  │
              │                  ▼
              │            MongoDB Database
              │      (Students & Attendance)
              │
              ▼
        Python Face Recognition API
         (DeepFace + OpenCV Models)
              │
              ▼
        Face Detection & Recognition
              │
              ▼
      Attendance Automatically Marked
```

---

# 💻 Tech Stack Overview

| Layer | Technology | Purpose |
|--------|------------|----------|
| Frontend | React.js (Vite) + Tailwind CSS | User Interface |
| Backend | Node.js + Express.js | Business Logic & APIs |
| AI Service | Python + DeepFace + OpenCV | Face Detection & Recognition |
| Database | MongoDB | Data Storage |
| Authentication | JWT | Secure Login |

---

# 📂 Project Structure

```text
Smart_Attendance_System/

├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   └── app.js
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── .env
│
├── python-face-api/
│   ├── faces/
│   ├── app.py
│   ├── requirements.txt
│   └── .env
│
├── ScreenShots/
│
└── README.md
```

---

# ⚙️ Installation

## Step 1: Clone the Repository

```bash
git clone https://github.com/Code-Tanmoy/Smart-Attendance-System.git
```

---

## Step 2: Navigate to the Project

```bash
cd Smart-Attendance-System
```

---

## Step 3: Install Backend Dependencies

```bash
cd backend
npm install
```

---

## Step 4: Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

---

## Step 5: Install Python Dependencies

```bash
cd ../python-face-api
pip install -r requirements.txt
```

---

## Step 6: Configure Environment Variables

Create the required `.env` files for:

- Backend
- Frontend
- Python Face API

Configure MongoDB connection strings, JWT secret, and API URLs.

---

## Step 7: Start the Backend Server

```bash
cd backend
npm start
```

---

## Step 8: Start the Frontend

```bash
cd frontend
npm run dev
```

---

## Step 9: Start the Python Face Recognition API

```bash
cd python-face-api
python app.py
```

---

## Step 10: Open the Application

Visit:

```
http://localhost:5173
```

The Smart Attendance System is now ready to use.


---

# 👨‍💻 User Manual

Follow these simple steps to use the Smart Attendance System.

## 🔐 Step 1: Login

- Open the application.
- Login using your credentials.
- After successful authentication, you will be redirected to the dashboard.

---

## 👨‍🎓 Step 2: Register Students

- Navigate to **Student Management**.
- Add student details.
- Capture or upload student face images.
- The system generates and stores face embeddings for future recognition.

---

## 👨‍🏫 Step 3: Manage Teachers & Subjects

- Add teacher information.
- Create subjects.
- Assign teachers to subjects.

---

## 📅 Step 4: Create Schedule

- Open the **Schedule Module**.
- Select class, teacher, subject and time.
- Save the schedule.

The backend verifies schedules before marking attendance.

---

## 📸 Step 5: Start Attendance

- Open the Attendance page.
- Allow camera permission.
- The system starts capturing live images.

---

## 🤖 Step 6: Face Recognition

The AI service:

- Detects faces using OpenCV.
- Extracts facial embeddings using DeepFace.
- Matches faces using GhostFaceNet / VGG-Face.
- Identifies registered students.

---

## ✅ Step 7: Attendance Marking

If the student is:

- Registered
- Recognized
- Scheduled for that class

The attendance is automatically recorded in MongoDB.

---

## 📊 Step 8: View Reports

Teachers can:

- View attendance history
- Search attendance
- Generate reports
- Monitor student attendance statistics

---

# 🔄 Attendance Workflow

```text
          Student
             │
             ▼
      Live Camera Feed
             │
             ▼
        React Frontend
             │
             ▼
     Node.js + Express API
             │
             ▼
     Python Face API
(OpenCV + DeepFace Recognition)
             │
             ▼
      Face Successfully Matched
             │
             ▼
    Schedule Verification
             │
             ▼
 MongoDB Attendance Database
             │
             ▼
 Attendance Successfully Marked
```

---

# 📷 Screenshots

## 🏠 Landing Page

```md
![Landing Page](ScreenShots/LandingPage.png)
```

---

## 🔐 Login Page

```md
![Login](ScreenShots/Login.png)
```

---

## 📊 Dashboard

```md
![Dashboard](ScreenShots/Dashboard.png)
```

---

## 👨‍🎓 Student Management

```md
![Students](ScreenShots/Students.png)
```

---

## 📸 Face Recognition

```md
![Face Recognition](ScreenShots/Recognition.png)
```

---

## 📅 Attendance

```md
![Attendance](ScreenShots/Attendance.png)
```

---

## 📈 Reports

```md
![Reports](ScreenShots/Reports.png)
```

> Replace the filenames above with your actual screenshot names.

---

# 🎯 Key Highlights

- AI-powered Attendance System
- Face Recognition using DeepFace
- OpenCV Image Processing
- Smart Attendance Scheduling
- Secure Authentication
- Automatic Attendance Logging
- Student & Teacher Management
- Responsive Dashboard
- MongoDB Data Storage
- Modern MERN Architecture

---

# 🚀 Future Enhancements

- 📱 Mobile Application
- ☁️ Cloud Deployment
- 📧 Email Notifications
- 📊 Advanced Analytics Dashboard
- 🌐 Multi-Campus Support
- 📍 GPS-Based Attendance
- 🔔 Real-time Notifications
- 📥 Excel & PDF Report Export
- 🌙 Dark Mode
- 🔐 Two-Factor Authentication
- 🎭 Anti-Spoofing Detection
- 😊 Emotion Detection
- 👥 Multi-Face Recognition
- 📹 CCTV Camera Integration

---

# 🤝 Contributing

Contributions are welcome!

If you have ideas for improvements:

1. Fork the repository
2. Create a new branch
3. Commit your changes
4. Push your branch
5. Open a Pull Request

---

# 📜 License

This project is intended for educational and research purposes.

---

# ⭐ Show Your Support

If you found this project useful, please consider giving it a **⭐ Star** on GitHub.

Your support motivates further development and improvements.

---

# ❤️ Thank You

Thank you for visiting this repository.

We hope this project demonstrates how Artificial Intelligence and Face Recognition can simplify attendance management while improving efficiency, security, and accuracy.

