"use client";
import React from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/contexts/auth-context';
import LoginForm from '@/components/forms/login';
import Image from 'next/image';

const LoginPage = () => {
    const { isAuthenticated } = useAuth();
    const router = useRouter();
    if(isAuthenticated){
        router.push("/")
    }
  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      {/* Left Section */}
      <div className="hidden lg:flex flex-1 flex-col justify-center items-center bg-blue-50">
        <Image src="/assets/UDAAN_PBG.webp" alt="Udaan Logo" className="mb-8" width={150} height={150} />
        <Image
          src="/assets/illustration.svg"
          alt="Illustration"
          className="w-2/3 max-w-sm"
          width={500}
          height={500}
        />
      </div>

      {/* Right Section */}
      <div className="flex flex-1 justify-center items-center bg-white">
        <div className="w-full max-w-md p-6 sm:p-8 space-y-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 text-center lg:text-center">
            Financial Management Dashboard
          </h1>
          {/* Login Form */}
          <LoginForm />
        </div>
      </div>
    </div>
  );
}

export default LoginPage