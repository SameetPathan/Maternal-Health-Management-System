import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { database } from "../firebase-config";
import { ref, set, get, push } from "firebase/database";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Cookies from "js-cookie";
import { format } from "date-fns";

function DietPlanForm(props) {
  const [formData, setFormData] = useState({
    currentWeight: '',
    bloodSugar: '',
    medicalConditions: '',
    allergies: '',
    preferredMealTimes: {
      breakfast: '',
      lunch: '',
      dinner: ''
    },
    startDate: new Date(),
    endDate: new Date()
  });

  const [dietDetails, setDietDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [selectedMonth, setSelectedMonth] = useState(null);

  useEffect(() => {
    props.setisFixed(false);
    fetchDietDetails();
  }, []);

  const groupDietsByMonth = (diets) => {
    const grouped = {};
    diets.forEach((diet) => {
      try {
        const date = new Date(diet.createdAt);
        if (isNaN(date.getTime())) {
          console.error("Invalid date:", diet.createdAt);
          return;
        }
        const monthYear = format(date, "MMMM yyyy");
        if (!grouped[monthYear]) {
          grouped[monthYear] = [];
        }
        grouped[monthYear].push(diet);
      } catch (error) {
        console.error("Error processing date:", error);
        const fallbackCategory = "Undated Plans";
        if (!grouped[fallbackCategory]) {
          grouped[fallbackCategory] = [];
        }
        grouped[fallbackCategory].push(diet);
      }
    });
    return grouped;
  };

  const handleDeleteDiet = async (dietKey) => {
    if (window.confirm("Are you sure you want to delete this diet plan?")) {
      try {
        const userCookie = Cookies.get("user");
        const userCookieData = JSON.parse(userCookie);

        const dietRef = ref(
          database,
          `MaternalHealthSystem/users/${userCookieData.phone}/dietPlans/${dietKey}`
        );

        await set(dietRef, null);
        toast.success("Diet plan deleted successfully");
        fetchDietDetails();
      } catch (error) {
        toast.error("Error deleting diet plan: " + error.message);
      }
    }
  };

  const fetchDietDetails = async () => {
    try {
      const userCookie = Cookies.get("user");
      if (!userCookie) {
        toast.error("User not authenticated");
        return;
      }

      const userCookieData = JSON.parse(userCookie);
      const dietRef = ref(
        database,
        `MaternalHealthSystem/users/${userCookieData.phone}/dietPlans`
      );
      const snapshot = await get(dietRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        const dietList = Object.entries(data).map(([key, value]) => {
          let createdAt = value.createdAt;
          if (!createdAt) {
            createdAt = value.timestamp
              ? new Date(value.timestamp).toISOString()
              : new Date().toISOString();
          }
          return {
            ...value,
            key,
            createdAt,
          };
        });

        const sortedList = dietList.sort((a, b) => {
          const dateA = new Date(a.createdAt);
          const dateB = new Date(b.createdAt);
          return dateB - dateA;
        });

        setDietDetails(sortedList);

        if (sortedList.length > 0 && new Date(sortedList[0].createdAt)) {
          const initialMonth = format(
            new Date(sortedList[0].createdAt),
            "MMMM yyyy"
          );
          setSelectedMonth(initialMonth);
        }
      } else {
        setDietDetails([]);
      }
    } catch (error) {
      toast.error("Failed to fetch diet details: " + error.message);
    }
  };

  const validateForm = () => {
    let tempErrors = {};
    let isValid = true;

    if (!formData.currentWeight) {
      tempErrors.currentWeight = "Please enter your current weight";
      isValid = false;
    }

    if (!formData.bloodSugar) {
      tempErrors.bloodSugar = "Please enter your blood sugar level";
      isValid = false;
    }

    if (!formData.preferredMealTimes.breakfast || 
        !formData.preferredMealTimes.lunch || 
        !formData.preferredMealTimes.dinner) {
      tempErrors.mealTimes = "Please enter all meal times";
      isValid = false;
    }

    if (formData.startDate >= formData.endDate) {
      tempErrors.dateRange = "End date must be after start date";
      isValid = false;
    }

    setErrors(tempErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validateForm()) {
      setLoading(true);
      try {
        const userCookie = Cookies.get("user");
        const userCookieData = JSON.parse(userCookie);

        const newDietPlan = {
          ...formData,
          startDate: formData.startDate.toISOString(),
          endDate: formData.endDate.toISOString(),
          timestamp: Date.now(),
          createdAt: new Date().toISOString(),
        };

        const newDietRef = push(
          ref(
            database,
            `MaternalHealthSystem/users/${userCookieData.phone}/dietPlans`
          ),
          newDietPlan
        );

        const newDietKey = newDietRef.key;

        const aiResponse = await fetch(
          "http://127.0.0.1:5000/api/diet-ai",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              current_data: {
                ...formData,
                startDate: formData.startDate.toISOString(),
                endDate: formData.endDate.toISOString(),
              },
              response_structure: {
                diet_plan: [],
              },
              phone: userCookieData.phone,
              currentKey: newDietKey,
            }),
          }
        );

        if (!aiResponse.ok) {
          throw new Error("AI API call failed");
        }

        const aiResult = await aiResponse.json();
        if (!aiResult.success) {
          throw new Error(aiResult.message);
        }

        toast.success("Diet plan created successfully with AI recommendations!");
        resetForm();
        fetchDietDetails();
      } catch (error) {
        toast.error("Error: " + error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('preferredMealTimes.')) {
      const mealTime = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        preferredMealTimes: {
          ...prev.preferredMealTimes,
          [mealTime]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const resetForm = () => {
    setFormData({
      currentWeight: '',
      bloodSugar: '',
      medicalConditions: '',
      allergies: '',
      preferredMealTimes: {
        breakfast: '',
        lunch: '',
        dinner: ''
      },
      startDate: new Date(),
      endDate: new Date()
    });
    setErrors({});
  };

  return (
    <div className="container py-5" style={{ marginBottom: "150px" }}>
      <div className="row g-4 justify-content-center">
        <div className="col-lg-5">
          <div className="card shadow-sm border-0 rounded-3">
            <div className="card-header py-3" style={{ backgroundColor: "#7555C6", color: "white" }}>
              <h4 className="mb-0 fw-bold">Create Diet Plan</h4>
            </div>
            <div className="card-body p-4">
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="form-label fw-semibold">Current Weight (kg)</label>
                  <input
                    type="number"
                    className={`form-control form-control-lg ${errors.currentWeight ? "is-invalid" : ""}`}
                    name="currentWeight"
                    value={formData.currentWeight}
                    onChange={handleChange}
                    placeholder="Enter your current weight"
                  />
                  {errors.currentWeight && (
                    <div className="invalid-feedback">{errors.currentWeight}</div>
                  )}
                </div>

                <div className="mb-4">
                  <label className="form-label fw-semibold">Blood Sugar Level (mg/dL)</label>
                  <input
                    type="number"
                    className={`form-control form-control-lg ${errors.bloodSugar ? "is-invalid" : ""}`}
                    name="bloodSugar"
                    value={formData.bloodSugar}
                    onChange={handleChange}
                    placeholder="Enter your blood sugar level"
                  />
                  {errors.bloodSugar && (
                    <div className="invalid-feedback">{errors.bloodSugar}</div>
                  )}
                </div>

                <div className="mb-4">
                  <label className="form-label fw-semibold">Medical Conditions</label>
                  <textarea
                    className="form-control form-control-lg"
                    name="medicalConditions"
                    value={formData.medicalConditions}
                    onChange={handleChange}
                    placeholder="Enter any medical conditions (optional)"
                    rows="2"
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label fw-semibold">Allergies</label>
                  <textarea
                    className="form-control form-control-lg"
                    name="allergies"
                    value={formData.allergies}
                    onChange={handleChange}
                    placeholder="Enter any food allergies (optional)"
                    rows="2"
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label fw-semibold">Preferred Meal Times</label>
                  <div className="row g-3">
                    <div className="col-md-4">
                      <input
                        type="time"
                        className="form-control form-control-lg"
                        name="preferredMealTimes.breakfast"
                        value={formData.preferredMealTimes.breakfast}
                        onChange={handleChange}
                        placeholder="Breakfast"
                      />
                      <small className="text-muted">Breakfast</small>
                    </div>
                    <div className="col-md-4">
                      <input
                        type="time"
                        className="form-control form-control-lg"
                        name="preferredMealTimes.lunch"
                        value={formData.preferredMealTimes.lunch}
                        onChange={handleChange}
                        placeholder="Lunch"
                      />
                      <small className="text-muted">Lunch</small>
                    </div>
                    <div className="col-md-4">
                      <input
                        type="time"
                        className="form-control form-control-lg"
                        name="preferredMealTimes.dinner"
                        value={formData.preferredMealTimes.dinner}
                        onChange={handleChange}
                        placeholder="Dinner"
                      />
                      <small className="text-muted">Dinner</small>
                    </div>
                  </div>
                  {errors.mealTimes && (
                    <div className="text-danger mt-2">{errors.mealTimes}</div>
                  )}
                </div>

                <div className="mb-4">
                  <label className="form-label fw-semibold">Start Date</label>
                  <DatePicker
                    selected={formData.startDate}
                    onChange={(date) => setFormData(prev => ({ ...prev, startDate: date }))}
                    className="form-control form-control-lg"
                    minDate={new Date()}
                    placeholderText="Select start date"
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label fw-semibold">End Date</label>
                  <DatePicker
                    selected={formData.endDate}
                    onChange={(date) => setFormData(prev => ({ ...prev, endDate: date }))}
                    className="form-control form-control-lg"
                    minDate={formData.startDate}
                    placeholderText="Select end date"
                  />
                  {errors.dateRange && (
                    <div className="text-danger mt-2">{errors.dateRange}</div>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn btn-lg w-100 text-white"
                  style={{ backgroundColor: "#7555C6" }}
                  disabled={loading}
                >
                  {loading ? (
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  ) : null}
                  Generate Diet Plan
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-lg-7">
          <div className="card shadow-sm border-0 rounded-3">
            <div className="card-header py-3" style={{ backgroundColor: "#7555C6", color: "white" }}>
              <h4 className="mb-0 fw-bold">Your Diet Plans</h4>
            </div>
            <div className="card-body p-4">
              {dietDetails.length === 0 ? (
                <div className="text-center py-5">
                  <h5 className="text-muted">No diet plans yet</h5>
                  <p className="text-muted mb-0">Create a plan to get personalized diet recommendations</p>
                </div>
              ) : (
                <>
                  <div className="mb-4 border-bottom">
                    <div className="d-flex flex-wrap">
                      {Object.keys(groupDietsByMonth(dietDetails))
                        .filter((month) => month)
                        .map((month) => (
                          <button
                            key={month}
                            className={`btn btn-link text-decoration-none px-3 py-2 ${
                              selectedMonth === month
                                ? "border-bottom border-3 border-primary fw-bold"
                                : ""
                            }`}
                            onClick={() => setSelectedMonth(month)}
                          >
                            {month}
                          </button>
                        ))}
                    </div>
                  </div>

                  {/* Diet Plan Cards */}
                  <div className="row g-4">
                    {groupDietsByMonth(dietDetails)[
                      selectedMonth ||
                        Object.keys(groupDietsByMonth(dietDetails))[0]
                    ]?.map((diet, index) => (
                      <div key={index} className="col-12">
                        <div className="card h-100 border-0 shadow-sm">
                          <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                              <div className="d-flex align-items-center gap-2">
                                <button
                                  className="btn btn-outline-danger btn-sm"
                                  onClick={() => handleDeleteDiet(diet.key)}
                                  title="Delete Diet Plan"
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                              </div>
                              <small className="text-muted">
                                Created on {new Date(diet.createdAt).toLocaleDateString()}
                              </small>
                            </div>

                            <div className="mb-3">
                              <div className="row g-3">
                                <div className="col-md-6">
                                  <p className="mb-1 text-muted small">Weight</p>
                                  <p className="mb-0 fw-semibold">{diet.currentWeight} kg</p>
                                </div>
                                <div className="col-md-6">
                                  <p className="mb-1 text-muted small">Blood Sugar</p>
                                  <p className="mb-0 fw-semibold">{diet.bloodSugar} mg/dL</p>
                                </div>
                              </div>
                            </div>

                            <div className="mb-3">
                              <div className="row g-3">
                                <div className="col-md-6">
                                  <p className="mb-1 text-muted small">Start Date</p>
                                  <p className="mb-0 fw-semibold">
                                    {new Date(diet.startDate).toLocaleDateString("en-US", {
                                      weekday: "long",
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                    })}
                                  </p>
                                </div>
                                <div className="col-md-6">
                                  <p className="mb-1 text-muted small">End Date</p>
                                  <p className="mb-0 fw-semibold">
                                    {new Date(diet.endDate).toLocaleDateString("en-US", {
                                      weekday: "long",
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                    })}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {diet.medicalConditions && (
                              <div className="mb-3">
                                <p className="mb-1 text-muted small">Medical Conditions</p>
                                <p className="mb-0">{diet.medicalConditions}</p>
                              </div>
                            )}

                            {diet.allergies && (
                              <div className="mb-3">
                                <p className="mb-1 text-muted small">Allergies</p>
                                <p className="mb-0">{diet.allergies}</p>
                              </div>
                            )}

                            <div className="mb-3">
                              <p className="mb-1 text-muted small">Preferred Meal Times</p>
                              <div className="row g-2">
                                <div className="col-md-4">
                                  <small className="text-muted">Breakfast:</small>{" "}
                                  <span className="fw-semibold">{diet.preferredMealTimes.breakfast}</span>
                                </div>
                                <div className="col-md-4">
                                  <small className="text-muted">Lunch:</small>{" "}
                                  <span className="fw-semibold">{diet.preferredMealTimes.lunch}</span>
                                </div>
                                <div className="col-md-4">
                                  <small className="text-muted">Dinner:</small>{" "}
                                  <span className="fw-semibold">{diet.preferredMealTimes.dinner}</span>
                                </div>
                              </div>
                            </div>

                            {diet.diet_plan && (
                              <div className="mt-3 pt-3 border-top">
                                <h6 className="fw-bold mb-3">Diet Plan Details</h6>
                                <div className="bg-light p-3 rounded">
                                  <pre
                                    style={{
                                      whiteSpace: "pre-wrap",
                                      wordWrap: "break-word",
                                      fontFamily: "inherit",
                                      margin: 0,
                                    }}
                                  >
                                    {diet.diet_plan}
                                  </pre>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DietPlanForm;