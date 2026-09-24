import json
from pathlib import Path

import cv2
import numpy as np

from fastapi import (
    FastAPI,
    UploadFile,
    File,
    Form,
    HTTPException
)
from fastapi.middleware.cors import CORSMiddleware

from database import (
    add_student,
    student_exists,
    mark_attendance,
    get_daily_attendance,
    get_monthly_attendance
)

from face import (
    recognize_face,
    prepare_training_face
)

from train_model import train_model


# =========================================================
# PATHS
# =========================================================

BASE_DIR = Path(__file__).resolve().parent

DATASET_DIR = BASE_DIR / "dataset"
MODELS_DIR = BASE_DIR / "models"

TRAINER_PATH = MODELS_DIR / "trainer.yml"
LABELS_PATH = MODELS_DIR / "labels.json"


# Create folders if they don't exist
DATASET_DIR.mkdir(
    parents=True,
    exist_ok=True
)

MODELS_DIR.mkdir(
    parents=True,
    exist_ok=True
)


# =========================================================
# FASTAPI
# =========================================================

app = FastAPI(
    title="Face Recognition Attendance System",
    description="Face Recognition Attendance System API",
    version="2.0.0"
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://fr-1-5z0y.onrender.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# GLOBAL MODEL
# =========================================================

recognizer = None
labels = {}


# =========================================================
# LOAD MODEL
# =========================================================

def load_model():
    """
    Load LBPH model and labels from models folder.
    """

    global recognizer
    global labels

    # -----------------------------------------------------
    # Check trainer
    # -----------------------------------------------------

    if not TRAINER_PATH.exists():

        recognizer = None
        labels = {}

        print("Trainer model not found.")

        return False

    # -----------------------------------------------------
    # Load model
    # -----------------------------------------------------

    try:

        recognizer = (
            cv2.face.LBPHFaceRecognizer_create()
        )

        recognizer.read(
            str(TRAINER_PATH)
        )

        # -------------------------------------------------
        # Load labels
        # -------------------------------------------------

        if LABELS_PATH.exists():

            with open(
                LABELS_PATH,
                "r",
                encoding="utf-8"
            ) as file:

                labels = json.load(file)

        else:

            labels = {}

        print(
            "Face recognition model loaded successfully."
        )

        print(
            "Students in model:",
            len(labels)
        )

        return True

    except Exception as error:

        print(
            "Model loading error:",
            error
        )

        recognizer = None
        labels = {}

        return False


# =========================================================
# STARTUP
# =========================================================

@app.on_event("startup")
def startup_event():

    print("=" * 60)

    print(
        "Face Recognition Attendance System"
    )

    print(
        "Backend starting..."
    )

    print(
        "Dataset:",
        DATASET_DIR
    )

    print(
        "Models:",
        MODELS_DIR
    )

    load_model()

    print(
        "Backend started successfully."
    )

    print("=" * 60)


# =========================================================
# HOME
# =========================================================

@app.get("/")
def home():

    return {
        "success": True,
        "message": "Face Recognition Attendance API",
        "status": "running"
    }


# =========================================================
# HEALTH CHECK
# =========================================================

@app.get("/health")
def health():

    return {
        "success": True,
        "status": "ok",
        "model_loaded": recognizer is not None,
        "trainer_exists": TRAINER_PATH.exists(),
        "labels_exists": LABELS_PATH.exists(),
        "dataset_exists": DATASET_DIR.exists()
    }


# =========================================================
# REGISTER STUDENT
# =========================================================

@app.post("/students")
async def register_student(

    student_name: str = Form(...),

    mother_name: str = Form(...),

    father_name: str = Form(...),

    father_phone: str = Form(...)
):

    # -----------------------------------------------------
    # Clean values
    # -----------------------------------------------------

    student_name = student_name.strip()

    mother_name = mother_name.strip()

    father_name = father_name.strip()

    father_phone = father_phone.strip()


    # -----------------------------------------------------
    # Validate student name
    # -----------------------------------------------------

    if not student_name:

        raise HTTPException(
            status_code=400,
            detail="Student name is required."
        )


    # -----------------------------------------------------
    # Validate mother name
    # -----------------------------------------------------

    if not mother_name:

        raise HTTPException(
            status_code=400,
            detail="Mother name is required."
        )


    # -----------------------------------------------------
    # Validate father name
    # -----------------------------------------------------

    if not father_name:

        raise HTTPException(
            status_code=400,
            detail="Father name is required."
        )


    # -----------------------------------------------------
    # Validate phone
    # -----------------------------------------------------

    if (
        not father_phone.isdigit()
        or len(father_phone) != 10
    ):

        raise HTTPException(
            status_code=400,
            detail="Father phone number must contain exactly 10 digits."
        )


    # -----------------------------------------------------
    # Check duplicate student
    # -----------------------------------------------------

    if student_exists(student_name):

        raise HTTPException(
            status_code=409,
            detail="Student already exists."
        )


    # -----------------------------------------------------
    # Create dataset folder
    # -----------------------------------------------------

    student_dir = DATASET_DIR / student_name

    if student_dir.exists():

        raise HTTPException(
            status_code=409,
            detail="Student dataset already exists."
        )


    try:

        student_dir.mkdir(
            parents=True,
            exist_ok=False
        )

    except Exception as error:

        print(
            "Dataset folder error:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail="Could not create student dataset."
        )


    # -----------------------------------------------------
    # Add student to SQLite database
    # -----------------------------------------------------

    student = add_student(
        student_name=student_name,
        mother_name=mother_name,
        father_name=father_name,
        father_phone=father_phone
    )


    if student is None:

        # Remove empty folder if DB insert failed
        try:

            student_dir.rmdir()

        except Exception:

            pass

        raise HTTPException(
            status_code=409,
            detail="Student already exists."
        )


    # -----------------------------------------------------
    # Response
    # -----------------------------------------------------

    return {

        "success": True,

        "message": "Student registered successfully.",

        "student": student

    }


# =========================================================
# CAPTURE FACE IMAGES
# =========================================================

@app.post("/face/capture")
async def capture_face_images(

    student_name: str = Form(...),

    images: list[UploadFile] = File(...)
):

    student_name = student_name.strip()


    # -----------------------------------------------------
    # Validate name
    # -----------------------------------------------------

    if not student_name:

        raise HTTPException(
            status_code=400,
            detail="Student name is required."
        )


    # -----------------------------------------------------
    # Check database
    # -----------------------------------------------------

    if not student_exists(student_name):

        raise HTTPException(
            status_code=404,
            detail="Student is not registered."
        )


    # -----------------------------------------------------
    # Student folder
    # -----------------------------------------------------

    student_dir = DATASET_DIR / student_name


    if not student_dir.exists():

        student_dir.mkdir(
            parents=True,
            exist_ok=True
        )


    # -----------------------------------------------------
    # Find next image number
    # -----------------------------------------------------

    existing_numbers = []

    for file in student_dir.glob("img_*.jpg"):

        try:

            number = int(
                file.stem.replace(
                    "img_",
                    ""
                )
            )

            existing_numbers.append(number)

        except ValueError:

            continue


    if existing_numbers:

        next_number = max(
            existing_numbers
        ) + 1

    else:

        next_number = 1


    # -----------------------------------------------------
    # Counters
    # -----------------------------------------------------

    saved_images = 0

    rejected_images = 0


    # -----------------------------------------------------
    # Process images
    # -----------------------------------------------------

    for image_file in images:

        try:

            # Read uploaded file
            contents = await image_file.read()


            # Convert bytes to numpy
            image_array = np.frombuffer(
                contents,
                dtype=np.uint8
            )


            # Convert to OpenCV image
            image = cv2.imdecode(
                image_array,
                cv2.IMREAD_COLOR
            )


            if image is None:

                rejected_images += 1

                continue


            # Detect and prepare face
            face = prepare_training_face(
                image
            )


            if face is None:

                rejected_images += 1

                continue


            # Save face
            image_path = (
                student_dir
                / f"img_{next_number}.jpg"
            )


            saved = cv2.imwrite(
                str(image_path),
                face
            )


            if saved:

                saved_images += 1

                next_number += 1

            else:

                rejected_images += 1


        except Exception as error:

            print(
                "Face capture error:",
                error
            )

            rejected_images += 1


    # -----------------------------------------------------
    # Response
    # -----------------------------------------------------

    return {

        "success": True,

        "student_name": student_name,

        "saved_images": saved_images,

        "rejected_images": rejected_images,

        "total_images": (
            saved_images
            + rejected_images
        ),

        "message": (
            f"{saved_images} face images saved."
        )

    }


# =========================================================
# TRAIN MODEL
# =========================================================

@app.post("/train")
def train_face_model():

    global recognizer
    global labels


    try:

        # -------------------------------------------------
        # Train using train_model.py
        # -------------------------------------------------

        result = train_model()


        # -------------------------------------------------
        # Reload trained model
        # -------------------------------------------------

        model_loaded = load_model()


        if not model_loaded:

            raise HTTPException(
                status_code=500,
                detail="Model trained but could not be loaded."
            )


        # -------------------------------------------------
        # Return result
        # -------------------------------------------------

        if isinstance(result, dict):

            return {
                "success": True,
                "message": (
                    "Face recognition model "
                    "trained successfully."
                ),
                **result
            }


        return {

            "success": True,

            "message": (
                "Face recognition model "
                "trained successfully."
            ),

            "students": len(labels)

        }


    except HTTPException:

        raise


    except Exception as error:

        print(
            "Training error:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail=f"Model training failed: {error}"
        )


# =========================================================
# RECOGNIZE FACE
# =========================================================

@app.post("/recognize")
async def recognize_student(

    image: UploadFile = File(...)
):

    global recognizer
    global labels


    # -----------------------------------------------------
    # Load model if necessary
    # -----------------------------------------------------

    if recognizer is None:

        if not load_model():

            raise HTTPException(
                status_code=400,
                detail=(
                    "Face recognition model "
                    "is not trained yet."
                )
            )


    # -----------------------------------------------------
    # Read image
    # -----------------------------------------------------

    try:

        contents = await image.read()


        if not contents:

            raise HTTPException(
                status_code=400,
                detail="Empty image received."
            )


        image_array = np.frombuffer(
            contents,
            dtype=np.uint8
        )


        frame = cv2.imdecode(
            image_array,
            cv2.IMREAD_COLOR
        )


        if frame is None:

            raise HTTPException(
                status_code=400,
                detail="Invalid image."
            )


        # -------------------------------------------------
        # Recognize using face.py
        # -------------------------------------------------

        result = recognize_face(
            frame,
            recognizer,
            labels,
            confidence_threshold=60
        )


        # -------------------------------------------------
        # Face not recognized
        # -------------------------------------------------

        if not result.get("recognized"):

            return {

                "success": True,

                "recognized": False,

                "student_name": None,

                "confidence": result.get(
                    "confidence",
                    0
                ),

                "attendance_marked": False,

                "message": result.get(
                    "message",
                    "Face not recognized."
                )

            }


        # -------------------------------------------------
        # Get student name
        # -------------------------------------------------

        student_name = result.get(
            "name"
        )


        if not student_name:

            return {

                "success": True,

                "recognized": False,

                "student_name": None,

                "confidence": result.get(
                    "confidence",
                    0
                ),

                "attendance_marked": False,

                "message": "Unknown student."

            }


        # -------------------------------------------------
        # Mark attendance
        # -----------------------------------------------------

        attendance = mark_attendance(
            student_name
        )


        # -------------------------------------------------
        # Response
        # -----------------------------------------------------

        return {

            "success": True,

            "recognized": True,

            "student_name": student_name,

            "confidence": result.get(
                "confidence",
                0
            ),

            "attendance_marked": attendance.get(
                "marked",
                False
            ),

            "message": attendance.get(
                "message",
                "Attendance processed."
            )

        }


    except HTTPException:

        raise


    except Exception as error:

        print(
            "Recognition error:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail=f"Face recognition failed: {error}"
        )


# =========================================================
# DAILY ATTENDANCE
# =========================================================

@app.get("/attendance/daily")
def daily_attendance(

    date: str | None = None,

    date_value: str | None = None

):

    # Support both:
    # /attendance/daily?date=2026-09-24
    # /attendance/daily?date_value=2026-09-24

    selected_date = (
        date
        or date_value
    )


    records = get_daily_attendance(
        attendance_date=selected_date
    )


    return {

        "success": True,

        "date": selected_date,

        "records": records

    }


# =========================================================
# MONTHLY ATTENDANCE
# =========================================================

@app.get("/attendance/monthly")
def monthly_attendance(

    month: str | None = None

):

    records = get_monthly_attendance(
        month=month
    )


    return {

        "success": True,

        "month": month,

        "records": records

    }


# =========================================================
# RUNNING MESSAGE
# =========================================================

@app.get("/api/status")
def api_status():

    return {

        "success": True,

        "backend": "running",

        "model_loaded": (
            recognizer is not None
        ),

        "students_dataset": (
            len(
                [
                    folder
                    for folder in DATASET_DIR.iterdir()
                    if folder.is_dir()
                ]
            )
        )

    }
