import cv2
import mediapipe as mp


# =========================================================
# MEDIAPIPE FACE DETECTION
# =========================================================

mp_face = mp.solutions.face_detection


# =========================================================
# FACE DETECTOR
# =========================================================

def detect_faces(image):
    """
    Detect faces in a BGR OpenCV image.

    Returns:
        List of bounding boxes:
        [(x1, y1, x2, y2), ...]
    """

    if image is None:
        return []

    if not hasattr(image, "shape"):
        return []

    if len(image.shape) != 3:
        return []

    height, width, _ = image.shape

    if height <= 0 or width <= 0:
        return []

    try:

        # -------------------------------------------------
        # Convert BGR -> RGB
        # -------------------------------------------------

        rgb_image = cv2.cvtColor(
            image,
            cv2.COLOR_BGR2RGB
        )


        # -------------------------------------------------
        # MediaPipe face detector
        # -------------------------------------------------

        with mp_face.FaceDetection(
            model_selection=0,
            min_detection_confidence=0.7
        ) as detector:

            results = detector.process(
                rgb_image
            )


    except Exception as error:

        print(
            "Face detection error:",
            error
        )

        return []


    boxes = []


    # -----------------------------------------------------
    # No faces
    # -----------------------------------------------------

    if not results.detections:

        return boxes


    # -----------------------------------------------------
    # Process every detected face
    # -----------------------------------------------------

    for detection in results.detections:

        try:

            bbox = (
                detection
                .location_data
                .relative_bounding_box
            )


            # -------------------------------------------------
            # Convert relative coordinates to pixels
            # -------------------------------------------------

            x1 = int(
                bbox.xmin * width
            ) - 10

            y1 = int(
                bbox.ymin * height
            ) - 10


            x2 = int(
                (bbox.xmin + bbox.width)
                * width
            ) + 10

            y2 = int(
                (bbox.ymin + bbox.height)
                * height
            ) + 10


            # -------------------------------------------------
            # Keep coordinates inside image
            # -------------------------------------------------

            x1 = max(
                0,
                x1
            )

            y1 = max(
                0,
                y1
            )

            x2 = min(
                width,
                x2
            )

            y2 = min(
                height,
                y2
            )


            # -------------------------------------------------
            # Ignore invalid boxes
            # -------------------------------------------------

            if x2 <= x1 or y2 <= y1:

                continue


            boxes.append(
                (
                    x1,
                    y1,
                    x2,
                    y2
                )
            )


        except Exception as error:

            print(
                "Bounding box error:",
                error
            )

            continue


    return boxes


# =========================================================
# EXTRACT FIRST FACE
# =========================================================

def extract_face(image):
    """
    Detect the first face and prepare it for LBPH.

    Returns:
        200x200 grayscale face
        or None
    """

    faces = detect_faces(
        image
    )


    if not faces:

        return None


    # -----------------------------------------------------
    # First detected face
    # -----------------------------------------------------

    x1, y1, x2, y2 = faces[0]


    face = image[
        y1:y2,
        x1:x2
    ]


    if face.size == 0:

        return None


    try:

        # -------------------------------------------------
        # Convert face to grayscale
        # -------------------------------------------------

        face_gray = cv2.cvtColor(
            face,
            cv2.COLOR_BGR2GRAY
        )


        # -------------------------------------------------
        # Resize to same size used during training
        # -------------------------------------------------

        face_resized = cv2.resize(
            face_gray,
            (200, 200)
        )


        return face_resized


    except Exception as error:

        print(
            "Face extraction error:",
            error
        )

        return None


# =========================================================
# EXTRACT ALL FACES
# =========================================================

def extract_all_faces(image):
    """
    Detect all faces from an image.

    Returns:
        List of 200x200 grayscale face images.
    """

    faces = []

    boxes = detect_faces(
        image
    )


    for x1, y1, x2, y2 in boxes:

        face = image[
            y1:y2,
            x1:x2
        ]


        if face.size == 0:

            continue


        try:

            # -------------------------------------------------
            # Convert to grayscale
            # -------------------------------------------------

            face_gray = cv2.cvtColor(
                face,
                cv2.COLOR_BGR2GRAY
            )


            # -------------------------------------------------
            # Resize
            # -------------------------------------------------

            face_resized = cv2.resize(
                face_gray,
                (200, 200)
            )


            faces.append(
                face_resized
            )


        except Exception as error:

            print(
                "Face extraction error:",
                error
            )

            continue


    return faces


# =========================================================
# RECOGNIZE FACE
# =========================================================

def recognize_face(
    image,
    recognizer,
    labels,
    confidence_threshold=60
):
    """
    Recognize the first detected face.

    Parameters:
        image:
            BGR OpenCV image.

        recognizer:
            LBPH recognizer.

        labels:
            Dictionary such as:
            {"0": "Viman Valli"}

        confidence_threshold:
            Maximum LBPH distance accepted.

    Returns:
        Dictionary containing recognition result.
    """

    # -----------------------------------------------------
    # Check recognizer
    # -----------------------------------------------------

    if recognizer is None:

        return {
            "recognized": False,
            "name": None,
            "confidence": 0,
            "message": "Model is not loaded."
        }


    # -----------------------------------------------------
    # Extract face
    # -----------------------------------------------------

    face = extract_face(
        image
    )


    if face is None:

        return {
            "recognized": False,
            "name": None,
            "confidence": 0,
            "message": "No face detected."
        }


    # -----------------------------------------------------
    # Predict
    # -----------------------------------------------------

    try:

        label, distance = recognizer.predict(
            face
        )


    except Exception as error:

        print(
            "Recognition error:",
            error
        )

        return {
            "recognized": False,
            "name": None,
            "confidence": 0,
            "message": "Recognition failed."
        }


    # -----------------------------------------------------
    # Convert LBPH distance to percentage
    # -----------------------------------------------------

    confidence = max(
        0,
        min(
            100,
            100 - distance
        )
    )


    confidence = round(
        confidence,
        2
    )


    # -----------------------------------------------------
    # Confidence check
    # -----------------------------------------------------

    if distance > confidence_threshold:

        return {
            "recognized": False,
            "name": None,
            "confidence": confidence,
            "message": "Face not recognized."
        }


    # -----------------------------------------------------
    # Find student name
    # -----------------------------------------------------

    name = labels.get(
        str(label),
        "Unknown"
    )


    if name == "Unknown":

        return {
            "recognized": False,
            "name": None,
            "confidence": confidence,
            "message": "Unknown student."
        }


    # -----------------------------------------------------
    # Successful recognition
    # -----------------------------------------------------

    return {
        "recognized": True,
        "name": name,
        "confidence": confidence,
        "message": "Face recognized successfully."
    }


# =========================================================
# RECOGNIZE MULTIPLE FACES
# =========================================================

def recognize_multiple_faces(
    image,
    recognizer,
    labels,
    confidence_threshold=60
):
    """
    Recognize all faces in an image.

    Returns:
        List of recognition results.
    """

    results = []


    # -----------------------------------------------------
    # Check recognizer
    # -----------------------------------------------------

    if recognizer is None:

        return results


    # -----------------------------------------------------
    # Detect all faces
    # -----------------------------------------------------

    boxes = detect_faces(
        image
    )


    for x1, y1, x2, y2 in boxes:

        face = image[
            y1:y2,
            x1:x2
        ]


        if face.size == 0:

            continue


        try:

            # -------------------------------------------------
            # Convert to grayscale
            # -------------------------------------------------

            face_gray = cv2.cvtColor(
                face,
                cv2.COLOR_BGR2GRAY
            )


            # -------------------------------------------------
            # Resize
            # -------------------------------------------------

            face_resized = cv2.resize(
                face_gray,
                (200, 200)
            )


            # -------------------------------------------------
            # Predict
            # -------------------------------------------------

            label, distance = recognizer.predict(
                face_resized
            )


        except Exception as error:

            print(
                "Multiple face recognition error:",
                error
            )

            continue


        # -----------------------------------------------------
        # Confidence
        # -----------------------------------------------------

        confidence = max(
            0,
            min(
                100,
                100 - distance
            )
        )


        confidence = round(
            confidence,
            2
        )


        # -----------------------------------------------------
        # Check confidence
        # -----------------------------------------------------

        if distance > confidence_threshold:

            continue


        # -----------------------------------------------------
        # Get name
        # -----------------------------------------------------

        name = labels.get(
            str(label),
            "Unknown"
        )


        if name == "Unknown":

            continue


        # -----------------------------------------------------
        # Add result
        # -----------------------------------------------------

        results.append(
            {
                "name": name,

                "confidence": confidence,

                "box": {
                    "x1": x1,
                    "y1": y1,
                    "x2": x2,
                    "y2": y2
                }
            }
        )


    return results


# =========================================================
# PREPARE FACE FOR TRAINING
# =========================================================

def prepare_training_face(image):
    """
    Detect and prepare a face image for LBPH training.

    Returns:
        200x200 grayscale face
        or None.
    """

    face = extract_face(
        image
    )


    if face is None:

        return None


    return face