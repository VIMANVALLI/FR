import React, {
  useEffect,
  useState,
} from "react";

import {
  getDailyAttendance,
  getMonthlyAttendance,
} from "../services/api";

function Attendance({ onBack }) {
  const [view, setView] = useState("daily");

  const [selectedDate, setSelectedDate] =
    useState(
      new Date()
        .toISOString()
        .split("T")[0]
    );

  const [selectedMonth, setSelectedMonth] =
    useState(
      new Date()
        .toISOString()
        .slice(0, 7)
    );

  const [dailyAttendance, setDailyAttendance] =
    useState([]);

  const [monthlyStudents, setMonthlyStudents] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  // =========================================================
  // LOAD DAILY ATTENDANCE
  // =========================================================

  const loadDailyAttendance = async () => {
    try {
      setLoading(true);
      setError("");

      console.log(
        "Loading daily attendance:",
        selectedDate
      );

      const response =
        await getDailyAttendance(
          selectedDate
        );

      console.log(
        "Daily attendance response:",
        response
      );

      setDailyAttendance(
        Array.isArray(response?.records)
          ? response.records
          : []
      );
    } catch (err) {
      console.error(
        "Daily attendance error:",
        err
      );

      setDailyAttendance([]);

      if (
        err?.response?.data?.detail
      ) {
        setError(
          err.response.data.detail
        );
      } else {
        setError(
          "Unable to load attendance records."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // LOAD MONTHLY ATTENDANCE
  // =========================================================

  const loadMonthlyAttendance = async () => {
    try {
      setLoading(true);
      setError("");

      console.log(
        "Loading monthly attendance:",
        selectedMonth
      );

      const response =
        await getMonthlyAttendance(
          selectedMonth
        );

      console.log(
        "Monthly attendance response:",
        response
      );

      setMonthlyStudents(
        Array.isArray(response?.records)
          ? response.records
          : []
      );
    } catch (err) {
      console.error(
        "Monthly attendance error:",
        err
      );

      setMonthlyStudents([]);

      if (
        err?.response?.data?.detail
      ) {
        setError(
          err.response.data.detail
        );
      } else {
        setError(
          "Unable to load monthly attendance."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // LOAD DATA WHEN DATE CHANGES
  // =========================================================

  useEffect(() => {
    if (view === "daily") {
      loadDailyAttendance();
    }
  }, [selectedDate, view]);

  // =========================================================
  // LOAD DATA WHEN MONTH CHANGES
  // =========================================================

  useEffect(() => {
    if (view === "monthly") {
      loadMonthlyAttendance();
    }
  }, [selectedMonth, view]);

  // =========================================================
  // STATISTICS
  // =========================================================

  const totalStudents =
    dailyAttendance.length;

  const presentCount =
    dailyAttendance.filter(
      (student) =>
        student.status === "Present"
    ).length;

  /*
    Your current backend stores attendance
    records only for students who are present.

    Therefore absent students cannot currently
    be calculated from the daily endpoint.
  */

  const absentCount = 0;

  const attendanceRate =
    totalStudents > 0
      ? Math.round(
          (presentCount /
            totalStudents) *
            100
        )
      : 0;

  // =========================================================
  // CHANGE VIEW
  // =========================================================

  const handleViewChange = (newView) => {
    setView(newView);
    setError("");
  };

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="attendance-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="attendance-header">

        <button
          className="attendance-back-button"
          onClick={onBack}
          type="button"
        >
          ← Back
        </button>

        <div>

          <p className="page-label">
            ATTENDANCE MANAGEMENT
          </p>

          <h1>
            Attendance
          </h1>

          <p className="page-subtitle">
            View and manage student attendance records.
          </p>

        </div>

      </div>


      {/* =====================================================
          STATISTICS
      ===================================================== */}

      <div className="attendance-stats">

        {/* TOTAL */}

        <div className="attendance-stat-card">

          <div className="stat-icon total-icon">
            👥
          </div>

          <div>

            <p>
              Total Recorded
            </p>

            <h2>
              {totalStudents}
            </h2>

          </div>

        </div>


        {/* PRESENT */}

        <div className="attendance-stat-card">

          <div className="stat-icon present-icon">
            ✓
          </div>

          <div>

            <p>
              Present
            </p>

            <h2>
              {presentCount}
            </h2>

          </div>

        </div>


        {/* ABSENT */}

        <div className="attendance-stat-card">

          <div className="stat-icon absent-icon">
            ×
          </div>

          <div>

            <p>
              Absent
            </p>

            <h2>
              {absentCount}
            </h2>

          </div>

        </div>


        {/* RATE */}

        <div className="attendance-stat-card">

          <div className="stat-icon percentage-icon">
            %
          </div>

          <div>

            <p>
              Attendance Rate
            </p>

            <h2>
              {attendanceRate}%
            </h2>

          </div>

        </div>

      </div>


      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (

        <div
          style={{
            marginBottom: "20px",
            padding: "15px 20px",
            borderRadius: "10px",
            background: "#fff1f2",
            color: "#be123c",
            border: "1px solid #fecdd3",
          }}
        >
          {error}
        </div>

      )}


      {/* =====================================================
          MAIN ATTENDANCE CARD
      ===================================================== */}

      <div className="attendance-card">

        {/* ===================================================
            TOP
        =================================================== */}

        <div className="attendance-top">

          {/* TABS */}

          <div className="attendance-tabs">

            <button
              className={
                view === "daily"
                  ? "active"
                  : ""
              }
              onClick={() =>
                handleViewChange(
                  "daily"
                )
              }
              type="button"
            >
              Daily Attendance
            </button>

            <button
              className={
                view === "monthly"
                  ? "active"
                  : ""
              }
              onClick={() =>
                handleViewChange(
                  "monthly"
                )
              }
              type="button"
            >
              Monthly Attendance
            </button>

          </div>


          {/* DATE / MONTH */}

          <div className="attendance-filter">

            {view === "daily" ? (

              <input
                type="date"
                value={selectedDate}
                onChange={(e) =>
                  setSelectedDate(
                    e.target.value
                  )
                }
              />

            ) : (

              <input
                type="month"
                value={selectedMonth}
                onChange={(e) =>
                  setSelectedMonth(
                    e.target.value
                  )
                }
              />

            )}

          </div>

        </div>


        {/* ===================================================
            LOADING
        =================================================== */}

        {loading && (

          <div
            className="attendance-content"
            style={{
              textAlign: "center",
              padding: "60px 20px",
            }}
          >

            <div
              className="attendance-spinner"
              style={{
                margin: "0 auto 20px",
              }}
            ></div>

            <h3>
              Loading attendance...
            </h3>

            <p>
              Please wait.
            </p>

          </div>

        )}


        {/* ===================================================
            DAILY
        =================================================== */}

        {!loading &&
          view === "daily" && (

            <div className="attendance-content">

              {dailyAttendance.length === 0 ? (

                <div className="attendance-empty">

                  <div className="empty-icon">
                    📋
                  </div>

                  <h2>
                    No Attendance Records
                  </h2>

                  <p>
                    No attendance has been recorded
                    for
                    <strong>
                      {" "}
                      {selectedDate}
                    </strong>.
                  </p>

                  <span>
                    Attendance records will appear
                    here after students are recognized.
                  </span>

                </div>

              ) : (

                <div className="attendance-table-container">

                  <table className="attendance-table">

                    <thead>

                      <tr>

                        <th>
                          #
                        </th>

                        <th>
                          Student
                        </th>

                        <th>
                          Date
                        </th>

                        <th>
                          Time
                        </th>

                        <th>
                          Status
                        </th>

                      </tr>

                    </thead>


                    <tbody>

                      {dailyAttendance.map(
                        (student, index) => (

                          <tr
                            key={
                              student.id ||
                              index
                            }
                          >

                            {/* NUMBER */}

                            <td>
                              {index + 1}
                            </td>


                            {/* STUDENT */}

                            <td>

                              <div className="student-name-cell">

                                <div className="student-avatar">

                                  {(
                                    student.name ||
                                    "?"
                                  )
                                    .charAt(0)
                                    .toUpperCase()}

                                </div>

                                <span>
                                  {student.name ||
                                    "Unknown"}
                                </span>

                              </div>

                            </td>


                            {/* DATE */}

                            <td>
                              {student.date ||
                                selectedDate}
                            </td>


                            {/* TIME */}

                            <td>
                              {student.time ||
                                "--"}
                            </td>


                            {/* STATUS */}

                            <td>

                              <span
                                className={`attendance-status ${
                                  student.status ===
                                  "Present"
                                    ? "status-present"
                                    : "status-absent"
                                }`}
                              >

                                <span className="status-dot"></span>

                                {student.status ||
                                  "Unknown"}

                              </span>

                            </td>

                          </tr>

                        )
                      )}

                    </tbody>

                  </table>

                </div>

              )}

            </div>

          )}


        {/* ===================================================
            MONTHLY
        =================================================== */}

        {!loading &&
          view === "monthly" && (

            <div className="attendance-content">

              {monthlyStudents.length === 0 ? (

                <div className="attendance-empty">

                  <div className="empty-icon">
                    📊
                  </div>

                  <h2>
                    No Monthly Records
                  </h2>

                  <p>
                    No attendance records found
                    for
                    <strong>
                      {" "}
                      {selectedMonth}
                    </strong>.
                  </p>

                  <span>
                    Monthly attendance statistics will
                    appear here when records are available.
                  </span>

                </div>

              ) : (

                <div className="attendance-table-container">

                  <table className="attendance-table monthly-table">

                    <thead>

                      <tr>

                        <th>
                          #
                        </th>

                        <th>
                          Student
                        </th>

                        <th>
                          Present
                        </th>

                        <th>
                          Absent
                        </th>

                        <th>
                          Attendance
                        </th>

                      </tr>

                    </thead>


                    <tbody>

                      {monthlyStudents.map(
                        (student, index) => (

                          <tr
                            key={
                              student.id ||
                              index
                            }
                          >

                            {/* NUMBER */}

                            <td>
                              {index + 1}
                            </td>


                            {/* STUDENT */}

                            <td>

                              <div className="student-name-cell">

                                <div className="student-avatar">

                                  {(
                                    student.name ||
                                    "?"
                                  )
                                    .charAt(0)
                                    .toUpperCase()}

                                </div>

                                <span>
                                  {student.name ||
                                    "Unknown"}
                                </span>

                              </div>

                            </td>


                            {/* PRESENT */}

                            <td>

                              <span className="present-number">
                                {student.present ??
                                  0}
                              </span>

                            </td>


                            {/* ABSENT */}

                            <td>

                              <span className="absent-number">
                                {student.absent ??
                                  0}
                              </span>

                            </td>


                            {/* PERCENTAGE */}

                            <td>

                              <div className="percentage-cell">

                                <div className="percentage-bar">

                                  <div
                                    className="percentage-fill"
                                    style={{
                                      width: `${Math.min(
                                        100,
                                        Math.max(
                                          0,
                                          Number(
                                            student.percentage ||
                                              0
                                          )
                                        )
                                      )}%`,
                                    }}
                                  ></div>

                                </div>

                                <span>
                                  {
                                    student.percentage ??
                                      0
                                  }
                                  %
                                </span>

                              </div>

                            </td>

                          </tr>

                        )
                      )}

                    </tbody>

                  </table>

                </div>

              )}

            </div>

          )}

      </div>

    </div>
  );
}

export default Attendance;