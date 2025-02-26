import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaBabyCarriage, FaStethoscope, FaUserMd, FaCalendarCheck, FaArrowRight } from 'react-icons/fa';
import { 
  Card, CardBody, CardTitle, CardText, Button,
  Container, Row, Col, Carousel, CarouselItem,
  CarouselControl, CarouselIndicators, CarouselCaption
} from 'reactstrap';

// Custom CSS
const styles = {
  heroSection: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '80px 0',
    marginBottom: '4rem',
    borderRadius: '0 0 50px 50px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
  },
  gradientText: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  serviceCard: {
    borderRadius: '15px',
    border: 'none',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
  },
  carouselImage: {
    height: '600px',
    objectFit: 'cover',
    borderRadius: '20px',
  },
  carouselContainer: {
    padding: '20px',
  },
  carouselCaption: {
    background: 'linear-gradient(rgba(0,0,0,0), rgba(0,0,0,0.8))',
    borderRadius: '0 0 20px 20px',
    padding: '2rem',
  }
};

function Home(props) {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [animating, setAnimating] = React.useState(false);

  const services = [
    {
      icon: <FaBabyCarriage size={40} />,
      title: "Maternal Care",
      description: "Comprehensive care throughout your pregnancy journey",
      color: "#667eea"
    },
    {
      icon: <FaStethoscope size={40} />,
      title: "Health Monitoring",
      description: "Regular health checkups and vital monitoring",
      color: "#764ba2"
    },
    {
      icon: <FaUserMd size={40} />,
      title: "Expert Consultation",
      description: "24/7 access to healthcare professionals",
      color: "#6B46C1"
    },
    {
      icon: <FaCalendarCheck size={40} />,
      title: "Appointment Scheduling",
      description: "Easy and flexible appointment booking",
      color: "#805AD5"
    }
  ];

  const carouselItems = [
    {
      src: 'bg1.jpg',
      altText: 'Maternal Care',
      caption: 'Expert Maternal Care',
      subtitle: 'Professional healthcare support throughout your journey'
    },
    {
      src: 'bg2.jpg',
      altText: 'Health Monitoring',
      caption: 'Comprehensive Health Monitoring',
      subtitle: 'State-of-the-art facilities for your wellbeing'
    },
    {
      src: 'bg3.png',
      altText: 'Expert Consultation',
      caption: '24/7 Expert Consultation',
      subtitle: 'Connect with healthcare professionals anytime'
    }
  ];

  useEffect(() => {
    props.setisFixed(false);
  }, []);

  const next = () => {
    if (animating) return;
    const nextIndex = activeIndex === carouselItems.length - 1 ? 0 : activeIndex + 1;
    setActiveIndex(nextIndex);
  };

  const previous = () => {
    if (animating) return;
    const nextIndex = activeIndex === 0 ? carouselItems.length - 1 : activeIndex - 1;
    setActiveIndex(nextIndex);
  };

  const goToIndex = (newIndex) => {
    if (animating) return;
    setActiveIndex(newIndex);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{marginTop:"-28px"}}
    >
      {/* Hero Section */}
      <div style={styles.heroSection}>
        <Container>
          <Row className="align-items-center">
            <Col md={6}>
              <motion.div
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <h1 className="display-4 text-white mb-4">Welcome to Modern Maternal Care</h1>
                <p className="lead text-white-50 mb-4">Experience the future of healthcare with our comprehensive maternal care services</p>
               
              </motion.div>
            </Col>
          </Row>
        </Container>
      </div>


      {/* Services Section */}
      <Container className="py-5">
        <motion.h2 
          className="text-center mb-5"
          style={styles.gradientText}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Our Services
        </motion.h2>

        <Row>
          {services.map((service, index) => (
            <Col md={3} key={index}>
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 * (index + 1) }}
              >
                <Card 
                  className="h-100 shadow-lg mb-4" 
                  style={styles.serviceCard}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-10px)';
                    e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                  }}
                >
                  <CardBody className="text-center">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      style={{ color: service.color }}
                      className="mb-4"
                    >
                      {service.icon}
                    </motion.div>
                    <CardTitle tag="h5" className="mb-3">{service.title}</CardTitle>
                    <CardText className="text-muted">{service.description}</CardText>
          
                  </CardBody>
                </Card>
              </motion.div>
            </Col>
          ))}
        </Row>
      </Container>
    </motion.div>
  );
}

export default Home;