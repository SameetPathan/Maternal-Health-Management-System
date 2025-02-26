import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ref, update } from 'firebase/database';
import { database } from '../firebase-config';
import { toast } from 'react-toastify';
import { 
  FaSignOutAlt, FaUser, FaEnvelope, FaPhone, 
  FaPencilAlt, FaSave, FaTimes, FaHospital, 
  FaMedkit, FaUserMd, FaCalendarCheck, 
  FaStethoscope, FaBriefcaseMedical, FaNotesMedical
} from 'react-icons/fa';
import Cookies from "js-cookie";
import { FaStar } from 'react-icons/fa';

function HospitalDashboard(props) {
  const { user, onLogout } = props;
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({ ...user });
  const [stats, setStats] = useState({
    patientCount: 0,
    appointmentsToday: 0,
    reviewsCount: 0
  });

  useEffect(() => {
    props.setisFixed(false);
    // Here you would fetch real stats from Firebase
    // For now using placeholder data
    setStats({
      patientCount: 24,
      appointmentsToday: 8,
      reviewsCount: 16
    });
  }, []);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      const userRef = ref(database, `MaternalHealthSystem/users/${user.phone}`);
      await update(userRef, {
        ...editedData,
        phone: user.phone
      });
      const userDataForCookie = {
        ...editedData,
        phone: user.phone,
        userType: 'hospital' 
      }
      Cookies.set("user", JSON.stringify(userDataForCookie), { expires: 7 });
      toast.success('Hospital profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      toast.error('Update failed: ' + error.message);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  const healthcareStats = [
    {
      icon: FaUser,
      label: "Patients",
      value: stats.patientCount,
      color: "text-primary"
    },
    {
      icon: FaCalendarCheck,
      label: "Today's Appointments",
      value: stats.appointmentsToday,
      color: "text-success"
    },
    {
      icon: FaStar,
      label: "Reviews",
      value: stats.reviewsCount,
      color: "text-warning"
    }
  ];

  return (
    <div className="min-vh-100 py-5 bg-light">
      <motion.div
        className="container"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Welcome Banner */}
        <motion.div 
          className="card mb-4 border-0 shadow-lg"
          style={{
            borderRadius: "20px",
            background: "linear-gradient(135deg, #6B5B95 0%, #9370DB 100%)"
          }}
        >
          <div className="card-body p-4">
            <div className="row align-items-center">
              <div className="col-md-6">
                <h1 className="display-6 fw-bold mb-3 text-white">Welcome, Dr. {user.name}!</h1>
                <p className="lead mb-0 text-white">Manage your maternal healthcare services</p>
              </div>
              <div className="col-md-6">
      
              </div>
            </div>
          </div>
        </motion.div>

 

        {/* Hospital Profile Section */}
        <motion.div 
          className="card border-0 shadow-lg"
          style={{ borderRadius: "20px" }}
          whileHover={{ boxShadow: "0px 10px 30px rgba(0,0,0,0.1)" }}
          variants={itemVariants}
        >
          <div className="card-body p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4 className="mb-0 text-primary fw-bold">Hospital Information</h4>
              {!isEditing ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn btn-outline-primary rounded-pill px-4"
                  onClick={handleEdit}
                >
                  <FaPencilAlt className="me-2" />
                  Edit Profile
                </motion.button>
              ) : (
                <div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn btn-success rounded-pill px-4 me-2"
                    onClick={handleSave}
                  >
                    <FaSave className="me-2" />
                    Save Changes
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn btn-outline-danger rounded-pill px-4"
                    onClick={() => setIsEditing(false)}
                  >
                    <FaTimes className="me-2" />
                    Cancel
                  </motion.button>
                </div>
              )}
            </div>

            <div className="row g-4">
              <div className="col-md-6">
                <div className="form-floating">
                  <input
                    type="text"
                    className={`form-control ${isEditing ? '' : 'bg-light'}`}
                    id="name"
                    name="name"
                    value={isEditing ? editedData.name : user.name}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="Name"
                  />
                  <label htmlFor="name">
                    <FaUserMd className="me-2 text-primary" />
                    Doctor Name
                  </label>
                </div>
              </div>

              <div className="col-md-6">
                <div className="form-floating">
                  <input
                    type="text"
                    className={`form-control ${isEditing ? '' : 'bg-light'}`}
                    id="hospitalName"
                    name="hospitalName"
                    value={isEditing ? editedData.hospitalName : user.hospitalName}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="Hospital Name"
                  />
                  <label htmlFor="hospitalName">
                    <FaHospital className="me-2 text-primary" />
                    Hospital Name
                  </label>
                </div>
              </div>

              <div className="col-md-6">
                <div className="form-floating">
                  <input
                    type="email"
                    className={`form-control ${isEditing ? '' : 'bg-light'}`}
                    id="email"
                    name="email"
                    value={isEditing ? editedData.email : user.email}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="Email"
                  />
                  <label htmlFor="email">
                    <FaEnvelope className="me-2 text-primary" />
                    Email Address
                  </label>
                </div>
              </div>

              <div className="col-md-6">
                <div className="form-floating">
                  <input
                    type="tel"
                    className="form-control bg-light"
                    id="phone"
                    value={user.phone}
                    disabled
                    placeholder="Phone"
                  />
                  <label htmlFor="phone">
                    <FaPhone className="me-2 text-primary" />
                    Phone Number
                  </label>
                </div>
              </div>

              <div className="col-md-6">
                <div className="form-floating">
                  <input
                    type="text"
                    className={`form-control ${isEditing ? '' : 'bg-light'}`}
                    id="specialization"
                    name="specialization"
                    value={isEditing ? editedData.specialization : user.specialization}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="Specialization"
                  />
                  <label htmlFor="specialization">
                    <FaStethoscope className="me-2 text-primary" />
                    Specialization
                  </label>
                </div>
              </div>

              <div className="col-md-6">
                <div className="form-floating">
                  <input
                    type="text"
                    className={`form-control ${isEditing ? '' : 'bg-light'}`}
                    id="licenseNumber"
                    name="licenseNumber"
                    value={isEditing ? editedData.licenseNumber : user.licenseNumber}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="License Number"
                  />
                  <label htmlFor="licenseNumber">
                    <FaBriefcaseMedical className="me-2 text-primary" />
                    License Number
                  </label>
                </div>
              </div>

              <div className="col-12">
              <label htmlFor="hospitalDescription">
              <FaNotesMedical className="me-2 text-primary" />
              Hospital Description
            </label>
                <div className="form-floating">
                  <textarea
                    className={`form-control ${isEditing ? '' : 'bg-light'}`}
                    id="hospitalDescription"
                    name="hospitalDescription"
                    value={isEditing ? editedData.hospitalDescription : (user.hospitalDescription || 'No description provided.')}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="Hospital Description"
                    style={{ height: "120px" }}
                  />
                 
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}



export default HospitalDashboard;