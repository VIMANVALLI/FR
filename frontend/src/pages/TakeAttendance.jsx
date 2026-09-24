import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import { recognizeFace } from "../services/api";

function TakeAttendance({ onBack }) {
  // =========================================================
  // REFS
  // =========================================================

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const recognitionTimerRef = useRef(null);
  const requestInProgressRef = useRef(false);

  // IMPORTANT:
  // Refs avoid React stale-state problems inside setInterval
  const cameraActiveRef = useRef(false);
  const recognizingRef = useRef(false);

  // =========================================================
  // STATE
  // =========================================================

  const [showCamera, setShowCamera] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [recognizing, setRecognizing] = useState(false);

  const [studentName, setStudentName] = useState("");
  const [confidence, setConfidence] = useState(0);
  const [attendanceMarked, setAttendanceMarked] = useState(false);

  const [message, setMessage] = useState(
    "Click Take Attendance to start."
  );

  // =========================================================
  // START CAMERA
  // =========================================================

  const startCamera = async () => {
    try {
      // Reset previous result
      setStudentName("");
      setConfidence(0);
      setAttendanceMarked(false);
      setMessage("Opening camera...");

      // Stop previous camera if any
      stopCamera();

      // Get browser camera
      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            width: {
              ideal: 1280,
            },
            height: {
              ideal: 720,
            },
            facingMode: "user",
          },
          audio: false,
        });

      streamRef.current = stream;

      // IMPORTANT
      cameraActiveRef.current = true;
      recognizingRef.current = true;

      setShowCamera(true);
      setCameraActive(true);
      setRecognizing(true);

      setMessage("Looking for a face...");

      // Wait until modal/video is rendered
      setTimeout(() => {
        if (!videoRef.current) {
          console.error("Video element not ready.");
          return;
        }

        videoRef.current.srcObject = stream;

        videoRef.current
          .play()
          .then(() => {
            console.log("Camera started successfully.");

            // Start recognition after video starts
            setTimeout(() => {
              startRecognitionLoop();
            }, 800);
          })
          .catch((error) => {
            console.error("Video play error:", error);
            setMessage("Unable to start camera video.");
          });
      }, 300);
    } catch (error) {
      console.error("Camera error:", error);

      cameraActiveRef.current = false;
      recognizingRef.current = false;

      setCameraActive(false);
      setRecognizing(false);

      if (error?.name === "NotAllowedError") {
        setMessage(
          "Camera permission denied. Please allow camera access."
        );
      } else if (error?.name === "NotFoundError") {
        setMessage("No camera found on this device.");
      } else {
        setMessage(
          "Unable to access camera. Please check camera permission."
        );
      }
    }
  };

  // =========================================================
  // CAPTURE CURRENT VIDEO FRAME
  // =========================================================

  const captureFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
      console.log("Video or canvas not available.");
      return null;
    }

    if (
      video.readyState <
      HTMLMediaElement.HAVE_CURRENT_DATA
    ) {
      console.log("Video is not ready.");
      return null;
    }

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    if (width <= 0 || height <= 0) {
      console.log("Invalid video dimensions.");
      return null;
    }

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");

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
        0.9
      );
    });
  };

  // =========================================================
  // RECOGNIZE CURRENT FRAME
  // =========================================================

  const recognizeCurrentFrame = async () => {
    // IMPORTANT:
    // Read from refs, NOT React state.
    if (
      !cameraActiveRef.current ||
      !recognizingRef.current
    ) {
      return;
    }

    if (requestInProgressRef.current) {
      return;
    }

    requestInProgressRef.current = true;

    try {
      console.log("Capturing frame...");

      const image = await captureFrame();

      if (!image) {
        requestInProgressRef.current = false;
        return;
      }

      console.log(
        "Sending frame to FastAPI...",
        image.size
      );

      const result = await recognizeFace(image);

      console.log(
        "Recognition response:",
        result
      );

      // =====================================================
      // RECOGNIZED
      // =====================================================

      if (
        result &&
        result.recognized === true
      ) {
        const name =
          result.student_name ||
          result.name ||
          "";

        setStudentName(name);

        setConfidence(
          Number(result.confidence || 0)
        );

        setAttendanceMarked(
          Boolean(result.attendance_marked)
        );

        setMessage(
          result.message ||
            "Student recognized successfully."
        );

        // Stop recognition
        recognizingRef.current = false;
        cameraActiveRef.current = false;

        setRecognizing(false);
        setCameraActive(false);

        stopRecognitionLoop();

        console.log(
          "Student recognized:",
          name
        );

        return;
      }

      // =====================================================
      // NOT RECOGNIZED
      // =====================================================

      if (result?.message) {
        setMessage(result.message);
      } else {
        setMessage(
          "Face detected, but student not recognized."
        );
      }
    } catch (error) {
      console.error(
        "Recognition API error:",
        error
      );

      if (error?.response?.data?.detail) {
        setMessage(
          error.response.data.detail
        );
      } else if (error?.message) {
        setMessage(error.message);
      } else {
        setMessage(
          "Unable to connect to backend."
        );
      }
    } finally {
      requestInProgressRef.current = false;
    }
  };

  // =========================================================
  // START RECOGNITION LOOP
  // =========================================================

  const startRecognitionLoop = () => {
    stopRecognitionLoop();

    console.log(
      "Recognition loop started."
    );

    // Run immediately
    recognizeCurrentFrame();

    // Then every 1.5 seconds
    recognitionTimerRef.current =
      setInterval(() => {
        recognizeCurrentFrame();
      }, 1500);
  };

  // =========================================================
  // STOP RECOGNITION LOOP
  // =========================================================

  const stopRecognitionLoop = () => {
    if (recognitionTimerRef.current) {
      clearInterval(
        recognitionTimerRef.current
      );

      recognitionTimerRef.current = null;

      console.log(
        "Recognition loop stopped."
      );
    }
  };

  // =========================================================
  // STOP CAMERA
  // =========================================================

  const stopCamera = () => {
    stopRecognitionLoop();

    requestInProgressRef.current = false;

    cameraActiveRef.current = false;
    recognizingRef.current = false;

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

    setCameraActive(false);
    setRecognizing(false);
  };

  // =========================================================
  // CLOSE CAMERA
  // =========================================================

  const closeCamera = () => {
    stopCamera();

    setShowCamera(false);

    setStudentName("");
    setConfidence(0);
    setAttendanceMarked(false);

    setMessage(
      "Click Take Attendance to start."
    );
  };

  // =========================================================
  // BACK
  // =========================================================

  const handleBack = () => {
    closeCamera();
    onBack();
  };

  // =========================================================
  // CLEANUP
  // =========================================================

  useEffect(() => {
    return () => {
      stopRecognitionLoop();

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
  // PAGE
  // =========================================================

  return (
    <>
      <div className="take-attendance-page">

        <div className="take-background-circle take-circle-one"></div>
        <div className="take-background-circle take-circle-two"></div>

        <div className="take-attendance-container">

          {/* HEADER */}

          <div className="take-attendance-header">

            <button
              className="back-button"
              onClick={handleBack}
              type="button"
            >
              ← Back
            </button>

            <p className="page-label">
              ATTENDANCE
            </p>

            <h1>
              Take Attendance
            </h1>

            <p>
              Use face recognition to identify students
              and mark attendance automatically.
            </p>

          </div>

          {/* MAIN CARD */}

          <div className="take-attendance-main-card">

            <div className="take-attendance-icon">
              📷
            </div>

            <h2>
              Ready to Take Attendance?
            </h2>

            <p>
              Click the button below to open the camera
              and start face recognition.
            </p>

            <button
              className="open-attendance-camera-button"
              onClick={startCamera}
              type="button"
            >
              <span>📷</span>

              <span>
                Take Attendance
              </span>
            </button>

          </div>

          {/* INFORMATION */}

          <div className="attendance-info">

            <div className="info-item">

              <span>1</span>

              <div>
                <strong>
                  Open Camera
                </strong>

                <p>
                  Click Take Attendance.
                </p>
              </div>

            </div>

            <div className="info-item">

              <span>2</span>

              <div>
                <strong>
                  Face the Camera
                </strong>

                <p>
                  Look directly at the camera.
                </p>
              </div>

            </div>

            <div className="info-item">

              <span>3</span>

              <div>
                <strong>
                  Attendance
                </strong>

                <p>
                  Attendance is marked automatically.
                </p>
              </div>

            </div>

          </div>

        </div>
      </div>

      {/* =====================================================
          CAMERA POPUP
      ===================================================== */}

      {showCamera && (

        <div className="attendance-camera-overlay">

          <div className="attendance-camera-modal">

            {/* HEADER */}

            <div className="attendance-camera-header">

              <div>

                <p className="camera-label">
                  FACE RECOGNITION
                </p>

                <h2>
                  Take Attendance
                </h2>

              </div>

              <button
                className="attendance-camera-close"
                onClick={closeCamera}
                type="button"
              >
                ×
              </button>

            </div>

            {/* CAMERA */}

            <div className="attendance-camera-view">

              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
              />

              {/* FACE FRAME */}

              <div className="attendance-face-frame">

                <div className="attendance-corner top-left"></div>
                <div className="attendance-corner top-right"></div>
                <div className="attendance-corner bottom-left"></div>
                <div className="attendance-corner bottom-right"></div>

              </div>

              {/* SCANNING */}

              {recognizing && (
                <div className="attendance-scanning-line"></div>
              )}

              {/* LIVE */}

              <div className="attendance-live-badge">

                <span></span>

                LIVE

              </div>

            </div>

            {/* HIDDEN CANVAS */}

            <canvas
              ref={canvasRef}
              style={{
                display: "none",
              }}
            />

            {/* RESULT */}

            <div className="attendance-popup-result">

              {/* SCANNING */}

              {!studentName &&
                recognizing && (

                  <div className="attendance-scanning-state">

                    <div className="attendance-spinner"></div>

                    <h3>
                      Scanning Face...
                    </h3>

                    <p>
                      Please look directly at the camera.
                    </p>

                  </div>

                )}

              {/* WAITING */}

              {!studentName &&
                !recognizing && (

                  <div className="attendance-waiting-state">

                    <div className="waiting-icon">
                      ?
                    </div>

                    <h3>
                      No Student Detected
                    </h3>

                    <p>
                      Position the student's face inside the frame.
                    </p>

                  </div>

                )}

              {/* RECOGNIZED */}

              {studentName && (

                <div className="attendance-recognized">

                  <div className="attendance-student-avatar">
                    {studentName.charAt(0)}
                  </div>

                  <h3>
                    {studentName}
                  </h3>

                  <span className="student-identified">
                    Student Identified
                  </span>

                  <div className="attendance-confidence">

                    <div className="attendance-confidence-header">

                      <span>
                        Recognition Confidence
                      </span>

                      <strong>
                        {confidence}%
                      </strong>

                    </div>

                    <div className="attendance-confidence-bar">

                      <div
                        className="attendance-confidence-fill"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(
                              0,
                              confidence
                            )
                          )}%`,
                        }}
                      ></div>

                    </div>

                  </div>

                  <div className="attendance-marked">

                    <div className="attendance-marked-icon">
                      {attendanceMarked
                        ? "✓"
                        : "!"}
                    </div>

                    <div>

                      <strong>
                        {attendanceMarked
                          ? "Attendance Marked"
                          : "Attendance Already Marked"}
                      </strong>

                      <p>
                        {attendanceMarked
                          ? "Present • "
                          : "Attendance already recorded • "}

                        {new Date().toLocaleTimeString(
                          [],
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </p>

                    </div>

                  </div>

                </div>

              )}

            </div>

            {/* MESSAGE */}

            <div className="attendance-popup-message">
              {message}
            </div>

            {/* CLOSE */}

            <button
              className="close-attendance-button"
              onClick={closeCamera}
              type="button"
            >
              Close Camera
            </button>

          </div>

        </div>

      )}
    </>
  );
}

export default TakeAttendance;