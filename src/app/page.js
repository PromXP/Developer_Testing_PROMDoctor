"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Image from "next/image";

import { API_URL } from "./libs/global";

import { Poppins } from "next/font/google";

import Doc from "@/app/assets/logincover.png";
import Docbg from "@/app/assets/logincoverbg.png";
import Docbgsm from "@/app/assets/loginsmallbg.png";

import PasswordReset from "@/app/PasswordReset/page.jsx";

import "@/app/globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-poppins",
});

export default function Home() {
  const useWindowSize = () => {
    const [size, setSize] = useState({
      width: 0,
      height: 0,
    });

    useEffect(() => {
      const updateSize = () => {
        setSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      };

      updateSize(); // set initial size
      window.addEventListener("resize", updateSize);
      return () => window.removeEventListener("resize", updateSize);
    }, []);

    return size;
  };

  const [showAlert, setshowAlert] = useState(false);
  const [alermessage, setAlertMessage] = useState("");
  const showWarning = (message) => {
    setAlertMessage(message);
    setshowAlert(true);
    setTimeout(() => setshowAlert(false), 4000);
  };

  const { width, height } = useWindowSize();
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem("userData");
    if (userData) {
      const { identifier, password, role } = JSON.parse(userData);

      axios
        .post(API_URL + "login", { identifier, password, role })
        .then(() => {
          router.replace("/Landing");
        })
        .catch(() => {
          localStorage.removeItem("userData"); // Clear on failure
        });
    }
  }, []);

  const handleLogin = async () => {
    if (typeof window !== "undefined") {
      setLoading(true);
      try {
        const response = await axios.post(API_URL + "login", {
          identifier,
          password,
          role: "doctor",
        });

        // Store only identifier, password, and role in localStorage
        localStorage.setItem(
          "userData",
          JSON.stringify({
            identifier,
            password,
            role: "doctor",
          })
        );

        router.replace("/Landing");
      } catch (error) {
        showWarning("Login failed. Please check your credentials.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <>
      {width > height && (
        <div
          className={`${poppins.className} w-screen h-screen bg-white flex md:flex-row`}
        >
          {/* Left Section - Takes Full Width in Portrait Mode */}
          <div
            className={`${
              height > width
                ? "w-full h-full flex items-center justify-center px-6"
                : "w-[55%] min-h-screen px-12"
            } flex flex-col gap-12 items-center justify-center`}
          >
            <div
              className={`w-full max-w-lg text-center  ${
                height > width ? "text-center" : "md:text-left"
              }`}
            >
              <p className="font-bold text-3xl md:text-5xl text-black">
                DOCTOR
              </p>
              <p className="font-semibold text-2xl md:text-4xl text-[#7075DB]">
                Login
              </p>
            </div>

            {/* Input Fields */}
            <form
              className="w-full max-w-lg flex flex-col gap-8"
              onSubmit={(e) => {
                e.preventDefault(); // Prevent default page reload
                handleLogin();
              }}
            >
              <div className="relative w-full">
                <label className="absolute left-4 -top-2 bg-white px-1 text-[#7075DB] text-sm">
                  Email / Phone / UEID
                </label>
                <input
                  type="text"
                  className="w-full text-black py-3 px-4 border-[1.6px] border-[#79747E] rounded-sm text-lg focus:border-[#7075DB] outline-none"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                />
              </div>

              <div className="relative w-full">
                <label className="absolute left-4 -top-2 bg-white px-1 text-[#7075DB] text-sm">
                  Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full text-black py-3 px-4 border-[1.6px] border-[#79747E] rounded-sm text-lg focus:border-[#7075DB] outline-none"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[#7075DB] focus:outline-none cursor-pointer"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              <div className="flex flex-wrap justify-center items-center text-sm">
                <p
                  className="text-[#FF8682] cursor-pointer"
                  onClick={() => setIsOpen(true)}
                >
                  Forgot Password?
                </p>
              </div>

              <button
                type="submit"
                className="w-full bg-[#7075DB] text-lg text-white py-2.5 rounded-lg cursor-pointer"
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>
          </div>

          {/* Right Section - Image*/}
          <div className="hidden md:flex w-[45%] min-h-screen relative rounded-l-[50px] overflow-hidden">
            <Image
              src={Docbg}
              alt="Coverbackground"
              className="absolute w-full h-full object-cover"
            />
            <Image
              src={Doc}
              alt="Cover"
              className="absolute w-[95%] h-[90%] left-1/2 bottom-0 transform -translate-x-1/2 object-cover"
            />
          </div>
          {showAlert && (
            <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-50">
              <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-6 py-3 rounded-lg shadow-lg animate-fade-in-out">
                {alermessage}
              </div>
            </div>
          )}
        </div>
      )}

      {width <= height && (
        <div
          className={`${poppins.className} w-screen h-screen bg-white flex flex-col`}
        >
          {/* Left Section - Takes Full Width in Portrait Mode */}
          <div
            className={`${
              height > width
                ? "w-full h-full flex items-center justify-center px-6"
                : "w-[55%] min-h-screen px-12"
            } flex flex-col gap-12 items-center justify-center`}
          >
            <div
              className={`w-full max-w-lg text-center  ${
                height > width ? "text-center" : "md:text-left"
              }`}
            >
              <p className="font-bold text-3xl md:text-5xl text-black">
                DOCTOR
              </p>
              <p className="font-semibold text-2xl md:text-4xl text-[#7075DB]">
                Login
              </p>
            </div>

            {/* Input Fields */}
            <form
              onSubmit={(e) => {
                e.preventDefault(); // Prevent default form reload
                handleLogin(); // Trigger your login function
              }}
              className="w-full max-w-lg flex flex-col gap-8"
            >
              <div className="relative w-full">
                <label className="absolute left-4 -top-2 bg-white px-1 text-[#7075DB] text-sm">
                  Email / Phone / UEID
                </label>
                <input
                  type="text"
                  className="w-full text-black py-3 px-4 border-[1.6px] border-[#79747E] rounded-sm text-lg focus:border-[#7075DB] outline-none"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                />
              </div>

              <div className="relative w-full">
                <label className="absolute left-4 -top-2 bg-white px-1 text-[#7075DB] text-sm">
                  Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full text-black py-3 px-4 border-[1.6px] border-[#79747E] rounded-sm text-lg focus:border-[#7075DB] outline-none"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[#7075DB] focus:outline-none cursor-pointer"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              <div className="flex flex-wrap justify-center items-center text-sm">
                <p
                  className="text-[#FF8682] cursor-pointer"
                  onClick={() => setIsOpen(true)}
                >
                  Forgot Password?
                </p>
              </div>

              <button
                type="submit"
                className="w-full bg-[#7075DB] text-lg text-white py-2.5 rounded-lg cursor-pointer"
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>
          </div>

          {/* Right Section - Image*/}
          <div
            className={`relative overflow-hidden ${
              height / width <= 1.5 &&
              height / width >= 1.3 &&
              height - width >= 200
                ? "flex w-full h-full justify-center items-end p-0"
                : "hidden"
            } `}
          >
            <Image
              src={Docbgsm}
              alt="Coverbackground"
              className="absolute w-[50%] h-[70%] object-fit left-1/4 top-1.5"
            />
            <Image
              src={Doc}
              alt="Cover"
              className="absolute w-[80%] h-[100%] object-fit"
            />
          </div>
          {showAlert && (
            <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-50">
              <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-6 py-3 rounded-lg shadow-lg animate-fade-in-out">
                {alermessage}
              </div>
            </div>
          )}
        </div>
      )}

      <PasswordReset isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
