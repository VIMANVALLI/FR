import sqlite3
from pathlib import Path
from datetime import datetime


# =========================================================
# DATABASE PATH
# =========================================================

BASE_DIR = Path(__file__).resolve().parent

DATABASE_FILE = BASE_DIR / "attendance.db"


# =========================================================
# DATABASE CONNECTION
# =========================================================

def get_connection():
    """
    Create a connection to SQLite database.
    """

    connection = sqlite3.connect(
        DATABASE_FILE
    )

    connection.row_factory = sqlite3.Row

    return connection


# =========================================================
# CREATE TABLES
# =========================================================

def create_tables():
    """
    Create required database tables.
    """

    connection = get_connection()

    cursor = connection.cursor()

    # -----------------------------------------------------
    # STUDENTS TABLE
    # -----------------------------------------------------

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_name TEXT NOT NULL UNIQUE,
            mother_name TEXT NOT NULL,
            father_name TEXT NOT NULL,
            father_phone TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
        """
    )

    # -----------------------------------------------------
    # ATTENDANCE TABLE
    # -----------------------------------------------------

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS attendance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_name TEXT NOT NULL,
            attendance_date TEXT NOT NULL,
            attendance_time TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'Present',
            UNIQUE(student_name, attendance_date)
        )
        """
    )

    connection.commit()

    connection.close()


# =========================================================
# STUDENT FUNCTIONS
# =========================================================

def add_student(
    student_name,
    mother_name,
    father_name,
    father_phone
):
    """
    Add a new student to the database.

    Returns:
        Dictionary containing student information.
        None if student already exists.
    """

    connection = get_connection()

    cursor = connection.cursor()

    try:

        created_at = datetime.now().isoformat(
            timespec="seconds"
        )

        cursor.execute(
            """
            INSERT INTO students (
                student_name,
                mother_name,
                father_name,
                father_phone,
                created_at
            )
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                student_name,
                mother_name,
                father_name,
                father_phone,
                created_at
            )
        )

        connection.commit()

        student_id = cursor.lastrowid

        return {
            "id": student_id,
            "student_name": student_name,
            "mother_name": mother_name,
            "father_name": father_name,
            "father_phone": father_phone,
            "created_at": created_at
        }

    except sqlite3.IntegrityError:

        return None

    finally:

        connection.close()


# =========================================================
# GET STUDENT
# =========================================================

def get_student(student_name):
    """
    Get a student by name.
    """

    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT *
        FROM students
        WHERE student_name = ?
        """,
        (student_name,)
    )

    student = cursor.fetchone()

    connection.close()

    if student is None:
        return None

    return dict(student)


# =========================================================
# GET ALL STUDENTS
# =========================================================

def get_all_students():
    """
    Return all registered students.
    """

    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT *
        FROM students
        ORDER BY student_name ASC
        """
    )

    students = cursor.fetchall()

    connection.close()

    return [
        dict(student)
        for student in students
    ]


# =========================================================
# CHECK STUDENT
# =========================================================

def student_exists(student_name):
    """
    Check whether a student already exists.
    """

    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT id
        FROM students
        WHERE student_name = ?
        """,
        (student_name,)
    )

    student = cursor.fetchone()

    connection.close()

    return student is not None


# =========================================================
# DELETE STUDENT
# =========================================================

def delete_student(student_name):
    """
    Delete student from database.

    Note:
    This does not delete the student's face dataset.
    """

    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute(
        """
        DELETE FROM students
        WHERE student_name = ?
        """,
        (student_name,)
    )

    deleted = cursor.rowcount > 0

    connection.commit()

    connection.close()

    return deleted


# =========================================================
# ATTENDANCE
# =========================================================

def mark_attendance(
    student_name,
    attendance_date=None,
    attendance_time=None
):
    """
    Mark attendance once per student per day.

    Returns:
        marked = True  -> newly marked
        marked = False -> already marked
    """

    connection = get_connection()

    cursor = connection.cursor()

    if attendance_date is None:

        attendance_date = datetime.now().strftime(
            "%Y-%m-%d"
        )

    if attendance_time is None:

        attendance_time = datetime.now().strftime(
            "%I:%M %p"
        )

    # -----------------------------------------------------
    # Check existing attendance
    # -----------------------------------------------------

    cursor.execute(
        """
        SELECT id
        FROM attendance
        WHERE student_name = ?
        AND attendance_date = ?
        """,
        (
            student_name,
            attendance_date
        )
    )

    existing = cursor.fetchone()

    if existing:

        connection.close()

        return {
            "marked": False,
            "message": "Attendance already marked for today."
        }

    # -----------------------------------------------------
    # Insert attendance
    # -----------------------------------------------------

    cursor.execute(
        """
        INSERT INTO attendance (
            student_name,
            attendance_date,
            attendance_time,
            status
        )
        VALUES (?, ?, ?, ?)
        """,
        (
            student_name,
            attendance_date,
            attendance_time,
            "Present"
        )
    )

    connection.commit()

    connection.close()

    return {
        "marked": True,
        "message": "Attendance marked successfully."
    }


# =========================================================
# DAILY ATTENDANCE
# =========================================================

def get_daily_attendance(
    attendance_date=None
):
    """
    Get attendance for one date.
    """

    connection = get_connection()

    cursor = connection.cursor()

    if attendance_date is None:

        attendance_date = datetime.now().strftime(
            "%Y-%m-%d"
        )

    cursor.execute(
        """
        SELECT
            id,
            student_name,
            attendance_date,
            attendance_time,
            status
        FROM attendance
        WHERE attendance_date = ?
        ORDER BY attendance_time ASC
        """,
        (attendance_date,)
    )

    records = cursor.fetchall()

    connection.close()

    return [
        {
            "id": record["id"],
            "name": record["student_name"],
            "date": record["attendance_date"],
            "time": record["attendance_time"],
            "status": record["status"]
        }
        for record in records
    ]


# =========================================================
# MONTHLY ATTENDANCE
# =========================================================

def get_monthly_attendance(
    month=None
):
    """
    Get attendance summary for a month.

    month format:
        YYYY-MM
    """

    connection = get_connection()

    cursor = connection.cursor()

    if month is None:

        month = datetime.now().strftime(
            "%Y-%m"
        )

    cursor.execute(
        """
        SELECT
            student_name,
            COUNT(*) AS present
        FROM attendance
        WHERE attendance_date LIKE ?
        GROUP BY student_name
        ORDER BY student_name ASC
        """,
        (
            month + "%",
        )
    )

    records = cursor.fetchall()

    connection.close()

    result = []

    for index, record in enumerate(records):

        present = record["present"]

        result.append(
            {
                "id": index + 1,
                "name": record["student_name"],
                "present": present,
                "absent": 0,
                "percentage": 100 if present > 0 else 0
            }
        )

    return result


# =========================================================
# INITIALIZE DATABASE
# =========================================================

create_tables()