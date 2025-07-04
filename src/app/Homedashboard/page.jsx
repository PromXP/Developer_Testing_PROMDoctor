"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Image from "next/image";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { Poppins } from "next/font/google";

import Firstimepassreset from "@/app/Firsttimepasswordreset/page.jsx";

import ProfileImage from "@/app/assets/profile.png";
import Malepat from "@/app/assets/man.png";
import Femalepat from "@/app/assets/woman.png";
import Maledoc from "@/app/assets/maledoc.png";
import Femaledoc from "@/app/assets/femaledoc.png";

import { UserIcon } from "@heroicons/react/24/outline";
import {
  ChevronRightIcon,
  ChevronLeftIcon,
  ArrowUpRightIcon,
} from "@heroicons/react/16/solid";
import Patientimg from "@/app/assets/patimg.png";
import Ascending from "@/app/assets/ascending.png";
import Descending from "@/app/assets/descending.png";
import Patcount from "@/app/assets/patcount.png";
import Doccount from "@/app/assets/doccount.png";
import Flag from "@/app/assets/flag.png";

import "@/app/globals.css";
import { API_URL } from "../libs/global";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-poppins",
});

const page = ({ goToReport }) => {
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

  const { width, height } = useWindowSize();

  const [selected, setSelected] = useState(0);

  const [passopen, setpassopen] = useState(false);

  const handleSelect = (index) => {
    setSelected(index);
  };
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("userData");

      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        console.log("Retrieved user from localStorage:", parsedUser);

        if (parsedUser.password === "doctor@123") {
          setpassopen(true);
        }

        // Attempt to log in again using the stored credentials
        const loginWithStoredUser = async () => {
          try {
            const response = await axios.post(API_URL + "login", {
              identifier: parsedUser.identifier,
              password: parsedUser.password,
              role: parsedUser.role, // Assuming role is stored and needed
            });

            // Handle successful login response
            localStorage.setItem(
              "userData",
              JSON.stringify({
                identifier: parsedUser.identifier,
                password: parsedUser.password,
                role: parsedUser.role,
              })
            );

            setUserData(response.data); // Store the full response data (e.g., tokens)
            localStorage.setItem("uhid", response.data.user.uhid);
            console.log(
              "Successfully logged in with stored credentials",
              response.data.user.uhid
            );
          } catch (error) {
            console.error("Login failed with stored credentials", error);
            alert("Login failed. Please check your credentials.");
          }
        };

        // Call login function
        loginWithStoredUser();
      }
    }
  }, []);

  const [patients, setPatients] = useState([]);
  const lastTapRef = useRef({});
  const [preOpCount, setPreOpCount] = useState(0);
  const [postOpStages, setPostOpStages] = useState({});
  const [postOpTotal, setPostOpTotal] = useState(0);
  const [leftscoreGroups, setLeftScoreGroups] = useState({});
  const [rightscoreGroups, setRightScoreGroups] = useState({});

  const [selectedLeg, setSelectedLeg] = useState("left");

  useEffect(() => {
    const fetchPatients = async () => {
      if (!userData?.user?.email) return;

      try {
        const res = await axios.get(
          API_URL + `patients/by-doctor/${userData.user.email}`
        );
        const data = res.data;

        setPatients(data);
        console.log("Paitent list", data);

        // Count PRE OP patients for current selected leg
        const preOp = data.filter(
          (patient) =>
            getCurrentPeriod(patient, selectedLeg).toLowerCase() === "pre op"
        ).length;
        setPreOpCount(preOp);

        // Count POST OP stages
        const stageCounts = {
          "6W": 0,
          "3M": 0,
          "6M": 0,
          "1Y": 0,
          "2Y": 0,
        };

        data.forEach((patient) => {
          const status = getCurrentPeriod(patient, selectedLeg).toUpperCase();
          if (stageCounts.hasOwnProperty(status)) {
            stageCounts[status]++;
          }
        });

        setPostOpStages(stageCounts);
        setPostOpTotal(
          Object.values(stageCounts).reduce((sum, val) => sum + val, 0)
        );

        // === Separate Score Grouping Logic ===

        const leftScoreGroups = {};
        const rightScoreGroups = {};

        // LEFT
        data.forEach((patient) => {
          patient.questionnaire_scores_left?.forEach((q1) => {
            const key = `${q1.name}|${q1.period}`;
            if (!leftScoreGroups[key]) leftScoreGroups[key] = [];

            data.forEach((otherPatient) => {
              otherPatient.questionnaire_scores_left?.forEach((q2) => {
                if (q2.name.includes(q1.name) && q2.period === q1.period) {
                  if (q2.score && q2.score.length > 0) {
                    leftScoreGroups[key].push(q2.score);
                  }
                }
              });
            });
          });
        });

        // RIGHT
        data.forEach((patient) => {
          patient.questionnaire_scores_right?.forEach((q1) => {
            const key = `${q1.name}|${q1.period}`;
            if (!rightScoreGroups[key]) rightScoreGroups[key] = [];

            data.forEach((otherPatient) => {
              otherPatient.questionnaire_scores_right?.forEach((q2) => {
                if (q2.name.includes(q1.name) && q2.period === q1.period) {
                  if (q2.score && q2.score.length > 0) {
                    rightScoreGroups[key].push(q2.score);
                  }
                }
              });
            });
          });
        });

        console.log("LEFT Score Groups:", leftScoreGroups);
        console.log("RIGHT Score Groups:", rightScoreGroups);

        // Store both separately
        setLeftScoreGroups(leftScoreGroups);
        setRightScoreGroups(rightScoreGroups);
      } catch (err) {
        console.error("Failed to fetch patients", err);
      }
    };

    fetchPatients();
  }, [userData?.user?.email]);

  const makeVip = async (uhid) => {
    try {
      const response = await axios.patch(
        API_URL + "patients/" + uhid + "/vip/toggle"
      );
      console.log("Patch successful:", response.data);
    } catch (error) {
      console.error("Patch error:", error);
    }
    const updatedPatients = patients.map((patient) =>
      patient.uhid === uhid ? { ...patient, vip: 1 } : patient
    );
    setPatients(updatedPatients);
  };

  const toggleVip = async (uhid) => {
    // <-- add async here
    try {
      const response = await axios.patch(
        API_URL + "patients/" + uhid + "/vip/toggle"
      );
      console.log("Patch successful:", response.data);
    } catch (error) {
      console.error("Patch error:", error);
    }

    const updatedPatients = patients.map((patient) =>
      patient.uhid === uhid
        ? { ...patient, vip: patient.vip === 1 ? 0 : 1 }
        : patient
    );
    setPatients(updatedPatients);
  };

  const handleProfileInteraction = (uhid) => {
    const now = Date.now();
    const lastTap = lastTapRef.current[uhid] || 0;

    if (now - lastTap < 300) {
      makeVip(uhid); // double tap
    }

    lastTapRef.current[uhid] = now;
  };

  const scoreoptions = ["OKS", "SF-12", "KOOS", "KSS", "FJS"];

  // Load selected option from localStorage or default to "ALL"
  const [scorefilter, setscoreFitler] = useState("OKS");

  const [patfilter, setpatFilter] = useState("All PATIENTS");

  const options = ["All PATIENTS", "PRE OPERATIVE", "POST OPERATIVE"];

  const postopoptions = ["ALL", "6W", "3M", "6M", "1Y", "2Y"];

  const [postopfilter, setpostopFitler] = useState("ALL");

  const getCurrentPeriod = (patient, side) => {
    const optionsdrop = ["Pre Op", "6W", "3M", "6M", "1Y", "2Y"];

    const allItems = [
      "Oxford Knee Score (OKS)",
      "Short Form - 12 (SF-12)",
      "Knee Society Score (KSS)",
      "Knee Injury and Ostheoarthritis Outcome Score, Joint Replacement (KOOS, JR)",
      "Forgotten Joint Score (FJS)",
    ];

    const assignedQuestionnaires =
      side === "left"
        ? patient.questionnaire_assigned_left
        : patient.questionnaire_assigned_right;

    // ⭐ If no assigned questionnaires, default to "Pre Op"
    if (!assignedQuestionnaires || assignedQuestionnaires.length === 0) {
      return "Pre Op";
    }

    const groupedByPeriod = optionsdrop.reduce((acc, period) => {
      const assigned = assignedQuestionnaires
        .filter((q) => q.period === period)
        .map((q) => q.name);
      acc[period] = assigned;
      return acc;
    }, {});

    // console.log("status", groupedByPeriod);

    const currentPeriod = optionsdrop.find((period, index) => {
      const assigned = groupedByPeriod[period] || [];
      const anyAssigned = assigned.length > 0; // ⭐ Check if at least 1 is assigned

      const nextPeriod = optionsdrop[index + 1];
      const nextAssigned = groupedByPeriod[nextPeriod] || [];
      const nextAnyAssigned = nextAssigned.length > 0;

      return anyAssigned && !nextAnyAssigned;
    });

    return currentPeriod;
  };

  const [searchTerm, setSearchTerm] = useState("");

  const filteredPatients = patients
    .filter((patient) => {
      const status = getCurrentPeriod(patient, selectedLeg).toLowerCase() || "";
      const selectedFilter = patfilter.toLowerCase();
      const subFilter = postopfilter.toLowerCase();
      const selectedLegSide = selectedLeg.toLowerCase(); // "left" or "right"

      const hasLeft =
        patient.questionnaire_assigned_left &&
        patient.questionnaire_assigned_left.length > 0;
      const hasRight =
        patient.questionnaire_assigned_right &&
        patient.questionnaire_assigned_right.length > 0;

      let matchByQuestionnaire = false;
      let matchByStatus = false;

      // Always check questionnaire assigned
      if (selectedLegSide === "left" && hasLeft) {
        matchByQuestionnaire = true;
      }
      if (selectedLegSide === "right" && hasRight) {
        matchByQuestionnaire = true;
      }

      // Always check current_status
      if (status.includes("left") && selectedLegSide === "left") {
        matchByStatus = true;
      }
      if (status.includes("right") && selectedLegSide === "right") {
        matchByStatus = true;
      }

      // If neither match questionnaire nor status, don't show
      if (!matchByQuestionnaire && !matchByStatus) {
        return false;
      }

      // Now apply pre/post-op filter
      if (selectedFilter === "all patients") {
        return true;
      }

      const period = getCurrentPeriod(patient, selectedLegSide).toLowerCase();

      if (selectedFilter === "all patients") {
        return true;
      }

      if (selectedFilter === "pre operative") {
        return period.includes("pre");
      }

      // Anything not "pre" is treated as post-operative
      if (selectedFilter === "post operative") {
        if (subFilter === "all") {
          return !period.includes("pre");
        }
        return !period.includes("pre") && period.includes(subFilter);
      }

      return false;
    })
    .filter((patient) => {
      if (!searchTerm.trim()) return true;

      const term = searchTerm.toLowerCase();

      const first = patient.first_name?.toLowerCase() || "";
      const last = patient.last_name?.toLowerCase() || "";
      const fullName = `${first} ${last}`.trim();

      return (
        first.includes(term) ||
        last.includes(term) ||
        fullName.includes(term) || // ✅ check "first last"
        patient.uhid?.toLowerCase().includes(term)
      );
    });

  const [patprogressfilter, setpatprogressFilter] = useState("ALL");

  const patprogressoptions = ["ALL", "PRE OP", "POST OP"];

  const [selectedDate, setSelectedDate] = useState("Today");
  const dateInputRef = useRef(null);

  const openDatePicker = () => {
    dateInputRef.current?.showPicker();
  };

  const handleDateChange = (e) => {
    const dateValue = e.target.value;
    if (dateValue) {
      const selected = new Date(dateValue);
      const today = new Date();

      const isToday =
        selected.getDate() === today.getDate() &&
        selected.getMonth() === today.getMonth() &&
        selected.getFullYear() === today.getFullYear();

      if (isToday) {
        setSelectedDate("Today");
      } else {
        const formattedDate = selected.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
        setSelectedDate(formattedDate);
      }
    }
  };

  const convertToDateString = (utcDate) => {
    const date = new Date(utcDate); // Parse the UTC date string into a Date object

    // Get the date in YYYY-MM-DD format
    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, "0"); // Months are 0-indexed, so add 1
    const day = date.getUTCDate().toString().padStart(2, "0");

    return `${year}-${month}-${day}`; // Return the date in the format "YYYY-MM-DD"
  };

  const isSameDay = (d1, d2) => {
    const date1 = new Date(d1);
    const date2 = new Date(d2);
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  const displayedPatients = [];

  patients.forEach((patient) => {
    const status = getCurrentPeriod(patient, selectedLeg).toLowerCase() || "";
    const selectedFilter = patprogressfilter.toLowerCase();

    const statusMatch =
      selectedFilter === "all" ||
      (selectedFilter === "pre op" && status.includes("pre")) ||
      (selectedFilter === "post op" && !status.includes("pre"));

    if (!statusMatch) return;

    // Go through each questionnaire for this patient
    patient.questionnaire_assigned?.forEach((q) => {
      // Convert the deadline from UTC to YYYY-MM-DD format
      const deadlineInDateFormat = convertToDateString(q.deadline);

      // Check if the selected date matches and if the questionnaire is incomplete
      if (
        (!selectedDate || isSameDay(deadlineInDateFormat, selectedDate)) && // Date match
        q.completed === 0 // Only show incomplete questionnaires
      ) {
        // Push the same patient object with deadline info if needed
        displayedPatients.push({
          ...patient,
          matched_deadline: deadlineInDateFormat, // Show the deadline in YYYY-MM-DD format
          matched_questionnaire: q.name, // Optional: To track which questionnaire
        });
      }
    });
  });

  const [sortAsc, setSortAsc] = useState(true);

  const handleSortClick = () => {
    setSortAsc((prev) => !prev);
    // Update your sorting logic here
  };

  const [filteredData, setFilteredData] = useState([]);

  const getScore = (patient) => {
    const scores =
      selectedLeg === "left"
        ? patient.questionnaire_scores_left
        : patient.questionnaire_scores_right;

    return (
      scores?.find((score) =>
        score.name?.toLowerCase().includes(scorefilter.toLowerCase())
      )?.score?.[0] ?? "N/A"
    );
  };

  let sortedPatients = [...filteredPatients];

  if (sortedPatients.length > 1) {
    sortedPatients.sort((a, b) => {
      const scoreA = getScore(a);
      const scoreB = getScore(b);

      const valA = isNaN(scoreA) ? -Infinity : parseFloat(scoreA);
      const valB = isNaN(scoreB) ? -Infinity : parseFloat(scoreB);

      return sortAsc ? valA - valB : valB - valA;
    });
    console.log("Sorting Patient", sortedPatients);
  } else if (sortedPatients.length === 1) {
    // Call getScore manually for the single patient
    getScore(sortedPatients[0]);
    console.log("Sorting Patient", sortedPatients);
  }

  const scoreMaxValues = {
    OKS: 48,
    "SF-12": 100,
    KOOS: 28,
    KSS: 35,
    FJS: 60,
  };

  const buckets = ["0-20", "20-40", "40-60", "60-80", "80-100"];

  const bucketColors = {
    "0-20": "#FF4C4C", // red
    "20-40": "#FF944C", // orange
    "40-60": "#FFD700", // yellow
    "60-80": "#A6E22E", // light green
    "80-100": "#04CE00", // green
  };

  const getBucketLabel = (score) => {
    if (score < 20) return "0-20";
    if (score < 40) return "20-40";
    if (score < 60) return "40-60";
    if (score < 80) return "60-80";
    return "80-100";
  };

  // Normalize and bucket data
  const scoreData = () => {
    const selectedFilter = patfilter.toLowerCase(); // Assuming you have patfilter state
    const isAllPatients = selectedFilter === "all patients"; // Check if "All Patients" selected

    const bucketCounts = {
      "0-20": { pre: 0, post: 0 },
      "20-40": { pre: 0, post: 0 },
      "40-60": { pre: 0, post: 0 },
      "60-80": { pre: 0, post: 0 },
      "80-100": { pre: 0, post: 0 },
    };

    // Select which patients to use based on filter
    const normalizeString = (str) => {
      return str
        .toLowerCase()
        .replace(/\s+/g, "") // Remove all spaces
        .replace(/-/g, "") // Remove hyphens
        .trim();
    };

    const generatePeriodVariants = (period) => {
      const basePeriod = normalizeString(period); // Normalize input (e.g., "post", "postoperative")

      if (basePeriod.includes("pre")) {
        return ["pre", "preop", "preoperative", "pre-op", "pre op"];
      } else if (basePeriod.includes("post")) {
        return [
          "post",
          "postop",
          "postoperative",
          "post-op",
          "post op",
          "6w",
          "3m",
          "6m",
          "1y",
          "2y",
          "all",
        ];
      } else {
        return [basePeriod];
      }
    };

    const patientsToUse = isAllPatients
      ? filteredPatients
      : filteredPatients.filter((patient) => {
          const currentPeriod = getCurrentPeriod(patient, selectedLeg);
          const normalizedCurrentPeriod = normalizeString(currentPeriod);
          const normalizedSelectedFilter = normalizeString(selectedFilter);
          const normalizedSubFilter = postopfilter?.toLowerCase?.() || "ALL"; // normalize to "6W", "ALL", etc.

          // Generate variants
          const currentPeriodVariants = generatePeriodVariants(
            normalizedCurrentPeriod
          );
          const selectedFilterVariants = generatePeriodVariants(
            normalizedSelectedFilter
          );

          // Check if patient matches the main period filter
          const periodMatches = currentPeriodVariants.some((variant) =>
            selectedFilterVariants.some((filterVariant) =>
              variant.includes(filterVariant)
            )
          );

          // If no match at all, reject
          if (!periodMatches) return false;

          // ✅ At this point, it's a pre or post match
          // If it’s post-op, and subfilter is set (not "All"), match the follow-up period
          const isPostOp = selectedFilterVariants.some((v) =>
            [
              "post",
              "postop",
              "postoperative",
              "post-op",
              "post op",
              "6w",
              "3m",
              "6m",
              "1y",
              "2y",
              "all",
            ].includes(v)
          );

          if (isPostOp && normalizedSubFilter !== "ALL") {
            //   const followUp =
            //     patient?.[selectedLeg]?.post_surgery_followup?.toUpperCase?.();
            //     console.log(
            //   "Period Match",
            //   followUp +
            //     " / " +
            //     normalizedSubFilter
            // );
            return true;
          }

          // If pre-op or post-op with "All", accept
          return true;
        });

    // Iterate over the selected patients and categorize their scores into buckets
    patientsToUse.forEach((patient) => {
      const scores =
        selectedLeg === "left"
          ? patient.questionnaire_scores_left
          : patient.questionnaire_scores_right;

      const scoreObj = scores?.find((s) =>
        s.name?.toLowerCase().includes(scorefilter.toLowerCase())
      );

      const rawScore = scoreObj?.score?.[0];
      const maxScore = scoreMaxValues[scorefilter] || 100;

      if (rawScore != null && !isNaN(rawScore)) {
        const normalizedScore = parseFloat(rawScore);
        const bucketLabel = getBucketLabel(normalizedScore);

        if (isAllPatients) {
          const status = getCurrentPeriod(patient, selectedLeg).toLowerCase();
          if (status.includes("pre")) {
            bucketCounts[bucketLabel].pre++;
          } else {
            bucketCounts[bucketLabel].post++;
          }
        } else {
          const status = getCurrentPeriod(patient, selectedLeg).toLowerCase();
          if (status.includes("pre")) {
            bucketCounts[bucketLabel].pre++;
          } else {
            bucketCounts[bucketLabel].post++;
          }
        }
      }
    });

    // Return data in the format you need for BarChart
    return Object.keys(bucketCounts).map((bucket) => ({
      name: bucket, // Bucket range (e.g., "0-20")
      uv: bucketCounts[bucket].pre + bucketCounts[bucket].post, // Total count
      pv: bucketCounts[bucket].pre, // Pre-operative count
      amt: bucketCounts[bucket].post, // Post-operative count
    }));
  };

  useEffect(() => {
    setFilteredData(scoreData());
  }, [patfilter]); // Dependency array ensures this runs when filter changes

  console.log("Bar chart", patfilter.toLowerCase());

  const containerRef = useRef(null);
  const cardRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [cardsPerPage, setCardsPerPage] = useState(50);

  // Calculate total pages and current visible patients
  const totalPages = Math.ceil(filteredPatients.length / cardsPerPage);
  const paginatedPatients = sortedPatients.slice(
    (currentPage - 1) * cardsPerPage,
    currentPage * cardsPerPage
  );

  // Dynamically calculate cards per page
  useEffect(() => {
    const updateCardsPerPage = () => {
      if (containerRef.current && cardRef.current) {
        const containerHeight = containerRef.current.clientHeight;
        const cardHeight = cardRef.current.clientHeight;
        const gap = 16; // tailwind gap-4
        const fit = Math.floor(containerHeight / (cardHeight + gap));
        setCardsPerPage(fit - 1 || 1);
      }
    };

    updateCardsPerPage();
    window.addEventListener("resize", updateCardsPerPage);
    return () => window.removeEventListener("resize", updateCardsPerPage);
  }, []);

  const scrollRef = useRef(null);

  const scrollByAmount = (amount) => {
    scrollRef.current?.scrollBy({ left: amount, behavior: "smooth" });
  };

  const getAge = (dobString) => {
    if (!dobString) return "";

    const dob = new Date(dobString); // may return Invalid Date if format is "05 May 2002"

    // Parse manually if needed
    if (isNaN(dob)) {
      const [day, monthStr, year] = dobString.split(" ");
      const monthMap = {
        Jan: 0,
        Feb: 1,
        Mar: 2,
        Apr: 3,
        May: 4,
        Jun: 5,
        Jul: 6,
        Aug: 7,
        Sep: 8,
        Oct: 9,
        Nov: 10,
        Dec: 11,
      };
      const month = monthMap[monthStr.slice(0, 3)];
      if (month === undefined) return "";

      dob.setFullYear(parseInt(year));
      dob.setMonth(month);
      dob.setDate(parseInt(day));
    }

    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();

    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }

    return age;
  };

  let patfil = "all patients";

  const [profileImages, setProfileImages] = useState("");

  useEffect(() => {
    const fetchPatientImage = async () => {
      try {
        const uhid = userData?.user?.uhid;
        console.log("Doctor Profile Image", uhid);
        const res = await fetch(
          `${API_URL}get-profile-photo/${encodeURIComponent(uhid)}`
        );

        if (!res.ok) throw new Error("Failed to fetch profile photos");
        const data = await res.json();

        setProfileImages(data.profile_image_url);
      } catch (err) {
        console.error("Error fetching profile images:", err);
      }
    };

    fetchPatientImage();
  }, [userData]); // empty dependency: fetch once on mount

  const [profileImages1, setProfileImages1] = useState({});

  useEffect(() => {
    const fetchAllImages = async () => {
      try {
        const res = await fetch(`${API_URL}get-all-profile-photos`);
        if (!res.ok) throw new Error("Failed to fetch profile photos");
        const data = await res.json();

        // Convert array to object { uhid: profile_image_url }
        const imagesMap = {};
        data.patients.forEach((p) => {
          imagesMap[p.uhid] = p.profile_image_url;
        });

        setProfileImages1(imagesMap);
      } catch (err) {
        console.error("Error fetching profile images:", err);
      }
    };

    fetchAllImages();
  }, []); // empty dependency: fetch once on mount

  return (
    <>
    
      <div className="flex flex-col lg:flex-row w-[95%] mx-auto mt-4 items-center gap-4 justify-between">
        {/* Greeting Section */}
        <div className="flex flex-col lg:flex-row md:items-center md:justify-between gap-4 w-full">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-1 md:gap-2">
            <h4 className="font-medium text-black text-xl md:text-[26px]">
              Welcome
            </h4>
            <h2 className="font-bold text-[#005585] text-2xl md:text-4xl">
              {userData?.user?.doctor_name
                ? `${userData.user.doctor_name}`
                : "Loading..."}
            </h2>
          </div>
          {/* Search Bar */}
          <div className="relative w-full md:w-3/5">
            <input
              type="text"
              placeholder="Search using Name or UHID"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-black w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#005585]"
            />
            <svg
              className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z"
              />
            </svg>
          </div>
        </div>

        {/* Right Side: Icons + Profile */}
        <div className="flex items-center mt-3 md:mt-0 gap-3 md:gap-6">
          {/* Notification Bell Icon */}
          <button className="hidden focus:outline-none w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
            <svg
              width="27"
              height="27"
              viewBox="0 0 27 27"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M23.6293 19.374C24.2478 18.2471 24.5782 16.9848 24.5911 15.6993C24.604 14.4139 24.299 13.1452 23.7032 12.0061C23.1074 10.867 22.2394 9.8928 21.1762 9.17017C20.113 8.44754 18.8877 7.99888 17.6093 7.86411C17.2035 6.88667 16.6031 6.00203 15.8446 5.26404C15.086 4.52605 14.1853 3.95014 13.197 3.57137C12.2088 3.19259 11.1539 3.01888 10.0964 3.06081C9.03894 3.10274 8.00105 3.35942 7.04594 3.81524C6.09082 4.27106 5.23845 4.91648 4.54072 5.71221C3.84299 6.50794 3.31449 7.43734 2.98739 8.44383C2.66028 9.45032 2.54142 10.5128 2.63804 11.5667C2.73466 12.6206 3.04474 13.6438 3.54939 14.5741L2.9094 16.824C2.85171 17.0292 2.84971 17.2461 2.90361 17.4523C2.95751 17.6585 3.06536 17.8466 3.21608 17.9974C3.36679 18.1481 3.55493 18.2559 3.76114 18.3098C3.96735 18.3637 4.1842 18.3617 4.38939 18.304L6.63937 17.664C7.54467 18.1636 8.54099 18.4764 9.56936 18.584C9.98593 19.6005 10.6125 20.5175 11.4081 21.2749C12.2036 22.0324 13.1502 22.6133 14.1858 22.9796C15.2214 23.3459 16.3227 23.4893 17.4176 23.4005C18.5125 23.3116 19.5763 22.9925 20.5393 22.464L22.7893 23.104C22.9948 23.1652 23.213 23.1697 23.4209 23.117C23.6288 23.0644 23.8185 22.9565 23.9702 22.8049C24.1218 22.6533 24.2296 22.4635 24.2823 22.2556C24.3349 22.0478 24.3304 21.8295 24.2693 21.624L23.6293 19.374ZM6.71937 16.4141C6.66134 16.4135 6.6037 16.4236 6.54937 16.4441L4.05939 17.154L4.76939 14.6641C4.79435 14.5861 4.80191 14.5036 4.79154 14.4224C4.78118 14.3412 4.75313 14.2633 4.70939 14.1941C3.89109 12.8131 3.60498 11.1809 3.90475 9.60397C4.20453 8.02701 5.06958 6.61368 6.33752 5.6293C7.60546 4.64492 9.1891 4.15717 10.7912 4.25762C12.3932 4.35807 13.9035 5.03981 15.0386 6.17486C16.1736 7.30991 16.8554 8.82022 16.9558 10.4223C17.0563 12.0243 16.5685 13.608 15.5841 14.8759C14.5998 16.1439 13.1864 17.0089 11.6095 17.3087C10.0325 17.6085 8.40034 17.3223 7.01937 16.5041C6.93021 16.4456 6.82598 16.4143 6.71937 16.4141V16.4141ZM22.4093 19.464L23.1193 21.954L20.6293 21.244C20.5513 21.2191 20.4688 21.2115 20.3876 21.2219C20.3064 21.2322 20.2285 21.2603 20.1593 21.304C19.3811 21.7642 18.5168 22.0599 17.6199 22.1727C16.7229 22.2856 15.8123 22.2133 14.9444 21.9602C14.0764 21.7072 13.2697 21.2787 12.5739 20.7015C11.8782 20.1242 11.3082 19.4103 10.8993 18.604C12.8741 18.4723 14.7251 17.5957 16.0784 16.1515C17.4316 14.7073 18.1861 12.8032 18.1893 10.8241C18.187 10.2556 18.1233 9.68894 17.9993 9.1341C19.0432 9.33017 20.0245 9.77491 20.86 10.4307C21.6955 11.0864 22.3608 11.9338 22.7993 12.9012C23.2379 13.8686 23.4368 14.9274 23.3794 15.988C23.3219 17.0486 23.0098 18.0797 22.4693 18.994C22.4255 19.0632 22.3975 19.1412 22.3871 19.2224C22.3768 19.3036 22.3843 19.3861 22.4093 19.464V19.464Z"
                fill="#0D0D0D"
                fillOpacity="0.75"
              />
            </svg>
          </button>

          {/* Message Icon */}
          <button className="hidden focus:outline-none w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
            <svg
              width="26"
              height="27"
              viewBox="0 0 26 27"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12.9632 23.8898C13.6238 23.8907 14.2682 23.6857 14.8069 23.3033C15.3456 22.921 15.7518 22.3804 15.9691 21.7565H9.95737C10.1746 22.3804 10.5808 22.921 11.1195 23.3033C11.6582 23.6857 12.3026 23.8907 12.9632 23.8898ZM20.4298 15.9816V11.0899C20.4298 7.65847 18.0992 4.76783 14.9419 3.8985C14.6293 3.1113 13.8656 2.55664 12.9632 2.55664C12.0608 2.55664 11.2971 3.1113 10.9846 3.8985C7.82725 4.76889 5.4966 7.65847 5.4966 11.0899V15.9816L3.67581 17.8024C3.57657 17.9013 3.49786 18.0188 3.44423 18.1483C3.39059 18.2777 3.36308 18.4164 3.36328 18.5565V19.6232C3.36328 19.9061 3.47566 20.1774 3.6757 20.3774C3.87574 20.5775 4.14705 20.6899 4.42994 20.6899H21.4965C21.7794 20.6899 22.0507 20.5775 22.2507 20.3774C22.4508 20.1774 22.5632 19.9061 22.5632 19.6232V18.5565C22.5634 18.4164 22.5359 18.2777 22.4822 18.1483C22.4286 18.0188 22.3499 17.9013 22.2506 17.8024L20.4298 15.9816Z"
                fill="#0D0D0D"
                fillOpacity="0.75"
              />
              <circle cx="19.0022" cy="5.63308" r="2.80496" fill="#F9A135" />
            </svg>
          </button>

          {/* Profile Box */}
          <div className="h-12 w-36 md:w-40 bg-white border-[#D9D9D9] border-[1.5px] rounded-2xl px-3">
            <div className="h-full flex flex-row gap-3 items-center justify-center">
              <Image
                src={
                  profileImages ||
                  (userData?.user?.gender === "male" ? Maledoc : Femaledoc)
                }
                alt="Doc Image"
                width={40} // or your desired width
                height={40} // or your desired height
                className="w-8 h-8 rounded-full object-cover"
              />
              <p className="text-sm font-medium text-[#0D0D0D] whitespace-nowrap">
                {userData?.user?.doctor_name
                  ? `${userData.user.doctor_name}`
                  : "Loading..."}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div
        className={` h-[85%] mx-auto flex  mt-5 ${
          width >= 1000 && width / height > 1
            ? "w-[95%] flex-row"
            : "w-full flex-col"
        }`}
      >
        <div
          className={`rounded-xl pt-4 px-4 flex flex-col justify-between pb-4 ${
            width >= 1000 && width / height > 1 ? "w-2/3" : "w-full"
          }
          ${width <= 540 && height < 940 ? "h-[150%]" : "h-full"}`}
          style={{
            boxShadow: "0 0px 10px rgba(0, 0, 0, 0.15)",
          }}
        >
          <div
            className={`flex  ${
              width < 650 && width >= 530
                ? "flex-col justify-center items-start gap-3"
                : width < 530
                ? "flex-col justify-center items-center gap-3"
                : "flex-row justify-between items-start"
            }`}
          >
            <div className="flex flex-col justify-between">
              <p className="text-black text-2xl font-poppins font-semibold">
                Patients
              </p>

              <div className="flex items-center justify-between w-full">
                <div
                  className={`bg-[#F5F5F5] rounded-lg py-0.5 px-[3px] w-fit border-2 border-[#191A1D] mt-[12px] 
      ${width < 450 ? "grid grid-cols-3" : "flex"} 
      ${width > 1000 && width / height > 1 ? "gap-1" : "gap-2"}`}
                >
                  {scoreoptions.map((option) => (
                    <div
                      key={option}
                      onClick={() => setscoreFitler(option)}
                      className={`px-2 py-1 cursor-pointer text-xs font-semibold transition-all duration-200 rounded-lg
          ${
            scorefilter === option
              ? "bg-gradient-to-b from-[#484E56] to-[#3B4048] text-white shadow-md"
              : "text-gray-500"
          }`}
                    >
                      {option}
                    </div>
                  ))}
                </div>

                {/* Sort icon on the same line */}
                <Image
                  src={sortAsc ? Ascending : Descending}
                  alt="Sort"
                  className="ml-3 w-5 h-5 cursor-pointer mt-[12px]"
                  onClick={handleSortClick}
                />
              </div>
            </div>

            <div
              className={`gap-1  cursor-pointer flex flex-col ${
                width < 650 && width >= 530
                  ? "items-start"
                  : width < 530
                  ? "items-center"
                  : "items-end"
              }`}
            >
              <div className="w-full flex flex-row justify-between items-center gap-4">
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setSelectedLeg("left")}
                    className={`px-4 py-0.5 rounded-full font-semibold ${
                      selectedLeg === "left"
                        ? "bg-[#005585] text-white"
                        : "bg-gray-300 text-black"
                    }`}
                  >
                    Left
                  </button>
                  <button
                    onClick={() => setSelectedLeg("right")}
                    className={`px-4 py-0.5 rounded-full font-semibold ${
                      selectedLeg === "right"
                        ? "bg-[#005585] text-white"
                        : "bg-gray-300 text-black"
                    }`}
                  >
                    Right
                  </button>
                </div>

                <div className="flex bg-[#282B30] rounded-full p-1 w-fit items-center justify-center">
                  {options.map((option) => (
                    <div
                      key={option}
                      onClick={() => {
                        setpatFilter(option);
                        setSearchTerm("");
                      }}
                      className={` cursor-pointer  font-semibold transition-all duration-200 rounded-full text-center
            ${
              patfilter === option
                ? "bg-gradient-to-b from-[#484E56] to-[#3B4048] text-white shadow-md"
                : "text-gray-300"
            }
            ${
              width < 530
                ? "text-[8px] px-2 py-1"
                : width > 1000 && width / height > 1
                ? "text-[10px] px-1.5 py-1"
                : "text-xs px-3 py-1"
            }
          `}
                    >
                      {option}
                    </div>
                  ))}
                </div>
              </div>
              {patfilter.toLowerCase() == "post operative" && (
                <div
                  className={` bg-[#F5F5F5] rounded-lg py-0.5 px-[3px] w-fit border-2 border-[#191A1D] gap-2 mt-2 ${
                    width < 450 ? "grid grid-cols-3" : "flex"
                  }`}
                >
                  {postopoptions.map((option) => (
                    <div
                      key={option}
                      onClick={() => {
                        setpostopFitler(option);
                        setSearchTerm("");
                      }}
                      className={`px-2 py-1 cursor-pointer text-xs font-semibold transition-all duration-200 rounded-lg
            ${
              postopfilter === option
                ? "bg-gradient-to-b from-[#484E56] to-[#3B4048] text-white shadow-md"
                : "text-gray-500"
            }
          `}
                    >
                      {option}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="w-full flex justify-center items-center mt-4">
            {totalPages > 1 && (
              <div className="flex items-center gap-2 max-w-full">
                {/* Left Arrow */}

                <ChevronLeftIcon
                  className="w-8 h-8 text-red-600 cursor-pointer"
                  onClick={() => scrollByAmount(-150)}
                />

                {/* Scrollable Page Buttons */}
                <div
                  ref={scrollRef}
                  className="flex gap-2 overflow-x-auto scrollbar-hide scroll-smooth px-1"
                  style={{ maxWidth: "70vw" }}
                >
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`px-3 py-1 border rounded cursor-pointer shrink-0 transition-all ${
                        currentPage === i + 1
                          ? "bg-blue-500 text-white"
                          : "bg-white text-blue-500"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                {/* Right Arrow */}

                <ChevronRightIcon
                  className="w-8 h-8 text-red-600 cursor-pointer"
                  onClick={() => scrollByAmount(150)}
                />
              </div>
            )}
          </div>

          <div
            ref={containerRef}
            className={`overflow-y-scroll flex-grow pr-2 mt-3 ${
              width < 650 && width >= 450
                ? patfilter.toLowerCase() === "post operative"
                  ? "h-[75%]"
                  : "h-[75%]"
                : width < 450 && width / height >= 0.5
                ? patfilter.toLowerCase() === "post operative"
                  ? "h-[60%]"
                  : "h-[60%]"
                : width < 450 && width / height < 0.5
                ? patfilter.toLowerCase() === "post operative"
                  ? "h-[67%]"
                  : "h-[67%]"
                : width >= 1000 && width < 1272 && width / height > 1
                ? patfilter.toLowerCase() === "post operative"
                  ? "h-[75%]"
                  : "h-[75%]"
                : patfilter.toLowerCase() === "post operative"
                ? "h-[82.8%]"
                : "h-[82.8%]"
            }`}
          >
            <div className="overflow-y-auto flex-1">
              <div className="grid grid-cols-1 transition-all duration-300">
                {paginatedPatients.map((patient) => (
                  <div
                    ref={patient.uhid ? cardRef : null}
                    key={patient.uhid}
                    style={{ backgroundColor: "rgba(0, 85, 133, 0.1)" }}
                    className={`w-full rounded-lg flex relative   my-1 py-2 px-3 ${
                      width < 530
                        ? "flex-col justify-center items-center"
                        : "flex-row justify-between items-center gap-2"
                    }
                ${width < 1000 ? "mb-2" : "mb-2"} `}
                  >
                    {patient.vip === 1 && (
                      <Image
                        src={Flag}
                        alt="VIP"
                        className="absolute top-0 left-0 w-5 h-5 cursor-pointer"
                        onClick={() => toggleVip(patient.uhid)}
                      />
                    )}

                    <div
                      className={`${
                        width < 640 && width >= 530
                          ? "w-3/5"
                          : width < 530
                          ? "w-full"
                          : "w-[50%]"
                      }`}
                    >
                      <div
                        className={`flex gap-4 py-0  items-center  ${
                          width < 710 && width >= 640
                            ? "px-0 flex-row"
                            : width < 530
                            ? "flex-col justify-center items-center"
                            : "px-2 flex-row"
                        }`}
                      >
                        <Image
                          className={`rounded-full ${
                            width < 530
                              ? "w-11 h-11 flex justify-center items-center"
                              : "w-10 h-10"
                          } ${
                            patient.vip !== 1
                              ? "cursor-pointer"
                              : "cursor-not-allowed"
                          }`}
                          src={
                            profileImages1[patient.uhid] ||
                            (patient.gender === "male" ? Malepat : Femalepat)
                          }
                          width={40} // or your desired width
                          height={40} // or your desired height
                          alt={patient.uhid}
                          onDoubleClick={() => {
                            if (patient.vip !== 1) {
                              makeVip(patient.uhid);
                            }
                          }}
                          onTouchEnd={() => {
                            if (patient.vip !== 1) {
                              handleProfileInteraction(patient.uhid);
                            }
                          }}
                          onClick={() => {
                            if (patient.vip !== 1) {
                              handleProfileInteraction(patient.uhid);
                            }
                          }}
                        />

                        <div
                          className={`w-full flex items-center ${
                            width < 710 ? "flex-col" : "flex-row"
                          }`}
                        >
                          <div
                            className={`flex  flex-col ${
                              width < 710 ? "w-full" : "w-[70%]"
                            }`}
                          >
                            <div
                              className={`flex items-center justify-between `}
                            >
                              <p
                                className={`text-[#475467] font-poppins font-medium text-base ${
                                  width < 530 ? "w-full text-center" : ""
                                }`}
                              >
                                {patient.first_name + " " + patient.last_name}
                              </p>
                            </div>
                            <p
                              className={`font-poppins font-medium text-sm text-[#475467] ${
                                width < 530 ? "text-center" : "text-start"
                              }`}
                            >
                              {getAge(patient.dob)}, {patient.gender}
                            </p>
                          </div>

                          <div
                            className={`text-sm font-medium font-poppins text-[#475467]   ${
                              width < 710 && width >= 530
                                ? "w-full text-start"
                                : width < 530
                                ? "w-full text-center"
                                : "w-[30%] text-start"
                            }`}
                          >
                            <p
                              className={`text-[#F2181C] ${
                                patient.surgeryReportStatus !== "PENDING"
                                  ? "hidden"
                                  : ""
                              }`}
                            >
                              {patient.uhid}
                            </p>
                            <p> UHID {patient.uhid} </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div
                      className={`flex ${
                        width < 640 && width >= 530
                          ? "w-2/5 flex-col text-start"
                          : width < 530
                          ? "w-full flex-col text-start"
                          : "w-[50%] flex-row"
                      }`}
                    >
                      <div
                        className={` flex ${
                          width <= 750 && width >= 530
                            ? "flex-col items-end"
                            : width < 530
                            ? "flex-col items-center"
                            : "flex-row"
                        } 
                    ${width < 640 ? "w-full justify-end" : "w-[70%]"}`}
                      >
                        <div
                          className={` text-sm font-medium text-[#475467] ${
                            width <= 750 && width >= 530
                              ? "w-3/4 text-start"
                              : width < 530
                              ? "w-full text-center"
                              : "w-[35%] text-end"
                          }`}
                        >
                          {getCurrentPeriod(patient, selectedLeg)}
                        </div>
                        <div
                          className={`text-base font-medium text-black ${
                            width <= 750 && width >= 530
                              ? "w-3/4 text-start"
                              : width < 530
                              ? "w-full text-center"
                              : "w-[55%] text-end"
                          }`}
                        >
                          SCORE:&nbsp;&nbsp;
                          {(selectedLeg === "left"
                            ? patient.questionnaire_scores_left
                            : patient.questionnaire_scores_right
                          )?.find((score) =>
                            score.name
                              ?.toLowerCase()
                              .includes(scorefilter.toLowerCase())
                          )?.score?.[0] ?? "N/A"}
                        </div>
                      </div>

                      <div
                        className={` flex flex-row justify-end items-center ${
                          width < 640 ? "w-full" : "w-[30%]"
                        }`}
                      >
                        <div
                          className={`flex flex-row gap-1 items-center ${
                            width < 640 && width >= 530
                              ? "w-3/4"
                              : width < 530
                              ? "w-full justify-center"
                              : ""
                          }`}
                          onClick={() => {
                            goToReport(
                              patient,
                              leftscoreGroups,
                              rightscoreGroups,
                              userData
                            );
                            if (typeof window !== "undefined") {
                              sessionStorage.setItem(
                                "patientUHID",
                                patient?.uhid
                              );
                              sessionStorage.setItem(
                                "patientPASSWORD",
                                patient?.password
                              );
                            }
                          }}
                        >
                          <div className="text-sm font-medium border-b-2 text-[#476367] border-blue-gray-500 cursor-pointer">
                            Report
                          </div>
                          <ArrowUpRightIcon
                            color="blue"
                            className="w-4 h-4 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div
          className={`h-full  flex flex-col justify-between
            ${
              width >= 1272
                ? "pl-15 gap-2"
                : width >= 1000 && width < 1272 && width / height > 1
                ? "pl-6 gap-2"
                : width < 1000
                ? "pl-0 mt-6 gap-4"
                : "pl-0 mt-6"
            }
            ${width >= 1000 && width / height > 1 ? "w-1/3" : "w-full "}`}
        >
          <div
            className={`w-full  flex flex-row justify-between ${
              width < 1170 && width >= 1000
                ? "gap-4 h-fit"
                : width < 1000
                ? "h-fit"
                : "h-fit gap-12"
            }`}
          >
            <div
              className={`h-full bg-white shadow-md rounded-xl flex flex-col items-start justify-between  ${
                width < 420 ? "w-fit" : "w-44"
              }
              ${
                width >= 1000 && width / height > 1 ? "gap-2 p-2" : "gap-5 p-4"
              }`}
            >
              <Image
                src={Patcount}
                alt="Profile"
                className={` rounded-lg ${
                  width < 1060 && width >= 1000 ? "w-9 h-9" : "w-10 h-10"
                }`}
              />
              <p
                className={`text-black  font-semibold ${
                  width < 1060 && width >= 1000 ? "text-sm" : "text-base"
                }`}
              >
                PRE OPERATIVE PATIENTS
              </p>
              <p
                className={`text-black font-medium text-end w-full ${
                  width < 1060 && width >= 1000 ? "text-3xl" : "text-4xl"
                }`}
              >
                {preOpCount}
              </p>
            </div>

            <div
              className={`h-full bg-white shadow-md rounded-xl flex flex-col items-start justify-between ${
                width < 420 ? "w-fit" : "w-44"
              }
              ${
                width >= 1000 && width / height > 1 ? "gap-2 p-2" : "gap-5 p-4"
              }`}
            >
              <Image
                src={Doccount}
                alt="Profile"
                className={`rounded-lg ${
                  width < 1060 && width >= 1000 ? "w-9 h-9" : "w-10 h-10"
                }`}
              />
              <p
                className={`text-black  font-semibold ${
                  width < 1060 && width >= 1000 ? "text-sm" : "text-base"
                }`}
              >
                POST OPERATIVE PATIENTS
              </p>
              <p
                className={`text-black font-medium text-end w-full ${
                  width < 1060 && width >= 1000 ? "text-3xl" : "text-4xl"
                }`}
              >
                {postOpTotal}
              </p>
            </div>
          </div>

          <div
            className={`w-full  justify-start gap-12 ${
              width < 1000 ? "h-fit" : "h-[60%]"
            }`}
          >
            <div className="w-full h-full bg-white shadow-md rounded-xl flex flex-col items-center justify-start p-3">
              <div className="w-full flex flex-row justify-between items-center mb-4">
                {" "}
                {/* Added margin bottom for space */}
                <p
                  className={`text-black font-semibold ${
                    width > 1000 && width / height > 1 ? "text-sm" : "text-lg"
                  }`}
                >
                  Patients Progress - {scorefilter}
                </p>
              </div>

              {/* Ensuring responsiveness for the chart */}
              <div className="w-full" style={{ height: "60vh" }}>
                {" "}
                {/* Height as a percentage of the viewport height */}
                {patfilter && scoreData().length > 0 && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={scoreData()} // Use the scoreData function to generate dynamic data
                      margin={{ top: 0, right: 20, left: -10, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="8 10" vertical={false} />

                      <XAxis
                        dataKey="name" // Use 'name' as the range (e.g., "0-20", "20-40")
                        label={{
                          position: "insideBottom",
                          fontSize: 14,
                          fontWeight: "bold",
                        }}
                        tick={{ fontSize: 12, fontWeight: 600 }}
                      />

                      <YAxis />

                      <Tooltip
                        content={({ payload, label }) => {
                          if (!payload || payload.length === 0) return null; // No tooltip content if no data

                          const data = payload[0].payload; // Access the data of the hovered bar
                          const isPreOp = data.pv > 0; // Check if Pre-Operative data exists
                          const isPostOp = data.amt > 0; // Check if Post-Operative data exists

                          return (
                            <div className="custom-tooltip text-black">
                              <p>{label}</p>
                              {isPreOp && <p>Pre-Operative: {data.pv}</p>}
                              {isPostOp && <p>Post-Operative: {data.amt}</p>}
                            </div>
                          );
                        }}
                      />
                      <Legend
                        wrapperStyle={{
                          fontSize: 12,
                          fontWeight: 600,
                          top: -30,
                        }}
                        iconType="square"
                        verticalAlign="top"
                        align="right"
                      />

                      {patfilter?.toLowerCase().trim() === "all patients" && (
                        <Bar
                          dataKey="pv"
                          stackId="a"
                          fill="#4F46E5"
                          name="Pre Op"
                        />
                      )}
                      {patfilter?.toLowerCase().trim() === "all patients" && (
                        <Bar
                          dataKey="amt"
                          stackId="a"
                          fill="#22C55E"
                          name="Post Op"
                        />
                      )}
                      {patfilter?.toLowerCase().trim() !== "all patients" && (
                        <Bar dataKey="uv" isAnimationActive={false}>
                          {scoreData().map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={bucketColors[entry.name] || "#8884d8"}
                            />
                          ))}
                        </Bar>
                      )}
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Firstimepassreset
        passopen={passopen}
        onClose={() => setpassopen(false)}
      />
    </>
  );
};

export default page;
