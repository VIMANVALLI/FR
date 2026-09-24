# Face Recognition Attendance System

A web-based **Face Recognition Attendance System** built with
**React.js**, **FastAPI**, **OpenCV**, **MediaPipe**, **LBPH Face
Recognition**, and **SQLite**.

The system allows students to be registered, face images to be captured
and trained, students to be recognized through the browser camera,
attendance to be marked automatically once per day, and daily/monthly
attendance records to be viewed.

## Features

-   Student registration with student, mother, father, and father phone
    details.
-   Browser camera face capture.
-   Automatic face detection and face-image processing.
-   LBPH face recognition model training.
-   Live face recognition through the browser camera.
-   Automatic attendance marking.
-   Duplicate attendance prevention for the same student on the same
    day.
-   Daily attendance records.
-   Monthly attendance summary.
-   React frontend with FastAPI backend.
-   SQLite database.

## Technology Stack

### Frontend

-   React.js
-   JavaScript
-   CSS
-   Axios
-   Browser MediaDevices API

### Backend

-   Python
-   FastAPI
-   Uvicorn
-   Python Multipart

### Face Recognition

-   OpenCV
-   OpenCV LBPH Face Recognizer
-   MediaPipe Face Detection
-   NumPy

### Database

-   SQLite

## Project Structure

``` text
Face_Reco/
│
├── backend/
│   ├── dataset/
│   │   └── Student Name/
│   │       ├── img_1.jpg
│   │       ├── img_2.jpg
│   │       └── ...
│   │
│   ├── models/
│   │   ├── trainer.yml
│   │   └── labels.json
│   │
│   ├── database.py
│   ├── face.py
│   ├── main.py
│   ├── train_model.py
│   ├── requirements.txt
│   ├── attendance.db
│   └── attendance.csv
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Menu.jsx
│   │   │   ├── RegisterStudent.jsx
│   │   │   ├── TakeAttendance.jsx
│   │   │   └── Attendance.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── index.css
│   │   └── index.js
│   ├── package.json
│   └── index.html
│
└── README.md
```

## System Flow

``` text
Student Registration
        ↓
Capture Face Images
        ↓
MediaPipe Face Detection
        ↓
Process Face Images
        ↓
Train LBPH Model
        ↓
trainer.yml + labels.json
        ↓
Open Attendance Camera
        ↓
Capture Camera Frame
        ↓
MediaPipe Face Detection
        ↓
LBPH Face Recognition
        ↓
Student Recognized
        ↓
Mark Attendance in SQLite
        ↓
View Daily / Monthly Attendance
```

## Backend Setup

Open a terminal:

``` bash
cd backend
```

Create a virtual environment:

``` bash
python -m venv venv
```

### Windows

``` bash
venv\Scripts\activate
```

### macOS/Linux

``` bash
source venv/bin/activate
```

Install dependencies:

``` bash
pip install -r requirements.txt
```

Recommended `requirements.txt`:

``` txt
fastapi
uvicorn[standard]
python-multipart
opencv-contrib-python==4.8.1.78
mediapipe==0.10.21
numpy==1.26.4
pandas==2.1.1
```

## Start Backend

``` bash
uvicorn main:app --reload
```

Backend:

``` text
http://127.0.0.1:8000
```

FastAPI documentation:

``` text
http://127.0.0.1:8000/docs
```

## Frontend Setup

Open another terminal:

``` bash
cd frontend
npm install
```

Install Axios if it is not already installed:

``` bash
npm install axios
```

Start React:

``` bash
npm start
```

Frontend:

``` text
http://localhost:3000
```

## API Endpoints

### Health Check

``` http
GET /health
```

### Register Student

``` http
POST /students
```

Form fields:

``` text
student_name
mother_name
father_name
father_phone
```

### Capture Face Images

``` http
POST /face/capture
```

Form fields:

``` text
student_name
images
```

### Train Model

``` http
POST /train
```

### Recognize Face

``` http
POST /recognize
```

Form field:

``` text
image
```

Example response:

``` json
{
  "success": true,
  "recognized": true,
  "student_name": "Viman Valli",
  "confidence": 87.5,
  "attendance_marked": true,
  "message": "Attendance marked successfully."
}
```

### Daily Attendance

``` http
GET /attendance/daily?date_value=YYYY-MM-DD
```

Example:

``` text
/attendance/daily?date_value=2026-09-24
```

### Monthly Attendance

``` http
GET /attendance/monthly?month=YYYY-MM
```

Example:

``` text
/attendance/monthly?month=2026-09
```

## Face Recognition

MediaPipe detects the face from the camera frame.

The detected face is converted to grayscale and resized to:

``` text
200 × 200
```

The processed face is then passed to the OpenCV LBPH recognizer.

The trained model is stored in:

``` text
backend/models/trainer.yml
```

Student label mappings are stored in:

``` text
backend/models/labels.json
```

## Attendance Database

The main database is:

``` text
backend/attendance.db
```

Attendance is recorded with:

-   Student name
-   Attendance date
-   Attendance time
-   Status

A student can only have one attendance record for a particular date.

## Using the Application

### 1. Register Student

1.  Open the application.
2.  Select **Register Student**.
3.  Enter the student's details.
4.  Open the camera.
5.  Capture the required face images.
6.  Complete face capture.
7.  Train the recognition model.

### 2. Take Attendance

1.  Open **Take Attendance**.
2.  Click **Take Attendance**.
3.  Allow camera permission.
4.  Look at the camera.
5.  The application continuously checks the face.
6.  After recognition, the student's name and confidence are displayed.
7.  Attendance is automatically recorded.

### 3. View Attendance

Open **Attendance**.

For daily attendance, select a date.

For monthly attendance, select a month.

The attendance page displays the records returned by the FastAPI
backend.

## Troubleshooting

### Backend Not Connecting

Open:

``` text
http://127.0.0.1:8000/health
```

Make sure the backend is running.

### Axios Error

Run:

``` bash
cd frontend
npm install axios
npm start
```

### Camera Not Opening

Check:

-   Browser camera permission.
-   Camera availability.
-   Another application is not using the camera.
-   Use `http://localhost:3000` during local development.

### Face Not Recognized

Check:

1.  The student is registered.
2.  Face images exist in the student's dataset folder.
3.  The model has been trained.
4.  `models/trainer.yml` exists.
5.  `models/labels.json` exists.
6.  The student's face is clearly visible.
7.  Lighting is sufficient.
8.  The student is looking toward the camera.

### Model Not Loaded

Open:

``` text
http://127.0.0.1:8000/health
```

Check:

``` json
"model_loaded": true
```

If the model is not loaded, train the model again.

### Attendance Not Appearing

Check:

-   Face recognition returned `recognized: true`.
-   Attendance was marked.
-   The selected date matches the attendance date.
-   The FastAPI backend is running.

## Privacy and Security

This project is intended mainly for local development and educational
use.

Before public deployment, consider adding:

-   Authentication and authorization.
-   HTTPS.
-   Secure database configuration.
-   Production CORS configuration.
-   Rate limiting.
-   Access control.
-   Secure biometric-data storage.
-   Appropriate consent and privacy procedures.

Face images are biometric information and should be collected, stored,
and processed responsibly.

## Future Improvements

Possible improvements:

-   Admin login.
-   Teacher login.
-   Student login.
-   Parent portal.
-   Student profile photos.
-   Improved face-recognition models.
-   Multiple-face recognition.
-   PDF attendance reports.
-   Excel export.
-   Email notifications.
-   SMS notifications.
-   Attendance calendar.
-   Student search and filtering.
-   Cloud database.
-   Production deployment.
-   Mobile application.
-   Improved recognition under different lighting conditions.

## Project Status

**Status: Completed working local prototype**

Current modules:

-   Student registration
-   Face image capture
-   Face dataset creation
-   Model training
-   Live face recognition
-   Automatic attendance marking
-   Duplicate attendance prevention
-   Daily attendance
-   Monthly attendance
-   React frontend
-   FastAPI backend
-   SQLite database

## Author

**Viman Valli**

B.Tech -- Computer Science Engineering

Sri Venkateswara Institute of Science and Technology, Kadapa

JNTUA

## License

This project is intended for educational and project-development
purposes.
