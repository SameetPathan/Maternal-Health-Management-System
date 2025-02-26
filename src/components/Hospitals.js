import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ref, get, push, set } from 'firebase/database';
import { database } from '../firebase-config';
import { toast } from 'react-toastify';
import { 
  FaHospital, FaSearch, FaStar, FaStarHalfAlt, FaRegStar, 
  FaUserMd, FaPhone, FaEnvelope, FaMapMarkerAlt, FaPaperPlane, 
  FaFilter, FaComments
} from 'react-icons/fa';
import { Rating } from 'react-simple-star-rating';
import Cookies from "js-cookie";

function Hospitals({ setisFixed, userId }) {
  const [hospitals, setHospitals] = useState([]);
  const [filteredHospitals, setFilteredHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({
    rating: 0,
    comment: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setisFixed(false);
    fetchHospitals();
  }, []);

  useEffect(() => {
    if (selectedHospital) {
      fetchReviews(selectedHospital.phone);
    }
  }, [selectedHospital]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredHospitals(hospitals);
    } else {
      const filtered = hospitals.filter(
        hospital => 
          hospital.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          hospital.hospitalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          hospital.specialization.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredHospitals(filtered);
    }
  }, [searchTerm, hospitals]);

  const fetchHospitals = async () => {
    try {
      const usersRef = ref(database, 'MaternalHealthSystem/users');
      const snapshot = await get(usersRef);
      
      if (snapshot.exists()) {
        const usersData = snapshot.val();
        const hospitalsList = Object.keys(usersData)
          .filter(key => usersData[key].userType === 'hospital')
          .map(key => ({
            ...usersData[key],
            id: key
          }));
        
        setHospitals(hospitalsList);
        setFilteredHospitals(hospitalsList);
      } else {
        toast.info('No hospitals found');
      }
    } catch (error) {
      toast.error('Error fetching hospitals: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async (hospitalId) => {
    try {
      const reviewsRef = ref(database, `MaternalHealthSystem/reviews/${hospitalId}`);
      const snapshot = await get(reviewsRef);
      
      if (snapshot.exists()) {
        const reviewsData = snapshot.val();
        const reviewsList = Object.keys(reviewsData).map(key => ({
          ...reviewsData[key],
          id: key
        }));
        
        setReviews(reviewsList);
      } else {
        setReviews([]);
      }
    } catch (error) {
      toast.error('Error fetching reviews: ' + error.message);
    }
  };

  const handleHospitalSelect = (hospital) => {
    setSelectedHospital(hospital);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleRatingChange = (rate) => {
    setNewReview(prev => ({
      ...prev,
      rating: rate / 20  // Convert from 0-100 to 0-5
    }));
  };

  const handleReviewChange = (e) => {
    setNewReview(prev => ({
      ...prev,
      comment: e.target.value
    }));
  };

  const submitReview = async () => {
    if (!selectedHospital) {
      toast.error('Please select a hospital');
      return;
    }

    if (newReview.rating === 0) {
      toast.error('Please provide a rating');
      return;
    }

    if (newReview.comment.trim() === '') {
      toast.error('Please provide a comment');
      return;
    }

    try {
      const reviewsRef = ref(database, `MaternalHealthSystem/reviews/${selectedHospital.phone}`);
      const newReviewRef = push(reviewsRef);
      const userCookie = Cookies.get("user");
              const userCookieData = JSON.parse(userCookie);
      
      await set(newReviewRef, {
        userId:userCookieData.phone,
        userName: 'Anonymous User', // You might want to get actual user name
        rating: newReview.rating,
        comment: newReview.comment,
        timestamp: Date.now(),
        status: 'pending' // For hospital approval if needed
      });
      
      toast.success('Review submitted successfully');
      setNewReview({ rating: 0, comment: '' });
      fetchReviews(selectedHospital.phone);
    } catch (error) {
      toast.error('Error submitting review: ' + error.message);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={`star-${i}`} className="text-warning" />);
    }
    
    if (hasHalfStar) {
      stars.push(<FaStarHalfAlt key="half-star" className="text-warning" />);
    }
    
    const remainingStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<FaRegStar key={`empty-${i}`} className="text-warning" />);
    }
    
    return stars;
  };

  const calculateAverageRating = (reviews) => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((total, review) => total + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  return (
    <div className="min-vh-100 py-5 bg-light">
      <div className="container">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="row mb-4">
            <div className="col-lg-8">
              <h2 className="mb-3 fw-bold text-primary">
                <FaHospital className="me-2" /> Find Maternal Healthcare Providers
              </h2>
              <p className="lead text-muted">
                Browse and review hospitals and specialists for your maternal healthcare needs
              </p>
            </div>
            <div className="col-lg-4">
              <div className="input-group mb-3">
                <span className="input-group-text bg-primary text-white">
                  <FaSearch />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by name or specialization"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>
            </div>
          </div>

          <div className="row">
            {/* Left Column - Hospital List */}
            <div className="col-lg-4 mb-4">
              <div className="card border-0 shadow-sm" style={{ borderRadius: "15px" }}>
                <div className="card-header bg-primary text-white py-3" style={{ borderRadius: "15px 15px 0 0" }}>
                  <h5 className="mb-0 fw-bold">
                    <FaUserMd className="me-2" /> Healthcare Providers
                  </h5>
                </div>
                <div className="card-body p-0" style={{ maxHeight: "500px", overflowY: "auto" }}>
                  {loading ? (
                    <div className="text-center p-4">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  ) : filteredHospitals.length === 0 ? (
                    <div className="text-center p-4">
                      <p>No hospitals found matching your search.</p>
                    </div>
                  ) : (
                    <ul className="list-group list-group-flush">
                      {filteredHospitals.map((hospital) => (
                        <motion.li
                          key={hospital.phone}
                          className={`list-group-item list-group-item-action ${selectedHospital?.phone === hospital.phone ? 'active bg-primary text-white' : ''}`}
                          onClick={() => handleHospitalSelect(hospital)}
                          whileHover={{ backgroundColor: '#f0f0f0' }}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <h6 className="mb-0 fw-bold">{hospital.hospitalName}</h6>
                              <small className={selectedHospital?.phone === hospital.phone ? 'text-white-50' : 'text-muted'}>
                                <FaUserMd className="me-1" /> Dr. {hospital.name}
                              </small>
                            </div>
                            <span className="badge bg-light text-dark rounded-pill">
                              {hospital.specialization}
                            </span>
                          </div>
                        </motion.li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Hospital Details & Reviews */}
            <div className="col-lg-8">
              {selectedHospital ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  {/* Hospital Details Card */}
                  <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: "15px" }}>
                    <div className="card-body p-4">
                      <div className="row">
                        <div className="col-md-8">
                          <h3 className="fw-bold text-primary mb-2">{selectedHospital.hospitalName}</h3>
                          <p className="mb-2">
                            <FaUserMd className="me-2 text-primary" /> Dr. {selectedHospital.name}
                            <span className="badge bg-light text-dark ms-2">{selectedHospital.specialization}</span>
                          </p>
                          <p className="mb-2">
                            <FaPhone className="me-2 text-primary" /> {selectedHospital.phone}
                          </p>
                          <p className="mb-2">
                            <FaEnvelope className="me-2 text-primary" /> {selectedHospital.email}
                          </p>
                          <p className="mb-0">
                            <FaMapMarkerAlt className="me-2 text-primary" /> {selectedHospital.address || "Address not provided"}
                          </p>
                        </div>
                        <div className="col-md-4 text-md-end mt-3 mt-md-0">
                          <div className="bg-light p-3 rounded text-center">
                            <h2 className="mb-0 fw-bold text-primary">{calculateAverageRating(reviews)}</h2>
                            <div className="mb-1">
                              {renderStars(parseFloat(calculateAverageRating(reviews)))}
                            </div>
                            <p className="mb-0 small text-muted">{reviews.length} review(s)</p>
                          </div>
                        </div>
                      </div>
                      <hr />
                      <p>{selectedHospital.hospitalDescription || "No description provided."}</p>
                    </div>
                  </div>

                  {/* Review Form */}
                  <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: "15px" }}>
                    <div className="card-header bg-white py-3" style={{ borderRadius: "15px 15px 0 0" }}>
                      <h5 className="mb-0 fw-bold">Write a Review</h5>
                    </div>
                    <div className="card-body p-4">
                      <div className="mb-3">
                        <label className="form-label fw-bold">Rating</label>
                        <div>
                          <Rating
                            onClick={handleRatingChange}
                            ratingValue={newReview.rating * 20} // Convert from 0-5 to 0-100
                            size={30}
                            transition
                            fillColor="#FFC107"
                            emptyColor="#e2e2e2"
                          />
                        </div>
                      </div>
                      <div className="mb-3">
                        <label htmlFor="reviewComment" className="form-label fw-bold">Your Review</label>
                        <textarea
                          className="form-control"
                          id="reviewComment"
                          rows="3"
                          value={newReview.comment}
                          onChange={handleReviewChange}
                          placeholder="Share your experience with this healthcare provider..."
                        ></textarea>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="btn btn-primary px-4"
                        onClick={submitReview}
                      >
                        <FaPaperPlane className="me-2" /> Submit Review
                      </motion.button>
                    </div>
                  </div>

                  {/* Reviews List */}
                  <div className="card border-0 shadow-sm" style={{ borderRadius: "15px" }}>
                    <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center" style={{ borderRadius: "15px 15px 0 0" }}>
                      <h5 className="mb-0 fw-bold">
                        <FaComments className="me-2" /> Patient Reviews
                      </h5>
                      <span className="badge bg-primary">{reviews.length} Review(s)</span>
                    </div>
                    <div className="card-body p-4">
                      {reviews.length === 0 ? (
                        <div className="text-center p-4">
                          <p className="mb-0 text-muted">No reviews yet. Be the first to review!</p>
                        </div>
                      ) : (
                        <div className="reviews-list">
                          {reviews.map((review) => (
                            <div key={review.id} className="review-item mb-4 pb-4 border-bottom">
                              <div className="d-flex justify-content-between mb-2">
                                <div>
                                  <h6 className="mb-0 fw-bold">{review.userName || 'Anonymous'}</h6>
                                  <div>
                                    {renderStars(review.rating)}
                                  </div>
                                </div>
                                <small className="text-muted">
                                  {new Date(review.timestamp).toLocaleDateString()}
                                </small>
                              </div>
                              <p className="mb-0 mt-2">{review.comment}</p>
                              {review.reply && (
                                <div className="mt-3 p-3 bg-light rounded">
                                  <small className="fw-bold text-primary">Hospital's Response:</small>
                                  <p className="mb-0 mt-1">{review.reply}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="card border-0 shadow-sm h-100" style={{ borderRadius: "15px" }}>
                  <div className="card-body p-5 d-flex flex-column justify-content-center align-items-center">
                    <FaHospital size={60} className="text-primary mb-4 opacity-50" />
                    <h4 className="text-center text-muted">Select a healthcare provider to view details and reviews</h4>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default Hospitals;