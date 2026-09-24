import axios from "axios";

// =========================================================
// FASTAPI BACKEND
// =========================================================

const API_URL = "https://fr-cdc7.onrender.com";

const api = axios.create({
  baseURL: API_URL,
  timeout: 120000,
});


// =========================================================
// REGISTER STUDENT
// =========================================================

export const registerStudent = async (studentData) => {
  const formData = new FormData();

  formData.append("student_name", studentData.student_name);
  formData.append("mother_name", studentData.mother_name);
  formData.append("father_name", studentData.father_name);
  formData.append("father_phone", studentData.father_phone);

  const response = await api.post("/students", formData);

  return response.data;
};


// =========================================================
// UPLOAD FACE IMAGES
// =========================================================

export const uploadFaceImages = async (studentName, images) => {
  const formData = new FormData();

  formData.append("student_name", studentName);

  images.forEach((image, index) => {
    formData.append(
      "images",
      image,
      `face_${index + 1}.jpg`
    );
  });

  const response = await api.post(
    "/face/capture",
    formData
  );

  return response.data;
};


// =========================================================
// TRAIN MODEL
// =========================================================

export const trainModel = async () => {
  const response = await api.post("/train");

  return response.data;
};


// =========================================================
// RECOGNIZE FACE
// =========================================================

export const recognizeFace = async (image) => {
  const formData = new FormData();

  formData.append(
    "image",
    image,
    "face.jpg"
  );

  const response = await api.post(
    "/recognize",
    formData
  );

  return response.data;
};


// =========================================================
// DAILY ATTENDANCE
// =========================================================

export const getDailyAttendance = async (date) => {
  const response = await api.get(
    "/attendance/daily",
    {
      params: {
        date_value: date,
      },
    }
  );

  return response.data;
};


// =========================================================
// MONTHLY ATTENDANCE
// =========================================================

export const getMonthlyAttendance = async (month) => {
  const response = await api.get(
    "/attendance/monthly",
    {
      params: {
        month: month,
      },
    }
  );

  return response.data;
};


// =========================================================
// BACKEND HEALTH
// =========================================================

export const checkBackend = async () => {
  const response = await api.get("/health");

  return response.data;
};


// =========================================================
// DEFAULT API
// =========================================================

export default api;
