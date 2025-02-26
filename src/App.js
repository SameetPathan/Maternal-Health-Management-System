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
import Hospitals from "./components/Hospitals";
import ChatBot from "./components/ChatBot";

// Hospital components
import HospitalDashboard from "./components/HospitalDashboard";
import PatientRecords from "./components/PatientRecords";
import HospitalReviews from "./components/HospitalReviews";

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

  // Helper to check if user is a hospital
  const isHospitalUser = userData?.userType === "hospital";

  return (
    <Router>
      <div className="App">
        <Navbar
          userData={userData}
          isAuthenticated={isAuthenticated}
          onLogout={handleLogout}
        />
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

          {/* Dashboard route based on user type */}
          <Route
            path="/dashboard"
            element={
              isAuthenticated ? (
                isHospitalUser ? (
                  <HospitalDashboard
                    setisFixed={setisFixed}
                    user={userData}
                    onLogout={handleLogout}
                  />
                ) : (
                  <Dashboard
                    setisFixed={setisFixed}
                    user={userData}
                    onLogout={handleLogout}
                  />
                )
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          {/* Patient/User specific routes */}
          <Route
            path="/sonography"
            element={
              isAuthenticated && !isHospitalUser ? (
                <SonographyReport setisFixed={setisFixed} />
              ) : (
                <Navigate to={isAuthenticated ? "/dashboard" : "/login"} />
              )
            }
          />

          <Route
            path="/diet-plan"
            element={
              isAuthenticated && !isHospitalUser ? (
                <DietPlan setisFixed={setisFixed} user={userData} />
              ) : (
                <Navigate to={isAuthenticated ? "/dashboard" : "/login"} />
              )
            }
          />

          <Route
            path="/exercise-plan"
            element={
              isAuthenticated && !isHospitalUser ? (
                <ExercisePlan setisFixed={setisFixed} />
              ) : (
                <Navigate to={isAuthenticated ? "/dashboard" : "/login"} />
              )
            }
          />

          <Route
            path="/weight-management"
            element={
              isAuthenticated && !isHospitalUser ? (
                <WeightManagement
                  setisFixed={setisFixed}
                  userId={userData?.id}
                />
              ) : (
                <Navigate to={isAuthenticated ? "/dashboard" : "/login"} />
              )
            }
          />

          <Route
            path="/health-tracking"
            element={
              isAuthenticated && !isHospitalUser ? (
                <HealthTracking setisFixed={setisFixed} userId={userData?.id} />
              ) : (
                <Navigate to={isAuthenticated ? "/dashboard" : "/login"} />
              )
            }
          />

          <Route
            path="/medical-appointments"
            element={
              isAuthenticated && !isHospitalUser ? (
                <MedicalAppointments
                  setisFixed={setisFixed}
                  userId={userData?.id}
                />
              ) : (
                <Navigate to={isAuthenticated ? "/dashboard" : "/login"} />
              )
            }
          />

          <Route
            path="/hospitals"
            element={
              isAuthenticated && !isHospitalUser ? (
                <Hospitals
                  setisFixed={setisFixed}
                  user={userData}
                  userId={userData?.id}
                />
              ) : (
                <Navigate to={isAuthenticated ? "/dashboard" : "/login"} />
              )
            }
          />

          <Route
            path="/patient-records"
            element={
              isAuthenticated && isHospitalUser ? (
                <PatientRecords
                  setisFixed={setisFixed}
                  hospitalData={userData}
                />
              ) : (
                <Navigate to={isAuthenticated ? "/dashboard" : "/login"} />
              )
            }
          />

          <Route
            path="/reviews"
            element={
              isAuthenticated && isHospitalUser ? (
                <HospitalReviews
                  setisFixed={setisFixed}
                  hospitalData={userData}
                />
              ) : (
                <Navigate to={isAuthenticated ? "/dashboard" : "/login"} />
              )
            }
          />

          {/* ChatBot route - available for both users and hospitals */}
          <Route
            path="/chat"
            element={
              isAuthenticated ? (
                <ChatBot setisFixed={setisFixed} currentUser={userData} />
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          {/* Default route */}
          <Route
            path="*"
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
