import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ref, get } from 'firebase/database';
import { database } from '../firebase-config';
import { toast } from 'react-toastify';
import { 
  FaUserCircle, FaSearch, FaFilter, FaSortAmountDown, 
  FaSortAmountUpAlt, FaChild, FaEnvelope, FaPhone, 
  FaWeight, FaCalendarAlt, FaNotesMedical, FaHeartbeat,
  FaUtensils, FaDumbbell, FaXRay, FaTable, FaChartLine
} from 'react-icons/fa';

function PatientRecords({ setisFixed, hospitalData }) {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // all, recent, etc.
  const [sort, setSort] = useState('name_asc'); // name_asc, name_desc, age_asc, age_desc
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [activeTab, setActiveTab] = useState('info'); // info, sonography, diet, exercise, weight, health

  useEffect(() => {
    setisFixed(false);
    fetchPatients();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [patients, searchTerm, filter, sort]);

  const fetchPatients = async () => {
    try {
      const usersRef = ref(database, 'MaternalHealthSystem/users');
      const snapshot = await get(usersRef);
      
      if (snapshot.exists()) {
        const usersData = snapshot.val();
        const patientsList = Object.keys(usersData)
          .filter(key => usersData[key].userType === 'user')
          .map(key => ({
            ...usersData[key],
            id: key
          }));
        
        setPatients(patientsList);
        setFilteredPatients(patientsList);
      } else {
        setPatients([]);
      }
    } catch (error) {
      toast.error('Error fetching patients: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...patients];
    
    // Apply search
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(patient => 
        (patient.name && patient.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (patient.email && patient.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (patient.phone && patient.phone.includes(searchTerm))
      );
    }
    
    // Apply filters
    if (filter === 'recent') {
      // If you have a registration date, you could filter by that
      // For now, let's assume the most recent 10 patients
      filtered = filtered.slice(0, 10);
    }
    
    // Apply sorting
    if (sort === 'name_asc') {
      filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (sort === 'name_desc') {
      filtered.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
    } else if (sort === 'age_asc') {
      filtered.sort((a, b) => (parseInt(a.age) || 0) - (parseInt(b.age) || 0));
    } else if (sort === 'age_desc') {
      filtered.sort((a, b) => (parseInt(b.age) || 0) - (parseInt(a.age) || 0));
    }
    
    setFilteredPatients(filtered);
  };

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setActiveTab('info');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  const calculateStatistics = () => {
    const total = patients.length;
    const averageAge = patients.length > 0 
      ? Math.round(patients.reduce((sum, patient) => sum + (parseInt(patient.age) || 0), 0) / total) 
      : 0;
    
    return {
      total,
      averageAge
    };
  };

  const getLatestSonography = (patient) => {
    if (!patient.Sonography) return null;
    const sonographyEntries = Object.entries(patient.Sonography);
    if (sonographyEntries.length === 0) return null;
    
    // Sort by timestamp (newest first)
    sonographyEntries.sort((a, b) => b[1].createdAt - a[1].createdAt);
    return { id: sonographyEntries[0][0], ...sonographyEntries[0][1] };
  };

  const getLatestDietPlan = (patient) => {
    if (!patient.dietPlans) return null;
    const dietEntries = Object.entries(patient.dietPlans);
    if (dietEntries.length === 0) return null;
    
    // Sort by timestamp (newest first)
    dietEntries.sort((a, b) => b[1].timestamp - a[1].timestamp);
    return { id: dietEntries[0][0], ...dietEntries[0][1] };
  };

  const getLatestExercisePlan = (patient) => {
    if (!patient.exercisePlans) return null;
    const exerciseEntries = Object.entries(patient.exercisePlans);
    if (exerciseEntries.length === 0) return null;
    
    // Sort by timestamp (newest first)
    exerciseEntries.sort((a, b) => b[1].timestamp - a[1].timestamp);
    return { id: exerciseEntries[0][0], ...exerciseEntries[0][1] };
  };

  const getHealthRecords = (patient) => {
    if (!patient.healthRecords) return [];
    return Object.entries(patient.healthRecords)
      .map(([id, record]) => ({ id, ...record }))
      .sort((a, b) => b.timestamp - a.timestamp);
  };

  const getWeightRecords = (patient) => {
    if (!patient.weightRecords) return [];
    return Object.entries(patient.weightRecords)
      .map(([id, record]) => ({ id, ...record }))
      .sort((a, b) => b.timestamp - a.timestamp);
  };

  const getAppointments = (patient) => {
    if (!patient.appointments) return [];
    return Object.entries(patient.appointments)
      .map(([id, appointment]) => ({ id, ...appointment }))
      .sort((a, b) => b.timestamp - a.timestamp);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      return dateString;
    }
  };

  const renderTabContent = () => {
    if (!selectedPatient) return null;

    switch (activeTab) {
      case 'info':
        return (
          <div className="row">
            <div className="col-md-6 mb-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <h5 className="card-title mb-3">
                    <FaUserCircle className="text-primary me-2" />
                    Personal Information
                  </h5>
                  <div className="mb-2">
                    <span className="fw-bold">Name:</span> {selectedPatient.name || 'Not provided'}
                  </div>
                  <div className="mb-2">
                    <span className="fw-bold">Age:</span> {selectedPatient.age || 'Not provided'}
                  </div>
                  <div className="mb-2">
                    <span className="fw-bold">Email:</span> {selectedPatient.email || 'Not provided'}
                  </div>
                  <div className="mb-2">
                    <span className="fw-bold">Phone:</span> {selectedPatient.phone || 'Not provided'}
                  </div>
                  <div className="mb-2">
                    <span className="fw-bold">Current Weight:</span> {selectedPatient.currentWeight || 'Not provided'} kg
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6 mb-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <h5 className="card-title mb-3">
                    <FaNotesMedical className="text-primary me-2" />
                    Medical History
                  </h5>
                  <p>{selectedPatient.medicalHistory || 'No medical history provided.'}</p>
                </div>
              </div>
            </div>
            <div className="col-12 mb-3">
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <h5 className="card-title mb-3">
                    <FaCalendarAlt className="text-primary me-2" />
                    Upcoming Appointments
                  </h5>
                  {getAppointments(selectedPatient).length > 0 ? (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead className="table-light">
                          <tr>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Doctor</th>
                            <th>Location</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getAppointments(selectedPatient).map(appointment => (
                            <tr key={appointment.id}>
                              <td>{formatDate(appointment.date)}</td>
                              <td>{appointment.time || 'Not specified'}</td>
                              <td>{appointment.doctorName || 'Not specified'}</td>
                              <td>{appointment.location || 'Not specified'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-muted">No appointments scheduled.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'sonography':
        const latestSonography = getLatestSonography(selectedPatient);
        return (
          <div className="row">
            <div className="col-12">
              <div className="card border-0 shadow-sm mb-4">
                <div className="card-body">
                  <h5 className="card-title mb-3">
                    <FaXRay className="text-primary me-2" />
                    Sonography Report
                  </h5>
                  
                  {latestSonography ? (
                    <>
                      <div className="row mb-4">
                        <div className="col-md-6">
                          {latestSonography.imageUrl && (
                            <img 
                              src={latestSonography.imageUrl} 
                              alt="Sonography" 
                              className="img-fluid rounded mb-3" 
                              style={{ maxHeight: '300px' }}
                            />
                          )}
                        </div>
                        <div className="col-md-6">
                          <div className="bg-light p-3 rounded h-100">
                            <h6 className="fw-bold mb-2">Report Details</h6>
                            <div className="mb-2">
                              <span className="fw-bold">Date:</span> {formatDate(latestSonography.reportDate)}
                            </div>
                            <div className="mb-2">
                              <span className="fw-bold">Gestational Age:</span> {latestSonography.gestationalAge || 'N/A'} weeks
                            </div>
                            <div className="mb-2">
                              <span className="fw-bold">Result:</span> <span className={`badge ${latestSonography.result === 'Normal' ? 'bg-success' : 'bg-warning'}`}>{latestSonography.result || 'Not specified'}</span>
                            </div>
                            <div className="mb-2">
                              <span className="fw-bold">Complications:</span> {latestSonography.complications || 'None'}
                            </div>
                            <div className="mb-2">
                              <span className="fw-bold">Follow-Up:</span> {latestSonography.recommendedFollowUp === 'Yes' ? 'Required' : 'Not Required'}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="row mb-4">
                        <div className="col-12">
                          <div className="table-responsive">
                            <table className="table table-bordered">
                              <thead className="table-light">
                                <tr>
                                  <th colSpan="2" className="text-center">Fetal Measurements</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td width="50%"><strong>Fetal Heart Rate:</strong></td>
                                  <td>{latestSonography.fetalHeartRate || 'N/A'} bpm</td>
                                </tr>
                                <tr>
                                  <td><strong>Fetal Weight:</strong></td>
                                  <td>{latestSonography.fetalWeight || 'N/A'} grams</td>
                                </tr>
                                <tr>
                                  <td><strong>Fetal Position:</strong></td>
                                  <td>{latestSonography.fetalPosition || 'N/A'}</td>
                                </tr>
                                <tr>
                                  <td><strong>Multiple Pregnancy:</strong></td>
                                  <td>{latestSonography.multiplePregnancy || 'N/A'}</td>
                                </tr>
                                <tr>
                                  <td><strong>Number of Fetuses:</strong></td>
                                  <td>{latestSonography.numberFetuses || 'N/A'}</td>
                                </tr>
                                <tr>
                                  <td><strong>Placental Position:</strong></td>
                                  <td>{latestSonography.placentalPosition || 'N/A'}</td>
                                </tr>
                                <tr>
                                  <td><strong>Amniotic Fluid Index:</strong></td>
                                  <td>{latestSonography.amnioticFluidIndex || 'N/A'}</td>
                                </tr>
                                <tr>
                                  <td><strong>Cervical Length:</strong></td>
                                  <td>{latestSonography.cervicalLength || 'N/A'} mm</td>
                                </tr>
                                <tr>
                                  <td><strong>Anatomical Markers:</strong></td>
                                  <td>{latestSonography.anatomicalMarkers || 'N/A'}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                      
                      {latestSonography.doctorNotes && (
                        <div className="mb-4">
                          <h6 className="fw-bold">Doctor's Notes</h6>
                          <div className="bg-light p-3 rounded">
                            <p className="mb-0">{latestSonography.doctorNotes}</p>
                          </div>
                        </div>
                      )}
                      
                      {latestSonography.ai_analysis && (
                        <div>
                          <h6 className="fw-bold">AI Analysis</h6>
                          <div className="bg-light p-3 rounded">
                            <p style={{ whiteSpace: 'pre-line' }}>{latestSonography.ai_analysis}</p>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-muted">No sonography records available.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'diet':
        const latestDietPlan = getLatestDietPlan(selectedPatient);
        return (
          <div className="row">
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <h5 className="card-title mb-3">
                    <FaUtensils className="text-primary me-2" />
                    Diet Plan
                  </h5>
                  
                  {latestDietPlan ? (
                    <>
                      <div className="row mb-4">
                        <div className="col-md-6">
                          <div className="bg-light p-3 rounded mb-3">
                            <h6 className="fw-bold mb-2">Plan Details</h6>
                            <div className="mb-2">
                              <span className="fw-bold">Start Date:</span> {formatDate(latestDietPlan.startDate)}
                            </div>
                            <div className="mb-2">
                              <span className="fw-bold">End Date:</span> {formatDate(latestDietPlan.endDate)}
                            </div>
                            <div className="mb-2">
                              <span className="fw-bold">Allergies:</span> {latestDietPlan.allergies || 'None'}
                            </div>
                            <div className="mb-2">
                              <span className="fw-bold">Medical Conditions:</span> {latestDietPlan.medicalConditions || 'None'}
                            </div>
                            <div className="mb-2">
                              <span className="fw-bold">Blood Sugar:</span> {latestDietPlan.bloodSugar || 'Not recorded'} mg/dL
                            </div>
                            <div className="mb-2">
                              <span className="fw-bold">Current Weight:</span> {latestDietPlan.currentWeight || 'Not recorded'} kg
                            </div>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="bg-light p-3 rounded mb-3">
                            <h6 className="fw-bold mb-2">Preferred Meal Times</h6>
                            {latestDietPlan.preferredMealTimes ? (
                              <>
                                <div className="mb-2">
                                  <span className="fw-bold">Breakfast:</span> {latestDietPlan.preferredMealTimes.breakfast || 'Not specified'}
                                </div>
                                <div className="mb-2">
                                  <span className="fw-bold">Lunch:</span> {latestDietPlan.preferredMealTimes.lunch || 'Not specified'}
                                </div>
                                <div className="mb-2">
                                  <span className="fw-bold">Dinner:</span> {latestDietPlan.preferredMealTimes.dinner || 'Not specified'}
                                </div>
                              </>
                            ) : (
                              <p className="text-muted mb-0">No meal times specified.</p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {latestDietPlan.diet_plan && (
                        <div>
                          <h6 className="fw-bold">Diet Plan</h6>
                          <div className="bg-light p-3 rounded">
                            <p style={{ whiteSpace: 'pre-line' }}>{latestDietPlan.diet_plan}</p>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-muted">No diet plans available.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'exercise':
        const latestExercisePlan = getLatestExercisePlan(selectedPatient);
        return (
          <div className="row">
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <h5 className="card-title mb-3">
                    <FaDumbbell className="text-primary me-2" />
                    Exercise Plan
                  </h5>
                  
                  {latestExercisePlan ? (
                    <>
                      <div className="row mb-4">
                        <div className="col-md-6">
                          <div className="bg-light p-3 rounded mb-3">
                            <h6 className="fw-bold mb-2">Plan Details</h6>
                            <div className="mb-2">
                              <span className="fw-bold">Start Date:</span> {formatDate(latestExercisePlan.startDate)}
                            </div>
                            <div className="mb-2">
                              <span className="fw-bold">End Date:</span> {formatDate(latestExercisePlan.endDate)}
                            </div>
                            <div className="mb-2">
                              <span className="fw-bold">Intensity Level:</span> {latestExercisePlan.intensityLevel || 'Not specified'}
                            </div>
                            <div className="mb-2">
                              <span className="fw-bold">Created:</span> {new Date(latestExercisePlan.timestamp).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {latestExercisePlan.exercises_plan && (
                        <div>
                          <h6 className="fw-bold">Exercise Plan</h6>
                          <div className="bg-light p-3 rounded">
                            <p style={{ whiteSpace: 'pre-line' }}>{latestExercisePlan.exercises_plan}</p>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-muted">No exercise plans available.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'weight':
        const weightRecords = getWeightRecords(selectedPatient);
        return (
          <div className="row">
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <h5 className="card-title mb-3">
                    <FaWeight className="text-primary me-2" />
                    Weight Management
                  </h5>
                  
                  {weightRecords.length > 0 ? (
                    <>
                      <div className="table-responsive mb-4">
                        <table className="table table-hover">
                          <thead className="table-light">
                            <tr>
                              <th>Date</th>
                              <th>Current Weight (kg)</th>
                              <th>Required Weight (kg)</th>
                              <th>BMI</th>
                              <th>Pregnancy Month</th>
                            </tr>
                          </thead>
                          <tbody>
                            {weightRecords.map(record => (
                              <tr key={record.id}>
                                <td>{formatDate(record.date)}</td>
                                <td>{record.currentWeight || 'N/A'}</td>
                                <td>{record.requiredWeight || 'N/A'}</td>
                                <td>{record.bmi || 'N/A'}</td>
                                <td>{record.pregnancyMonth || 'N/A'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      {weightRecords[0].description && (
                        <div>
                          <h6 className="fw-bold">Latest Analysis</h6>
                          <div className="bg-light p-3 rounded">
                            <p>{weightRecords[0].description}</p>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-muted">No weight records available.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'health':
        const healthRecords = getHealthRecords(selectedPatient);
        return (
          <div className="row">
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <h5 className="card-title mb-3">
                    <FaHeartbeat className="text-primary me-2" />
                    Health Tracking
                  </h5>
                  
                  {healthRecords.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead className="table-light">
                          <tr>
                            <th>Date</th>
                            <th>Blood Pressure</th>
                            <th>Heart Rate</th>
                            <th>Sugar Level</th>
                            <th>Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {healthRecords.map(record => (
                            <tr key={record.id}>
                              <td>{formatDate(record.date)}</td>
                              <td>{record.bloodPressureSystolic}/{record.bloodPressureDiastolic} mmHg</td>
                              <td>{record.heartRate || 'N/A'} bpm</td>
                              <td>{record.sugarLevel || 'N/A'} mg/dL</td>
                              <td>{record.additionalNotes || 'None'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-muted">No health records available.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  const stats = calculateStatistics();

  return (
    <div className="min-vh-100 py-5 bg-light">
      <div className="container">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="row mb-4">
            <div className="col">
              <h2 className="mb-3 fw-bold text-primary">
                <FaUserCircle className="me-2" /> Patient Records
              </h2>
              <p className="lead text-muted">
                Manage and view maternal healthcare patients
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="row mb-4">
            <div className="col-md-6 mb-3 mb-md-0">
              <div className="card border-0 shadow-sm h-100" style={{ borderRadius: "15px" }}>
                <div className="card-body d-flex align-items-center">
                  <div className="rounded-circle p-3 bg-primary bg-opacity-10 me-3">
                    <FaUserCircle className="text-primary" size={24} />
                  </div>
                  <div>
                    <h3 className="mb-0 fw-bold">{stats.total}</h3>
                    <p className="mb-0 text-muted">Total Patients</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card border-0 shadow-sm h-100" style={{ borderRadius: "15px" }}>
                <div className="card-body d-flex align-items-center">
                  <div className="rounded-circle p-3 bg-info bg-opacity-10 me-3">
                    <FaChild className="text-info" size={24} />
                  </div>
                  <div>
                    <h3 className="mb-0 fw-bold">{stats.averageAge}</h3>
                    <p className="mb-0 text-muted">Average Age</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters Row */}
          <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: "15px" }}>
            <div className="card-body p-4">
              <div className="row g-3">
                <div className="col-md-4">
                  <div className="input-group">
                    <span className="input-group-text bg-primary text-white">
                      <FaSearch />
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search patients..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="input-group">
                    <span className="input-group-text bg-primary text-white">
                      <FaFilter />
                    </span>
                    <select
                      className="form-select"
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                    >
                      <option value="all">All Patients</option>
                      <option value="recent">Recent Patients</option>
                    </select>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="input-group">
                    <span className="input-group-text bg-primary text-white">
                      {sort.includes('asc') ? <FaSortAmountDown /> : <FaSortAmountUpAlt />}
                    </span>
                    <select
                      className="form-select"
                      value={sort}
                      onChange={(e) => setSort(e.target.value)}
                    >
                      <option value="name_asc">Name (A-Z)</option>
                      <option value="name_desc">Name (Z-A)</option>
                      <option value="age_asc">Age (Low to High)</option>
                      <option value="age_desc">Age (High to Low)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Patient List and Detail View */}
          <div className="row">
            {/* Patient List */}
            <div className={selectedPatient ? "col-lg-4 mb-4 mb-lg-0" : "col-lg-12"}>
              <div className="card border-0 shadow-sm" style={{ borderRadius: "15px" }}>
                <div className="card-header bg-white py-3 border-0">
                  <h5 className="mb-0 fw-bold">Patient List</h5>
                </div>
                <div className="card-body p-0">
                  {loading ? (
                    <div className="text-center p-4">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="mt-2 text-muted">Loading patients...</p>
                    </div>
                  ) : filteredPatients.length > 0 ? (
                    <div className="list-group list-group-flush">
                      {filteredPatients.map(patient => (
                        <button
                          key={patient.id}
                          className={`list-group-item list-group-item-action border-0 py-3 px-4 ${selectedPatient && selectedPatient.id === patient.id ? 'active' : ''}`}
                          onClick={() => handlePatientSelect(patient)}
                        >
                          <div className="d-flex align-items-center">
                            <div className="rounded-circle bg-primary bg-opacity-10 p-3 me-3">
                              <FaUserCircle className={`${selectedPatient && selectedPatient.id === patient.id ? 'text-white' : 'text-primary'}`} size={20} />
                            </div>
                            <div>
                              <h6 className="mb-1 fw-bold">{patient.name || 'Unnamed Patient'}</h6>
                              <div className="small">
                                <span className="me-3"><FaEnvelope className="me-1" /> {patient.email || 'No email'}</span>
                                <span><FaPhone className="me-1" /> {patient.phone || 'No phone'}</span>
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-4">
                      <p className="text-muted mb-0">No patients found.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Patient Detail View */}
            {selectedPatient && (
              <div className="col-lg-8">
                <div className="card border-0 shadow-sm" style={{ borderRadius: "15px" }}>
                  <div className="card-header bg-white py-3 border-0">
                    <div className="d-flex justify-content-between align-items-center">
                      <h5 className="mb-0 fw-bold">{selectedPatient.name}</h5>
                      <div>
                        <span className="badge bg-primary me-2">Patient ID: {selectedPatient.id}</span>
                        <span className="badge bg-info">Age: {selectedPatient.age || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="card-body">
                    {/* Tabs */}
                    <ul className="nav nav-tabs mb-4">
                      <li className="nav-item">
                        <button 
                          className={`nav-link ${activeTab === 'info' ? 'active' : ''}`}
                          onClick={() => setActiveTab('info')}
                        >
                          <FaUserCircle className="me-2" /> Personal Info
                        </button>
                      </li>
                      <li className="nav-item">
                        <button 
                          className={`nav-link ${activeTab === 'sonography' ? 'active' : ''}`}
                          onClick={() => setActiveTab('sonography')}
                        >
                          <FaXRay className="me-2" /> Sonography
                        </button>
                      </li>
                      <li className="nav-item">
                        <button 
                          className={`nav-link ${activeTab === 'diet' ? 'active' : ''}`}
                          onClick={() => setActiveTab('diet')}
                        >
                          <FaUtensils className="me-2" /> Diet
                        </button>
                      </li>
                      <li className="nav-item">
                        <button 
                          className={`nav-link ${activeTab === 'exercise' ? 'active' : ''}`}
                          onClick={() => setActiveTab('exercise')}
                        >
                          <FaDumbbell className="me-2" /> Exercise
                        </button>
                      </li>
                      <li className="nav-item">
                        <button 
                          className={`nav-link ${activeTab === 'weight' ? 'active' : ''}`}
                          onClick={() => setActiveTab('weight')}
                        >
                          <FaWeight className="me-2" /> Weight
                        </button>
                      </li>
                      <li className="nav-item">
                        <button 
                          className={`nav-link ${activeTab === 'health' ? 'active' : ''}`}
                          onClick={() => setActiveTab('health')}
                        >
                          <FaHeartbeat className="me-2" /> Health
                        </button>
                      </li>
                    </ul>
                    
                    {/* Tab Content */}
                    {renderTabContent()}
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default PatientRecords;