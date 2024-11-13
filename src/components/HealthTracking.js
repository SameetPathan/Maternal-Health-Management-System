// components/HealthTracking.js
import React, { useState, useEffect } from 'react';
import { database } from '../firebase-config';
import { ref, set,remove,update,onValue } from 'firebase/database';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { 
  FaCalendar, 
  FaHeartbeat, 
  FaTint, 
  FaChartLine, 
  FaNotesMedical,
  FaPlus,
  FaEdit,
  FaTrash
} from 'react-icons/fa';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

function HealthTracking(props) {
const {user} = props;
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
    try {
      const userCookie = Cookies.get('user');
      const userCookieData = JSON.parse(userCookie);
      
      const newHealthData = {
        ...formData,
        date: formData.date.toISOString(),
        timestamp: Date.now()
      };
  
      if (editingId) {
        // Update existing record
        const updateRef = ref(database, `MaternalHealthSystem/users/${userCookieData.phone}/healthRecords/${editingId}`);
        await update(updateRef, newHealthData);
        toast.success('Health data updated successfully!');
      } else {
        // Add new record
        const newRecordRef = ref(database, `MaternalHealthSystem/users/${userCookieData.phone}/healthRecords/${Date.now()}`);
        await set(newRecordRef, newHealthData);
        toast.success('Health data recorded successfully!');
      }
  
      resetForm();
    } catch (error) {
      toast.error('Error saving health data: ' + error.message);
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
  
  // Handle delete function
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        const userCookie = Cookies.get('user');
        const userCookieData = JSON.parse(userCookie);
        
        const deleteRef = ref(database, `MaternalHealthSystem/users/${userCookieData.phone}/healthRecords/${id}`);
        await remove(deleteRef);
        toast.success('Record deleted successfully!');
      } catch (error) {
        toast.error('Error deleting record: ' + error.message);
      }
    }
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
    <motion.div
      className="container mt-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{marginBottom:"380px"}}
    >
      <div className="row">
        <div className="col-md-12">
          <div className="card shadow mb-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h3>Health Tracking</h3>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn btn-primary"
                  onClick={() => setShowForm(!showForm)}
                >
                  <FaPlus className="me-2" />
                  {showForm ? 'Cancel' : 'Add New Entry'}
                </motion.button>
              </div>

              {showForm && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleSubmit}
                  className="mb-4"
                >
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <div className="input-group">
                        <span className="input-group-text">
                          <FaCalendar />
                        </span>
                        <DatePicker
                          selected={formData.date}
                          onChange={date => setFormData(prev => ({ ...prev, date }))}
                          className="form-control"
                          maxDate={new Date()}
                        />
                      </div>
                    </div>

                    <div className="col-md-6 mb-3">
                      <div className="input-group">
                        <span className="input-group-text">
                          <FaTint />
                        </span>
                        <input
                          type="number"
                          className="form-control"
                          name="sugarLevel"
                          placeholder="Sugar Level (mg/dL)"
                          value={formData.sugarLevel}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div className="col-md-6 mb-3">
                      <div className="input-group">
                        <span className="input-group-text">
                          <FaHeartbeat />
                        </span>
                        <input
                          type="number"
                          className="form-control"
                          name="heartRate"
                          placeholder="Heart Rate (BPM)"
                          value={formData.heartRate}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div className="col-md-6 mb-3">
                      <div className="input-group">
                        <span className="input-group-text">
                          <FaChartLine />
                        </span>
                        <input
                          type="number"
                          className="form-control"
                          name="bloodPressureSystolic"
                          placeholder="Blood Pressure (Systolic)"
                          value={formData.bloodPressureSystolic}
                          onChange={handleChange}
                        />
                        <input
                          type="number"
                          className="form-control"
                          name="bloodPressureDiastolic"
                          placeholder="Blood Pressure (Diastolic)"
                          value={formData.bloodPressureDiastolic}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div className="col-12 mb-3">
                      <div className="input-group">
                        <span className="input-group-text">
                          <FaNotesMedical />
                        </span>
                        <textarea
                          className="form-control"
                          name="additionalNotes"
                          placeholder="Additional Notes"
                          value={formData.additionalNotes}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    className="btn btn-success"
                  >
                    Save Health Data
                  </motion.button>
                </motion.form>
              )}

              <div className="health-records">
              <h4 className="mb-3">Health Records</h4>
              {healthData.map((record) => (
                <motion.div
                  key={record.id}
                  className="card mb-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-3">
                        <p><FaCalendar className="me-2" />
                          {record.date.toLocaleDateString()}
                        </p>
                      </div>
                      <div className="col-md-2">
                        <p><FaTint className="me-2" />
                          Sugar: {record.sugarLevel} mg/dL
                        </p>
                      </div>
                      <div className="col-md-2">
                        <p><FaHeartbeat className="me-2" />
                          Heart Rate: {record.heartRate} BPM
                        </p>
                      </div>
                      <div className="col-md-2">
                        <p><FaChartLine className="me-2" />
                          BP: {record.bloodPressureSystolic}/{record.bloodPressureDiastolic}
                        </p>
                      </div>
                      <div className="col-md-3">
                        <div className="d-flex justify-content-end">
                          <button 
                            className="btn btn-sm btn-primary me-2"
                            onClick={() => handleEdit(record)}
                          >
                            <FaEdit /> Edit
                          </button>
                          <button 
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDelete(record.id)}
                          >
                            <FaTrash /> Delete
                          </button>
                        </div>
                      </div>
                      {record.additionalNotes && (
                        <div className="col-12 mt-2">
                          <p>
                            <FaNotesMedical className="me-2" />
                            Notes: {record.additionalNotes}
                          </p>
                        </div>
                      )}
                      
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

             
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default HealthTracking;
