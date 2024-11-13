// App.js
import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import Cookies from "js-cookie";
import Register from "./components/Register";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import "bootstrap/dist/css/bootstrap.min.css";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";
import Home from "./components/Home";
import SonographyReport from "./components/SonographyReport";
import DietPlan from "./components/DietPlan";
import ExercisePlan from "./components/ExercisePlan";
import WeightManagement from "./components/WeightManagement";
import HealthTracking from "./components/HealthTracking";
import MedicalAppointments from "./components/MedicalAppointments";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState(null);
  const [isFixed, setisFixed] = useState(false);

  useEffect(() => {
    const userCookie = Cookies.get("user");
    if (userCookie) {
      setIsAuthenticated(true);
      setUserData(JSON.parse(userCookie));
    }
  }, []);

  const handleLogin = (user) => {
    setIsAuthenticated(true);
    setUserData(user);
    Cookies.set("user", JSON.stringify(user), { expires: 7 });
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserData(null);
    Cookies.remove("user");
  };

  return (
    <Router>
      <div className="App">
        <Navbar isAuthenticated={isAuthenticated} onLogout={handleLogout} />
        <ToastContainer position="top-right" />
        <Routes>
          <Route path="/" element={<Home setisFixed={setisFixed} />} />
          <Route
            path="/register"
            element={
              !isAuthenticated ? (
                <Register setisFixed={setisFixed} />
              ) : (
                <Navigate to="/dashboard" />
              )
            }
          />
          <Route
            path="/login"
            element={
              !isAuthenticated ? (
                <Login onLogin={handleLogin} setisFixed={setisFixed} />
              ) : (
                <Navigate to="/dashboard" />
              )
            }
          />
          <Route
            path="/dashboard"
            element={
              isAuthenticated ? (
                <Dashboard
                  setisFixed={setisFixed}
                  user={userData}
                  onLogout={handleLogout}
                />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/sonography"
            element={
              isAuthenticated ? (
                <SonographyReport setisFixed={setisFixed} />
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          <Route
            path="/diet-plan"
            element={
              isAuthenticated ? (
                <DietPlan setisFixed={setisFixed} user={userData} />
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          <Route
            path="/exercise-plan"
            element={
              isAuthenticated ? (
                <ExercisePlan setisFixed={setisFixed} />
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          <Route
            path="/weight-management"
            element={
              isAuthenticated ? (
                <WeightManagement
                  setisFixed={setisFixed}
                  userId={userData.id}
                />
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          <Route
            path="/health-tracking"
            element={
              isAuthenticated ? (
                <HealthTracking setisFixed={setisFixed} userId={userData.id} />
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          <Route 
            path="/medical-appointments" 
            element={
              isAuthenticated ? 
              <MedicalAppointments setisFixed={setisFixed} userId={userData.id} /> : 
              <Navigate to="/login" />
            } 
          />


          <Route
            path="/"
            element={
              <Navigate to={isAuthenticated ? "/dashboard" : "/login"} />
            }
          />
        </Routes>
        <Footer isFixed={isFixed} />
      </div>
    </Router>
  );
}

export default App;
