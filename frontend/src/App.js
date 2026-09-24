import React, { useState } from "react";

import Home from "./pages/Home";
import Menu from "./pages/Menu";
import RegisterStudent from "./pages/RegisterStudent";
import TakeAttendance from "./pages/TakeAttendance";
import Attendance from "./pages/Attendance";

import "./App.css";

function App() {
  const [currentPage, setCurrentPage] = useState("home");

  // Home → Menu
  const handleStart = () => {
    setCurrentPage("menu");
  };

  // Menu → Register Student
  const handleRegister = () => {
    setCurrentPage("register");
  };

  // Menu → Take Attendance
  const handleTakeAttendance = () => {
    setCurrentPage("take-attendance");
  };

  // Menu → Attendance
  const handleAttendance = () => {
    setCurrentPage("attendance");
  };

  // Any page → Menu
  const handleBackToMenu = () => {
    setCurrentPage("menu");
  };

  // Render current page
  switch (currentPage) {
    case "home":
      return <Home onStart={handleStart} />;

    case "menu":
      return (
        <Menu
          onRegister={handleRegister}
          onTakeAttendance={handleTakeAttendance}
          onAttendance={handleAttendance}
          onBack={() => setCurrentPage("home")}
        />
      );

    case "register":
      return (
        <RegisterStudent
          onBack={handleBackToMenu}
        />
      );

    case "take-attendance":
      return (
        <TakeAttendance
          onBack={handleBackToMenu}
        />
      );

    case "attendance":
      return (
        <Attendance
          onBack={handleBackToMenu}
        />
      );

    default:
      return <Home onStart={handleStart} />;
  }
}

export default App;