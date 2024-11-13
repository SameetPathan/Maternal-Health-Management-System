// components/MedicalAppointments.js
import React, { useState, useEffect } from 'react';
import { ref, set, onValue, off } from "firebase/database";
import { database } from '../firebase-config';
import Cookies from 'js-cookie';

import { toast } from 'react-toastify';
import { FaUserMd, FaMapMarkerAlt, FaCalendar, FaClock,FaMdb } from 'react-icons/fa';
import { motion } from 'framer-motion';

function MedicalAppointments(props) {
  const { userId } = props;
  const [appointments, setAppointments] = useState([]);
  const [formData, setFormData] = useState({
    doctorName: '',
    location: '',
    date: '',
    time: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    props.setisFixed(false);
  }, []);


  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      try {
        const userCookie = Cookies.get('user');
        const userCookieData = JSON.parse(userCookie);
        
        let appointmentData = {
          ...formData,
          timestamp: Date.now()
        };

        // Create reference using new syntax
        const appointmentRef = ref(database, `MaternalHealthSystem/users/${userCookieData.phone}/appointments/${Date.now()}`);
        await set(appointmentRef, appointmentData);
        
        setFormData({
          doctorName: '',
          location: '',
          date: '',
          time: ''
        });
        
        toast.success('Appointment scheduled successfully!');
      } catch (error) {
        toast.error('Failed to schedule appointment: ' + error.message);
      }
    }
};

useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const userCookie = Cookies.get('user');
        const userCookieData = JSON.parse(userCookie);
        
        // Create reference using new syntax
        const appointmentsRef = ref(database, `MaternalHealthSystem/users/${userCookieData.phone}/appointments`);
        
        onValue(appointmentsRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const appointmentsList = Object.keys(data).map(key => ({
              id: key,
              ...data[key]
            }));
            setAppointments(appointmentsList);
          } else {
            setAppointments([]);
          }
        });

      } catch (error) {
        toast.error('Error fetching appointments');
      }
    };

    fetchAppointments();

    // Cleanup subscription
    return () => {
      const userCookie = Cookies.get('user');
      const userCookieData = JSON.parse(userCookie);
      const appointmentsRef = ref(database, `MaternalHealthSystem/users/${userCookieData.phone}/appointments`);
      off(appointmentsRef);
    };
}, []);


  const validateForm = () => {
    let tempErrors = {};
    let isValid = true;

    if (!formData.doctorName.trim()) {
      tempErrors.doctorName = 'Doctor name is required';
      isValid = false;
    }

    if (!formData.location.trim()) {
      tempErrors.location = 'Location is required';
      isValid = false;
    }

    if (!formData.date) {
      tempErrors.date = 'Date is required';
      isValid = false;
    }

    if (!formData.time) {
      tempErrors.time = 'Time is required';
      isValid = false;
    }

    setErrors(tempErrors);
    return isValid;
  };



  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <motion.div 
      className="container mt-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="row">
        <div className="col-md-6">
          <div className="card shadow mb-4">
            <div className="card-body">
              <h3 className="card-title mb-4">Schedule Appointment</h3>
              <form onSubmit={handleSubmit}>
                <div className="form-group mb-3">
                  <div className="input-group">
                    <span className="input-group-text">
                      <FaUserMd />
                    </span>
                    <input
                      type="text"
                      className={`form-control ${errors.doctorName ? 'is-invalid' : ''}`}
                      name="doctorName"
                      placeholder="Doctor's Name"
                      value={formData.doctorName}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.doctorName && <div className="invalid-feedback d-block">{errors.doctorName}</div>}
                </div>

                <div className="form-group mb-3">
                  <div className="input-group">
                    <span className="input-group-text">
                      <FaMapMarkerAlt />
                    </span>
                    <input
                      type="text"
                      className={`form-control ${errors.location ? 'is-invalid' : ''}`}
                      name="location"
                      placeholder="Location"
                      value={formData.location}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.location && <div className="invalid-feedback d-block">{errors.location}</div>}
                </div>

                <div className="form-group mb-3">
                  <div className="input-group">
                    <span className="input-group-text">
                      <FaCalendar />
                    </span>
                    <input
                      type="date"
                      className={`form-control ${errors.date ? 'is-invalid' : ''}`}
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.date && <div className="invalid-feedback d-block">{errors.date}</div>}
                </div>

                <div className="form-group mb-3">
                  <div className="input-group">
                    <span className="input-group-text">
                      <FaClock />
                    </span>
                    <input
                      type="time"
                      className={`form-control ${errors.time ? 'is-invalid' : ''}`}
                      name="time"
                      value={formData.time}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.time && <div className="invalid-feedback d-block">{errors.time}</div>}
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  className="btn btn-primary w-100"
                >
                  Schedule Appointment
                </motion.button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card shadow">
            <div className="card-body">
              <h3 className="card-title mb-4">Your Appointments</h3>
              {appointments.length === 0 ? (
                <p className="text-muted">No appointments scheduled</p>
              ) : (
                appointments.map(appointment => (
                  <motion.div 
                    key={appointment.id}
                    className="card mb-3"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <div className="card-body">
                      <h5 className="card-title">
                      <FaMdb className="me-2" />
                        {appointment.doctorName}
                      </h5>
                      <p className="card-text">
                        <FaMapMarkerAlt className="me-2" />
                        {appointment.location}
                      </p>
                      <p className="card-text">
                        <FaCalendar className="me-2" />
                        {appointment.date}
                        <FaClock className="ms-3 me-2" />
                        {appointment.time}
                      </p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default MedicalAppointments;
