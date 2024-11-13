// Login.js
import React, { useState,useEffect } from 'react';
import { Link,useNavigate } from 'react-router-dom';
import { ref, push, set, query, orderByChild, equalTo, get } from "firebase/database";
import { database } from '../firebase-config';
import { toast } from 'react-toastify';
import { FaPhone, FaLock } from 'react-icons/fa';
import { motion } from 'framer-motion';

const Login = (props) => {
  const { onLogin } = props; 
  const navigate = useNavigate(); 
  const [formData, setFormData] = useState({
    phone: '',
    password: ''
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    let tempErrors = {};
    let isValid = true;

    if (!/^\d{10}$/.test(formData.phone)) {
      tempErrors.phone = 'Phone number must be 10 digits';
      isValid = false;
    }

    if (!formData.password) {
      tempErrors.password = 'Password is required';
      isValid = false;
    }

    setErrors(tempErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      try {
        const usersRef = ref(database, 'MaternalHealthSystem/users');
        const userQuery = query(usersRef, orderByChild('phone'), equalTo(formData.phone));
        const snapshot = await get(userQuery);
        
        if (snapshot.exists()) {
          const userData = Object.values(snapshot.val())[0];
          if (btoa(formData.password) === userData.password) {
            const userDataForCookie = {
              name: userData.name,
              email: userData.email,
              phone: userData.phone,
              age: userData.age,
              medicalHistory: userData.medicalHistory,
              currentWeight: userData.currentWeight,
            };
            
            onLogin(userDataForCookie);
            toast.success('Login successful!');
          } else {
            toast.error('Invalid credentials');
          }
        } else {
          toast.error('User not found');
        }
      } catch (error) {
        toast.error('Login failed: ' + error.message);
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
    props.setisFixed(true);
  }, []);

  return (
    <motion.div 
      className="container mt-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="row justify-content-center">
        <div className="col-md-4">
          <div className="card shadow">
            <div className="card-body">
              <h2 className="text-center mb-4">Login</h2>
              <form onSubmit={handleSubmit}>
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

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  className="btn btn-primary w-100 mt-3"
                >
                  Login
                </motion.button>
              </form>
              
              <div className="text-center mt-3">
                Don't have an account? <Link to="/register">Register here</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default Login;
