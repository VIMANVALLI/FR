import cv2
import json
import numpy as np
from pathlib import Path


# =========================================================
# PATHS
# =========================================================

BASE_DIR = Path(__file__).resolve().parent

DATASET_DIR = BASE_DIR / "dataset"

MODEL_DIR = BASE_DIR / "models"

TRAINER_PATH = MODEL_DIR / "trainer.yml"

LABELS_PATH = MODEL_DIR / "labels.json"


# =========================================================
# CREATE MODEL DIRECTORY
# =========================================================

MODEL_DIR.mkdir(
    parents=True,
    exist_ok=True
)


# =========================================================
# TRAIN MODEL
# =========================================================

def train_model():
    """
    Train the LBPH face recognition model.

    Dataset structure:

        dataset/
        ├── Student One/
        │   ├── img_1.jpg
        │   ├── img_2.jpg
        │   └── ...
        │
        └── Student Two/
            ├── img_1.jpg
            ├── img_2.jpg
            └── ...

    Returns:
        Dictionary containing training information.
    """

    # =====================================================
    # TRAINING DATA
    # =====================================================

    faces = []

    face_labels = []

    label_map = {}


    # =====================================================
    # CHECK DATASET
    # =====================================================

    if not DATASET_DIR.exists():

        raise RuntimeError(
            "Dataset folder not found."
        )


    # =====================================================
    # GET STUDENT FOLDERS
    # =====================================================

    student_folders = sorted(
        [
            folder
            for folder in DATASET_DIR.iterdir()
            if folder.is_dir()
        ],
        key=lambda folder: folder.name.lower()
    )


    if not student_folders:

        raise RuntimeError(
            "No student folders found in dataset."
        )


    print()
    print("=" * 60)
    print("STARTING FACE RECOGNITION MODEL TRAINING")
    print("=" * 60)


    # =====================================================
    # PROCESS STUDENTS
    # =====================================================

    current_label = 0

    students_with_images = 0


    for student_dir in student_folders:

        student_name = student_dir.name.strip()


        if not student_name:

            continue


        # -------------------------------------------------
        # Get JPG images
        # -------------------------------------------------

        image_files = sorted(
            student_dir.glob("*.jpg"),
            key=lambda file: file.name.lower()
        )


        # -------------------------------------------------
        # Also support JPEG
        # -------------------------------------------------

        image_files += sorted(
            student_dir.glob("*.jpeg"),
            key=lambda file: file.name.lower()
        )


        image_files += sorted(
            student_dir.glob("*.png"),
            key=lambda file: file.name.lower()
        )


        if not image_files:

            print(
                f"[WARNING] No face images found for: "
                f"{student_name}"
            )

            continue


        print()
        print(
            f"[INFO] Processing student: "
            f"{student_name}"
        )

        print(
            f"[INFO] Images found: "
            f"{len(image_files)}"
        )


        # -------------------------------------------------
        # Student images
        # -------------------------------------------------

        student_image_count = 0


        for image_path in image_files:

            try:

                # -----------------------------------------
                # Read grayscale image
                # -----------------------------------------

                image = cv2.imread(
                    str(image_path),
                    cv2.IMREAD_GRAYSCALE
                )


                if image is None:

                    print(
                        f"[WARNING] Could not read: "
                        f"{image_path.name}"
                    )

                    continue


                # -----------------------------------------
                # Resize to standard size
                # -----------------------------------------

                image = cv2.resize(
                    image,
                    (200, 200)
                )


                # -----------------------------------------
                # Add training data
                # -----------------------------------------

                faces.append(
                    image
                )

                face_labels.append(
                    current_label
                )

                student_image_count += 1


            except Exception as error:

                print(
                    f"[WARNING] Error processing "
                    f"{image_path.name}: {error}"
                )


        # -------------------------------------------------
        # Only create label if valid images exist
        # -------------------------------------------------

        if student_image_count > 0:

            label_map[
                student_name
            ] = current_label

            students_with_images += 1

            print(
                f"[INFO] Valid images: "
                f"{student_image_count}"
            )

            print(
                f"[INFO] Assigned label: "
                f"{current_label}"
            )

            current_label += 1

        else:

            print(
                f"[WARNING] No valid images for "
                f"{student_name}. Student skipped."
            )


    # =====================================================
    # CHECK TRAINING DATA
    # =====================================================

    if not faces:

        raise RuntimeError(
            "No valid face images found for training."
        )


    if not face_labels:

        raise RuntimeError(
            "No face labels found for training."
        )


    if not label_map:

        raise RuntimeError(
            "No students with valid face images found."
        )


    print()
    print("=" * 60)
    print("TRAINING DATA READY")
    print("=" * 60)

    print(
        f"Students : {students_with_images}"
    )

    print(
        f"Images   : {len(faces)}"
    )

    print("=" * 60)


    # =====================================================
    # CREATE LBPH RECOGNIZER
    # =====================================================

    try:

        recognizer = (
            cv2.face.LBPHFaceRecognizer_create(
                radius=1,
                neighbors=8,
                grid_x=8,
                grid_y=8
            )
        )


    except AttributeError:

        raise RuntimeError(
            "cv2.face is not available. "
            "Please install opencv-contrib-python."
        )


    # =====================================================
    # TRAIN MODEL
    # =====================================================

    print()

    print(
        "[INFO] Training LBPH model..."
    )


    try:

        recognizer.train(
            faces,
            np.array(
                face_labels,
                dtype=np.int32
            )
        )


    except Exception as error:

        raise RuntimeError(
            f"LBPH training failed: {error}"
        )


    print(
        "[INFO] Model training completed."
    )


    # =====================================================
    # SAVE TRAINER MODEL
    # =====================================================

    try:

        recognizer.save(
            str(TRAINER_PATH)
        )


    except Exception as error:

        raise RuntimeError(
            f"Could not save trainer model: {error}"
        )


    print(
        f"[INFO] Model saved:"
    )

    print(
        f"       {TRAINER_PATH}"
    )


    # =====================================================
    # CREATE REVERSE LABEL MAP
    # =====================================================

    # Example:
    #
    # label_map:
    #
    # {
    #     "Viman Valli": 0,
    #     "Bharath Kumar": 1
    # }
    #
    # Reverse:
    #
    # {
    #     "0": "Viman Valli",
    #     "1": "Bharath Kumar"
    # }

    reverse_labels = {
        str(label): student_name
        for student_name, label
        in label_map.items()
    }


    # =====================================================
    # SAVE LABELS
    # =====================================================

    try:

        with open(
            LABELS_PATH,
            "w",
            encoding="utf-8"
        ) as file:

            json.dump(
                reverse_labels,
                file,
                indent=4,
                ensure_ascii=False
            )


    except Exception as error:

        raise RuntimeError(
            f"Could not save labels: {error}"
        )


    print(
        "[INFO] Labels saved:"
    )

    print(
        f"       {LABELS_PATH}"
    )


    # =====================================================
    # TRAINING COMPLETED
    # =====================================================

    print()
    print("=" * 60)
    print("FACE RECOGNITION TRAINING COMPLETED")
    print("=" * 60)

    print(
        f"Students : {students_with_images}"
    )

    print(
        f"Images   : {len(faces)}"
    )

    print(
        f"Model    : {TRAINER_PATH}"
    )

    print(
        f"Labels   : {LABELS_PATH}"
    )

    print("=" * 60)


    # =====================================================
    # RETURN RESULT
    # =====================================================

    return {
        "students": students_with_images,

        "images": len(faces),

        "model": str(
            TRAINER_PATH
        ),

        "labels": str(
            LABELS_PATH
        )
    }


# =========================================================
# RUN DIRECTLY
# =========================================================

if __name__ == "__main__":

    try:

        result = train_model()


        print()

        print(
            "======================================"
        )

        print(
            "       TRAINING COMPLETED"
        )

        print(
            "======================================"
        )

        print(
            f"Students : {result['students']}"
        )

        print(
            f"Images   : {result['images']}"
        )

        print(
            f"Model    : {result['model']}"
        )

        print(
            f"Labels   : {result['labels']}"
        )

        print(
            "======================================"
        )


    except Exception as error:

        print()

        print(
            "======================================"
        )

        print(
            "[ERROR] TRAINING FAILED"
        )

        print(
            "======================================"
        )

        print(
            error
        )

        print(
            "======================================"
        )