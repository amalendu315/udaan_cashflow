"use client";


const Footer = () => {

  return (
    <footer
      className={`sticky w-full bg-gray-200 text-gray-900 py-6 px-4 transition-all duration-500 ease-in-out`}
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between">
        {/* Left Side */}
        <div className="text-sm text-gray-400">
          &copy; {new Date().getFullYear()} AirIQ Online Private Limited. All Rights Reserved.
        </div>

        {/* Footer Links */}
        <div className="flex space-x-4 mt-2 md:mt-0">
          <a
            href="#"
            className="hover:text-white transition duration-300 transform hover:-translate-y-1"
          >
            Terms of Service
          </a>
          <a
            href="#"
            className="hover:text-white transition duration-300 transform hover:-translate-y-1"
          >
            Privacy Policy
          </a>
          <a
            href="#"
            className="hover:text-white transition duration-300 transform hover:-translate-y-1"
          >
            Contact Us
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
