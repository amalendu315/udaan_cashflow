"use client";
// Dependencies
import Link from "next/link";

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 text-gray-800">
      <h1 className="text-6xl font-extrabold text-blue-600 mb-4">404</h1>
      <h2 className="text-2xl font-bold mb-2">Page Not Found</h2>
      <p className="text-lg mb-6">
        Oops! The page you are looking for does not exist. It might have been
        moved or deleted.
      </p>
      <Link href="/" passHref>
        <p className="px-6 py-2 bg-blue-500 text-white font-semibold rounded shadow-md hover:bg-blue-600 transition duration-300">
          Go Back Home
        </p>
      </Link>
    </div>
  );
};

export default NotFoundPage;
