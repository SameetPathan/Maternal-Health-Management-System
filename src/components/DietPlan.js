// DietPlanForm.js
import React, { useState,useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { 
  FaWeight, 
  FaTint, 
  FaNotesMedical, 
  FaAllergies, 
  FaClock, 
  FaCalendarAlt 
} from 'react-icons/fa';
import { database } from '../firebase-config';
import { ref, set } from 'firebase/database';
import Cookies from 'js-cookie';

function DietPlanForm(props) {
  const [formData, setFormData] = useState({
    currentWeight: '',
    bloodSugar: '',
    medicalConditions: '',
    allergies: '',
    preferredMealTimes: {
      breakfast: '',
      lunch: '',
      dinner: ''
    }
  });

  useEffect(() => {
    props.setisFixed(false);
  }, []);

  const [errors, setErrors] = useState({});
  const [dietPlan, setDietPlan] = useState(null);

  const validateForm = () => {
    let tempErrors = {};
    let isValid = true;

    if (!formData.currentWeight || formData.currentWeight < 30) {
      tempErrors.currentWeight = 'Please enter a valid weight';
      isValid = false;
    }

    if (!formData.bloodSugar || formData.bloodSugar < 70 || formData.bloodSugar > 400) {
      tempErrors.bloodSugar = 'Please enter a valid blood sugar level';
      isValid = false;
    }

    if (!formData.medicalConditions.trim()) {
      tempErrors.medicalConditions = 'Please enter any medical conditions or "None"';
      isValid = false;
    }

    setErrors(tempErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      try {
        const startDate = new Date().toISOString().split('T')[0];
        const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const newDietPlan = {
          ...formData,
          startDate,
          endDate,
          createdAt: Date.now()
        };

        // Create a reference with a unique ID
        const userCookie = Cookies.get('user');
        const userCookieData = JSON.parse(userCookie);
        const dietPlanRef = ref(database, `MaternalHealthSystem/users/${userCookieData.phone}/dietPlans/` + Date.now());
        await set(dietPlanRef, newDietPlan);
        
        setDietPlan(newDietPlan);
        toast.success('Diet plan created successfully!');
      } catch (error) {
        toast.error('Failed to create diet plan: ' + error.message);
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

  const handleTimeChange = (meal, time) => {
    setFormData(prev => ({
      ...prev,
      preferredMealTimes: {
        ...prev.preferredMealTimes,
        [meal]: time
      }
    }));
  };

  return (
    <motion.div
      className="container mt-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card shadow">
            <div className="card-body">
              <h2 className="text-center mb-4">Create Your Diet Plan</h2>
              
              <form onSubmit={handleSubmit}>
                <div className="form-group mb-3">
                  <div className="input-group">
                    <span className="input-group-text">
                      <FaWeight />
                    </span>
                    <input
                      type="number"
                      className={`form-control ${errors.currentWeight ? 'is-invalid' : ''}`}
                      name="currentWeight"
                      placeholder="Current Weight (kg)"
                      value={formData.currentWeight}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.currentWeight && <div className="invalid-feedback d-block">{errors.currentWeight}</div>}
                </div>

                <div className="form-group mb-3">
                  <div className="input-group">
                    <span className="input-group-text">
                      <FaTint />
                    </span>
                    <input
                      type="number"
                      className={`form-control ${errors.bloodSugar ? 'is-invalid' : ''}`}
                      name="bloodSugar"
                      placeholder="Blood Sugar Level (mg/dL)"
                      value={formData.bloodSugar}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.bloodSugar && <div className="invalid-feedback d-block">{errors.bloodSugar}</div>}
                </div>

                <div className="form-group mb-3">
                  <div className="input-group">
                    <span className="input-group-text">
                      <FaNotesMedical />
                    </span>
                    <textarea
                      className={`form-control ${errors.medicalConditions ? 'is-invalid' : ''}`}
                      name="medicalConditions"
                      placeholder="Medical Conditions"
                      value={formData.medicalConditions}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.medicalConditions && <div className="invalid-feedback d-block">{errors.medicalConditions}</div>}
                </div>

                <div className="form-group mb-3">
                  <div className="input-group">
                    <span className="input-group-text">
                      <FaAllergies />
                    </span>
                    <textarea
                      className="form-control"
                      name="allergies"
                      placeholder="Food Allergies (if any)"
                      value={formData.allergies}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-group mb-3">
                  <label className="mb-2"><FaClock /> Preferred Meal Times</label>
                  <div className="row g-3">
                    <div className="col-md-4">
                      <input
                        type="time"
                        className="form-control"
                        value={formData.preferredMealTimes.breakfast}
                        onChange={(e) => handleTimeChange('breakfast', e.target.value)}
                      />
                      <small className="text-muted">Breakfast</small>
                    </div>
                    <div className="col-md-4">
                      <input
                        type="time"
                        className="form-control"
                        value={formData.preferredMealTimes.lunch}
                        onChange={(e) => handleTimeChange('lunch', e.target.value)}
                      />
                      <small className="text-muted">Lunch</small>
                    </div>
                    <div className="col-md-4">
                      <input
                        type="time"
                        className="form-control"
                        value={formData.preferredMealTimes.dinner}
                        onChange={(e) => handleTimeChange('dinner', e.target.value)}></input>
                      <small className="text-muted">Dinner</small>
                    </div>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  className="btn btn-primary w-100 mt-3"
                >
                  Generate Diet Plan
                </motion.button>
              </form>

              {dietPlan && (
                <motion.div
                  className="mt-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="card">
                    <div className="card-body">
                      <h4 className="mb-3">Your Diet Plan</h4>
                      <p>
                        <FaCalendarAlt className="me-2" />
                        <strong>Start Date:</strong> {dietPlan.startDate}
                      </p>
                      <p>
                        <FaCalendarAlt className="me-2" />
                        <strong>End Date:</strong> {dietPlan.endDate}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default DietPlanForm;
