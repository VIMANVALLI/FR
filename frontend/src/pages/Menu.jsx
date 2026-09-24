import React from "react";

function Menu({ onRegister, onTakeAttendance, onAttendance, onBack }) {
  return (
    <div className="menu-page">
      <div className="menu-background-circle menu-circle-one"></div>
      <div className="menu-background-circle menu-circle-two"></div>

      <div className="menu-container">

        {/* Header */}
        <div className="menu-header">
          <button className="back-button" onClick={onBack}>
            ← Back
          </button>

          <div className="menu-icon">
            <span>◉</span>
          </div>

          <p className="menu-label">FACE RECOGNITION SYSTEM</p>

          <h1>What would you like to do?</h1>

          <p>
            Choose an option to manage students and attendance.
          </p>
        </div>

        {/* Menu Cards */}
        <div className="menu-options">

          {/* Register Student */}
          <button
            className="menu-card register-card"
            onClick={onRegister}
          >
            <div className="menu-card-icon">
              👨‍🎓
            </div>

            <div className="menu-card-content">
              <h2>Register Student</h2>

              <p>
                Add a new student and capture face data
                for recognition.
              </p>

              <span className="menu-card-action">
                Register Student <b>→</b>
              </span>
            </div>
          </button>


          {/* Take Attendance */}
          <button
            className="menu-card attendance-card"
            onClick={onTakeAttendance}
          >
            <div className="menu-card-icon">
              📷
            </div>

            <div className="menu-card-content">
              <h2>Take Attendance</h2>

              <p>
                Use face recognition to identify students
                and mark attendance.
              </p>

              <span className="menu-card-action">
                Start Camera <b>→</b>
              </span>
            </div>
          </button>


          {/* See Attendance */}
          <button
            className="menu-card records-card"
            onClick={onAttendance}
          >
            <div className="menu-card-icon">
              📊
            </div>

            <div className="menu-card-content">
              <h2>See Attendance</h2>

              <p>
                View daily and monthly attendance
                records of students.
              </p>

              <span className="menu-card-action">
                View Records <b>→</b>
              </span>
            </div>
          </button>

        </div>

        <p className="menu-footer">
          Select an option to continue
        </p>

      </div>
    </div>
  );
}

export default Menu;