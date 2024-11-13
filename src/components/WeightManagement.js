// components/WeightManagement.js
import React, { useState, useEffect } from 'react';
import { storage, database } from '../firebase-config';
import { ref, push, set, remove, get, update,onValue } from "firebase/database";
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { toast } from 'react-toastify';
import { FaWeight, FaCalendar, FaChartLine, FaClock } from 'react-icons/fa';
import { motion } from 'framer-motion';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import Cookies from 'js-cookie';


function WeightManagement(props) {

    const {userId} = props;
  const [weightData, setWeightData] = useState({
    date: new Date(),
    currentWeight: '',
    bmi: '',
    pregnancyMonth: '',
    requiredWeight:"Still analysing"
  });

  useEffect(() => {
    props.setisFixed(false);
  }, []);

  const [weightHistory, setWeightHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch weight history from Firebase
    const fetchWeightHistory = async () => {
      try {
        const userCookie = Cookies.get('user');
        const userCookieData = JSON.parse(userCookie);
        
        // Fix: Add string template literals and proper path formatting
        const weightRef = ref(database, `MaternalHealthSystem/users/${userCookieData.phone}/weightRecords`);

        onValue(weightRef, (snapshot) => {
          const records = snapshot.val();
          if (records) {
            const weightArray = Object.keys(records).map(key => ({
              id: key,
              ...records[key],
              date: new Date(records[key].date)
            }));
            setWeightHistory(weightArray.sort((a, b) => b.date - a.date));
          }
          setLoading(false);
        });
      } catch (error) {
        toast.error('Error fetching weight history');
        setLoading(false);
      }
    };

    fetchWeightHistory();
}, []);

const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        const userCookie = Cookies.get('user');
        const userCookieData = JSON.parse(userCookie);
        
        let newWeiPlan = {
            ...weightData,
            date: weightData.date.toISOString(),
            timestamp: Date.now()
        };

        // Fix: Add string template literals and proper path formatting
        const weightRef = ref(database, `MaternalHealthSystem/users/${userCookieData.phone}/weightRecords/${Date.now()}`);
        await set(weightRef, newWeiPlan);
      
        toast.success('Weight record added successfully!');
        setWeightData({
            date: new Date(),
            currentWeight: '',
            bmi: '',
            pregnancyMonth: ''
        });
    } catch (error) {
        toast.error('Failed to add weight record');
    }
};


  const handleChange = (e) => {
    const { name, value } = e.target;
    setWeightData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <motion.div
      className="container mt-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{marginBottom:"150px"}}
    >
      <div className="row">
        <div className="col-md-6">
          <motion.div
            className="card shadow mb-4"
            whileHover={{ scale: 1.02 }}
          >
            <div className="card-body">
              <h3 className="card-title mb-4">
                <FaWeight className="me-2" />
                Add Weight Record
              </h3>
              <form onSubmit={handleSubmit}>
                <div className="form-group mb-3">
                  <div className="input-group">
                    <span className="input-group-text">
                      <FaCalendar />
                    </span>
                    <DatePicker
                      selected={weightData.date}
                      onChange={date => setWeightData(prev => ({ ...prev, date }))}
                      className="form-control"
                      maxDate={new Date()}
                      placeholderText="Select Date"
                    />
                  </div>
                </div>

                <div className="form-group mb-3">
                  <div className="input-group">
                    <span className="input-group-text">
                      <FaWeight />
                    </span>
                    <input
                      type="number"
                      className="form-control"
                      name="currentWeight"
                      placeholder="Current Weight (kg)"
                      value={weightData.currentWeight}
                      onChange={handleChange}
                      step="0.1"
                      required
                    />
                  </div>
                </div>

                <div className="form-group mb-3">
                  <div className="input-group">
                    <span className="input-group-text">
                      <FaChartLine />
                    </span>
                    <input
                      type="number"
                      className="form-control"
                      name="bmi"
                      placeholder="Current BMI"
                      value={weightData.bmi}
                      onChange={handleChange}
                      step="0.1"
                      required
                    />
                  </div>
                </div>

                <div className="form-group mb-3">
                  <div className="input-group">
                    <span className="input-group-text">
                      <FaClock />
                    </span>
                    <select
                      className="form-control"
                      name="pregnancyMonth"
                      value={weightData.pregnancyMonth}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Pregnancy Month</option>
                      {[...Array(9)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          Month {i + 1}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  className="btn btn-primary w-100"
                >
                  Add Record
                </motion.button>
              </form>
            </div>
          </motion.div>
        </div>

        <div className="col-md-6">
          <motion.div
            className="card shadow"
            whileHover={{ scale: 1.02 }}
          >
            <div className="card-body">
              <h3 className="card-title mb-4">
                <FaChartLine className="me-2" />
                Weight History
              </h3>
              {loading ? (
                <div className="text-center">Loading...</div>
              ) : weightHistory.length === 0 ? (
                <div className="text-center text-muted">No weight records found</div>
              ) : (
                <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Weight (kg)</th>
                      <th>BMI</th>
                      <th>Month</th>
                      <th>Required Weight</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weightHistory.map((record) => (
                      <motion.tr
                        key={record.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <td>{record.date.toLocaleDateString()}</td>
                        <td>{record.currentWeight}</td>
                        <td>{record.bmi}</td>
                        <td>{record.pregnancyMonth}</td>
                        <td>{record.requiredWeight}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

export default WeightManagement;
