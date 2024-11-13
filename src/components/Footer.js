// components/Footer.js
import React from 'react';
import { FaHeart, FaPhone, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';

function Footer(props) {
  return (
    <footer className={`bg-dark text-light ${props.isFixed ? 'fixed-bottom' : 'mt-5'}`}>
      <div className="container py-4">
      
        <hr className="mt-4" />
        
        <div className="text-center pt-3">
          <p className="mb-0">
            <small className=" text-light">&copy; {new Date().getFullYear()} Mom Care. All rights reserved.</small>
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
