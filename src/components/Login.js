import React, { useState, useEffect } from 'react';
import { ref, query, orderByChild, equalTo, get } from 'firebase/database';
import { database } from '../firebase-config';
import { toast } from 'react-toastify';
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

const Login = ({ onLogin, setisFixed }) => {
  const [userType, setUserType] = useState('user');
  const [formData, setFormData] = useState({
    userType: 'user',
    phone: '',
    password: '',
    // Additional field for healthcare providers
    licenseNumber: ''
  });

  useEffect(() => {
    setisFixed(false);
  }, []);

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showError, setShowError] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    if (!/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = 'Phone number must be 10 digits';
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
      isValid = false;
    }

    // Additional validation for healthcare providers
    if (userType === 'hospital' && !formData.licenseNumber.trim()) {
      newErrors.licenseNumber = 'License number is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setShowError(false);
    
    if (validateForm()) {
      try {
        const usersRef = ref(database, `MaternalHealthSystem/users/`);
        const userQuery = query(usersRef, orderByChild('phone'), equalTo(formData.phone));
        const snapshot = await get(userQuery);
        
        if (snapshot.exists()) {
          const userData = Object.values(snapshot.val())[0];
          
          // Additional validation for healthcare providers
          if (userType === 'hospital' && userData.licenseNumber !== formData.licenseNumber) {
            toast.error('Invalid license number');
            setIsLoading(false);
            return;
          }
          
          if (btoa(formData.password) === userData.password) {
            const userDataForCookie = userType === 'user' ? {
              name: userData.name,
              email: userData.email,
              phone: userData.phone,
              age: userData.age,
              medicalHistory: userData.medicalHistory,
              currentWeight: userData.currentWeight,
              userType: 'user'
            } : {
              name: userData.name,
              email: userData.email,
              phone: userData.phone,
              licenseNumber: userData.licenseNumber,
              specialization: userData.specialization,
              hospitalName: userData.hospitalName,
              userType: 'hospital'
            };
            
            onLogin(userDataForCookie);
            toast.success('Login successful!');
            
            // Reset form
            setFormData({
              userType: 'user',
              phone: '',
              password: '',
              licenseNumber: ''
            });
          } else {
            toast.error('Invalid credentials');
          }
        } else {
          toast.error('User not found');
        }
      } catch (error) {
        toast.error('Login failed: ' + error.message);
        setShowError(true);
      } finally {
        setIsLoading(false);
      }
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
    // Clear error when user starts typing
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
          <Col lg="8">
            <Card className="shadow">
              <Row className="g-0">
                {/* Left side - Info Section */}
                <Col md="6" style={purpleTheme}>
                  <div className="p-4 h-100 d-flex flex-column justify-content-center">
                    <h3 className="h4 fw-bold mb-4">
                      {userType === 'user' 
                        ? 'Welcome Back!'
                        : 'Welcome Healthcare Provider!'}
                    </h3>
                    <p className="mb-4">
                      {userType === 'user'
                        ? 'Access your maternal health journey and connect with our caring community.'
                        : 'Access your dashboard to manage patients and appointments.'}
                    </p>
                    <ul className="list-unstyled">
                      {userType === 'user' ? (
                        <>
                          <li className="mb-3 d-flex align-items-center">
                            <i className="bi bi-check-circle-fill me-2"></i>
                            Personalized Care Plans
                          </li>
                          <li className="mb-3 d-flex align-items-center">
                            <i className="bi bi-check-circle-fill me-2"></i>
                            Health Tracking
                          </li>
                          <li className="mb-3 d-flex align-items-center">
                            <i className="bi bi-check-circle-fill me-2"></i>
                            Expert Support
                          </li>
                        </>
                      ) : (
                        <>
                          <li className="mb-3 d-flex align-items-center">
                            <i className="bi bi-check-circle-fill me-2"></i>
                            Patient Management
                          </li>
                          <li className="mb-3 d-flex align-items-center">
                            <i className="bi bi-check-circle-fill me-2"></i>
                            Appointment Scheduling
                          </li>
                          <li className="mb-3 d-flex align-items-center">
                            <i className="bi bi-check-circle-fill me-2"></i>
                            Medical Records Access
                          </li>
                        </>
                      )}
                    </ul>
                  </div>
                </Col>

                {/* Right side - Login Form */}
                <Col md="6">
                  <CardBody className="p-4">
                    <h2 className="display-6 fw-bold mb-3">Login</h2>
                    <p className="text-muted mb-4">
                      {userType === 'user'
                        ? 'Welcome back to your maternal health journey'
                        : 'Welcome back to your healthcare dashboard'}
                    </p>

                    {showError && (
                      <Alert color="danger" toggle={() => setShowError(false)}>
                        Invalid credentials. Please try again.
                      </Alert>
                    )}

                    <Form onSubmit={handleSubmit}>
                      <FormGroup className="mb-4">
                        <Label for="userType">Login as</Label>
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

                      <FormGroup className="mb-4">
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

                      {userType === 'hospital' && (
                        <FormGroup className="mb-4">
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
                      )}

                      <FormGroup className="mb-4">
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

                      <Button
                        type="submit"
                        className="w-100"
                        size="lg"
                        style={purpleTheme}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Spinner size="sm" className="me-2" />
                            Logging in...
                          </>
                        ) : (
                          'Login'
                        )}
                      </Button>

                      <div className="text-center mt-4">
                        <p className="text-muted">
                          Don't have an account?{' '}
                          <a
                            href="#"
                            onClick={(e) => e.preventDefault()}
                            style={{ color: '#6B5B95', textDecoration: 'none' }}
                          >
                            Register here
                          </a>
                        </p>
                      </div>
                    </Form>
                  </CardBody>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Login;