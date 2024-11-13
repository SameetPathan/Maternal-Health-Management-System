// Dashboard.js
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ref, update } from 'firebase/database';
import { database } from '../firebase-config';
import { toast } from 'react-toastify';
import { 
  FaSignOutAlt, FaUser, FaEnvelope, FaPhone, 
  FaWeight, FaHistory, FaPencilAlt, FaSave, FaTimes 
} from 'react-icons/fa';
import Cookies from "js-cookie";

function Dashboard(props) {
  const { user, onLogout } = props;
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({ ...user });

  useEffect(() => {
    props.setisFixed(false);
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
        phone: user.phone // Prevent phone number from being updated as it's the key
      });
      const userDataForCookie = {
        ...editedData,
        phone: user.phone 
      }
      Cookies.set("user", JSON.stringify(userDataForCookie), { expires: 7 });
      toast.success('Profile updated successfully!');
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

  return (
    <motion.div
      className="container mt-5"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="row">
        <div className="col-md-8 mx-auto">
          <motion.div 
            className="card shadow-lg"
            whileHover={{ boxShadow: "0px 10px 20px rgba(0,0,0,0.2)" }}
          >
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <motion.h2 
                  variants={itemVariants}
                  className="text-primary"
                >
                  Welcome, {user.name}
                </motion.h2>
               
              </div>

              <motion.div variants={itemVariants} className="user-info">
                <div className="d-flex justify-content-between align-items-center">
                  <h4 className="mb-4 text-secondary">Your Information</h4>
                  {!isEditing ? (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="btn btn-outline-primary"
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
                        className="btn btn-success me-2"
                        onClick={handleSave}
                      >
                        <FaSave className="me-2" />
                        Save
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="btn btn-outline-danger"
                        onClick={() => setIsEditing(false)}
                      >
                        <FaTimes className="me-2" />
                        Cancel
                      </motion.button>
                    </div>
                  )}
                </div>
                
                <motion.div 
                className="card mb-3 border-0 bg-light"
                variants={itemVariants}
              >
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">
                        <FaUser className="me-2 text-primary" />
                        Name
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          className="form-control"
                          name="name"
                          value={editedData.name}
                          onChange={handleChange}
                        />
                      ) : (
                        <p className="form-control-plaintext">{user.name}</p>
                      )}
                    </div>
              
                    <div className="col-md-6 mb-3">
                      <label className="form-label">
                        <FaUser className="me-2 text-primary" />
                        Age
                      </label>
                      {isEditing ? (
                        <input
                          type="number"
                          className="form-control"
                          name="age"
                          value={editedData.age}
                          onChange={handleChange}
                        />
                      ) : (
                        <p className="form-control-plaintext">{user.age}</p>
                      )}
                    </div>
              
                    <div className="col-md-6 mb-3">
                      <label className="form-label">
                        <FaEnvelope className="me-2 text-primary" />
                        Email
                      </label>
                      {isEditing ? (
                        <input
                          type="email"
                          className="form-control"
                          name="email"
                          value={editedData.email}
                          onChange={handleChange}
                        />
                      ) : (
                        <p className="form-control-plaintext">{user.email}</p>
                      )}
                    </div>
              
                    <div className="col-md-6 mb-3">
                      <label className="form-label">
                        <FaPhone className="me-2 text-primary" />
                        Phone Number
                      </label>
                      <p className="form-control-plaintext">{user.phone}</p>
                    </div>
              
                    <div className="col-md-6 mb-3">
                      <label className="form-label">
                        <FaWeight className="me-2 text-primary" />
                        Current Weight (kg)
                      </label>
                      {isEditing ? (
                        <input
                          type="number"
                          className="form-control"
                          name="currentWeight"
                          value={editedData.currentWeight}
                          onChange={handleChange}
                        />
                      ) : (
                        <p className="form-control-plaintext">{user.currentWeight}</p>
                      )}
                    </div>
              
                    <div className="col-md-12 mb-3">
                      <label className="form-label">
                        <FaHistory className="me-2 text-primary" />
                        Medical History
                      </label>
                      {isEditing ? (
                        <textarea
                          className="form-control"
                          name="medicalHistory"
                          value={editedData.medicalHistory}
                          onChange={handleChange}
                          rows="4"
                        />
                      ) : (
                        <p className="form-control-plaintext">{user.medicalHistory}</p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

export default Dashboard;
