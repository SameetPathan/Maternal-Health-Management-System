// components/SonographyReport.js
import React, { useState, useEffect } from 'react';
import { storage, database } from '../firebase-config';
import { ref, push, set, remove, get, update } from "firebase/database";
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
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
  FaTimes
} from 'react-icons/fa';

function SonographyReport(props) {
  const [reportData, setReportData] = useState({
    reportDate: '',
    complications: 'Pending',
    result: 'Pending',
    imageUrl: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [reports, setReports] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    props.setisFixed(false);
  }, []);


  const fetchReports = async () => {
    try {
      const userCookie = Cookies.get('user');
      if (userCookie) {
        const userCookieData = JSON.parse(userCookie);
        const reportsRef = ref(database, `MaternalHealthSystem/users/${userCookieData.phone}/Sonography`);
        const snapshot = await get(reportsRef);
        
        if (snapshot.exists()) {
          const reportsData = [];
          snapshot.forEach((childSnapshot) => {
            reportsData.push({
              id: childSnapshot.key,
              ...childSnapshot.val()
            });
          });
          setReports(reportsData.sort((a, b) => b.createdAt - a.createdAt));
        }
      }
    } catch (error) {
      toast.error('Error fetching reports: ' + error.message);
    }
  };

  const handleDelete = async (reportId, imageUrl) => {
    try {
      const userCookie = Cookies.get('user');
      const userCookieData = JSON.parse(userCookie);
      
      // Delete from database
      const reportRef = ref(database, `MaternalHealthSystem/users/${userCookieData.phone}/Sonography/${reportId}`);
      await remove(reportRef);

      // Delete image from storage
      if (imageUrl) {
        const imageRef = storageRef(storage, imageUrl);
        await deleteObject(imageRef);
      }

      toast.success('Report deleted successfully!');
      fetchReports();
    } catch (error) {
      toast.error('Failed to delete report: ' + error.message);
    }
  };

  const handleEdit = (report) => {
    setReportData({
      reportDate: report.reportDate,
      complications: report.complications,
      result: report.result,
      imageUrl: report.imageUrl
    });
    setIsEditing(true);
    setEditingId(report.id);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const userCookie = Cookies.get('user');
      const userCookieData = JSON.parse(userCookie);
      let imageUrl = reportData.imageUrl;

      // Handle image upload if there's a new image
      if (imageFile) {
        const imageStorageRef = storageRef(storage, `sonography/${Date.now()}_${imageFile.name}`);
        const uploadTask = await uploadBytes(imageStorageRef, imageFile);
        imageUrl = await getDownloadURL(uploadTask.ref);
      }

      const reportsRef = ref(database, `MaternalHealthSystem/users/${userCookieData.phone}/Sonography`);
      
      if (isEditing) {
        // Update existing report
        const updateRef = ref(database, `MaternalHealthSystem/users/${userCookieData.phone}/Sonography/${editingId}`);
        await update(updateRef, {
          ...reportData,
          imageUrl,
          updatedAt: Date.now()
        });
        toast.success('Report updated successfully!');
      } else {
        // Create new report
        const newReportRef = push(reportsRef);
        await set(newReportRef, {
          ...reportData,
          imageUrl,
          createdAt: Date.now()
        });
        toast.success('Report added successfully!');
      }

      // Reset form
      setReportData({ reportDate: '', complications: '', result: '', imageUrl: '' });
      setImageFile(null);
      setIsEditing(false);
      setEditingId(null);
      fetchReports();
    } catch (error) {
      toast.error('Failed to save report: ' + error.message);
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.5,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <motion.div 
    className="container-fluid mt-5"
    variants={containerVariants}
    initial="hidden"
    style={{marginBottom:"150px"}}
    animate="visible"
  >
    <div className="row">
      <div className="col-lg-4 mb-4">
          <motion.div 
            className="card shadow-lg border-0 rounded-lg"
            variants={itemVariants}
          >
            <div className="card-body p-4">
              <div className="alert alert-primary mb-4" role="alert">
                <FaRegClock className="me-2" />
                {isEditing ? 'Edit Sonography Report' : 'Add Sonography Report'}
              </div>
                
                  <form onSubmit={handleSubmit}>
                    <motion.div 
                      className="form-group mb-3"
                      whileHover={{ scale: 1.01 }}
                    >
                      <div className="input-group input-group-lg">
                        <span className="input-group-text bg-primary text-white">
                          <FaCalendar />
                        </span>
                        <input
                          type="date"
                          className="form-control"
                          value={reportData.reportDate}
                          onChange={(e) => setReportData({...reportData, reportDate: e.target.value})}
                          required
                        />
                      </div>
                    </motion.div>

                    <motion.div 
                      className="form-group mb-3"
                      whileHover={{ scale: 1.01 }}
                    >
                      <div className="input-group">
                        
                        <textarea
                          className="form-control"
                          placeholder="Complications Detected"
                          value={reportData.complications}
                          onChange={(e) => setReportData({...reportData, complications: e.target.value})}
                          hidden
                          rows="3"
                        />
                      </div>
                    </motion.div>

                    <motion.div 
                      className="form-group mb-3"
                      whileHover={{ scale: 1.01 }}
                    >
                      <div className="input-group">
                       
                        <textarea
                          className="form-control"
                          placeholder="Result"
                          value={reportData.result}
                          onChange={(e) => setReportData({...reportData, result: e.target.value})}
                          hidden
                          rows="3"
                        />
                      </div>
                    </motion.div>

                    <motion.div 
                      className="form-group mb-4"
                      whileHover={{ scale: 1.01 }}
                    >
                      <label className="form-label">
                       
                      
                      </label>
                      <input
                        type="file"
                        className="form-control form-control-lg"
                        accept="image/*"
                        onChange={handleImageChange}
                        required={!isEditing}
                      />
                    </motion.div>

                    <div className="d-grid gap-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        className="btn btn-primary btn-lg"
                      >
                        <FaSave className="me-2" />
                        {isEditing ? 'Update Report' : 'Save Report'}
                      </motion.button>

                      {isEditing && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="button"
                          className="btn btn-secondary btn-lg"
                          onClick={() => {
                            setIsEditing(false);
                            setEditingId(null);
                            setReportData({ reportDate: '', complications: '', result: '', imageUrl: '' });
                            setImageFile(null);
                          }}
                        >
                          <FaTimes className="me-2" />
                          Cancel Editing
                        </motion.button>
                      )}
                    </div>
                  </form>
                </div>
          </motion.div>
      </div>
      <div className="col-lg-8 mb-4">
          <motion.div 
            className="card shadow-lg border-0 rounded-lg"
            variants={itemVariants}
          >
            <div className="card-body p-4">
              <div className="alert alert-primary mb-4" role="alert">
                <FaRegClock className="me-2" />
                Sonography Reports History
              </div>
        
            
            <AnimatePresence>
              <div className="row">
                {reports.map((report) => (
                  <div className="col-md-6 mb-3" key={report.id}>
                    <motion.div 
                      className="card mb-3 border-0 shadow-sm h-100"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      whileHover={{ scale: 1.01 }}
                    >
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <h5 className="card-title text-primary">
                            <FaCalendar className="me-2" />
                            {new Date(report.reportDate).toLocaleDateString()}
                          </h5>
                          <div>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.9 }}
                              className="btn btn-outline-primary btn-sm me-2"
                              onClick={() => handleEdit(report)}
                            >
                              <FaEdit /> Edit
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => handleDelete(report.id, report.imageUrl)}
                            >
                              <FaTrash /> Delete
                            </motion.button>
                          </div>
                        </div>
                        <div className="report-details">
                          <p>
                            <strong>
                              <FaExclamationCircle className="me-2" />
                              Complications:
                            </strong>
                            <br />
                            {report.complications}
                          </p>
                          <p>
                            <strong>
                              <FaFileUpload className="me-2" />
                              Result:
                            </strong>
                            <br />
                            {report.result}
                          </p>
                          {report.imageUrl && (
                            <motion.img 
                              src={report.imageUrl} 
                              alt="Sonography Report" 
                              className="img-fluid mt-2 rounded"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.3 }}
                              style={{ maxHeight: '200px', cursor: 'pointer' }}
                              whileHover={{ scale: 1.05 }}
                            />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  </div>
                ))}
              </div>
            </AnimatePresence>
            
            {reports.length === 0 && (
              <motion.p 
                className="text-muted text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                No reports found
              </motion.p>
            )}
          </div>
        </motion.div>
      </div>
    </div>

  </motion.div>
  );
}

export default SonographyReport;
