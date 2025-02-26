import React, { useState, useEffect } from 'react';
import { database } from '../firebase-config';
import { ref, set, remove, update, onValue } from 'firebase/database';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

function HealthTracking(props) {
  const [healthData, setHealthData] = useState([]);
  const [formData, setFormData] = useState({
    date: new Date(),
    sugarLevel: '',
    heartRate: '',
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    additionalNotes: ''
  });

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchHealthData();
  }, []);

  const fetchHealthData = () => {
    try {
      const userCookie = Cookies.get('user');
      const userCookieData = JSON.parse(userCookie);
      
      const healthRef = ref(database, `MaternalHealthSystem/users/${userCookieData.phone}/healthRecords`);
      
      onValue(healthRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const healthArray = Object.entries(data).map(([key, value]) => ({
            id: key,
            ...value,
            date: new Date(value.date)
          }));
          setHealthData(healthArray.sort((a, b) => b.date - a.date));
        } else {
          setHealthData([]);
        }
      });
    } catch (error) {
      toast.error('Error fetching health data: ' + error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCookie = Cookies.get('user');
      const userCookieData = JSON.parse(userCookie);
      
      const newHealthData = {
        ...formData,
        date: formData.date.toISOString(),
        timestamp: Date.now()
      };
  
      if (editingId) {
        const updateRef = ref(database, `MaternalHealthSystem/users/${userCookieData.phone}/healthRecords/${editingId}`);
        await update(updateRef, newHealthData);
        toast.success('Health data updated successfully!');
      } else {
        const newRecordRef = ref(database, `MaternalHealthSystem/users/${userCookieData.phone}/healthRecords/${Date.now()}`);
        await set(newRecordRef, newHealthData);
        toast.success('Health data recorded successfully!');
      }
  
      resetForm();
    } catch (error) {
      toast.error('Error saving health data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      setLoading(true);
      try {
        const userCookie = Cookies.get('user');
        const userCookieData = JSON.parse(userCookie);
        
        const deleteRef = ref(database, `MaternalHealthSystem/users/${userCookieData.phone}/healthRecords/${id}`);
        await remove(deleteRef);
        toast.success('Record deleted successfully!');
      } catch (error) {
        toast.error('Error deleting record: ' + error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEdit = (record) => {
    setFormData({
      date: new Date(record.date),
      sugarLevel: record.sugarLevel,
      heartRate: record.heartRate,
      bloodPressureSystolic: record.bloodPressureSystolic,
      bloodPressureDiastolic: record.bloodPressureDiastolic,
      additionalNotes: record.additionalNotes
    });
    setEditingId(record.id);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      date: new Date(),
      sugarLevel: '',
      heartRate: '',
      bloodPressureSystolic: '',
      bloodPressureDiastolic: '',
      additionalNotes: ''
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="container py-5" style={{marginBottom: "150px"}}>
      <div className="row justify-content-center">
        <div className="col-12">
          <div className="card shadow-sm border-0 rounded-3">
            <div className="card-header d-flex justify-content-between align-items-center py-3" 
                 style={{ backgroundColor: '#7555C6', color: 'white' }}>
              <h4 className="mb-0 fw-bold">Health Tracking</h4>
              <button
                className="btn btn-light"
                onClick={() => setShowForm(!showForm)}
              >
                {showForm ? 'Cancel' : '+ Add New Entry'}
              </button>
            </div>
            
            <div className="card-body p-4">
              {showForm && (
                <div className="mb-4 p-4 bg-light rounded-3">
                  <h5 className="mb-4 fw-bold">{editingId ? 'Edit Health Record' : 'Add New Health Record'}</h5>
                  <form onSubmit={handleSubmit}>
                    <div className="row g-4">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Date</label>
                        <DatePicker
                          selected={formData.date}
                          onChange={date => setFormData(prev => ({ ...prev, date }))}
                          className="form-control form-control-lg"
                          maxDate={new Date()}
                          placeholderText="Select Date"
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Sugar Level (mg/dL)</label>
                        <input
                          type="number"
                          className="form-control form-control-lg"
                          name="sugarLevel"
                          value={formData.sugarLevel}
                          onChange={handleChange}
                          placeholder="Enter sugar level"
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Heart Rate (BPM)</label>
                        <input
                          type="number"
                          className="form-control form-control-lg"
                          name="heartRate"
                          value={formData.heartRate}
                          onChange={handleChange}
                          placeholder="Enter heart rate"
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Blood Pressure</label>
                        <div className="input-group">
                          <input
                            type="number"
                            className="form-control form-control-lg"
                            name="bloodPressureSystolic"
                            value={formData.bloodPressureSystolic}
                            onChange={handleChange}
                            placeholder="Systolic"
                          />
                          <span className="input-group-text">/</span>
                          <input
                            type="number"
                            className="form-control form-control-lg"
                            name="bloodPressureDiastolic"
                            value={formData.bloodPressureDiastolic}
                            onChange={handleChange}
                            placeholder="Diastolic"
                          />
                        </div>
                      </div>

                      <div className="col-12">
                        <label className="form-label fw-semibold">Additional Notes</label>
                        <textarea
                          className="form-control"
                          name="additionalNotes"
                          value={formData.additionalNotes}
                          onChange={handleChange}
                          rows="3"
                          placeholder="Enter any additional notes"
                        />
                      </div>

                      <div className="col-12">
                        <button
                          type="submit"
                          className="btn btn-lg text-white"
                          style={{ backgroundColor: '#7555C6' }}
                          disabled={loading}
                        >
                          {loading ? (
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          ) : null}
                          {editingId ? 'Update Record' : 'Save Record'}
                        </button>
                        {editingId && (
                          <button
                            type="button"
                            className="btn btn-lg btn-light ms-2"
                            onClick={resetForm}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </form>
                </div>
              )}

              <div className="mt-4">
                <h5 className="mb-4 fw-bold">Health Records History</h5>
                {healthData.length === 0 ? (
                  <div className="text-center py-5 text-muted">
                    <p className="mb-0">No health records found</p>
                  </div>
                ) : (
                  <div className="row g-4">
                    {healthData.map((record) => (
                      <div key={record.id} className="col-12">
                        <div className="card h-100 border-0 shadow-sm">
                          <div className="card-body">
                            <div className="row align-items-center">
                              <div className="col-md-3">
                                <p className="mb-2 text-muted small">Date</p>
                                <p className="mb-0 fw-semibold">{record.date.toLocaleDateString()}</p>
                              </div>
                              <div className="col-md-2">
                                <p className="mb-2 text-muted small">Sugar Level</p>
                                <p className="mb-0 fw-semibold">{record.sugarLevel} mg/dL</p>
                              </div>
                              <div className="col-md-2">
                                <p className="mb-2 text-muted small">Heart Rate</p>
                                <p className="mb-0 fw-semibold">{record.heartRate} BPM</p>
                              </div>
                              <div className="col-md-2">
                                <p className="mb-2 text-muted small">Blood Pressure</p>
                                <p className="mb-0 fw-semibold">{record.bloodPressureSystolic}/{record.bloodPressureDiastolic}</p>
                              </div>
                              <div className="col-md-3 text-md-end">
                                <button 
                                  className="btn btn-sm me-2" 
                                  style={{ 
                                    backgroundColor: '#7555C6',
                                    color: 'white'
                                  }}
                                  onClick={() => handleEdit(record)}
                                  disabled={loading}
                                >
                                  Edit
                                </button>
                                <button 
                                  className="btn btn-sm btn-danger"
                                  onClick={() => handleDelete(record.id)}
                                  disabled={loading}
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                            {record.additionalNotes && (
                              <div className="mt-3 pt-3 border-top">
                                <p className="mb-2 text-muted small">Additional Notes</p>
                                <p className="mb-0">{record.additionalNotes}</p>
                              </div>
                            )}
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
    </div>
  );
}

export default HealthTracking;