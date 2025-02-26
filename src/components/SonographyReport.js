import React, { useState, useEffect } from "react";
import { storage, database } from "../firebase-config";
import { ref, push, set, remove, get, update } from "firebase/database";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import Cookies from "js-cookie";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import DatePicker from "react-datepicker";
import {
  FaCalendar,
  FaExclamationCircle,
  FaFileUpload,
  FaTrash,
  FaEdit,
  FaImage,
  FaFileMedical,
  FaRegClock,
  FaSave,
  FaTimes,
  FaBaby,
  FaUpload,
  FaFileAlt,
  FaRuler,
  FaHeartbeat,
  FaWeight,
  FaVial,
} from "react-icons/fa";

function SonographyReport(props) {
  const [reportData, setReportData] = useState({
    reportDate: "",
    gestationalAge: "",
    fetalHeartRate: "",
    fetalWeight: "",
    fetalPosition: "",
    placentalPosition: "",
    amnioticFluidIndex: "",
    cervicalLength: "",
    complications: "No complications detected",
    result: "Normal",
    multiplePregnancy: "No",
    numberFetuses: "1",
    anatomicalMarkers: "",
    recommendedFollowUp: "",
    doctorNotes: "",
    imageUrl: "",
  });

  const fetchReports = async () => {
    try {
      const userCookie = Cookies.get("user");
      if (userCookie) {
        const userCookieData = JSON.parse(userCookie);
        const reportsRef = ref(
          database,
          `MaternalHealthSystem/users/${userCookieData.phone}/Sonography`
        );
        const snapshot = await get(reportsRef);

        if (snapshot.exists()) {
          const reportsData = [];
          snapshot.forEach((childSnapshot) => {
            reportsData.push({
              id: childSnapshot.key,
              ...childSnapshot.val(),
            });
          });
          setReports(reportsData.sort((a, b) => b.createdAt - a.createdAt));
        }
      }
    } catch (error) {
      toast.error("Error fetching reports: " + error.message);
    }
  };

  const [imageFile, setImageFile] = useState(null);
  const [reports, setReports] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReports();
    props.setisFixed(false);
  }, []);

  const fetalPositions = [
    "Cephalic",
    "Breech",
    "Transverse",
    "Oblique",
    "Unknown",
  ];

  const placentalPositions = [
    "Anterior",
    "Posterior",
    "Fundal",
    "Lateral",
    "Low-lying",
    "Previa",
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userCookie = Cookies.get("user");
      const userCookieData = JSON.parse(userCookie);
      let imageUrl = reportData.imageUrl;

      if (imageFile) {
        const imageStorageRef = storageRef(
          storage,
          `sonography/${Date.now()}_${imageFile.name}`
        );
        const uploadTask = await uploadBytes(imageStorageRef, imageFile);
        imageUrl = await getDownloadURL(uploadTask.ref);
      }

      const reportsRef = ref(
        database,
        `MaternalHealthSystem/users/${userCookieData.phone}/Sonography`
      );

      let reportRef;
      if (isEditing) {
        reportRef = ref(
          database,
          `MaternalHealthSystem/users/${userCookieData.phone}/Sonography/${editingId}`
        );
        await update(reportRef, {
          ...reportData,
          imageUrl,
          updatedAt: Date.now(),
        });
      } else {
        reportRef = push(reportsRef);
        await set(reportRef, {
          ...reportData,
          imageUrl,
          createdAt: Date.now(),
        });
      }

      // Call AI analysis
      const aiResponse = await fetch("http://127.0.0.1:5000/api/sono-ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          current_data: reportData,
          phone: userCookieData.phone,
          currentKey: isEditing ? editingId : reportRef.key,
        }),
      });

      if (!aiResponse.ok) {
        throw new Error("API call failed");
      }

      toast.success(
        isEditing
          ? "Report updated successfully!"
          : "Report added successfully!"
      );
      resetForm();
      fetchReports();
    } catch (error) {
      toast.error("Failed to save report: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleDelete = async (reportId, imageUrl) => {
    try {
      const userCookie = Cookies.get("user");
      const userCookieData = JSON.parse(userCookie);

      // Delete from database
      const reportRef = ref(
        database,
        `MaternalHealthSystem/users/${userCookieData.phone}/Sonography/${reportId}`
      );
      await remove(reportRef);

      // Delete image from storage
      if (imageUrl) {
        const imageRef = storageRef(storage, imageUrl);
        await deleteObject(imageRef);
      }

      toast.success("Report deleted successfully!");
      fetchReports();
    } catch (error) {
      toast.error("Failed to delete report: " + error.message);
    }
  };

  const resetForm = () => {
    setReportData({
      reportDate: "",
      gestationalAge: "",
      fetalHeartRate: "",
      fetalWeight: "",
      fetalPosition: "",
      placentalPosition: "",
      amnioticFluidIndex: "",
      cervicalLength: "",
      complications: "No complications detected",
      result: "Normal",
      multiplePregnancy: "No",
      numberFetuses: "1",
      anatomicalMarkers: "",
      recommendedFollowUp: "",
      doctorNotes: "",
      imageUrl: "",
    });

    // Reset the image file state
    setImageFile(null);

    // Reset editing states
    setIsEditing(false);
    setEditingId(null);

    // Reset any errors if you have error state
    // setErrors({});

    // Reset image preview if you have one
    setSelectedImage(null);
  };

  const handleEdit = (report) => {
    setReportData({
      reportDate: report.reportDate,
      complications: report.complications,
      result: report.result,
      imageUrl: report.imageUrl,
    });
    setIsEditing(true);
    setEditingId(report.id);
  };

  return (
    <div className="min-vh-100 bg-light py-5">
      <motion.div
        className="container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header Section */}
        <div className="row mb-4">
          <div className="col-12">
            <motion.div
              className="card border-0 shadow-lg"
              style={{
                borderRadius: "20px",
                background: "linear-gradient(135deg, #7555C6 0%, #6610f2 100%)",
              }}
            >
              <div className="card-body p-4">
                <div className="d-flex align-items-center">
                  <FaBaby className="display-4 me-3 text-white" />
                  <div className="text-white">
                    <h1 className="h3 mb-2">Sonography Reports</h1>
                    <p className="mb-0 opacity-75">
                      Comprehensive tracking of your pregnancy ultrasound
                      records
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="row g-4">
          {/* Form Section */}
          <div className="col-lg-4">
            <motion.div
              className="card border-0 shadow-lg"
              style={{ borderRadius: "20px" }}
            >
              <div className="card-body p-4">
                <h5 className="card-title mb-4">
                  <FaFileAlt className="text-primary me-2" />
                  {isEditing ? "Edit Report" : "New Report"}
                </h5>

                <form onSubmit={handleSubmit} className="row g-3">
                  <div className="col-12">
                    <div className="form-group mb-3">
                      <label className="form-label">
                        <FaCalendar className="me-2" />
                        Report Date
                      </label>
                      <input
                        type="date"
                        className="form-control form-control-lg"
                        value={reportData.reportDate}
                        onChange={(e) =>
                          setReportData({
                            ...reportData,
                            reportDate: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">
                        <FaRegClock className="me-2" />
                        Gestational Age (weeks)
                      </label>
                      <input
                        type="number"
                        className="form-control form-control-lg"
                        value={reportData.gestationalAge}
                        onChange={(e) =>
                          setReportData({
                            ...reportData,
                            gestationalAge: e.target.value,
                          })
                        }
                        placeholder="Enter weeks"
                        required
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">
                        <FaHeartbeat className="me-2" />
                        Fetal Heart Rate (BPM)
                      </label>
                      <input
                        type="number"
                        className="form-control form-control-lg"
                        value={reportData.fetalHeartRate}
                        onChange={(e) =>
                          setReportData({
                            ...reportData,
                            fetalHeartRate: e.target.value,
                          })
                        }
                        placeholder="Enter BPM"
                        required
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">
                        <FaWeight className="me-2" />
                        Estimated Fetal Weight (g)
                      </label>
                      <input
                        type="number"
                        className="form-control form-control-lg"
                        value={reportData.fetalWeight}
                        onChange={(e) =>
                          setReportData({
                            ...reportData,
                            fetalWeight: e.target.value,
                          })
                        }
                        placeholder="Enter weight in grams"
                        required
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">
                        <FaBaby className="me-2" />
                        Fetal Position
                      </label>
                      <select
                        className="form-select form-select-lg"
                        value={reportData.fetalPosition}
                        onChange={(e) =>
                          setReportData({
                            ...reportData,
                            fetalPosition: e.target.value,
                          })
                        }
                        required
                      >
                        <option value="">Select position</option>
                        {fetalPositions.map((pos) => (
                          <option key={pos} value={pos}>
                            {pos}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="col-12">
                    <div className="form-group mb-3">
                      <label className="form-label">
                        <FaFileMedical className="me-2" />
                        Placental Position
                      </label>
                      <select
                        className="form-select form-select-lg"
                        value={reportData.placentalPosition}
                        onChange={(e) =>
                          setReportData({
                            ...reportData,
                            placentalPosition: e.target.value,
                          })
                        }
                        required
                      >
                        <option value="">Select position</option>
                        {placentalPositions.map((pos) => (
                          <option key={pos} value={pos}>
                            {pos}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">
                        <FaVial className="me-2" />
                        Amniotic Fluid Index
                      </label>
                      <input
                        type="number"
                        className="form-control form-control-lg"
                        value={reportData.amnioticFluidIndex}
                        onChange={(e) =>
                          setReportData({
                            ...reportData,
                            amnioticFluidIndex: e.target.value,
                          })
                        }
                        placeholder="Enter AFI"
                        required
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">
                        <FaRuler className="me-2" />
                        Cervical Length (mm)
                      </label>
                      <input
                        type="number"
                        className="form-control form-control-lg"
                        value={reportData.cervicalLength}
                        onChange={(e) =>
                          setReportData({
                            ...reportData,
                            cervicalLength: e.target.value,
                          })
                        }
                        placeholder="Enter length in mm"
                        required
                      />
                    </div>
                  </div>

                  <div className="col-12">
                    <div className="form-floating">
                      <select
                        className="form-select"
                        value={reportData.multiplePregnancy}
                        onChange={(e) =>
                          setReportData({
                            ...reportData,
                            multiplePregnancy: e.target.value,
                          })
                        }
                        required
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                      <label>
                        <FaBaby className="me-2" />
                        Multiple Pregnancy
                      </label>
                    </div>
                  </div>

                  {reportData.multiplePregnancy === "Yes" && (
                    <div className="col-12">
                      <div className="form-floating">
                        <select
                          className="form-select"
                          value={reportData.numberFetuses}
                          onChange={(e) =>
                            setReportData({
                              ...reportData,
                              numberFetuses: e.target.value,
                            })
                          }
                          required
                        >
                          <option value="2">Twins (2)</option>
                          <option value="3">Triplets (3)</option>
                          <option value="4">Quadruplets (4)</option>
                          <option value="5">Quintuplets (5)</option>
                        </select>
                        <label>
                          <FaBaby className="me-2" />
                          Number of Fetuses
                        </label>
                      </div>
                    </div>
                  )}

                  <div className="col-12">
                    <div className="form-floating">
                      <textarea
                        className="form-control"
                        style={{ height: "100px" }}
                        value={reportData.anatomicalMarkers}
                        onChange={(e) =>
                          setReportData({
                            ...reportData,
                            anatomicalMarkers: e.target.value,
                          })
                        }
                        placeholder="Enter anatomical markers"
                      />
                      <label>
                        <FaFileMedical className="me-2" />
                        Anatomical Markers
                      </label>
                    </div>
                  </div>

                  <div className="col-12">
                    <div className="form-floating">
                      <select
                        className="form-select"
                        value={reportData.complications}
                        onChange={(e) =>
                          setReportData({
                            ...reportData,
                            complications: e.target.value,
                          })
                        }
                        required
                      >
                        <option value="No complications detected">
                          No complications detected
                        </option>
                        <option value="Minor complications">
                          Minor complications
                        </option>
                        <option value="Requires attention">
                          Requires attention
                        </option>
                        <option value="Immediate follow-up needed">
                          Immediate follow-up needed
                        </option>
                      </select>
                      <label>
                        <FaExclamationCircle className="me-2" />
                        Complications
                      </label>
                    </div>
                  </div>

                  <div className="col-12">
                    <div className="form-floating">
                      <textarea
                        className="form-control"
                        style={{ height: "100px" }}
                        value={reportData.recommendedFollowUp}
                        onChange={(e) =>
                          setReportData({
                            ...reportData,
                            recommendedFollowUp: e.target.value,
                          })
                        }
                        placeholder="Enter follow-up recommendations"
                      />
                      <label>
                        <FaCalendar className="me-2" />
                        Recommended Follow-up
                      </label>
                    </div>
                  </div>

                  <div className="col-12">
                    <div className="form-floating">
                      <textarea
                        className="form-control"
                        style={{ height: "100px" }}
                        value={reportData.doctorNotes}
                        onChange={(e) =>
                          setReportData({
                            ...reportData,
                            doctorNotes: e.target.value,
                          })
                        }
                        placeholder="Enter doctor's notes"
                      />
                      <label>
                        <FaFileAlt className="me-2" />
                        Doctor's Notes
                      </label>
                    </div>
                  </div>

                  <div className="col-12">
                    <label className="form-label d-flex align-items-center mb-2">
                      <FaUpload className="me-2 text-primary" />
                      Upload Sonography Image
                    </label>
                    <input
                      type="file"
                      className="form-control"
                      accept="image/*"
                      onChange={handleImageChange}
                      required={!isEditing}
                    />
                  </div>

                  <div className="col-12">
                    <div className="d-grid gap-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        className="btn btn-primary btn-lg"
                        disabled={loading}
                      >
                        {loading ? (
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          ></span>
                        ) : (
                          <FaSave className="me-2" />
                        )}
                        {isEditing ? "Update Report" : "Save Report"}
                      </motion.button>

                      {isEditing && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="button"
                          className="btn btn-outline-secondary btn-lg"
                          onClick={() => {
                            setIsEditing(false);
                            setEditingId(null);
                            resetForm();
                          }}
                        >
                          <FaTimes className="me-2" />
                          Cancel Editing
                        </motion.button>
                      )}
                    </div>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>

          {/* Reports Display Section */}
          <div className="col-lg-8">
            <motion.div
              className="card border-0 shadow-lg"
              style={{ borderRadius: "20px" }}
            >
              <div className="card-body p-4">
                <h5 className="card-title mb-4">
                  <FaRegClock className="text-primary me-2" />
                  Sonography History
                </h5>

                <AnimatePresence>
                  <div className="row g-4">
                    {reports.map((report) => (
                      <motion.div
                        className="col-12"
                        key={report.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                      >
                        <div className="card h-100 border-0 shadow-sm">
                          <div className="card-body">
                            <div className="row">
                              <div className="col-md-4">
                                {report.imageUrl && (
                                  <div className="position-relative mb-3">
                                    <img
                                      src={report.imageUrl}
                                      alt="Sonography"
                                      className="img-fluid rounded cursor-pointer"
                                      onClick={() =>
                                        setSelectedImage(report.imageUrl)
                                      }
                                      style={{
                                        maxHeight: "200px",
                                        width: "100%",
                                        objectFit: "cover",
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
                              <div className="col-md-8">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                  <h6 className="text-primary mb-0">
                                    Report Date:{" "}
                                    {new Date(
                                      report.reportDate
                                    ).toLocaleDateString()}
                                  </h6>
                                  <div className="btn-group">
                                    <motion.button
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      className="btn btn-outline-primary btn-sm"
                                      onClick={() => handleEdit(report)}
                                    >
                                      <FaEdit />
                                    </motion.button>
                                    <motion.button
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      className="btn btn-outline-danger btn-sm"
                                      onClick={() =>
                                        handleDelete(report.id, report.imageUrl)
                                      }
                                    >
                                      <FaTrash />
                                    </motion.button>
                                  </div>
                                </div>

                                <div className="row g-3">
                                  <div className="col-6">
                                    <small className="text-muted">
                                      Gestational Age:
                                    </small>
                                    <p className="mb-2">
                                      {report.gestationalAge} weeks
                                    </p>
                                  </div>
                                  <div className="col-6">
                                    <small className="text-muted">
                                      Fetal Heart Rate:
                                    </small>
                                    <p className="mb-2">
                                      {report.fetalHeartRate} BPM
                                    </p>
                                  </div>
                                  <div className="col-6">
                                    <small className="text-muted">
                                      Estimated Weight:
                                    </small>
                                    <p className="mb-2">
                                      {report.fetalWeight} g
                                    </p>
                                  </div>
                                  <div className="col-6">
                                    <small className="text-muted">
                                      Fetal Position:
                                    </small>
                                    <p className="mb-2">
                                      {report.fetalPosition}
                                    </p>
                                  </div>
                                </div>

                                <div
                                  className={`badge ${
                                    report.complications ===
                                    "No complications detected"
                                      ? "bg-success"
                                      : report.complications ===
                                        "Minor complications"
                                      ? "bg-warning"
                                      : "bg-danger"
                                  } mb-2`}
                                >
                                  {report.complications}
                                </div>

                                {report.ai_analysis && (
                                  <div className="mt-3 pt-3 border-top">
                                    <h6 className="fw-bold mb-2">
                                       Analysis
                                    </h6>
                                    <div className="bg-light p-3 rounded">
                                      <pre
                                        className="mb-0"
                                        style={{
                                          whiteSpace: "pre-wrap",
                                          wordWrap: "break-word",
                                          fontFamily: "inherit",
                                        }}
                                      >
                                        {report.ai_analysis}
                                      </pre>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </AnimatePresence>

                {reports.length === 0 && (
                  <motion.div
                    className="text-center py-5"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <FaImage className="text-muted mb-3" size={48} />
                    <p className="text-muted mb-0">
                      No sonography reports available
                    </p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Image Preview Modal */}
      {selectedImage && (
        <div
          className="modal fade show d-block"
          style={{
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 1050,
          }}
          onClick={() => setSelectedImage(null)}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0">
              <div className="modal-body p-0">
                <img
                  src={selectedImage}
                  alt="Sonography Preview"
                  className="img-fluid rounded"
                  style={{ width: "100%" }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SonographyReport;
