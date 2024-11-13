// ExercisePlan.js
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { database } from '../firebase-config';
import { ref, set,get } from 'firebase/database';
import { motion } from 'framer-motion';
import { 
  FaCalendarAlt, 
  FaRunning, 
  FaHeartbeat, 
  FaDumbbell
} from 'react-icons/fa';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import Cookies from 'js-cookie';

function ExercisePlan(props) {
  const [formData, setFormData] = useState({
    intensityLevel: '',
    startDate: new Date(),
    endDate: new Date()
  });

  const [exerciseDetails, setExerciseDetails] = useState([]);

  useEffect(() => {
    props.setisFixed(false);
    // Fetch exercise details from Firebase
    fetchExerciseDetails();
  }, []);

  const fetchExerciseDetails = async () => {
    try {
      const userCookie = Cookies.get('user');
      if (!userCookie) {
        toast.error('User not authenticated');
        return;
      }
  
      const userCookieData = JSON.parse(userCookie);
      const exerciseRef = ref(database, `MaternalHealthSystem/users/${userCookieData.phone}/exercisePlans`);
      
      // Use get() instead of on() for one-time fetch
      const snapshot = await get(exerciseRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        const exerciseList = Object.values(data);
        setExerciseDetails(exerciseList);
      } else {
        setExerciseDetails([]);
      }
    } catch (error) {
      toast.error('Failed to fetch exercise details: ' + error.message);
    }
  };
  

  const [errors, setErrors] = useState({});

  const intensityLevels = [
    { value: 'low', label: 'Low - Suitable for beginners' },
    { value: 'moderate', label: 'Moderate - For regular exercisers' },
    { value: 'high', label: 'High - For advanced fitness levels' }
  ];

  const validateForm = () => {
    let tempErrors = {};
    let isValid = true;

    if (!formData.intensityLevel) {
      tempErrors.intensityLevel = 'Please select intensity level';
      isValid = false;
    }

    if (formData.startDate >= formData.endDate) {
      tempErrors.dateRange = 'End date must be after start date';
      isValid = false;
    }

    setErrors(tempErrors);
    return isValid;
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      try {
       
        const newExerPlan = {
          ...formData,
          startDate: formData.startDate.toISOString(),
          endDate: formData.endDate.toISOString(),
          createdAt: new Date().toISOString()
        };


        // Create a reference with a unique ID
        const userCookie = Cookies.get('user');
        const userCookieData = JSON.parse(userCookie);
        const exerciseRef = ref(database, `MaternalHealthSystem/users/${userCookieData.phone}/exercisePlans/` + Date.now());
        await set(exerciseRef, newExerPlan);

        toast.success('Exercise plan created successfully!');
        resetForm();
      } catch (error) {
        toast.error('Failed to create exercise plan: ' + error.message);
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      intensityLevel: '',
      startDate: new Date(),
      endDate: new Date()
    });
    setErrors({});
  };

  return (
    <motion.div
      className="container mt-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{marginBottom:"150px"}}
    >
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card shadow">
            <div className="card-body">
              <h2 className="text-center mb-4">
                <FaDumbbell className="me-2" />
                Exercise Plan
              </h2>

              <form onSubmit={handleSubmit}>
                <div className="form-group mb-3">
                  <label className="mb-2">
                    <FaHeartbeat className="me-2" />
                    Intensity Level
                  </label>
                  <select
                    className={`form-select ${errors.intensityLevel ? 'is-invalid' : ''}`}
                    name="intensityLevel"
                    value={formData.intensityLevel}
                    onChange={handleChange}
                  >
                    <option value="">Select Intensity Level</option>
                    {intensityLevels.map(level => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                  {errors.intensityLevel && 
                    <div className="invalid-feedback d-block">{errors.intensityLevel}</div>
                  }
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="mb-2">
                      <FaCalendarAlt className="me-2" />
                      Start Date
                    </label>
                    <DatePicker
                      selected={formData.startDate}
                      onChange={date => setFormData(prev => ({ ...prev, startDate: date }))}
                      className="form-control"
                      minDate={new Date()}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="mb-2">
                      <FaCalendarAlt className="me-2" />
                      End Date
                    </label>
                    <DatePicker
                      selected={formData.endDate}
                      onChange={date => setFormData(prev => ({ ...prev, endDate: date }))}
                      className="form-control"
                      minDate={formData.startDate}
                    />
                  </div>
                  {errors.dateRange && 
                    <div className="text-danger mt-2">{errors.dateRange}</div>
                  }
                </div>

                <motion.button
                type="submit"
                className="btn btn-primary w-100 mb-4"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Create Exercise Plan
              </motion.button>
              
              </form>

              {/* Read-only Exercise Details Section */}
              <div className="exercises-section mt-4">
                <h4 className="mb-3">
                  <FaRunning className="me-2" />
                  Your Exercise Details
                </h4>
                
                {exerciseDetails.length > 0 ? (
                  exerciseDetails.map((exercise, index) => (
                    <motion.div
                      key={index}
                      className="card mb-3"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="card-body">
                        <h5 className="card-title">{exercise.name}</h5>
                        <p className="card-text">{exercise.description}</p>
                        <p className="card-text"><small className="text-muted">Duration: {exercise.duration}</small></p>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-center text-muted">
                    Exercise details will be added by the admin.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default ExercisePlan;
