// Register.js
import React, { useState,useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ref, set } from "firebase/database";
import { database } from '../firebase-config';

import { toast } from 'react-toastify';
import { FaUser, FaEnvelope, FaPhone, FaWeight, FaHistory, FaLock } from 'react-icons/fa';
import { motion } from 'framer-motion';

function Register(props) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    email: '',
    phone: '',
    medicalHistory: '',
    currentWeight: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    let tempErrors = {};
    let isValid = true;

    if (!formData.name.trim()) {
      tempErrors.name = 'Name is required';
      isValid = false;
    }

    if (!formData.age || formData.age < 18 || formData.age > 50) {
      tempErrors.age = 'Age must be between 18 and 50';
      isValid = false;
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      tempErrors.email = 'Email is invalid';
      isValid = false;
    }

    if (!/^\d{10}$/.test(formData.phone)) {
      tempErrors.phone = 'Phone number must be 10 digits';
      isValid = false;
    }

    if (!formData.medicalHistory.trim()) {
      tempErrors.medicalHistory = 'Medical history is required';
      isValid = false;
    }

    if (!formData.currentWeight || formData.currentWeight < 30) {
      tempErrors.currentWeight = 'Please enter a valid weight';
      isValid = false;
    }

    if (formData.password.length < 6) {
      tempErrors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    if (formData.password !== formData.confirmPassword) {
      tempErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    setErrors(tempErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      try {
        const newUserRef = ref(database, 'MaternalHealthSystem/users/' + formData.phone);
        await set(newUserRef, {
          ...formData,
          password: btoa(formData.password)
        });

        toast.success('Registration successful!');
        navigate('/login');
      } catch (error) {
        toast.error('Registration failed: ' + error.message);
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

  useEffect(() => {
    props.setisFixed(false);
  }, []);

  return (
    <motion.div 
      className="container mt-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow">
            <div className="card-body">
              <h2 className="text-center mb-4">Register</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-group mb-3">
                  <div className="input-group">
                    <span className="input-group-text">
                      <FaUser />
                    </span>
                    <input
                      type="text"
                      className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                      name="name"
                      placeholder="Full Name"
                      value={formData.name}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.name && <div className="invalid-feedback d-block">{errors.name}</div>}
                </div>

                <div className="form-group mb-3">
                  <div className="input-group">
                    <span className="input-group-text">
                      <FaUser />
                    </span>
                    <input
                      type="number"
                      className={`form-control ${errors.age ? 'is-invalid' : ''}`}
                      name="age"
                      placeholder="Age"
                      value={formData.age}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.age && <div className="invalid-feedback d-block">{errors.age}</div>}
                </div>

                <div className="form-group mb-3">
                  <div className="input-group">
                    <span className="input-group-text">
                      <FaEnvelope />
                    </span>
                    <input
                      type="email"
                      className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                      name="email"
                      placeholder="Email Address"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.email && <div className="invalid-feedback d-block">{errors.email}</div>}
                </div>

                <div className="form-group mb-3">
                  <div className="input-group">
                    <span className="input-group-text">
                      <FaPhone />
                    </span>
                    <input
                      type="tel"
                      className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                      name="phone"
                      placeholder="Phone Number"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.phone && <div className="invalid-feedback d-block">{errors.phone}</div>}
                </div>

                <div className="form-group mb-3">
                  <div className="input-group">
                    <span className="input-group-text">
                      <FaHistory />
                    </span>
                    <textarea
                      className={`form-control ${errors.medicalHistory ? 'is-invalid' : ''}`}
                      name="medicalHistory"
                      placeholder="Medical History"
                      value={formData.medicalHistory}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.medicalHistory && <div className="invalid-feedback d-block">{errors.medicalHistory}</div>}
                </div>

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
                    <FaLock />
                  </span>
                  <input
                    type="password"
                    className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>
              
                  {errors.password && <div className="invalid-feedback d-block">{errors.password}</div>}
                </div>

                <div className="form-group mb-3">
                  <div className="input-group">
                    <span className="input-group-text">
                      <FaLock />
                    </span>
                    <input
                      type="password"
                      className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                      name="confirmPassword"
                      placeholder="Confirm Password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.confirmPassword && <div className="invalid-feedback d-block">{errors.confirmPassword}</div>}
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  className="btn btn-primary w-100 mt-3"
                >
                  Register
                </motion.button>
              </form>
              
              <div className="text-center mt-3">
                Already have an account? <Link to="/login">Login here</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default Register;
