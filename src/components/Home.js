// components/Home.js
import React,{useEffect} from 'react';
import { motion } from 'framer-motion';
import { FaBabyCarriage, FaStethoscope, FaUserMd, FaCalendarCheck } from 'react-icons/fa';
import { Carousel } from 'react-bootstrap';

function Home(props) {
  const services = [
    {
      icon: <FaBabyCarriage size={40} />,
      title: "Maternal Care",
      description: "Comprehensive care throughout your pregnancy journey"
    },
    {
      icon: <FaStethoscope size={40} />,
      title: "Health Monitoring",
      description: "Regular health checkups and vital monitoring"
    },
    {
      icon: <FaUserMd size={40} />,
      title: "Expert Consultation",
      description: "24/7 access to healthcare professionals"
    },
    {
      icon: <FaCalendarCheck size={40} />,
      title: "Appointment Scheduling",
      description: "Easy and flexible appointment booking"
    }
  ];

  useEffect(() => {
    props.setisFixed(false);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >

      <Carousel fade className="mb-5">
        <Carousel.Item>
          <img
            className="d-block w-100"
            style={{ height: '500px', objectFit: 'cover' }}
            src="bg1.jpg"
            alt="Maternal Care"
          />
          <Carousel.Caption>
            <h3>Expert Maternal Care</h3>
            <p>Professional healthcare support throughout your journey</p>
          </Carousel.Caption>
        </Carousel.Item>
        <Carousel.Item>
        <img
          className="d-block w-100"
          style={{ height: '500px', objectFit: 'cover' }}
          src="bg2.jpg"
          alt="Maternal Care"
        />
        <Carousel.Caption>
          <h3>Expert Maternal Care</h3>
          <p>Professional healthcare support throughout your journey</p>
        </Carousel.Caption>
      </Carousel.Item>
      <Carousel.Item>
      <img
        className="d-block w-100"
        style={{ height: '500px', objectFit: 'cover' }}
        src="bg3.png"
        alt="Maternal Care"
      />
      <Carousel.Caption>
        <h3>Expert Maternal Care</h3>
        <p>Professional healthcare support throughout your journey</p>
      </Carousel.Caption>
    </Carousel.Item>
      </Carousel>


      <div className="container mb-5">
        <motion.h2 
          className="text-center mb-5"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Our Services
        </motion.h2>

        <div className="row">
          {services.map((service, index) => (
            <motion.div
              key={index}
              className="col-md-3 mb-4"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 * (index + 1) }}
            >
              <div className="card h-100 shadow-sm hover-card">
                <div className="card-body text-center">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="text-primary mb-3"
                  >
                    {service.icon}
                  </motion.div>
                  <h5 className="card-title">{service.title}</h5>
                  <p className="card-text text-muted">{service.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default Home;
