import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  registerStudent,
  uploadFaceImages,
  trainModel,
} from "../services/api";

function RegisterStudent({ onBack }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const automaticTimerRef = useRef(null);

  const capturedImagesRef = useRef([]);

  const [formData, setFormData] = useState({
    studentName: "",
    motherName: "",
    fatherName: "",
    fatherPhone: "",
  });

  const [showCamera, setShowCamera] = useState(false);
  const [cameraStarted, setCameraStarted] = useState(false);

  const [captureMode, setCaptureMode] =
    useState("automatic");

  const [photoCount, setPhotoCount] = useState(0);

  const [training, setTraining] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [completed, setCompleted] = useState(false);

  const [message, setMessage] = useState("");

  const automaticPhotos = 25;
  const manualPhotos = 5;
  const totalPhotos =
    automaticPhotos + manualPhotos;

  // =========================================================
  // FORM INPUT
  // =========================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =========================================================
  // CAPTURE CURRENT VIDEO FRAME
  // =========================================================

  const captureFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
      return null;
    }

    if (
      video.readyState <
      HTMLMediaElement.HAVE_CURRENT_DATA
    ) {
      return null;
    }

    const width =
      video.videoWidth || 640;

    const height =
      video.videoHeight || 480;

    canvas.width = width;
    canvas.height = height;

    const context =
      canvas.getContext("2d");

    if (!context) {
      return null;
    }

    context.drawImage(
      video,
      0,
      0,
      width,
      height
    );

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          resolve(blob);
        },
        "image/jpeg",
        0.90
      );
    });
  };

  // =========================================================
  // OPEN CAMERA
  // =========================================================

  const openCamera = async () => {
    if (!formData.studentName.trim()) {
      setMessage(
        "Please enter the student name first."
      );
      return;
    }

    if (!formData.motherName.trim()) {
      setMessage(
        "Please enter the mother name."
      );
      return;
    }

    if (!formData.fatherName.trim()) {
      setMessage(
        "Please enter the father name."
      );
      return;
    }

    if (
      !/^[0-9]{10}$/.test(
        formData.fatherPhone
      )
    ) {
      setMessage(
        "Please enter a valid 10-digit phone number."
      );
      return;
    }

    try {
      setMessage(
        "Opening camera..."
      );

      const stream =
        await navigator.mediaDevices.getUserMedia(
          {
            video: {
              facingMode: "user",
              width: {
                ideal: 1280,
              },
              height: {
                ideal: 720,
              },
            },
            audio: false,
          }
        );

      streamRef.current = stream;

      capturedImagesRef.current = [];

      setShowCamera(true);
      setCameraStarted(false);
      setPhotoCount(0);
      setCaptureMode("automatic");
      setTraining(false);
      setUploading(false);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject =
            stream;

          videoRef.current
            .play()
            .catch(() => {});
        }
      }, 100);

      setMessage("");
    } catch (error) {
      console.error(
        "Camera error:",
        error
      );

      setMessage(
        "Unable to access camera. Please allow camera permission."
      );
    }
  };

  // =========================================================
  // STOP CAMERA
  // =========================================================

  const stopCamera = () => {
    if (automaticTimerRef.current) {
      clearInterval(
        automaticTimerRef.current
      );

      automaticTimerRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach((track) => {
          track.stop();
        });

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraStarted(false);
  };

  // =========================================================
  // CLOSE CAMERA
  // =========================================================

  const closeCamera = () => {
    stopCamera();

    capturedImagesRef.current = [];

    setShowCamera(false);
    setPhotoCount(0);
    setCaptureMode("automatic");
    setTraining(false);
    setUploading(false);
    setMessage("");
  };

  // =========================================================
  // START CAPTURE
  // =========================================================

  const startCapture = () => {
    if (!videoRef.current) {
      setMessage(
        "Camera is not ready."
      );
      return;
    }

    if (
      videoRef.current.readyState <
      HTMLMediaElement.HAVE_CURRENT_DATA
    ) {
      setMessage(
        "Please wait for the camera to start."
      );
      return;
    }

    capturedImagesRef.current = [];

    setCameraStarted(true);
    setPhotoCount(0);
    setCaptureMode("automatic");

    setMessage(
      "Keep your face inside the frame. Capturing 25 photos automatically..."
    );

    startAutomaticCapture();
  };

  // =========================================================
  // AUTOMATIC 25 PHOTO CAPTURE
  // =========================================================

  const startAutomaticCapture = () => {
    let count = 0;

    if (automaticTimerRef.current) {
      clearInterval(
        automaticTimerRef.current
      );
    }

    automaticTimerRef.current =
      setInterval(async () => {
        const image =
          await captureFrame();

        if (!image) {
          return;
        }

        capturedImagesRef.current.push(
          image
        );

        count += 1;

        setPhotoCount(count);

        if (
          count >= automaticPhotos
        ) {
          clearInterval(
            automaticTimerRef.current
          );

          automaticTimerRef.current =
            null;

          setCaptureMode("manual");

          setMessage(
            "25 photos completed. Now capture 5 photos from different angles."
          );
        }
      }, 700);
  };

  // =========================================================
  // MANUAL PHOTO CAPTURE
  // =========================================================

  const captureManualPhoto = async () => {
    if (
      captureMode !== "manual" ||
      training ||
      uploading
    ) {
      return;
    }

    const image =
      await captureFrame();

    if (!image) {
      setMessage(
        "Could not capture photo. Please try again."
      );
      return;
    }

    capturedImagesRef.current.push(
      image
    );

    const newPhotoCount =
      capturedImagesRef.current.length;

    setPhotoCount(newPhotoCount);

    const manualCount =
      newPhotoCount -
      automaticPhotos;

    if (
      manualCount <
      manualPhotos
    ) {
      setMessage(
        `Manual photo ${manualCount + 1} of ${manualPhotos}. Change your face angle and capture again.`
      );

      return;
    }

    setPhotoCount(totalPhotos);

    setMessage(
      "All 30 photos captured. Uploading photos..."
    );

    await uploadPhotosAndTrain();
  };

  // =========================================================
  // UPLOAD PHOTOS + TRAIN
  // =========================================================

  const uploadPhotosAndTrain =
    async () => {
      try {
        setUploading(true);

        const images =
          capturedImagesRef.current;

        if (
          images.length !==
          totalPhotos
        ) {
          throw new Error(
            `Expected ${totalPhotos} photos but captured ${images.length}.`
          );
        }

        // ---------------------------------------------------
        // STEP 1: REGISTER STUDENT
        // ---------------------------------------------------

        setMessage(
          "Registering student..."
        );

        await registerStudent({
          student_name:
            formData.studentName.trim(),

          mother_name:
            formData.motherName.trim(),

          father_name:
            formData.fatherName.trim(),

          father_phone:
            formData.fatherPhone.trim(),
        });

        // ---------------------------------------------------
        // STEP 2: UPLOAD FACE IMAGES
        // ---------------------------------------------------

        setMessage(
          "Uploading 30 face photos to the server..."
        );

        const uploadResult =
          await uploadFaceImages(
            formData.studentName.trim(),
            images
          );

        console.log(
          "Face upload result:",
          uploadResult
        );

        // ---------------------------------------------------
        // CHECK UPLOAD RESULT
        // ---------------------------------------------------

        if (
          uploadResult &&
          uploadResult.saved_images !==
            undefined &&
          Number(
            uploadResult.saved_images
          ) !== totalPhotos
        ) {
          throw new Error(
            `Only ${uploadResult.saved_images} photos were saved.`
          );
        }

        setUploading(false);

        // ---------------------------------------------------
        // STEP 3: TRAIN MODEL
        // ---------------------------------------------------

        setTraining(true);

        setMessage(
          "Training face recognition model..."
        );

        const trainingResult =
          await trainModel();

        console.log(
          "Training result:",
          trainingResult
        );

        setTraining(false);

        // ---------------------------------------------------
        // SUCCESS
        // ---------------------------------------------------

        setCompleted(true);

        setMessage(
          "Student registered and face recognition model trained successfully."
        );

        stopCamera();
      } catch (error) {
        console.error(
          "Registration error:",
          error
        );

        setUploading(false);
        setTraining(false);

        let errorMessage =
          "Registration failed.";

        if (
          error?.response?.data
            ?.detail
        ) {
          errorMessage =
            error.response.data.detail;
        } else if (
          error?.message
        ) {
          errorMessage =
            error.message;
        }

        setMessage(
          errorMessage
        );
      }
    };

  // =========================================================
  // CLEANUP
  // =========================================================

  useEffect(() => {
    return () => {
      if (
        automaticTimerRef.current
      ) {
        clearInterval(
          automaticTimerRef.current
        );
      }

      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track) => {
            track.stop();
          });
      }
    };
  }, []);

  // =========================================================
  // UI
  // =========================================================

  return (
    <>
      <div className="register-page">
        <div className="register-container">

          {/* HEADER */}

          <div className="register-header">

            <button
              className="back-button"
              onClick={onBack}
              type="button"
            >
              ×
            </button>

            <h1>
              Register Student
            </h1>

            <p>
              Enter student details to
              register a new student.
            </p>

          </div>

          {/* FORM */}

          {!completed ? (
            <div className="register-card">

              {/* STUDENT NAME */}

              <div className="form-group full-width">

                <label>
                  Student Name{" "}
                  <span>*</span>
                </label>

                <input
                  type="text"
                  name="studentName"
                  value={
                    formData.studentName
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Enter student full name"
                  disabled={
                    showCamera ||
                    uploading ||
                    training
                  }
                />

              </div>

              {/* MOTHER NAME */}

              <div className="form-group full-width">

                <label>
                  Mother Name{" "}
                  <span>*</span>
                </label>

                <input
                  type="text"
                  name="motherName"
                  value={
                    formData.motherName
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Enter mother name"
                  disabled={
                    showCamera ||
                    uploading ||
                    training
                  }
                />

              </div>

              {/* FATHER NAME */}

              <div className="form-group full-width">

                <label>
                  Father Name{" "}
                  <span>*</span>
                </label>

                <input
                  type="text"
                  name="fatherName"
                  value={
                    formData.fatherName
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Enter father name"
                  disabled={
                    showCamera ||
                    uploading ||
                    training
                  }
                />

              </div>

              {/* FATHER PHONE */}

              <div className="form-group full-width">

                <label>
                  Father Phone Number{" "}
                  <span>*</span>
                </label>

                <input
                  type="tel"
                  name="fatherPhone"
                  value={
                    formData.fatherPhone
                  }
                  onChange={(e) => {
                    const value =
                      e.target.value.replace(
                        /\D/g,
                        ""
                      );

                    setFormData(
                      (previous) => ({
                        ...previous,
                        fatherPhone:
                          value.slice(
                            0,
                            10
                          ),
                      })
                    );
                  }}
                  placeholder="Enter 10-digit phone number"
                  maxLength="10"
                  inputMode="numeric"
                  disabled={
                    showCamera ||
                    uploading ||
                    training
                  }
                />

              </div>

              {/* MESSAGE */}

              {message && (
                <div className="capture-message">
                  {message}
                </div>
              )}

              {/* FACE REGISTRATION */}

              <div className="photo-section">

                <div className="photo-section-header">

                  <div>

                    <h2>
                      Face Registration
                    </h2>

                    <p>
                      Capture 30 photos
                      for face recognition.
                    </p>

                  </div>

                  <div className="photo-count">
                    {photoCount}/
                    {totalPhotos}
                  </div>

                </div>

                <button
                  className="take-photo-button"
                  onClick={openCamera}
                  type="button"
                  disabled={
                    showCamera ||
                    uploading ||
                    training
                  }
                >
                  <span>
                    📷
                  </span>

                  <span>
                    Take Photo
                  </span>
                </button>

              </div>

            </div>
          ) : (

            /* SUCCESS */

            <div className="registration-success">

              <div className="success-icon">
                ✓
              </div>

              <h3>
                Registration Successful
              </h3>

              <p>
                {formData.studentName}{" "}
                has been registered
                successfully.
              </p>

              <button
                className="done-button"
                onClick={onBack}
                type="button"
              >
                Done
              </button>

            </div>
          )}

        </div>
      </div>

      {/* =====================================================
          CAMERA POPUP
      ===================================================== */}

      {showCamera && (
        <div className="camera-overlay">

          <div className="camera-modal">

            {/* CAMERA HEADER */}

            <div className="camera-header">

              <div>

                <p className="camera-label">
                  FACE CAPTURE
                </p>

                <h2>
                  {captureMode ===
                  "automatic"
                    ? "Automatic Capture"
                    : "Manual Capture"}
                </h2>

              </div>

              <button
                className="camera-close"
                onClick={closeCamera}
                type="button"
                disabled={
                  uploading ||
                  training
                }
              >
                ×
              </button>

            </div>

            {/* CAMERA */}

            <div className="camera-view">

              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
              />

              <canvas
                ref={canvasRef}
                style={{
                  display: "none",
                }}
              />

              <div className="face-frame"></div>

              <div className="camera-counter">
                {photoCount}/
                {totalPhotos}
              </div>

            </div>

            {/* CONTROLS */}

            <div className="camera-controls">

              {/* START */}

              {!cameraStarted &&
                !uploading &&
                !training && (
                  <button
                    className="camera-start-button"
                    onClick={
                      startCapture
                    }
                    type="button"
                  >
                    Start
                  </button>
                )}

              {/* AUTOMATIC */}

              {cameraStarted &&
                captureMode ===
                  "automatic" &&
                !uploading &&
                !training && (
                  <div className="capture-progress">

                    <div className="progress-text">
                      Capturing photos...
                    </div>

                    <div className="progress-bar">

                      <div
                        className="progress-fill"
                        style={{
                          width: `${
                            (photoCount /
                              automaticPhotos) *
                            100
                          }%`,
                        }}
                      ></div>

                    </div>

                    <span>
                      {photoCount}/
                      {automaticPhotos}
                    </span>

                  </div>
                )}

              {/* MANUAL */}

              {cameraStarted &&
                captureMode ===
                  "manual" &&
                !training &&
                !uploading && (
                  <button
                    className="manual-capture-button"
                    onClick={
                      captureManualPhoto
                    }
                    type="button"
                  >
                    Capture Photo
                  </button>
                )}

              {/* UPLOADING */}

              {uploading && (
                <div className="training-box">

                  <div className="training-spinner"></div>

                  <span>
                    Uploading photos...
                  </span>

                </div>
              )}

              {/* TRAINING */}

              {training && (
                <div className="training-box">

                  <div className="training-spinner"></div>

                  <span>
                    Training model...
                  </span>

                </div>
              )}

            </div>

            {/* MANUAL INSTRUCTIONS */}

            {captureMode ===
              "manual" &&
              !training &&
              !uploading && (
                <div className="manual-instructions">

                  <strong>
                    Capture 5 Different
                    Angles
                  </strong>

                  <p>
                    Change your face angle
                    slightly for each
                    photo.
                  </p>

                  <div className="angle-list">

                    <span>
                      1. Straight
                    </span>

                    <span>
                      2. Left
                    </span>

                    <span>
                      3. Right
                    </span>

                    <span>
                      4. Up
                    </span>

                    <span>
                      5. Down
                    </span>

                  </div>

                </div>
              )}

          </div>
        </div>
      )}
    </>
  );
}

export default RegisterStudent;