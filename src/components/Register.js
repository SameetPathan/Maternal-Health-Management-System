import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  Form,
  FormGroup,
  Label,
  Input,
  Button,
  Spinner,
  Alert
} from 'reactstrap';
import { Link, useNavigate } from 'react-router-dom';
import { ref, set } from "firebase/database";
import { database } from '../firebase-config';

import { toast } from 'react-toastify';
import { FaUser, FaEnvelope, FaPhone, FaWeight, FaHistory, FaLock } from 'react-icons/fa';
import { motion } from 'framer-motion';
const Register = (props) => {
  const navigate = useNavigate();
  const [userType, setUserType] = useState('user');
  const [formData, setFormData] = useState({
    userType: 'user',
    name: '',
    age: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    // User specific fields
    medicalHistory: '',
    currentWeight: '',
    // Hospital/Doctor specific fields
    specialization: '',
    licenseNumber: '',
    hospitalName: '',
    experience: '',
    address: ''
  });

  useEffect(() => {
    props.setisFixed(false);
  }, []);

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = 'Phone number must be 10 digits';
    }

    if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // User specific validation
    if (userType === 'user') {
      if (!formData.age || formData.age < 18 || formData.age > 50) {
        newErrors.age = 'Age must be between 18 and 50';
      }
      if (!formData.medicalHistory.trim()) {
        newErrors.medicalHistory = 'Medical history is required';
      }
      if (!formData.currentWeight || formData.currentWeight < 30) {
        newErrors.currentWeight = 'Please enter a valid weight';
      }
    }

    // Hospital/Doctor specific validation
    if (userType === 'hospital') {
      if (!formData.specialization.trim()) {
        newErrors.specialization = 'Specialization is required';
      }
      if (!formData.licenseNumber.trim()) {
        newErrors.licenseNumber = 'License number is required';
      }
      if (!formData.hospitalName.trim()) {
        newErrors.hospitalName = 'Hospital name is required';
      }
      if (!formData.experience) {
        newErrors.experience = 'Years of experience is required';
      }
      if (!formData.address.trim()) {
        newErrors.address = 'Address is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

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
    
    if (validateForm()) {
      setTimeout(() => {
        setShowSuccess(true);
        setIsLoading(false);
        setFormData({
          userType: 'user',
          name: '',
          age: '',
          email: '',
          phone: '',
          password: '',
          confirmPassword: '',
          medicalHistory: '',
          currentWeight: '',
          specialization: '',
          licenseNumber: '',
          hospitalName: '',
          experience: '',
          address: ''
        });
      }, 1500);
    } else {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'userType') {
      setUserType(value);
    }
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const purpleTheme = {
    backgroundColor: '#6B5B95',
    color: 'white'
  };

  return (
    <div className="min-h-screen py-5" style={{ backgroundColor: '#f8f9fa' }}>
      <Container>
        <Row className="justify-content-center">
          <Col lg="10">
            <Card className="shadow">
              <Row className="g-0">
                <Col md="8">
                  <CardBody className="p-4">
                    <h2 className="display-6 fw-bold mb-3">Create Account</h2>
                    <p className="text-muted mb-4">Join our maternal health community</p>

                    {showSuccess && (
                      <Alert color="success" toggle={() => setShowSuccess(false)}>
                        Registration successful! Please check your email for verification.
                      </Alert>
                    )}

                    <Form onSubmit={handleSubmit}>
                      <FormGroup className="mb-4">
                        <Label for="userType">Register as</Label>
                        <Input
                          type="select"
                          name="userType"
                          id="userType"
                          value={userType}
                          onChange={handleChange}
                        >
                          <option value="user">Patient</option>
                          <option value="hospital">Healthcare Provider</option>
                        </Input>
                      </FormGroup>

                      <Row>
                        {/* Common Fields */}
                        <Col md="6">
                          <FormGroup>
                            <Label for="name">Full Name</Label>
                            <Input
                              type="text"
                              name="name"
                              id="name"
                              placeholder="Enter your full name"
                              value={formData.name}
                              onChange={handleChange}
                              invalid={!!errors.name}
                            />
                            {errors.name && <div className="text-danger small mt-1">{errors.name}</div>}
                          </FormGroup>
                        </Col>

                        <Col md="6">
                          <FormGroup>
                            <Label for="email">Email Address</Label>
                            <Input
                              type="email"
                              name="email"
                              id="email"
                              placeholder="Enter your email"
                              value={formData.email}
                              onChange={handleChange}
                              invalid={!!errors.email}
                            />
                            {errors.email && <div className="text-danger small mt-1">{errors.email}</div>}
                          </FormGroup>
                        </Col>

                        {/* Conditional Fields based on userType */}
                        {userType === 'user' ? (
                          // User specific fields
                          <>
                            <Col md="6">
                              <FormGroup>
                                <Label for="age">Age</Label>
                                <Input
                                  type="number"
                                  name="age"
                                  id="age"
                                  placeholder="Enter your age"
                                  value={formData.age}
                                  onChange={handleChange}
                                  invalid={!!errors.age}
                                />
                                {errors.age && <div className="text-danger small mt-1">{errors.age}</div>}
                              </FormGroup>
                            </Col>

                            <Col md="12">
                              <FormGroup>
                                <Label for="medicalHistory">Medical History</Label>
                                <Input
                                  type="textarea"
                                  name="medicalHistory"
                                  id="medicalHistory"
                                  placeholder="Enter your medical history"
                                  rows="3"
                                  value={formData.medicalHistory}
                                  onChange={handleChange}
                                  invalid={!!errors.medicalHistory}
                                />
                                {errors.medicalHistory && <div className="text-danger small mt-1">{errors.medicalHistory}</div>}
                              </FormGroup>
                            </Col>

                            <Col md="6">
                              <FormGroup>
                                <Label for="currentWeight">Current Weight (kg)</Label>
                                <Input
                                  type="number"
                                  name="currentWeight"
                                  id="currentWeight"
                                  placeholder="Enter your current weight"
                                  value={formData.currentWeight}
                                  onChange={handleChange}
                                  invalid={!!errors.currentWeight}
                                />
                                {errors.currentWeight && <div className="text-danger small mt-1">{errors.currentWeight}</div>}
                              </FormGroup>
                            </Col>
                          </>
                        ) : (
                          // Hospital/Doctor specific fields
                          <>
                            <Col md="6">
                              <FormGroup>
                                <Label for="specialization">Specialization</Label>
                                <Input
                                  type="text"
                                  name="specialization"
                                  id="specialization"
                                  placeholder="Enter your specialization"
                                  value={formData.specialization}
                                  onChange={handleChange}
                                  invalid={!!errors.specialization}
                                />
                                {errors.specialization && <div className="text-danger small mt-1">{errors.specialization}</div>}
                              </FormGroup>
                            </Col>

                            <Col md="6">
                              <FormGroup>
                                <Label for="licenseNumber">License Number</Label>
                                <Input
                                  type="text"
                                  name="licenseNumber"
                                  id="licenseNumber"
                                  placeholder="Enter your license number"
                                  value={formData.licenseNumber}
                                  onChange={handleChange}
                                  invalid={!!errors.licenseNumber}
                                />
                                {errors.licenseNumber && <div className="text-danger small mt-1">{errors.licenseNumber}</div>}
                              </FormGroup>
                            </Col>

                            <Col md="6">
                              <FormGroup>
                                <Label for="hospitalName">Hospital/Clinic Name</Label>
                                <Input
                                  type="text"
                                  name="hospitalName"
                                  id="hospitalName"
                                  placeholder="Enter hospital/clinic name"
                                  value={formData.hospitalName}
                                  onChange={handleChange}
                                  invalid={!!errors.hospitalName}
                                />
                                {errors.hospitalName && <div className="text-danger small mt-1">{errors.hospitalName}</div>}
                              </FormGroup>
                            </Col>

                            <Col md="6">
                              <FormGroup>
                                <Label for="experience">Years of Experience</Label>
                                <Input
                                  type="number"
                                  name="experience"
                                  id="experience"
                                  placeholder="Enter years of experience"
                                  value={formData.experience}
                                  onChange={handleChange}
                                  invalid={!!errors.experience}
                                />
                                {errors.experience && <div className="text-danger small mt-1">{errors.experience}</div>}
                              </FormGroup>
                            </Col>

                            <Col md="12">
                              <FormGroup>
                                <Label for="address">Practice Address</Label>
                                <Input
                                  type="textarea"
                                  name="address"
                                  id="address"
                                  placeholder="Enter your practice address"
                                  rows="3"
                                  value={formData.address}
                                  onChange={handleChange}
                                  invalid={!!errors.address}
                                />
                                {errors.address && <div className="text-danger small mt-1">{errors.address}</div>}
                              </FormGroup>
                            </Col>
                          </>
                        )}

                        {/* Common fields continued */}
                        <Col md="6">
                          <FormGroup>
                            <Label for="phone">Phone Number</Label>
                            <Input
                              type="tel"
                              name="phone"
                              id="phone"
                              placeholder="Enter your phone number"
                              value={formData.phone}
                              onChange={handleChange}
                              invalid={!!errors.phone}
                            />
                            {errors.phone && <div className="text-danger small mt-1">{errors.phone}</div>}
                          </FormGroup>
                        </Col>

                        <Col md="6">
                          <FormGroup>
                            <Label for="password">Password</Label>
                            <Input
                              type="password"
                              name="password"
                              id="password"
                              placeholder="Enter your password"
                              value={formData.password}
                              onChange={handleChange}
                              invalid={!!errors.password}
                            />
                            {errors.password && <div className="text-danger small mt-1">{errors.password}</div>}
                          </FormGroup>
                        </Col>

                        <Col md="6">
                          <FormGroup>
                            <Label for="confirmPassword">Confirm Password</Label>
                            <Input
                              type="password"
                              name="confirmPassword"
                              id="confirmPassword"
                              placeholder="Confirm your password"
                              value={formData.confirmPassword}
                              onChange={handleChange}
                              invalid={!!errors.confirmPassword}
                            />
                            {errors.confirmPassword && <div className="text-danger small mt-1">{errors.confirmPassword}</div>}
                          </FormGroup>
                        </Col>
                      </Row>

                      <Button
                        type="submit"
                        className="w-100 mt-4"
                        size="lg"
                        style={purpleTheme}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Spinner size="sm" className="me-2" />
                            Registering...
                          </>
                        ) : (
                          'Register'
                        )}
                      </Button>

                      <div className="text-center mt-4">
                        <p className="text-muted">
                          Already have an account?{' '}
                          <a
                            href="#"
                            onClick={(e) => e.preventDefault()}
                            style={{ color: '#6B5B95', textDecoration: 'none' }}
                          >
                            Login here
                          </a>
                        </p>
                      </div>
                    </Form>
                  </CardBody>
                </Col>

                {/* Info Section */}
                <Col md="4" style={purpleTheme}>
                  <div className="p-4 h-100 d-flex flex-column justify-content-center">
                    <h3 className="h4 fw-bold mb-4">
                      {userType === 'user' 
                        ? 'Welcome to Maternal Health System'
                        : 'Join Our Healthcare Network'}
                    </h3>
                    <p className="mb-4">
                      {userType === 'user'
                        ? 'Join our community of mothers for better maternal care.'
                        : 'Connect with patients and provide expert maternal healthcare services.'}
                    </p>
                    <ul className="list-unstyled">
                      {userType === 'user' ? (
                        <>
                          <li className="mb-3 d-flex align-items-center">
                            <i className="bi bi-check-circle-fill me-2"></i>
                            24/7 Support
                          </li>
                          <li className="mb-3 d-flex align-items-center">
                            <i className="bi bi-check-circle-fill me-2"></i>
                            Expert Healthcare Advice
                          </li>
                          <li className="mb-3 d-flex align-items-center">
                            <i className="bi bi-check-circle-fill me-2"></i>
                            Secure & Private
                          </li>
                        </>
                      ) : (
                        <>
                          <li className="mb-3 d-flex align-items-center">
                            <i className="bi bi-check-circle-fill me-2"></i>
                            Manage Patient Records
                          </li>
                          <li className="mb-3 d-flex align-items-center">
                            <i className="bi bi-check-circle-fill me-2"></i>
                            Schedule Appointments
                          </li>
                          <li className="mb-3 d-flex align-items-center">
                            <i className="bi bi-check-circle-fill me-2"></i>
                            Secure Communication
                          </li>
                        </>
                      )}
                    </ul>
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Register;