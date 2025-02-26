import React, { useState, useEffect } from "react";
import { storage, database } from "../firebase-config";
import { ref, push, onValue, remove } from "firebase/database";
import { toast } from "react-toastify";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Cookies from "js-cookie";

const WeightManagement = (props) => {
  const [showDescription, setShowDescription] = useState({});
  const [weightData, setWeightData] = useState({
    date: new Date(),
    currentWeight: "",
    bmi: "",
    pregnancyMonth: "",
    requiredWeight: "Analyzing..."
  });
  const [weightHistory, setWeightHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    props.setisFixed(false);
    const fetchWeightHistory = async () => {
      try {
        const userCookie = Cookies.get("user");
        const userCookieData = JSON.parse(userCookie);
        const weightRef = ref(
          database,
          `MaternalHealthSystem/users/${userCookieData.phone}/weightRecords`
        );

        onValue(weightRef, (snapshot) => {
          const records = snapshot.val();
          if (records) {
            const weightArray = Object.keys(records).map((key) => ({
              id: key,
              ...records[key],
              date: new Date(records[key].date),
            }));
            setWeightHistory(weightArray.sort((a, b) => b.date - a.date));
          }
          setLoading(false);
        });
      } catch (error) {
        toast.error("Error fetching weight history");
        setLoading(false);
      }
    };

    fetchWeightHistory();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCookie = Cookies.get("user");
      const userCookieData = JSON.parse(userCookie);

      let newWeiPlan = {
        ...weightData,
        date: weightData.date.toISOString(),
        timestamp: Date.now(),
      };

      const newWeightRef = push(
        ref(
          database,
          `MaternalHealthSystem/users/${userCookieData.phone}/weightRecords`
        ),
        newWeiPlan
      );
      const newWeightKey = newWeightRef.key;

      await fetch("http://127.0.0.1:5000/api/weight-ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          current_data: newWeiPlan,
          currentKey: newWeightKey,
          response_structure: {
            requiredWeight: "",
            description: "",
          },
          phone: userCookieData.phone,
        }),
      });

      toast.success("Weight record added successfully!");
      setWeightData({
        date: new Date(),
        currentWeight: "",
        bmi: "",
        pregnancyMonth: "",
      });
    } catch (error) {
      toast.error("Failed to add weight record");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (recordId) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      setLoading(true);
      try {
        const userCookie = Cookies.get("user");
        const userCookieData = JSON.parse(userCookie);
        
        const recordRef = ref(
          database,
          `MaternalHealthSystem/users/${userCookieData.phone}/weightRecords/${recordId}`
        );
        
        await remove(recordRef);
        toast.success("Record deleted successfully!");
      } catch (error) {
        console.error("Error deleting record:", error);
        toast.error("Failed to delete record");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setWeightData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="container py-5" style={{ marginBottom: "150px" }}>
      <div className="row g-4">
        <div className="col-lg-5">
          <div className="card shadow-sm border-0 rounded-3 bg-white">
            <div className="card-header text-white py-3" style={{ backgroundColor: '#7555C6' }}>
              <h4 className="mb-0 fw-bold">Add Weight Record</h4>
            </div>
            <div className="card-body p-4">
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="form-label fw-semibold">Date</label>
                  <DatePicker
                    selected={weightData.date}
                    onChange={(date) => setWeightData((prev) => ({ ...prev, date }))}
                    className="form-control form-control-lg"
                    maxDate={new Date()}
                    placeholderText="Select Date"
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label fw-semibold">Current Weight (kg)</label>
                  <input
                    type="number"
                    className="form-control form-control-lg"
                    name="currentWeight"
                    placeholder="Enter weight"
                    value={weightData.currentWeight}
                    onChange={handleChange}
                    step="0.1"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label fw-semibold">BMI</label>
                  <input
                    type="number"
                    className="form-control form-control-lg"
                    name="bmi"
                    placeholder="Enter BMI"
                    value={weightData.bmi}
                    onChange={handleChange}
                    step="0.1"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label fw-semibold">Pregnancy Month</label>
                  <select
                    className="form-select form-select-lg"
                    name="pregnancyMonth"
                    value={weightData.pregnancyMonth}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Month</option>
                    {[...Array(9)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        Month {i + 1}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="btn btn-lg w-100 fw-bold text-white" 
                  style={{ backgroundColor: '#7555C6' }}
                  disabled={loading}
                >
                  {loading ? (
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  ) : null}
                  Add Record
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-lg-7">
          <div className="card shadow-sm border-0 rounded-3 bg-white">
            <div className="card-header text-white py-3 d-flex justify-content-between align-items-center" style={{ backgroundColor: '#7555C6' }}>
              <h4 className="mb-0 fw-bold">Weight History & AI Analysis</h4>
            </div>
            <div className="card-body p-4">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border" style={{ color: '#7555C6' }} role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : weightHistory.length === 0 ? (
                <div className="text-center py-5">
                  <p className="text-muted mb-0 fs-5">No weight records found</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th scope="col">Date</th>
                        <th scope="col">Weight</th>
                        <th scope="col">BMI</th>
                        <th scope="col">Month</th>
                        <th scope="col">Required</th>
                        <th scope="col">Details</th>
                        <th scope="col">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {weightHistory.map((record) => (
                        <tr key={record.id}>
                          <td>{record.date.toLocaleDateString()}</td>
                          <td>{record.currentWeight} kg</td>
                          <td>{record.bmi}</td>
                          <td>{record.pregnancyMonth}</td>
                          <td>{record.requiredWeight}</td>
                          <td>
                            <button
                              className="btn btn-sm" 
                              style={{ 
                                border: '1px solid #7555C6',
                                color: '#7555C6'
                              }}
                              onClick={() =>
                                setShowDescription((prev) => ({
                                  ...prev,
                                  [record.id]: !prev[record.id],
                                }))
                              }
                            >
                              {showDescription[record.id] ? "Hide" : "View"}
                            </button>
                            {showDescription[record.id] && (
                              <div className="mt-2 p-3 bg-light rounded">
                                <p className="mb-0 small">
                                  {record.description || "No description available"}
                                </p>
                              </div>
                            )}
                          </td>
                          <td>
                            <div className="d-flex gap-2">
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => handleDelete(record.id)}
                                disabled={loading}
                              >
                                {loading ? (
                                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                ) : (
                                  "Delete"
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeightManagement;