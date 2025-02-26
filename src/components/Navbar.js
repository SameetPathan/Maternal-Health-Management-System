// components/Navbar.js
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FaUser,
  FaSignInAlt,
  FaHeart,
  FaSignOutAlt,
  FaXRay,
  FaUtensils,
  FaDumbbell,
  FaHeartbeat,
  FaCalendarPlus,
  FaBars,
  FaTimes,
  FaHospital,
  FaTachometerAlt,
  FaStar,
  FaComments,
} from "react-icons/fa";

function Navbar({ isAuthenticated, onLogout, userData }) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  // Determine user type from userData
  const userType = userData?.userType || "user";
  const isHospital = userType === "hospital";

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark mb-4 sticky-top">
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center" to="/">
          <FaHeart className="me-2 text-danger" size={24} />
          <span
            className="d-none d-sm-inline"
            style={{
              fontSize: "1.5rem",
              fontWeight: "bold",
              textShadow: "1px 1px 2px rgba(0,0,0,0.1)",
            }}
          >
            Mom Care
          </span>
          <span
            className="d-sm-none"
            style={{
              fontSize: "1.2rem",
              fontWeight: "bold",
            }}
          >
            MCare
          </span>
        </Link>

        <button
          className="navbar-toggler border-0"
          type="button"
          onClick={toggleMenu}
        >
          {isOpen ? (
            <FaTimes className="navbar-toggler-icon" />
          ) : (
            <FaBars className="navbar-toggler-icon" />
          )}
        </button>

        <div className={`collapse navbar-collapse ${isOpen ? "show" : ""}`}>
          <ul className="navbar-nav ms-auto">
            {!isAuthenticated ? (
              <>
                <li className="nav-item my-2 my-lg-0 mx-lg-2">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link
                      className="nav-link btn btn-outline-success px-4 rounded-pill w-100"
                      to="/register"
                      onClick={() => setIsOpen(false)}
                    >
                      <FaUser className="me-2" />
                      Register
                    </Link>
                  </motion.div>
                </li>
                <li className="nav-item my-2 my-lg-0 mx-lg-2">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link
                      className="nav-link btn btn-light text-success px-4 rounded-pill w-100"
                      to="/login"
                      onClick={() => setIsOpen(false)}
                    >
                      <FaSignInAlt className="me-2" />
                      Login
                    </Link>
                  </motion.div>
                </li>
              </>
            ) : isHospital ? (
              // Hospital user navigation items
              <>
                <li className="nav-item">
                  <Link
                    className="nav-link px-4 py-2"
                    to="/dashboard"
                    onClick={() => setIsOpen(false)}
                  >
                    <FaTachometerAlt className="me-2" />
                    Dashboard
                  </Link>
                </li>

                <li className="nav-item">
                  <Link
                    className="nav-link px-4 py-2"
                    to="/patient-records"
                    onClick={() => setIsOpen(false)}
                  >
                    <FaUser className="me-2" />
                    Patients
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    className="nav-link px-4 py-2"
                    to="/reviews"
                    onClick={() => setIsOpen(false)}
                  >
                    <FaStar className="me-2" />
                    Reviews
                  </Link>
                </li>
                {/* Chat link for regular users */}
                <li className="nav-item">
                  <Link
                    className="nav-link px-4 py-2"
                    to="/chat"
                    onClick={() => setIsOpen(false)}
                  >
                    <FaComments className="me-2" />
                    Messages
                  </Link>
                </li>
                <li className="nav-item mt-3 mt-lg-0 ms-lg-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn btn-light text-danger px-4 rounded-pill w-100"
                    onClick={() => {
                      setIsOpen(false);
                      onLogout();
                    }}
                  >
                    <FaSignOutAlt className="me-2" />
                    Logout
                  </motion.button>
                </li>
              </>
            ) : (
              // Regular user navigation items
              <>
                <li className="nav-item">
                  <Link
                    className="nav-link px-4 py-2"
                    to="/sonography"
                    onClick={() => setIsOpen(false)}
                  >
                    <FaXRay className="me-2" />
                    Sonography
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    className="nav-link px-4 py-2"
                    to="/diet-plan"
                    onClick={() => setIsOpen(false)}
                  >
                    <FaUtensils className="me-2" />
                    Diet
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    className="nav-link px-4 py-2"
                    to="/exercise-plan"
                    onClick={() => setIsOpen(false)}
                  >
                    <FaDumbbell className="me-2" />
                    Exercise
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    className="nav-link px-4 py-2"
                    to="/weight-management"
                    onClick={() => setIsOpen(false)}
                  >
                    <FaDumbbell className="me-2" />
                    Weight
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    className="nav-link px-4 py-2"
                    to="/health-tracking"
                    onClick={() => setIsOpen(false)}
                  >
                    <FaHeartbeat className="me-2" />
                    Health
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    className="nav-link px-4 py-2"
                    to="/medical-appointments"
                    onClick={() => setIsOpen(false)}
                  >
                    <FaCalendarPlus className="me-2" />
                    Appointments
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    className="nav-link px-4 py-2"
                    to="/hospitals"
                    onClick={() => setIsOpen(false)}
                  >
                    <FaHospital className="me-2" />
                    Hospitals
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    className="nav-link px-4 py-2"
                    to="/chat"
                    onClick={() => setIsOpen(false)}
                  >
                    <FaComments className="me-2" />
                    Messages
                  </Link>
                </li>
                <li className="nav-item mt-3 mt-lg-0 ms-lg-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn btn-light text-danger px-4 rounded-pill w-100"
                    onClick={() => {
                      setIsOpen(false);
                      onLogout();
                    }}
                  >
                    <FaSignOutAlt className="me-2" />
                    Logout
                  </motion.button>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
