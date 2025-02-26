import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { database } from "../firebase-config";
import { ref, set, get, push } from "firebase/database";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Cookies from "js-cookie";
import { format } from "date-fns";

function ExercisePlan(props) {
  const [formData, setFormData] = useState({
    intensityLevel: "",
    startDate: new Date(),
    endDate: new Date(),
  });
  const [exerciseDetails, setExerciseDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [selectedMonth, setSelectedMonth] = useState(null);

  useEffect(() => {
    props.setisFixed(false);
    fetchExerciseDetails();
  }, []);

  const groupExercisesByMonth = (exercises) => {
    const grouped = {};
    exercises.forEach((exercise) => {
      try {
        // Safely parse the date
        const date = new Date(exercise.createdAt);
        // Check if date is valid
        if (isNaN(date.getTime())) {
          console.error("Invalid date:", exercise.createdAt);
          return; // Skip this iteration
        }
        const monthYear = format(date, "MMMM yyyy");
        if (!grouped[monthYear]) {
          grouped[monthYear] = [];
        }
        grouped[monthYear].push(exercise);
      } catch (error) {
        console.error("Error processing date:", error);
        // Create a fallback category if needed
        const fallbackCategory = "Undated Plans";
        if (!grouped[fallbackCategory]) {
          grouped[fallbackCategory] = [];
        }
        grouped[fallbackCategory].push(exercise);
      }
    });
    return grouped;
  };

  const intensityLevels = [
    {
      value: "low",
      label: "Low - Safe exercises for pregnancy",
      description: "Gentle activities suitable for all trimesters",
    },
    {
      value: "moderate",
      label: "Moderate - Regular activity level",
      description: "Balanced exercises for maintaining fitness",
    },
    {
      value: "high",
      label: "High - Advanced pregnancy exercises",
      description: "For those with pre-existing fitness routines",
    },
  ];

  const handleDeleteExercise = async (exerciseKey) => {
    if (window.confirm("Are you sure you want to delete this exercise plan?")) {
      try {
        const userCookie = Cookies.get("user");
        const userCookieData = JSON.parse(userCookie);

        const exerciseRef = ref(
          database,
          `MaternalHealthSystem/users/${userCookieData.phone}/exercisePlans/${exerciseKey}`
        );

        await set(exerciseRef, null); // This will delete the node
        toast.success("Exercise plan deleted successfully");
        fetchExerciseDetails(); // Refresh the list
      } catch (error) {
        toast.error("Error deleting exercise plan: " + error.message);
      }
    }
  };

  const fetchExerciseDetails = async () => {
    try {
      const userCookie = Cookies.get("user");
      if (!userCookie) {
        toast.error("User not authenticated");
        return;
      }

      const userCookieData = JSON.parse(userCookie);
      const exerciseRef = ref(
        database,
        `MaternalHealthSystem/users/${userCookieData.phone}/exercisePlans`
      );
      const snapshot = await get(exerciseRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        const exerciseList = Object.entries(data).map(([key, value]) => {
          // Ensure createdAt is a valid date
          let createdAt = value.createdAt;
          if (!createdAt) {
            createdAt = value.timestamp
              ? new Date(value.timestamp).toISOString()
              : new Date().toISOString();
          }
          return {
            ...value,
            key,
            createdAt, // Use the validated createdAt
          };
        });

        const sortedList = exerciseList.sort((a, b) => {
          const dateA = new Date(a.createdAt);
          const dateB = new Date(b.createdAt);
          return dateB - dateA;
        });

        setExerciseDetails(sortedList);

        // Set initial selected month if we have valid exercises
        if (sortedList.length > 0 && new Date(sortedList[0].createdAt)) {
          const initialMonth = format(
            new Date(sortedList[0].createdAt),
            "MMMM yyyy"
          );
          setSelectedMonth(initialMonth);
        }
      } else {
        setExerciseDetails([]);
      }
    } catch (error) {
      toast.error("Failed to fetch exercise details: " + error.message);
    }
  };

  const validateForm = () => {
    let tempErrors = {};
    let isValid = true;

    if (!formData.intensityLevel) {
      tempErrors.intensityLevel = "Please select intensity level";
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

        // Create the exercise plan with timestamp
        const newExerPlan = {
          ...formData,
          startDate: formData.startDate.toISOString(),
          endDate: formData.endDate.toISOString(),
          timestamp: Date.now(),
          createdAt: new Date().toISOString(),
        };

        // Use push() to generate a unique key
        const newExerciseRef = push(
          ref(
            database,
            `MaternalHealthSystem/users/${userCookieData.phone}/exercisePlans`
          ),
          newExerPlan
        );

        // Get the generated key
        const newExerciseKey = newExerciseRef.key;

        // Then call AI API with the new key
        const aiResponse = await fetch(
          "http://127.0.0.1:5000/api/exercise-ai",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              current_data: {
                intensityLevel: formData.intensityLevel,
                startDate: formData.startDate.toISOString(),
                endDate: formData.endDate.toISOString(),
              },
              response_structure: {
                exercises_plan: [],
              },
              phone: userCookieData.phone,
              currentKey: newExerciseKey, // Using the generated key here
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

        toast.success(
          "Exercise plan created successfully with AI recommendations!"
        );
        resetForm();
        fetchExerciseDetails(); // Refresh the list
      } catch (error) {
        toast.error("Error: " + error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user changes value
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const resetForm = () => {
    setFormData({
      intensityLevel: "",
      startDate: new Date(),
      endDate: new Date(),
    });
    setErrors({});
  };

  return (
    <div className="container py-5" style={{ marginBottom: "150px" }}>
      <div className="row g-4 justify-content-center">
        <div className="col-lg-5">
          <div className="card shadow-sm border-0 rounded-3">
            <div
              className="card-header py-3"
              style={{ backgroundColor: "#7555C6", color: "white" }}
            >
              <h4 className="mb-0 fw-bold">Create Exercise Plan</h4>
            </div>
            <div className="card-body p-4">
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="form-label fw-semibold">
                    Intensity Level
                  </label>
                  <select
                    className={`form-select form-select-lg ${
                      errors.intensityLevel ? "is-invalid" : ""
                    }`}
                    name="intensityLevel"
                    value={formData.intensityLevel}
                    onChange={handleChange}
                  >
                    <option value="">Select Intensity Level</option>
                    {intensityLevels.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                  {errors.intensityLevel && (
                    <div className="invalid-feedback">
                      {errors.intensityLevel}
                    </div>
                  )}
                  {formData.intensityLevel && (
                    <div className="form-text mt-2">
                      {
                        intensityLevels.find(
                          (level) => level.value === formData.intensityLevel
                        )?.description
                      }
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <label className="form-label fw-semibold">Start Date</label>
                  <DatePicker
                    selected={formData.startDate}
                    onChange={(date) =>
                      setFormData((prev) => ({ ...prev, startDate: date }))
                    }
                    className="form-control form-control-lg"
                    minDate={new Date()}
                    placeholderText="Select start date"
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label fw-semibold">End Date</label>
                  <DatePicker
                    selected={formData.endDate}
                    onChange={(date) =>
                      setFormData((prev) => ({ ...prev, endDate: date }))
                    }
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
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                  ) : null}
                  Generate Exercise Plan
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-lg-7">
          <div className="card shadow-sm border-0 rounded-3">
            <div
              className="card-header py-3"
              style={{ backgroundColor: "#7555C6", color: "white" }}
            >
              <h4 className="mb-0 fw-bold">Your Exercise Plans</h4>
            </div>
            <div className="card-body p-4">
              {exerciseDetails.length === 0 ? (
                <div className="text-center py-5">
                  <div className="mb-3"></div>
                  <h5 className="text-muted">No exercise plans yet</h5>
                  <p className="text-muted mb-0">
                    Create a plan to get personalized exercise recommendations
                  </p>
                </div>
              ) : (
                <>
                  {/* Tabs */}
                  {/* Tabs */}
                  <div className="mb-4 border-bottom">
                    <div className="d-flex flex-wrap">
                      {Object.keys(groupExercisesByMonth(exerciseDetails))
                        .filter((month) => month) // Filter out any undefined/null months
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

                  {/* Exercise Cards */}
                  <div className="row g-4">
                    {groupExercisesByMonth(exerciseDetails)[
                      selectedMonth ||
                        Object.keys(groupExercisesByMonth(exerciseDetails))[0]
                    ]?.map((exercise, index) => (
                      <div key={index} className="col-12">
                        <div className="card h-100 border-0 shadow-sm">
                          <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                              <div className="d-flex align-items-center gap-2">
                                <span
                                  className="badge"
                                  style={{
                                    backgroundColor: "#7555C6",
                                    color: "white",
                                    padding: "8px 16px",
                                  }}
                                >
                                  {exercise.intensityLevel
                                    ? `${exercise.intensityLevel
                                        .charAt(0)
                                        .toUpperCase()}${exercise.intensityLevel.slice(
                                        1
                                      )} Intensity`
                                    : "Intensity Not Set"}
                                </span>
                                <button
                                  className="btn btn-outline-danger btn-sm"
                                  onClick={() =>
                                    handleDeleteExercise(exercise.key)
                                  }
                                  title="Delete Exercise Plan"
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                              </div>
                              <small className="text-muted">
                                Created on{" "}
                                {new Date(
                                  exercise.createdAt
                                ).toLocaleDateString()}
                              </small>
                            </div>

                            <div className="mb-3">
                              <div className="row g-3">
                                <div className="col-md-6">
                                  <p className="mb-1 text-muted small">
                                    Start Date
                                  </p>
                                  <p className="mb-0 fw-semibold">
                                    {new Date(
                                      exercise.startDate
                                    ).toLocaleDateString("en-US", {
                                      weekday: "long",
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                    })}
                                  </p>
                                </div>
                                <div className="col-md-6">
                                  <p className="mb-1 text-muted small">
                                    End Date
                                  </p>
                                  <p className="mb-0 fw-semibold">
                                    {new Date(
                                      exercise.endDate
                                    ).toLocaleDateString("en-US", {
                                      weekday: "long",
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                    })}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {exercise.exercises_plan && (
                              <div className="mt-3 pt-3 border-top">
                                <h6 className="fw-bold mb-3">
                                  Exercise Plan Details
                                </h6>
                                <div className="bg-light p-3 rounded">
                                  <pre
                                    style={{
                                      whiteSpace: "pre-wrap",
                                      wordWrap: "break-word",
                                      fontFamily: "inherit",
                                      margin: 0,
                                    }}
                                  >
                                    {exercise.exercises_plan}
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

export default ExercisePlan;
