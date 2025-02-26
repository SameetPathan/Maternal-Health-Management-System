import React, { useState, useEffect } from 'react';
import { ref, set, onValue, off } from "firebase/database";
import { database } from '../firebase-config';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';

function MedicalAppointments(props) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    doctorName: '',
    location: '',
    date: '',
    time: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    props.setisFixed(false);
    const fetchAppointments = async () => {
      try {
        const userCookie = Cookies.get('user');
        const userCookieData = JSON.parse(userCookie);
        const appointmentsRef = ref(database, `MaternalHealthSystem/users/${userCookieData.phone}/appointments`);
        
        onValue(appointmentsRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const appointmentsList = Object.keys(data).map(key => ({
              id: key,
              ...data[key]
            }));
            setAppointments(appointmentsList.sort((a, b) => new Date(a.date) - new Date(b.date)));
          } else {
            setAppointments([]);
          }
        });
      } catch (error) {
        toast.error('Error fetching appointments');
      }
    };

    fetchAppointments();

    return () => {
      const userCookie = Cookies.get('user');
      const userCookieData = JSON.parse(userCookie);
      const appointmentsRef = ref(database, `MaternalHealthSystem/users/${userCookieData.phone}/appointments`);
      off(appointmentsRef);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      setLoading(true);
      try {
        const userCookie = Cookies.get('user');
        const userCookieData = JSON.parse(userCookie);
        
        const appointmentData = {
          ...formData,
          timestamp: Date.now()
        };

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
      } finally {
        setLoading(false);
      }
    }
  };

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
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  return (
    <div className="container py-5" style={{marginBottom: "150px"}}>
      <div className="row g-4">
        <div className="col-lg-5">
          <div className="card shadow-sm border-0 rounded-3">
            <div className="card-header py-3" style={{ backgroundColor: '#7555C6', color: 'white' }}>
              <h4 className="mb-0 fw-bold">Schedule Appointment</h4>
            </div>
            <div className="card-body p-4">
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="form-label fw-semibold">Doctor's Name</label>
                  <input
                    type="text"
                    className={`form-control form-control-lg ${errors.doctorName ? 'is-invalid' : ''}`}
                    name="doctorName"
                    placeholder="Enter doctor's name"
                    value={formData.doctorName}
                    onChange={handleChange}
                  />
                  {errors.doctorName && 
                    <div className="invalid-feedback">{errors.doctorName}</div>
                  }
                </div>

                <div className="mb-4">
                  <label className="form-label fw-semibold">Location</label>
                  <input
                    type="text"
                    className={`form-control form-control-lg ${errors.location ? 'is-invalid' : ''}`}
                    name="location"
                    placeholder="Enter clinic/hospital location"
                    value={formData.location}
                    onChange={handleChange}
                  />
                  {errors.location && 
                    <div className="invalid-feedback">{errors.location}</div>
                  }
                </div>

                <div className="mb-4">
                  <label className="form-label fw-semibold">Date</label>
                  <input
                    type="date"
                    className={`form-control form-control-lg ${errors.date ? 'is-invalid' : ''}`}
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                  />
                  {errors.date && 
                    <div className="invalid-feedback">{errors.date}</div>
                  }
                </div>

                <div className="mb-4">
                  <label className="form-label fw-semibold">Time</label>
                  <input
                    type="time"
                    className={`form-control form-control-lg ${errors.time ? 'is-invalid' : ''}`}
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                  />
                  {errors.time && 
                    <div className="invalid-feedback">{errors.time}</div>
                  }
                </div>

                <button
                  type="submit"
                  className="btn btn-lg w-100 text-white"
                  style={{ backgroundColor: '#7555C6' }}
                  disabled={loading}
                >
                  {loading ? (
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  ) : null}
                  Schedule Appointment
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-lg-7">
          <div className="card shadow-sm border-0 rounded-3">
            <div className="card-header py-3" style={{ backgroundColor: '#7555C6', color: 'white' }}>
              <h4 className="mb-0 fw-bold">Upcoming Appointments</h4>
            </div>
            <div className="card-body p-4">
              {appointments.length === 0 ? (
                <div className="text-center py-5">
                  <div className="mb-3">
                   
                  </div>
                  <h5 className="text-muted">No appointments scheduled</h5>
                  <p className="text-muted mb-0">Your upcoming appointments will appear here</p>
                </div>
              ) : (
                <div className="row g-4">
                  {appointments.map(appointment => (
                    <div key={appointment.id} className="col-12">
                      <div className="card h-100 border-0 shadow-sm">
                        <div className="card-body">
                          <div className="row align-items-center">
                            <div className="col-md-6">
                              <h5 className="card-title fw-bold mb-3">{appointment.doctorName}</h5>
                              <p className="card-text mb-2">
                                <span className="text-muted">Location: </span>
                                {appointment.location}
                              </p>
                            </div>
                            <div className="col-md-6 text-md-end">
                              <p className="card-text mb-2">
                                <span className="badge text-bg-light p-2 fw-normal">
                                  {new Date(appointment.date).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </span>
                              </p>
                              <p className="card-text mb-0">
                                <span className="badge text-bg-light p-2 fw-normal">
                                  {appointment.time}
                                </span>
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MedicalAppointments;