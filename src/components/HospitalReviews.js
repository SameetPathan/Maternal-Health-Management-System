import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ref, get, update } from 'firebase/database';
import { database } from '../firebase-config';
import { toast } from 'react-toastify';
import { 
  FaStar, FaStarHalfAlt, FaRegStar, FaReply, 
  FaCheckCircle, FaTimesCircle, FaFilter, FaSearch,
  FaSortAmountDown, FaSortAmountUpAlt, FaComments
} from 'react-icons/fa';

function HospitalReviews({ setisFixed, hospitalData }) {
  const [reviews, setReviews] = useState([]);
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // all, pending, replied
  const [sort, setSort] = useState('newest'); // newest, oldest, highest, lowest

  useEffect(() => {
    setisFixed(false);
    fetchReviews();
  }, [hospitalData]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [reviews, searchTerm, filter, sort]);

  const fetchReviews = async () => {
    try {
      const reviewsRef = ref(database, `MaternalHealthSystem/reviews/${hospitalData.phone}`);
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
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...reviews];
    
    // Apply search
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(review => 
        review.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (review.userName && review.userName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Apply status filter
    if (filter === 'pending') {
      filtered = filtered.filter(review => !review.reply);
    } else if (filter === 'replied') {
      filtered = filtered.filter(review => review.reply);
    }
    
    // Apply sorting
    if (sort === 'newest') {
      filtered.sort((a, b) => b.timestamp - a.timestamp);
    } else if (sort === 'oldest') {
      filtered.sort((a, b) => a.timestamp - b.timestamp);
    } else if (sort === 'highest') {
      filtered.sort((a, b) => b.rating - a.rating);
    } else if (sort === 'lowest') {
      filtered.sort((a, b) => a.rating - b.rating);
    }
    
    setFilteredReviews(filtered);
  };

  const handleReplyChange = (reviewId, text) => {
    setReplyText({
      ...replyText,
      [reviewId]: text
    });
  };

  const submitReply = async (reviewId) => {
    if (!replyText[reviewId] || replyText[reviewId].trim() === '') {
      toast.error('Please enter a reply');
      return;
    }

    try {
      const reviewRef = ref(database, `MaternalHealthSystem/reviews/${hospitalData.phone}/${reviewId}`);
      await update(reviewRef, {
        reply: replyText[reviewId],
        replyTimestamp: Date.now()
      });
      
      toast.success('Reply submitted successfully');
      
      // Update the reviews list
      setReviews(prev => 
        prev.map(review => 
          review.id === reviewId 
            ? { 
                ...review, 
                reply: replyText[reviewId],
                replyTimestamp: Date.now()
              } 
            : review
        )
      );
      
      // Clear the reply text for this review
      setReplyText({
        ...replyText,
        [reviewId]: ''
      });
    } catch (error) {
      toast.error('Error submitting reply: ' + error.message);
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

  const calculateStats = () => {
    if (reviews.length === 0) {
      return {
        averageRating: 0,
        total: 0,
        pending: 0,
        replied: 0
      };
    }

    const total = reviews.length;
    const pending = reviews.filter(review => !review.reply).length;
    const replied = reviews.filter(review => review.reply).length;
    const sum = reviews.reduce((total, review) => total + review.rating, 0);
    const averageRating = (sum / total).toFixed(1);

    return {
      averageRating,
      total,
      pending,
      replied
    };
  };

  const stats = calculateStats();

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
            <div className="col">
              <h2 className="mb-3 fw-bold text-primary">
                <FaComments className="me-2" /> Manage Patient Reviews
              </h2>
              <p className="lead text-muted">
                View and respond to reviews for {hospitalData.hospitalName}
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="row mb-4">
            <div className="col-md-3 mb-3 mb-md-0">
              <div className="card border-0 shadow-sm h-100" style={{ borderRadius: "15px" }}>
                <div className="card-body d-flex align-items-center">
                  <div className="rounded-circle p-3 bg-primary bg-opacity-10 me-3">
                    <FaStar className="text-primary" size={24} />
                  </div>
                  <div>
                    <h3 className="mb-0 fw-bold">{stats.averageRating}</h3>
                    <p className="mb-0 text-muted">Average Rating</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-3 mb-md-0">
              <div className="card border-0 shadow-sm h-100" style={{ borderRadius: "15px" }}>
                <div className="card-body d-flex align-items-center">
                  <div className="rounded-circle p-3 bg-info bg-opacity-10 me-3">
                    <FaComments className="text-info" size={24} />
                  </div>
                  <div>
                    <h3 className="mb-0 fw-bold">{stats.total}</h3>
                    <p className="mb-0 text-muted">Total Reviews</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-3 mb-md-0">
              <div className="card border-0 shadow-sm h-100" style={{ borderRadius: "15px" }}>
                <div className="card-body d-flex align-items-center">
                  <div className="rounded-circle p-3 bg-warning bg-opacity-10 me-3">
                    <FaTimesCircle className="text-warning" size={24} />
                  </div>
                  <div>
                    <h3 className="mb-0 fw-bold">{stats.pending}</h3>
                    <p className="mb-0 text-muted">Pending Replies</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100" style={{ borderRadius: "15px" }}>
                <div className="card-body d-flex align-items-center">
                  <div className="rounded-circle p-3 bg-success bg-opacity-10 me-3">
                    <FaCheckCircle className="text-success" size={24} />
                  </div>
                  <div>
                    <h3 className="mb-0 fw-bold">{stats.replied}</h3>
                    <p className="mb-0 text-muted">Replied</p>
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
                      placeholder="Search reviews..."
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
                      <option value="all">All Reviews</option>
                      <option value="pending">Pending Reply</option>
                      <option value="replied">Replied</option>
                    </select>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="input-group">
                    <span className="input-group-text bg-primary text-white">
                      {sort.includes('newest') || sort.includes('highest') ? 
                        <FaSortAmountDown /> : <FaSortAmountUpAlt />}
                    </span>
                    <select
                      className="form-select"
                      value={sort}
                      onChange={(e) => setSort(e.target.value)}
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="highest">Highest Rating</option>
                      <option value="lowest">Lowest Rating</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reviews List */}
          <div className="card border-0 shadow-sm" style={{ borderRadius: "15px" }}>
            <div className="card-header bg-white py-3" style={{ borderRadius: "15px 15px 0 0" }}>
              <h5 className="mb-0 fw-bold">Patient Reviews ({filteredReviews.length})</h5>
            </div>
            <div className="card-body p-0">
              {loading ? (
                <div className="text-center p-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : filteredReviews.length === 0 ? (
                <div className="text-center p-5">
                  <p className="text-muted mb-0">No reviews found matching your criteria.</p>
                </div>
              ) : (
                <div className="reviews-list">
                  {filteredReviews.map((review) => (
                    <div key={review.id} className="p-4 border-bottom">
                      <div className="row">
                        <div className="col-md-8">
                          <div className="d-flex justify-content-between mb-2">
                            <div>
                              <h6 className="mb-0 fw-bold">{review.userName || 'Anonymous'}</h6>
                              <div>
                                {renderStars(review.rating)}
                                <span className="ms-2 text-muted">{review.rating.toFixed(1)}/5</span>
                              </div>
                            </div>
                            <span className="badge bg-light text-dark">
                              {new Date(review.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="mb-0 mt-2">{review.comment}</p>
                          
                          {review.reply && (
                            <div className="mt-3 p-3 bg-light rounded">
                              <div className="d-flex justify-content-between">
                                <small className="fw-bold text-primary">Your Response:</small>
                                <small className="text-muted">
                                  {review.replyTimestamp ? new Date(review.replyTimestamp).toLocaleDateString() : ''}
                                </small>
                              </div>
                              <p className="mb-0 mt-1">{review.reply}</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="col-md-4">
                          {!review.reply ? (
                            <div className="bg-light p-3 rounded mt-3 mt-md-0">
                              <h6 className="fw-bold mb-2">
                                <FaReply className="me-2 text-primary" /> Reply to Review
                              </h6>
                              <textarea
                                className="form-control mb-2"
                                rows="3"
                                placeholder="Type your response here..."
                                value={replyText[review.id] || ''}
                                onChange={(e) => handleReplyChange(review.id, e.target.value)}
                              ></textarea>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="btn btn-primary w-100"
                                onClick={() => submitReply(review.id)}
                              >
                                Submit Response
                              </motion.button>
                            </div>
                          ) : (
                            <div className="d-flex justify-content-center align-items-center h-100">
                              <div className="text-center">
                                <FaCheckCircle className="text-success" size={30} />
                                <p className="text-muted mt-2 mb-0">Replied</p>
                              </div>
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
        </motion.div>
      </div>
    </div>
  );
}

export default HospitalReviews;