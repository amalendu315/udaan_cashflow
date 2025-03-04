"use client";
import { useState } from "react";

import { useAuth } from "@/contexts/auth-context";
import toast from "react-hot-toast";




const LoginForm = () => {
    const {login} = useAuth();
    const [formData, setFormData] = useState({ username: "", password: "" });
    const [isLoading, setIsLoading] = useState(false);
    const handleChange = (e:React.ChangeEvent<HTMLInputElement>) => {
        setFormData({...formData, [e.target.name]: e.target.value});
    };
    const handleSubmit = async (e:React.FormEvent) => {
      setIsLoading(true);
        e.preventDefault();
        try {
            const res = await fetch("/api/login",{
                method:"POST",
                headers:{
                    "Content-Type":"application/json",
                },
                body:JSON.stringify(formData),
            });
            if(!res.ok){
                throw new Error("Invalid Credentials");
            }
            const data = await res.json();
            login(data?.token, data?.user);
            console.log('data?.user', data?.user)
            toast.success("Logged in Successfully");
        } catch (error) {
            toast.error((error as Error).message);
        } finally {
          setIsLoading(false);
        }
    }
    return (
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md space-y-6"
      >
        <h2 className="text-xl font-semibold text-gray-800 text-center">
          Login to your account
        </h2>

        <div>
          <label
            htmlFor="username"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Username
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your username"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your password"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        >
          Login
        </button>
      </form>
    );
};

export default LoginForm;