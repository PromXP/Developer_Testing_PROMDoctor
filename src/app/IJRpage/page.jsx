"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Image from "next/image";

import { API_URL } from "../libs/global";

import LeftKnee from "@/app/assets/leftknee.png";
import RightKnee from "@/app/assets/rightknee.png";
import Malepat from "@/app/assets/man.png";
import Femalepat from "@/app/assets/woman.png";
import Medialcondyle from "@/app/assets/medialcondyle.png";
import Lateralcondyle from "@/app/assets/lateralcondyle.png";
import Medialcondylepost from "@/app/assets/medialcondylepost.png";
import Lateralcondylepost from "@/app/assets/lateralcondylepost.png";
import Tibial from "@/app/assets/tibial.png";

const page = ({ closeijr }) => {
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

  const [patient, setpatient] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const uid = sessionStorage.getItem("patientUHID");
      const pass = sessionStorage.getItem("patientPASSWORD");
      console.log("user from sessionStorage :", uid + " " + pass);

      if (uid !== "undefined" && pass !== "undefined") {
        console.log("user from sessionStorage 2:", uid + " " + pass);

        // Attempt to log in again using the stored credentials
        const loginWithStoredUser = async () => {
          try {
            const response = await axios.post(API_URL + "login", {
              identifier: uid,
              password: pass,
              role: "patient", // Assuming role is stored and needed
            });

            setpatient(response.data.user); // Store the full response data (e.g., tokens)
            // console.log("API Response:", response.data.user);
          } catch (error) {
            console.error("Login failed with stored credentials", error);
          }
        };

        // Call login function
        loginWithStoredUser();
      }
    }
  }, []);

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

  const [leftcurrentstatus, setLeftCurrentStatus] = useState("");
  const [rightcurrentstatus, setRightCurrentStatus] = useState("");

  const questionnaire_assigned_left =
    patient?.questionnaire_assigned_left || [];
  const questionnaire_assigned_right =
    patient?.questionnaire_assigned_right || [];
  useEffect(() => {
    setLeftCurrentStatus(
      getPeriodFromSurgeryDate(
        patient?.post_surgery_details_left?.date_of_surgery
      )
    );
    setRightCurrentStatus(
      getPeriodFromSurgeryDate(
        patient?.post_surgery_details_right?.date_of_surgery
      )
    );
  }, [questionnaire_assigned_left, questionnaire_assigned_right]);

  const getCurrentPeriod = (side) => {
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
        ? questionnaire_assigned_left
        : questionnaire_assigned_right;

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

  const [selectedHospital, setselectedHospital] = useState("Parvathy Hospital");
  const hospitaloptions = ["Parvathy Hospital"];

  const options = [
    "GENERAL",
    "NERVE BLOCK",
    "EPIDURAL",
    "SPINAL (INTRATHECAL)",
  ];
  const [selected, setSelected] = useState("");

  const asagradeoptions = ["1", "2", "3", "4", "5"];
  const [asagrade, setasagrade] = useState("");

  const [preopflexion, setpreopflexion] = useState("");
  const [preopextension, setpreopextension] = useState("");

  const [consultant, setconsultant] = useState("DR. VETRI KUMAR M K");
  const consultantoptions = ["DR. VETRI KUMAR M K"];

  const [sameForSurgeon, setsameForSurgeon] = useState(false);

  const [operatingsurgeon, setoperatingsurgeon] = useState(
    "DR. VETRI KUMAR M K"
  );
  const operatingsurgeonoptions = ["DR. VETRI KUMAR M K", "DR. VINOTH KUMAR"];

  const [firstassisstant, setfirstassisstant] = useState("DR. VINOTH KUMAR");
  const firstassisstantoptions = ["DR. VETRI KUMAR M K", "DR. VINOTH KUMAR"];

  const [secondassisstant, setsecondassisstant] =
    useState("DR. MILAN ADHIKARI");
  const secondassisstantoptions = ["DR. VINOTH KUMAR", "DR. MILAN ADHIKARI"];

  const [manageproc, setmanagproc] = useState("");
  const procedureoptions = [
    "PRIMARY TKA",
    "PRIMARY UKA",
    "REVISION HTO TO TKA",
    "REVISION UKA TO TKA",
    "TKA TO REVISION TKA",
  ];

  const [surgindi, setsurgindi] = useState("");
  const surgindioptions = [
    "VARUS",
    "VALGUS",
    "FLEXION CONTRACTION",
    "RECURVATUM DEFORMITY",
  ];
  const handleCheckboxChange = (option) => {
    const currentValues = surgindi ? surgindi.split(",") : [];
    if (currentValues.includes(option)) {
      // Remove unchecked option
      const updated = currentValues.filter((item) => item !== option);
      setsurgindi(updated.join(","));
    } else {
      // Add checked option
      const updated = [...currentValues, option];
      setsurgindi(updated.join(","));
    }
  };

  const [techassist, settechassist] = useState("");
  const techassistoptions = [
    "COMPUTER GUIDE",
    "ROBOTIC",
    "PSI",
    "CONVENTIONAL INSTRUMENTS",
  ];

  const [alignphil, setalignphil] = useState("");
  const alignphiloptions = ["MA", "KA", "rKA", "FA", "iKA", "HYBRID"];

  const [toruused, settourused] = useState("");
  const tourusedoptions = ["Yes", "No"];

  const [optime, setoptime] = useState("");

  const handleOptimeChange = (e) => {
    let value = e.target.value.replace(/\D/g, ""); // Remove non-digits

    if (!value) {
      setoptime("");
      return;
    }

    if (value.length > 4) {
      value = value.slice(0, 4); // Limit to 4 digits max
    }

    if (value.length === 4) {
      const hours = parseInt(value.slice(0, 2), 10);
      const minutes = parseInt(value.slice(2, 4), 10);

      if (hours > 23 || minutes > 59) {
        showWarning(
          "Invalid time input. Please enter a valid 24-hour time (HHMM)."
        );
        setoptime("");
        return;
      }

      // Format as HH:MM only after full input
      value = `${value.slice(0, 2)}:${value.slice(2, 4)}`;
    }

    // Until valid 4 digits, show raw input
    setoptime(value);
  };

  const [aclcondition, setaclcondition] = useState("");
  const aclconditionoptions = ["INTACT", "TORN", "RECONSTRUCTED"];

  const [pclcondition, setpclcondition] = useState("");
  const pclconditionoptions = ["INTACT", "TORN", "EXCISED"];

  const [wearStatus, setWearStatus] = useState(""); // initially empty

  const handleChangewearstatus = (event) => {
    setWearStatus(event.target.value);
  };

  const [distalmedialinithick, setdistalmedialinithick] = useState("0 mm"); // or use 0 for a number

  const handleInputdistalmedialinithick = (event) => {
    setdistalmedialinithick(event.target.value);
  };

  const [distalmedialrecutyn, setdistalmedialrecutyn] = useState(""); // or use 0 for a number

  const handleInputdistalmedialrecutyn = (event) => {
    setdistalmedialrecutyn(event.target.value);
  };

  const [distalmedialrecutvalue, setdistalmedialrecutvalue] = useState("0 mm"); // or use 0 for a number

  const handleInputdistalmedialrecutvalue = (event) => {
    setdistalmedialrecutvalue(event.target.value);
  };

  const [distalmedialwasheryn, setdistalmedialwasheryn] = useState(""); // or use 0 for a number

  const handleInputdistalmedialwasheryn = (event) => {
    setdistalmedialwasheryn(event.target.value);
  };

  const [distalmedialwashervalue, setdistalmedialwashervalue] =
    useState("0 mm"); // or use 0 for a number

  const handleInputdistalmedialwashervalue = (event) => {
    setdistalmedialwashervalue(event.target.value);
  };

  const [distalmedialfinalthick, setdistalmedialfinalthick] = useState("0 mm"); // or use 0 for a number

  const handleInputdistalmedialfinalthick = (event) => {
    setdistalmedialfinalthick(event.target.value);
  };

  // LATERAL STATES
  const [wearStatusLat, setWearStatusLat] = useState("");
  const handleChangeWearStatusLat = (e) => setWearStatusLat(e.target.value);

  const [distallateralinithick, setdistallateralinithick] = useState("0 mm");
  const handleInputdistallateralinithick = (e) =>
    setdistallateralinithick(e.target.value);

  const [distallateralrecutyn, setdistallateralrecutyn] = useState("");
  const handleInputdistallateralrecutyn = (e) =>
    setdistallateralrecutyn(e.target.value);

  const [distallateralrecutvalue, setdistallateralrecutvalue] =
    useState("0 mm");
  const handleInputdistallateralrecutvalue = (e) =>
    setdistallateralrecutvalue(e.target.value);

  const [distallateralwasheryn, setdistallateralwasheryn] = useState("");
  const handleInputdistallateralwasheryn = (e) =>
    setdistallateralwasheryn(e.target.value);

  const [distallateralwashervalue, setdistallateralwashervalue] =
    useState("0 mm");
  const handleInputdistallateralwashervalue = (e) =>
    setdistallateralwashervalue(e.target.value);

  const [distallateralfinalthick, setdistallateralfinalthick] =
    useState("0 mm");
  const handleInputdistallateralfinalthick = (e) =>
    setdistallateralfinalthick(e.target.value);

  // POSTMEDIAL STATES
  const [postmedialWear, setPostmedialWear] = useState("");
  const handlePostmedialWearChange = (e) => setPostmedialWear(e.target.value);

  const [postmedialInitialThickness, setPostmedialInitialThickness] =
    useState("");
  const handlePostmedialInitialThicknessChange = (e) =>
    setPostmedialInitialThickness(e.target.value);

  const [postmedialRecutYN, setPostmedialRecutYN] = useState("");
  const handlePostmedialRecutYNChange = (e) =>
    setPostmedialRecutYN(e.target.value);

  const [postmedialRecutValue, setPostmedialRecutValue] = useState("0 mm");
  const handlePostmedialRecutValueChange = (e) =>
    setPostmedialRecutValue(e.target.value);

  const [postmedialFinalThickness, setPostmedialFinalThickness] = useState("");
  const handlePostmedialFinalThicknessChange = (e) =>
    setPostmedialFinalThickness(e.target.value);

  // POSTLATERAL STATES
  const [postlateralWear, setPostlateralWear] = useState("");
  const handlePostlateralWearChange = (e) => setPostlateralWear(e.target.value);

  const [postlateralInitialThickness, setPostlateralInitialThickness] =
    useState("0 mm");
  const handlePostlateralInitialThicknessChange = (e) =>
    setPostlateralInitialThickness(e.target.value);

  const [postlateralRecutYN, setPostlateralRecutYN] = useState("");
  const handlePostlateralRecutYNChange = (e) =>
    setPostlateralRecutYN(e.target.value);

  const [postlateralRecutValue, setPostlateralRecutValue] = useState("0 mm");
  const handlePostlateralRecutValueChange = (e) =>
    setPostlateralRecutValue(e.target.value);

  const [postlateralFinalThickness, setPostlateralFinalThickness] =
    useState("");
  const handlePostlateralFinalThicknessChange = (e) =>
    setPostlateralFinalThickness(e.target.value);

  // TIBIAL LEFT STATE
  const [tibialLeftWear, setTibialLeftWear] = useState("");
  const handleTibialLeftWearChange = (e) => setTibialLeftWear(e.target.value);

  const [tibialLeftValue, setTibialLeftValue] = useState("0 mm");
  const handleTibialLeftValueChange = (e) => setTibialLeftValue(e.target.value);

  const [tibialRightWear, setTibialRightWear] = useState("");
  const handleTibialRightWearChange = (e) => setTibialRightWear(e.target.value);

  const [tibialRightValue, setTibialRightValue] = useState("0 mm");
  const handleTibialRightValueChange = (e) =>
    setTibialRightValue(e.target.value);

  const [tibialVVRecutYN, setTibialVVRecutYN] = useState("");
  const handleTibialVVRecutYNChange = (e) => setTibialVVRecutYN(e.target.value);

  const [tibialVVRecutValue, setTibialVVRecutValue] = useState("0 mm");
  const handleTibialVVRecutValueChange = (e) =>
    setTibialVVRecutValue(e.target.value);

  const [tibialSlopeRecutYN, setTibialSlopeRecutYN] = useState("");
  const handleTibialSlopeRecutYNChange = (e) =>
    setTibialSlopeRecutYN(e.target.value);

  const [tibialSlopeRecutValue, setTibialSlopeRecutValue] = useState("0 mm");
  const handleTibialSlopeRecutValueChange = (e) =>
    setTibialSlopeRecutValue(e.target.value);

  const [finalCheck, setFinalCheck] = useState("");
  const handleFinalCheckChange = (e) => setFinalCheck(e.target.value);

  const [femursize, setfemursize] = useState("");
  const femursizeoptions = ["YES", "NO"];

  const [insertthickness, setinsertthickness] = useState("");
  const insertthicknessoptions = ["WORN", "UNWORN"];

  const rowHeaders = ["MANUFACTURER", "MODEL", "SIZE"];
  const colHeaders = ["FEMUR", "TIBIA", "INSERT", "PATELLA"];

  const [tableData, setTableData] = useState(
    [10, 11, 12, 13, 14].map((thickness) => ({
      thickness, // 10, 11, ...
      numOfTicks: "", // text input
      extensionExtOrient: "", // text input (degrees)
      flexionIntOrient: "", // text input (degrees)
      liftOff: "", // radio "N" or "Y"
    }))
  );

  const handleInputChange = (index, field, value) => {
    setTableData((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const [femorSize, setFemorSize] = useState("");
  const handleFemorSizeChange = (e) => setFemorSize(e.target.value);

  const [tibialSize, setTibialSize] = useState("0 mm");
  const handleTibialSizeChange = (e) => setTibialSize(e.target.value);

  const [insertThickness, setInsertThickness] = useState("");
  const handleInsertThicknessChange = (e) => setInsertThickness(e.target.value);

  const [patellaSize, setPatellaSize] = useState("");
  const handlePatellaSizeChange = (e) => setPatellaSize(e.target.value);

  const [preresurfacingthickness, setpreresurfacingthickness] =
    useState("0 mm");
  const handlePreresurfacingThicknessChange = (e) =>
    setpreresurfacingthickness(e.target.value);

  const [postresurfacingthickness, setpostresurfacingthickness] =
    useState("0 mm");
  const handlePostresurfacingThicknessChange = (e) =>
    setpostresurfacingthickness(e.target.value);

  const optionsData = {
    FEMUR: {
      MANUFACTURER: ["BIORAD MEDISYS", "MICROPORT"],
      MODEL: {
        "BIORAD MEDISYS": ["EXCEL MPK"],
        MICROPORT: ["EVOLUATION"],
      },
      SIZE: {
        "EXCEL MPK": ["A", "B", "C", "D", "E", "F", "G", "H"],
        EVOLUATION: [
          "1 mm",
          "2 mm",
          "3 mm",
          "4 mm",
          "5 mm",
          "6 mm",
          "7 mm",
          "8 mm",
        ],
      },
    },
    TIBIA: {
      MANUFACTURER: ["BIORAD MEDISYS", "MICROPORT"],
      MODEL: {
        "BIORAD MEDISYS": ["EXCEL MPK"],
        MICROPORT: ["EVOLUATION"],
      },
      SIZE: {
        "EXCEL MPK": ["1", "2", "3", "4", "5", "6"],
        EVOLUATION: [
          "1 mm",
          "2 mm",
          "2+ mm",
          "3 mm",
          "4 mm",
          "5 mm",
          "6 mm",
          "6+ mm",
          "7 mm",
          "8 mm",
        ],
      },
    },
    INSERT: {
      MANUFACTURER: ["BIORAD MEDISYS", "MICROPORT"],
      MODEL: {
        "BIORAD MEDISYS": ["EXCEL MPK"],
        MICROPORT: ["EVOLUATION"],
      },
      SIZE: {
        "EXCEL MPK": ["7 mm", "8 mm", "9 mm", "11 mm", "13 mm"],
        EVOLUATION: ["10 mm", "12 mm", "14 mm", "17 mm", "21 mm"],
      },
    },
    PATELLA: {
      MANUFACTURER: ["BIORAD MEDISYS", "MICROPORT"],
      MODEL: {
        "BIORAD MEDISYS": ["EXCEL MPK"],
        MICROPORT: ["EVOLUATION"],
      },
      SIZE: {
        "EXCEL MPK": ["26 mm", "28 mm", "32 mm", "36 mm"],
        EVOLUATION: ["26 mm", "29 mm", "32 mm", "35 mm", "38 mm", "41 mm"],
      },
    },
  };

  const [selectedValues, setSelectedValues] = useState(
    colHeaders.reduce((acc, col) => {
      acc[col] = rowHeaders.reduce((rowAcc, row) => {
        rowAcc[row] = "";
        return rowAcc;
      }, {});
      return acc;
    }, {})
  );

  const handleChange = (col, row, value) => {
    setSelectedValues((prev) => {
      const updated = { ...prev[col], [row]: value };

      if (row === "MANUFACTURER") {
        updated["MODEL"] = "";
        updated["SIZE"] = "";
      } else if (row === "MODEL") {
        updated["SIZE"] = "";
      }

      return {
        ...prev,
        [col]: updated,
      };
    });
  };

  const isoDate =
    (patient?.post_surgery_details_left?.date_of_surgery?.startsWith(
      "0001-01-01"
    )
      ? null
      : patient?.post_surgery_details_left?.date_of_surgery) ||
    (patient?.post_surgery_details_right?.date_of_surgery?.startsWith(
      "0001-01-01"
    )
      ? null
      : patient?.post_surgery_details_right?.date_of_surgery);

  const istDate = new Date(isoDate);

  // Convert to IST and extract date
  const dateOnlyIST = istDate.toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearAllFields = () => {
    setselectedHospital("Parvathy Hospital");
    setSelected("");
    setasagrade("");
    setpreopflexion("");
    setpreopextension("");
    setconsultant("DR. VETRI KUMAR M K");
    setoperatingsurgeon("DR. VETRI KUMAR M K");
    setfirstassisstant("DR. VINOTH");
    setsecondassisstant("DR. MILAN");
    setmanagproc("");
    setsurgindi("");
    settechassist("");
    setalignphil("");
    settourused("");
    setoptime("");

    setSelectedValues(
      colHeaders.reduce((acc, col) => {
        acc[col] = rowHeaders.reduce((rowAcc, row) => {
          rowAcc[row] = "";
          return rowAcc;
        }, {});
        return acc;
      }, {})
    );

    // ACL / PCL
    setaclcondition("");
    setpclcondition("");

    // DISTAL MEDIAL
    setWearStatus("");
    setdistalmedialinithick("0 mm");
    setdistalmedialrecutyn("");
    setdistalmedialrecutvalue("0 mm");
    setdistalmedialwasheryn("");
    setdistalmedialwashervalue("0 mm");
    setdistalmedialfinalthick("0 mm");

    // DISTAL LATERAL
    setWearStatusLat("");
    setdistallateralinithick("0 mm");
    setdistallateralrecutyn("");
    setdistallateralrecutvalue("0 mm");
    setdistallateralwasheryn("");
    setdistallateralwashervalue("0 mm");
    setdistallateralfinalthick("0 mm");

    // POST MEDIAL
    setPostmedialWear("");
    setPostmedialInitialThickness("");
    setPostmedialRecutYN("");
    setPostmedialRecutValue("0 mm");
    setPostmedialFinalThickness("");

    // POST LATERAL
    setPostlateralWear("");
    setPostlateralInitialThickness("0 mm");
    setPostlateralRecutYN("");
    setPostlateralRecutValue("0 mm");
    setPostlateralFinalThickness("");

    // TIBIAL
    setTibialLeftWear("");
    setTibialLeftValue("0 mm");
    setTibialRightWear("");
    setTibialRightValue("0 mm");
    setTibialVVRecutYN("");
    setTibialVVRecutValue("0 mm");
    setTibialSlopeRecutYN("");
    setTibialSlopeRecutValue("0 mm");
    setTibialSize("0 mm");

    // FINAL CHECK + INSERT + FEMUR
    setFinalCheck("");
    setfemursize("");
    setinsertthickness("");
    setpreresurfacingthickness("0 mm");
    setpostresurfacingthickness("0 mm");

    // Reset table data
    setTableData(
      [10, 11, 12, 13, 14].map((thickness) => ({
        thickness,
        numOfTicks: "",
        extensionExtOrient: "",
        flexionIntOrient: "",
        liftOff: "",
      }))
    );
  };

  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const showWarning = (message) => {
    setAlertMessage(message);
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 4000);
  };

  const validatePayloadAndWarn = (payload) => {
    const errors = {};
    const isNonEmpty = (val) => typeof val === "string" && val.trim() !== "";
    const isValidDate = (val) => /^\d{4}-\d{2}-\d{2}$/.test(val);
    const isValidTime = (val) => /^\d{2}:\d{2}$/.test(val);

    // Basic patient and surgery details
    if (!isNonEmpty(payload.patuhid)) errors.patuhid = "UHID is required.";
    if (!isNonEmpty(payload.hospital_name))
      errors.hospital_name = "Hospital name is required.";
    if (!isNonEmpty(payload.anaesthetic_type))
      errors.anaesthetic_type = "Anaesthetic type is required.";
    if (!isNonEmpty(payload.asa_grade))
      errors.asa_grade = "ASA grade is required.";

    // ROM section - multiple period support
    if (!Array.isArray(payload.rom) || payload.rom.length === 0) {
      errors.rom = "At least one ROM entry is required.";
    } else {
      payload.rom.forEach((romEntry, index) => {
        const label = romEntry.period || `Entry ${index + 1}`;
        if (!isNonEmpty(romEntry.period)) {
          errors[`rom_${index}_period`] = `${label}: Period is required.`;
        }
        if (!isNonEmpty(romEntry.flexion)) {
          errors[`rom_${index}_flexion`] = `${label}: Flexion is required.`;
        }
        if (!isNonEmpty(romEntry.extension)) {
          errors[`rom_${index}_extension`] = `${label}: Extension is required.`;
        }
      });
    }

    // Surgery team
    if (!isNonEmpty(payload.consultant_incharge))
      errors.consultant_incharge = "Consultant Incharge is required.";
    if (!isNonEmpty(payload.operating_surgeon))
      errors.operating_surgeon = "Operating Surgeon is required.";
    if (!isNonEmpty(payload.first_assistant))
      errors.first_assistant = "First Assistant is required.";
    if (!isNonEmpty(payload.second_assistant))
      errors.second_assistant = "Second Assistant is required.";

    // Surgery meta
    if (!isNonEmpty(payload.mag_proc))
      errors.mag_proc = "Procedure name is required.";
    if (!isNonEmpty(payload.side)) errors.side = "Surgery side is required.";
    if (!isNonEmpty(payload.surgery_indication))
      errors.surgery_indication = "Surgery indication is required.";
    if (!isNonEmpty(payload.tech_assist))
      errors.tech_assist = "Technical assistance is required.";
    if (!isNonEmpty(payload.align_phil))
      errors.align_phil = "Alignment philosophy is required.";
    if (!isNonEmpty(payload.torq_used))
      errors.torq_used = "Torque used info is required.";
    // if (!isNonEmpty(payload.op_name))
    //   errors.op_name = "Operation name is required.";
    if (!isValidDate(payload.op_date))
      errors.op_date = "Valid operation date (YYYY-MM-DD) is required.";
    if (!isValidTime(payload.op_time))
      errors.op_time = "Valid operative time (HH:MM) is required.";

    // Components details (FEMUR, TIBIA, INSERT, PATELLA)
    const parts = ["FEMUR", "TIBIA", "INSERT", "PATELLA"];
    for (const part of parts) {
      const comp = payload.components_details?.[part];
      if (!comp) {
        errors[`components_details_${part}`] = `${part} details missing.`;
      } else {
        if (!isNonEmpty(comp.MANUFACTURER))
          errors[`${part}_MANUFACTURER`] = `${part} manufacturer is required.`;
        if (!isNonEmpty(comp.MODEL))
          errors[`${part}_MODEL`] = `${part} model is required.`;
        if (!isNonEmpty(comp.SIZE))
          errors[`${part}_SIZE`] = `${part} size is required.`;
      }
    }

    // Bone Resection
    const bone = payload.bone_resection || {};
    if (!isNonEmpty(bone.acl)) errors.acl = "ACL condition is required.";
    if (!isNonEmpty(bone.pcl)) errors.pcl = "PCL condition is required.";

    const validateSection = (section, prefix) => {
      if (!isNonEmpty(section?.wear))
        errors[`${prefix}_wear`] = `${prefix} wear is required.`;
      if (!isNonEmpty(section?.initial_thickness))
        errors[
          `${prefix}_initial`
        ] = `${prefix} initial thickness is required.`;
      if (!isNonEmpty(section?.recut))
        errors[`${prefix}_recut`] = `${prefix} recut is required.`;
      if (!isNonEmpty(section?.recutvalue))
        errors[`${prefix}_recutvalue`] = `${prefix} recut value is required.`;
      if (!isNonEmpty(section?.final_thickness))
        errors[`${prefix}_final`] = `${prefix} final thickness is required.`;
      if ("washer" in section && !isNonEmpty(section?.washer))
        errors[`${prefix}_washer`] = `${prefix} washer is required.`;
      if ("washervalue" in section && !isNonEmpty(section?.washervalue))
        errors[`${prefix}_washervalue`] = `${prefix} washer value is required.`;
    };

    validateSection(bone.distal_medial, "distal_medial");
    validateSection(bone.distal_lateral, "distal_lateral");
    validateSection(bone.posterial_medial, "posterial_medial");
    validateSection(bone.posterial_lateral, "posterial_lateral");

    const validateWearValue = (section, prefix) => {
      if (!isNonEmpty(section?.wear))
        errors[`${prefix}_wear`] = `${prefix} wear is required.`;
      if (!isNonEmpty(section?.value))
        errors[`${prefix}_value`] = `${prefix} value is required.`;
    };

    validateWearValue(bone.tibial_resection_left, "tibial_left");
    validateWearValue(bone.tibial_resection_right, "tibial_right");

    // Tibial VV recut
    const vv = bone.tibialvvrecut || {};
    if (!isNonEmpty(vv.vvrecut))
      errors.tibialvvrecut = "Tibial VV recut is required.";
    if (!isNonEmpty(vv.vvrecutvalue))
      errors.tibialvvrecutvalue = "Tibial VV recut value is required.";

    const slope = bone.tibialsloperecut || {};
    if (!isNonEmpty(slope.sloperecut))
      errors.tibialsloperecut = "Tibial slope recut is required.";
    if (!isNonEmpty(slope.sloperecutvalue))
      errors.tibialsloperecutvalue = "Tibial slope recut value is required.";

    if (!isNonEmpty(bone.final_check))
      errors.final_check = "Final check is required.";

    // Femur, Tibia, Insert, Patella size info
    if (!isNonEmpty(bone.pfj_resurfacing)) {
      errors.pfj_resurfacing = "PFJ Resurfacing is required.";
    } else if (bone.pfj_resurfacing === "YES") {
      if (!isNonEmpty(bone.preresurfacing)) {
        errors.preresurfacing = "Pre-resurfacing thickness is required.";
      }
      if (!isNonEmpty(bone.postresurfacing)) {
        errors.postresurfacing = "Post-resurfacing thickness is required.";
      }
    }
    // if (!isNonEmpty(bone.femur_size?.shape))
    //   errors.femur_shape = "Femur shape is required.";
    if (!isNonEmpty(bone.trachela_resection))
      errors.trachela_resection = "Tracheal Resection is required.";
    if (!isNonEmpty(bone.patella)) errors.patella = "Patella is required.";
    // if (!isNonEmpty(bone.insert_thickness?.shape))
    //   errors.insert_shape = "Insert shape is required.";

    // Thickness Table Validation
    const table = bone.thickness_table || [];
    if (!Array.isArray(table) || table.length !== 5) {
      errors.tableData = "Thickness table must have 5 rows.";
    } else {
      table.forEach((row, i) => {
        const label = `Row ${i + 1} (${row.thickness}mm)`;
        if (!isNonEmpty(row.numOfTicks))
          errors[`table_${i}_ticks`] = `${label}: Ticks required.`;
        if (!isNonEmpty(row.extensionExtOrient))
          errors[
            `table_${i}_ext`
          ] = `${label}: Extension orientation required.`;
        if (!isNonEmpty(row.flexionIntOrient))
          errors[`table_${i}_flex`] = `${label}: Flexion orientation required.`;
        if (!isNonEmpty(row.liftOff))
          errors[`table_${i}_liftoff`] = `${label}: Lift-off required.`;
      });
    }

    return errors;
  };

  const side = [
    ...(patient?.post_surgery_details_left?.date_of_surgery &&
    !patient.post_surgery_details_left.date_of_surgery.startsWith("0001-01-01")
      ? ["Left Knee"]
      : []),

    ...(patient?.post_surgery_details_right?.date_of_surgery &&
    !patient.post_surgery_details_right.date_of_surgery.startsWith("0001-01-01")
      ? ["Right Knee"]
      : []),
  ];

  const handleSendremainder = async () => {
    const payload = {
      patuhid: patient?.uhid,
      hospital_name: selectedHospital,
      anaesthetic_type: selected,
      asa_grade: asagrade,
      rom: [
        {
          period: "preop", // to match "preop", "1month", etc.
          flexion: preopflexion,
          extension: preopextension,
        },
      ],
      consultant_incharge: consultant,
      operating_surgeon: operatingsurgeon,
      first_assistant: firstassisstant,
      second_assistant: secondassisstant,
      mag_proc: manageproc,
      side: side.join(", "),
      surgery_indication: surgindi,
      tech_assist: techassist,
      align_phil: alignphil,
      torq_used: toruused,
      // op_name: opname,
      op_date: dateOnlyIST,
      op_time: optime,
      components_details: selectedValues,
      bone_resection: {
        acl: aclcondition,
        distal_medial: {
          wear: wearStatus,
          initial_thickness: distalmedialinithick,
          recut: distalmedialrecutyn,
          recutvalue: distalmedialrecutvalue,
          washer: distalmedialwasheryn,
          washervalue: distalmedialwashervalue,
          final_thickness: distalmedialfinalthick,
        },
        distal_lateral: {
          wear: wearStatusLat,
          initial_thickness: distallateralinithick,
          recut: distallateralrecutyn,
          recutvalue: distallateralrecutvalue,
          washer: distallateralwasheryn,
          washervalue: distallateralwashervalue,
          final_thickness: distallateralfinalthick,
        },
        posterial_medial: {
          wear: postmedialWear,
          initial_thickness: postmedialInitialThickness,
          recut: postmedialRecutYN,
          recutvalue: postmedialRecutValue,
          final_thickness: postmedialFinalThickness,
        },
        posterial_lateral: {
          wear: postlateralWear,
          initial_thickness: postlateralInitialThickness,
          recut: postlateralRecutYN,
          recutvalue: postlateralRecutValue,
          final_thickness: postlateralFinalThickness,
        },
        tibial_resection_left: {
          wear: tibialLeftWear,
          value: tibialLeftValue,
        },
        tibial_resection_right: {
          wear: tibialRightWear,
          value: tibialRightValue,
        },
        pcl: pclcondition,
        tibialvvrecut: {
          vvrecut: tibialVVRecutYN,
          vvrecutvalue: tibialVVRecutValue,
        },
        tibialsloperecut: {
          sloperecut: tibialSlopeRecutYN,
          sloperecutvalue: tibialSlopeRecutValue,
        },
        final_check: finalCheck,
        thickness_table: tableData,
        pfj_resurfacing: femursize,
        trachela_resection: tibialSize,
        patella: insertthickness,
        preresurfacing: preresurfacingthickness,
        postresurfacing: postresurfacingthickness,
      },
      posting_timestamp: new Date().toISOString(),
    };
    console.log("Surgery Data", payload);
    // return;
    // setIsSubmitting(true); // 🔒 Lock submission

    try {
      const response = await fetch(API_URL + "uploadpatientsurgery", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      console.log("Submission successful:", payload);
      if (!response.ok) {
        throw new Error("Failed to send data.");
      }

      const result = await response.json();
      console.log("Submission successful:", result);
      //   window.location.reload();
      // Optionally, show success message here
    } catch (error) {
      console.error("Error submitting data:", error);
    } finally {
      setIsSubmitting(false); // 🔓 Unlock submission
    }

    window.location.reload();
    closeijr();
  };

  const [profileImages, setProfileImages] = useState("");

  useEffect(() => {
    const fetchPatientImage = async () => {
      try {
        const uhid = patient?.uhid;
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
  }, [patient]); // empty dependency: fetch once on mount

  const [submitconfirmpop, setsubmitconfirmpop] = useState(false);
  const handlesubmitpop = () => {
    // const payload = {
    //   patuhid: patient?.uhid,
    //   hospital_name: selectedHospital,
    //   anaesthetic_type: selected,
    //   asa_grade: asagrade,
    //   rom: [{
    //     period: "preop", // to match "preop", "1month", etc.
    //     flexion: preopflexion,
    //     extension: preopextension,
    //   }],
    //   consultant_incharge: consultant,
    //   operating_surgeon: operatingsurgeon,
    //   first_assistant: firstassisstant,
    //   second_assistant: secondassisstant,
    //   mag_proc: manageproc,
    //   side: side.join(", "),
    //   surgery_indication: surgindi,
    //   tech_assist: techassist,
    //   align_phil: alignphil,
    //   torq_used: toruused,
    //   // op_name: opname,
    //   op_date: dateOnlyIST,
    //   op_time: optime,
    //   components_details: selectedValues,
    //   bone_resection: {
    //     acl: aclcondition,
    //     distal_medial: {
    //       wear: wearStatus,
    //       initial_thickness: distalmedialinithick,
    //       recut: distalmedialrecutyn,
    //       recutvalue: distalmedialrecutvalue,
    //       washer: distalmedialwasheryn,
    //       washervalue: distalmedialwashervalue,
    //       final_thickness: distalmedialfinalthick,
    //     },
    //     distal_lateral: {
    //       wear: wearStatusLat,
    //       initial_thickness: distallateralinithick,
    //       recut: distallateralrecutyn,
    //       recutvalue: distallateralrecutvalue,
    //       washer: distallateralwasheryn,
    //       washervalue: distallateralwashervalue,
    //       final_thickness: distallateralfinalthick,
    //     },
    //     posterial_medial: {
    //       wear: postmedialWear,
    //       initial_thickness: postmedialInitialThickness,
    //       recut: postmedialRecutYN,
    //       recutvalue: postmedialRecutValue,
    //       final_thickness: postmedialFinalThickness,
    //     },
    //     posterial_lateral: {
    //       wear: postlateralWear,
    //       initial_thickness: postlateralInitialThickness,
    //       recut: postlateralRecutYN,
    //       recutvalue: postlateralRecutValue,
    //       final_thickness: postlateralFinalThickness,
    //     },
    //     tibial_resection_left: {
    //       wear: tibialLeftWear,
    //       value: tibialLeftValue,
    //     },
    //     tibial_resection_right: {
    //       wear: tibialRightWear,
    //       value: tibialRightValue,
    //     },
    //     pcl: pclcondition,
    //     tibialvvrecut: {
    //       vvrecut: tibialVVRecutYN,
    //       vvrecutvalue: tibialVVRecutValue,
    //     },
    //     tibialsloperecut: {
    //       sloperecut: tibialSlopeRecutYN,
    //       sloperecutvalue: tibialSlopeRecutValue,
    //     },
    //     final_check: finalCheck,
    //     thickness_table: tableData,
    //     pfj_resurfacing: femursize,
    //     trachela_resection: tibialSize,
    //     patella: insertthickness,
    //     preresurfacing:preresurfacingthickness,
    //     postresurfacing: postresurfacingthickness,
    //   },
    //   posting_timestamp: new Date().toISOString(),
    // };

    // const errors = validatePayloadAndWarn(payload);
    // const firstErrorKey = Object.keys(errors)[0];

    // if (firstErrorKey) {
    //   showWarning(errors[firstErrorKey]); // Show specific field error
    //   return; // Stop submission
    // } else {
    //   // handleSendremainder();
    //   setsubmitconfirmpop(true);
    // }
    setsubmitconfirmpop(true);
  };

  function getPeriodFromSurgeryDate(surgeryDateStr, patient) {
    if (!surgeryDateStr) return "Not Found";

    const surgeryDate = new Date(surgeryDateStr);

    // Check for invalid or default placeholder date
    if (
      isNaN(surgeryDate) ||
      surgeryDate.getFullYear() === 1 // Covers "0001-01-01T00:00:00.000+00:00"
    ) {
      return "Not Found";
    }

    const today = new Date();
    const diffInDays = Math.floor(
      (today - surgeryDate) / (1000 * 60 * 60 * 24)
    );

    if (diffInDays <=0) {
      return "Pre Op";
    }

    const periodOffsets = {
      "6W": 42,
      "3M": 90,
      "6M": 180,
      "1Y": 365,
      "2Y": 730,
    };

    const periods = Object.entries(periodOffsets)
      .map(([label, offset]) => ({
        label,
        diff: Math.abs(diffInDays - offset),
      }))
      .sort((a, b) => a.diff - b.diff);

    return periods[0]?.label || "Unknown";
  }

  return (
    <>
      <div className="flex flex-col gap-8 p-8 ">
        <div className="flex flex-col md:flex-row w-full mx-auto items-center justify-between">
          <div
            className={`w-full rounded-lg flex ${
              width < 760 ? "py-0" : "py-4"
            }`}
          >
            <div className={`relative w-full`}>
              <div
                className={`flex gap-4  flex-col justify-center items-center ${
                  width < 760 ? "" : "py-0"
                }`}
              >
                <div
                  className={`w-full flex gap-4 justify-center items-center ${
                    width < 530
                      ? "flex-col justify-center items-center"
                      : "flex-row"
                  }`}
                >
                  <Image
                    src={
                      profileImages ||
                      (patient?.gender === "male" ? Malepat : Femalepat)
                    }
                    alt={patient?.uhid}
                    width={40} // or your desired width
                    height={40} // or your desired height
                    className={`rounded-full ${
                      width < 530
                        ? "w-11 h-11 flex justify-center items-center"
                        : "w-14 h-14"
                    }`}
                  />

                  <div
                    className={`w-full flex items-center ${
                      width < 760 ? "flex-col gap-2 justify-center" : "flex-row"
                    }`}
                  >
                    <div
                      className={`flex  flex-col gap-3 ${
                        width < 760 ? "w-full" : "w-1/2"
                      }`}
                    >
                      <div
                        className={`flex items-center gap-2 flex-row ${
                          width < 530 ? "justify-center" : ""
                        }`}
                      >
                        <p
                          className={`text-[#475467] font-poppins font-semibold text-base ${
                            width < 530 ? "text-start" : ""
                          }`}
                        >
                          Patient Name |
                        </p>
                        <p
                          className={`text-black font-poppins font-bold text-base ${
                            width < 530 ? "text-start" : ""
                          }`}
                        >
                          {patient?.first_name + " " + patient?.last_name}
                        </p>
                      </div>
                      <div
                        className={`flex flex-row  ${
                          width < 710 && width >= 530
                            ? "w-full justify-between"
                            : ""
                        }`}
                      >
                        <p
                          className={`font-poppins font-semibold text-sm text-[#475467] ${
                            width < 530 ? "text-center" : "text-start"
                          }
                          w-1/2`}
                        >
                          {getAge(patient?.dob)}, {patient?.gender}
                        </p>
                        <div
                          className={`text-sm font-normal font-poppins text-[#475467] w-1/2 ${
                            width < 530 ? "text-center" : ""
                          }`}
                        >
                          UHID {patient?.uhid}
                        </div>
                      </div>
                    </div>

                    <div
                      className={`flex   ${
                        width < 760 ? "w-full" : "w-1/2 justify-between"
                      }
                      ${
                        width < 530
                          ? "flex-col gap-4 justify-center items-center"
                          : "flex-row"
                      }`}
                    >
                      <div
                        className={` flex flex-col gap-3 ${
                          width < 530
                            ? "justify-center items-center w-full"
                            : "w-[20%]"
                        }`}
                      >
                        <p className="text-[#475467] font-semibold text-5">
                          BMI
                        </p>
                        <p className="text-[#04CE00] font-bold text-6">
                          {patient?.bmi}
                        </p>
                      </div>
                      <div
                        className={` flex flex-col gap-3 ${
                          width < 530
                            ? "justify-center items-center w-full"
                            : "w-[40%]"
                        }`}
                      >
                        <p className="text-[#475467] font-semibold text-5">
                          STATUS
                        </p>
                        <p className="text-[#F86060] font-bold text-6">
                          <>
                            {leftcurrentstatus && (
                              <>
                                <span className="text-red-500">L: </span>{" "}
                                {leftcurrentstatus}
                              </>
                            )}
                            {leftcurrentstatus && rightcurrentstatus && " "}
                            {rightcurrentstatus && (
                              <>
                                <span className="text-red-500">R: </span>{" "}
                                {rightcurrentstatus}
                              </>
                            )}
                          </>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col">
          <div>
            <p className="text-black text-3xl font-semibold">
              OPERATION DETAILS
            </p>
          </div>
          <table className="table-fixed w-full text-black text-lg font-medium border-separate border-spacing-y-8">
            <tbody>
              {/* Hospital Dropdown */}
              <tr>
                <td className="w-1/3 align-middle font-bold text-lg items-center">
                  SELECT HOSPITAL
                </td>
                <td className="w-fit">
                  <select
                    id="dropdown"
                    value={selectedHospital}
                    onChange={(e) => setselectedHospital(e.target.value)}
                    className="w-1/2 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {hospitaloptions.map((hospital, index) => (
                      <option key={index} value={hospital}>
                        {hospital}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>

              {/* Anaesthetic Types */}
              <tr>
                <td className="w-1/4 align-top font-bold">ANAESTHETIC TYPES</td>
                <td>
                  <div className="flex flex-wrap gap-6">
                    {options.map((option, index) => (
                      <label
                        key={index}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="dynamicRadio1"
                          value={option}
                          checked={selected === option}
                          onChange={() => setSelected(option)}
                          className="form-radio text-blue-600"
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                </td>
              </tr>

              {/* ASA Grade */}
              <tr>
                <td className="w-1/4 align-top font-bold">ASA GRADE</td>
                <td>
                  <div className="flex flex-wrap gap-6">
                    {asagradeoptions.map((option, index) => (
                      <label
                        key={index}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="dynamicRadio2"
                          value={option}
                          checked={asagrade === option}
                          onChange={() => setasagrade(option)}
                          className="form-radio text-blue-600"
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                </td>
              </tr>

              {/* PRE OP ROM */}
              <tr>
                <td className="w-1/4 align-middle font-bold">PRE OP - ROM</td>
                <td>
                  <div className="flex flex-row flex-wrap gap-8 text-black">
                    <div className="flex items-center gap-4">
                      <label className="text-lg font-semibold">FLEXION</label>
                      <input
                        id="firstInput"
                        type="text"
                        value={preopflexion}
                        onChange={(e) => setpreopflexion(e.target.value)}
                        className="w-28 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      />
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="text-lg font-semibold">EXTENSION</label>
                      <input
                        id="secondInput"
                        type="text"
                        value={preopextension}
                        onChange={(e) => setpreopextension(e.target.value)}
                        className="w-28 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      />
                    </div>
                  </div>
                  <p className="text-lg font-medium italic mt-2">
                    *WITH SPECIAL CHARACTERS
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex flex-col">
          <div>
            <p className="text-black text-3xl font-semibold">SURGEON DETAILS</p>
          </div>
          <table className="w-full text-black text-lg font-semibold border-separate border-spacing-y-8">
            <tbody>
              {/* CONSULTANT IN-CHARGE row */}
              <tr className="items-center">
                <td className="w-1/3 align-middle">CONSULTANT IN-CHARGE</td>
                <td className="">
                  <div className="flex flex-col gap-4">
                    <select
                      id="consultant"
                      value={consultant}
                      onChange={(e) => setconsultant(e.target.value)}
                      className="text-lg font-semibold px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full max-w-xs"
                    >
                      {consultantoptions.map((option, index) => (
                        <option key={index} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        id="sameDoctor"
                        checked={sameForSurgeon}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setsameForSurgeon(checked);
                          if (checked) {
                            const normalizedConsultant = consultant
                              .trim()
                              .toLowerCase();
                            const normalizedSurgeons =
                              operatingsurgeonoptions.map((s) =>
                                s.trim().toLowerCase()
                              );

                            if (
                              normalizedSurgeons.includes(normalizedConsultant)
                            ) {
                              setoperatingsurgeon(consultant); // assign actual name
                            } else {
                              setsameForSurgeon(false); // uncheck the box
                              alert(
                                "Selected consultant is not available as an operating surgeon."
                              );
                            }
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <span>Same for surgeon</span>
                    </label>
                  </div>
                </td>
              </tr>

              {/* OPERATING SURGEON row */}
              <tr className="items-center">
                <td className="w-1/4 align-middle">OPERATING SURGEON</td>
                <td className="" colSpan={2}>
                  <select
                    id="operatingsurgeon"
                    value={operatingsurgeon}
                    onChange={(e) => setoperatingsurgeon(e.target.value)}
                    className="text-lg font-semibold px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full max-w-xs"
                  >
                    {operatingsurgeonoptions.map((option, index) => (
                      <option key={index} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>

              {/* FIRST ASSISTANT row */}
              <tr className="items-center">
                <td className="w-1/4 align-middle">FIRST ASSISTANT</td>
                <td className="" colSpan={2}>
                  <select
                    id="firstassisstant"
                    value={firstassisstant}
                    onChange={(e) => setfirstassisstant(e.target.value)}
                    className="text-lg font-semibold px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full max-w-xs"
                  >
                    {firstassisstantoptions.map((option, index) => (
                      <option key={index} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>

              {/* SECOND ASSISTANT row */}
              <tr className="items-center">
                <td className="w-1/4 align-middle">SECOND ASSISTANT</td>
                <td className="" colSpan={2}>
                  <select
                    id="secondassisstant"
                    value={secondassisstant}
                    onChange={(e) => setsecondassisstant(e.target.value)}
                    className="text-lg font-semibold px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full max-w-xs"
                  >
                    {secondassisstantoptions.map((option, index) => (
                      <option key={index} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-8 pb-8">
          <div>
            <p className="text-black text-3xl font-semibold">
              MANAGE PROCEDURES
            </p>
          </div>
          <div className="flex flex-row text-black text-lg font-medium gap-6">
            {procedureoptions.map((option, index) => (
              <label
                key={index}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="radio"
                  name="dynamicRadio3"
                  value={option}
                  checked={manageproc === option}
                  onChange={() => setmanagproc(option)}
                  className="form-radio text-blue-600"
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-col">
          <div>
            <p className="text-black text-3xl font-semibold">
              PROCEDURE DETAILS
            </p>
          </div>

          <table className="w-full border-separate border-spacing-y-8">
            <tbody>
              {/* SIDE Row */}
              <tr className="align-middle">
                <td className="font-bold text-lg text-black w-1/3">SIDE</td>
                <td>
                  <div className="flex flex-row gap-10">
                    {/* Left Knee */}
                    {patient?.post_surgery_details_left?.date_of_surgery &&
                      !patient.post_surgery_details_left.date_of_surgery.startsWith(
                        "0001-01-01"
                      ) && (
                        <div className="w-fit h-fit py-2 rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer">
                          <Image
                            src={LeftKnee}
                            alt="Left Knee"
                            className="w-12 h-12"
                          />
                          <p className="font-semibold text-lg text-black">
                            Left Knee
                          </p>
                        </div>
                      )}

                    {/* Right Knee */}
                    {patient?.post_surgery_details_right?.date_of_surgery &&
                      !patient.post_surgery_details_right.date_of_surgery.startsWith(
                        "0001-01-01"
                      ) && (
                        <div className="w-fit h-fit py-2 rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer">
                          <Image
                            src={RightKnee}
                            alt="Right Knee"
                            className="w-12 h-12"
                          />
                          <p className="font-semibold text-lg text-black">
                            Right Knee
                          </p>
                        </div>
                      )}
                  </div>
                </td>
              </tr>

              {/* INDICATION OF SURGERY Row */}
              <tr className="align-middle">
                <td className="font-bold text-xl text-black w-1/4">
                  INDICATION OF SURGERY
                </td>
              </tr>
              <tr className="align-middle">
                <td className="font-bold text-lg text-black w-1/4">
                  DEFORMITY
                </td>
                <td>
                  <div className="flex flex-row text-black text-lg font-medium gap-8">
                    {surgindioptions.map((option, index) => (
                      <label
                        key={index}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          value={option}
                          checked={surgindi.includes(option)}
                          onChange={() => handleCheckboxChange(option)}
                          className="form-checkbox text-blue-600"
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex flex-col">
          <div>
            <p className="text-black text-3xl font-semibold">
              SURGICAL APPROACH
            </p>
          </div>
          <table className="w-full border-separate border-spacing-y-8">
            <tbody>
              {/* TECHNOLOGICAL ASSISTANCE Row */}
              <tr className="align-middle">
                <td className="font-bold text-lg text-black w-1/3">
                  TECHNOLOGICAL ASSISTANCE
                </td>
                <td>
                  <div className="flex flex-row text-black text-lg font-medium gap-8">
                    {techassistoptions.map((option, index) => (
                      <label
                        key={index}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="dynamicRadio5"
                          value={option}
                          checked={techassist === option}
                          onChange={() => settechassist(option)}
                          className="form-radio text-blue-600"
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                </td>
              </tr>

              {/* ALIGNMENT PHILOSOPHY Row */}
              <tr className="align-middle">
                <td className="font-bold text-lg text-black w-1/4">
                  ALLIGNMENT PHILOSOPHY
                </td>
                <td>
                  <div className="flex flex-row text-black text-lg font-medium gap-8">
                    {alignphiloptions.map((option, index) => (
                      <label
                        key={index}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="dynamicRadio6"
                          value={option}
                          checked={alignphil === option}
                          onChange={() => setalignphil(option)}
                          className="form-radio text-blue-600"
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex flex-col">
          <div>
            <p className="text-black text-3xl font-semibold">
              INTRA OPERATIVE EVENTS
            </p>
          </div>
          <table className="w-full border-separate border-spacing-y-8">
            <tbody>
              {/* TOURNIQUET USED Row */}
              <tr className="align-middle">
                <td className="font-bold text-lg text-black w-1/4">
                  TOURNIQUET USED
                </td>
                <td>
                  <div className="flex flex-row text-black text-lg font-medium gap-8">
                    {tourusedoptions.map((option, index) => (
                      <label
                        key={index}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="dynamicRadio7"
                          value={option}
                          checked={toruused === option}
                          onChange={() => settourused(option)}
                          className="form-radio text-blue-600"
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                </td>
              </tr>

              <tr className="align-middle">
                <td className="font-bold text-lg text-black w-1/3">
                  OPERATIVE DATE
                </td>
                <td>
                  <div className="flex flex-row items-center gap-4">
                    <p className="text-black text-lg font-semibold">
                      {dateOnlyIST}
                    </p>
                  </div>
                </td>
              </tr>

              {/* OPERATIVE TIME Row */}
              <tr className="align-middle">
                <td className="font-bold text-lg text-black w-1/4">
                  OPERATIVE TIME
                </td>
                <td>
                  <div className="flex flex-row items-center gap-4">
                    <input
                      id="optime"
                      type="text"
                      placeholder="HH:MM (24 HRS)"
                      value={optime}
                      onChange={handleOptimeChange}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black font-semibold text-lg"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-8">
          <div>
            <p className="text-black text-3xl font-semibold">BONE RESECTION</p>
          </div>

          <table className="w-full border-separate border-spacing-y-0">
            <tbody>
              {/* ACL CONDTION Row */}
              <tr className="align-middle">
                <td className="font-bold text-lg text-black w-1/4">
                  ACL CONDITION
                </td>
                <td>
                  <div className="flex flex-row text-black text-lg font-medium gap-8">
                    {aclconditionoptions.map((option, index) => (
                      <label
                        key={index}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="dynamicRadio8"
                          value={option}
                          checked={aclcondition === option}
                          onChange={() => setaclcondition(option)}
                          className="form-radio text-blue-600"
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                </td>
              </tr>
              <tr>
                <td colSpan="2" className="h-8"></td>
              </tr>
              <tr className="align-middle">
                <td className="font-bold text-2xl text-black w-1/3">
                  DISTAL FEMORAL RESECTION
                </td>
                <td>
                  <div className="flex flex-row items-center gap-4">
                    <p className="text-black text-lg font-medium">
                      <strong>Target Thickness:</strong> 8mm Unworn, 6mm Worn
                      (No Cartilage)
                      <br />
                      When initial thickness misses target – recut or use a
                      washer
                    </p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div className="w-full flex flex-row">
            <div className="w-full h-fit flex flex-row text-black text-sm gap-2 pr-2">
              {/* Left image */}
              <div className="w-1/4 flex justify-center">
                <Image
                  src={Medialcondyle}
                  alt="Medial Condyle"
                  className="w-full h-full"
                />
              </div>

              {/* Right content */}
              <table className="w-3/4 text-black text-base border-separate border-spacing-y-3 h-fit shadow-lg py-2 px-4 rounded-2xl">
                <tbody>
                  {/* Heading */}
                  <tr>
                    <td colSpan="3" className="text-lg font-bold">
                      MEDIAL CONDYLE
                    </td>
                  </tr>

                  {/* Wear Selection */}
                  <tr>
                    <td colSpan="3">
                      <div className="flex flex-row text-black text-base font-medium gap-8">
                        <label className="mr-6 cursor-pointer">
                          <input
                            type="radio"
                            name="wear"
                            value="unworn"
                            className="mr-1"
                            checked={wearStatus === "unworn"}
                            onChange={handleChangewearstatus}
                          />
                          UNWORN
                        </label>
                        <label className="cursor-pointer">
                          <input
                            type="radio"
                            name="wear"
                            value="worn"
                            className="mr-1"
                            checked={wearStatus === "worn"}
                            onChange={handleChangewearstatus}
                          />
                          WORN
                        </label>
                      </div>
                    </td>
                  </tr>

                  {/* INITIAL THICKNESS */}
                  <tr>
                    <td className="font-semibold w-1/2 text-base">
                      INITIAL THICKNESS
                    </td>
                    <td className="w-1/4 text-black text-base flex flex-row items-center font-medium gap-2">
                      <select
                        className="border px-2 py-1 w-28 mr-1 rounded"
                        value={distalmedialinithick}
                        onChange={handleInputdistalmedialinithick}
                      >
                        {Array.from({ length: 32 }, (_, i) => {
                          const value = (i * 0.5).toFixed(1);
                          const label = `${value} mm`;
                          return (
                            <option key={value} value={label}>
                              {label}
                            </option>
                          );
                        })}
                      </select>
                    </td>
                  </tr>

                  {/* RECUT */}
                  <tr>
                    <td className="font-semibold">RECUT</td>
                    <td>
                      <div className="flex flex-row text-black text-base font-medium gap-8">
                        <label className="mr-4 cursor-pointer">
                          <input
                            type="radio"
                            name="recut"
                            value="no"
                            className="mr-1"
                            checked={distalmedialrecutyn === "no"}
                            onChange={handleInputdistalmedialrecutyn}
                          />{" "}
                          N
                        </label>
                        <label className="cursor-pointer">
                          <input
                            type="radio"
                            name="recut"
                            value="yes"
                            className="mr-1"
                            checked={distalmedialrecutyn === "yes"}
                            onChange={handleInputdistalmedialrecutyn}
                          />{" "}
                          Y
                        </label>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-row items-center text-black text-base font-medium gap-2">
                        <select
                          className="border px-2 py-1 w-28 rounded mr-1"
                          value={distalmedialrecutvalue}
                          onChange={handleInputdistalmedialrecutvalue}
                        >
                          {Array.from({ length: 32 }, (_, i) => {
                          const value = (i * 0.5).toFixed(1);
                          const label = `${value} mm`;
                          return (
                            <option key={value} value={label}>
                              {label}
                            </option>
                          );
                        })}
                        </select>
                      </div>
                    </td>
                  </tr>

                  {/* WASHER */}
                  <tr>
                    <td className="font-semibold">WASHER</td>
                    <td>
                      <div className="flex flex-row text-black text-base font-medium gap-8">
                        <label className="mr-4 cursor-pointer">
                          <input
                            type="radio"
                            name="washer"
                            value="no"
                            className="mr-1"
                            checked={distalmedialwasheryn === "no"}
                            onChange={handleInputdistalmedialwasheryn}
                          />{" "}
                          N
                        </label>
                        <label className="cursor-pointer">
                          <input
                            type="radio"
                            name="washer"
                            value="yes"
                            className="mr-1"
                            checked={distalmedialwasheryn === "yes"}
                            onChange={handleInputdistalmedialwasheryn}
                          />{" "}
                          Y
                        </label>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-row items-center text-black text-base font-medium gap-2">
                        <select
                          className="border px-2 py-1 w-28 rounded mr-1"
                          value={distalmedialwashervalue}
                          onChange={handleInputdistalmedialwashervalue}
                        >
                          {Array.from({ length: 32 }, (_, i) => {
                          const value = (i * 0.5).toFixed(1);
                          const label = `${value} mm`;
                          return (
                            <option key={value} value={label}>
                              {label}
                            </option>
                          );
                        })}
                        </select>
                      </div>
                    </td>
                  </tr>

                  {/* FINAL THICKNESS */}
                  <tr>
                    <td className="font-semibold">FINAL THICKNESS</td>
                    <td>
                      <div className="flex flex-row items-center text-black text-base font-medium gap-2">
                        <select
                          className="border px-2 py-1 w-24 mr-1 rounded"
                          value={distalmedialfinalthick}
                          onChange={handleInputdistalmedialfinalthick}
                        >
                          {Array.from({ length: 32 }, (_, i) => {
                          const value = (i * 0.5).toFixed(1);
                          const label = `${value} mm`;
                          return (
                            <option key={value} value={label}>
                              {label}
                            </option>
                          );
                        })}
                        </select>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="w-full h-fit flex flex-row text-black text-sm gap-2 pl-2 ">
              {/* Right content */}
              <table className="w-3/4 text-black text-base border-separate border-spacing-y-3 h-fit shadow-lg py-2 px-4 rounded-2xl">
                <tbody>
                  {/* Heading */}
                  <tr>
                    <td colSpan="3" className="text-lg font-bold">
                      LATERAL CONDYLE
                    </td>
                  </tr>

                  {/* LATERAL SECTION */}

                  {/* Wear Selection */}
                  <tr>
                    <td colSpan="3">
                      <div className="flex flex-row text-black text-base font-medium gap-8">
                        <label className="mr-6 cursor-pointer">
                          <input
                            type="radio"
                            name="wearLat"
                            value="unworn"
                            className="mr-1"
                            checked={wearStatusLat === "unworn"}
                            onChange={handleChangeWearStatusLat}
                          />
                          UNWORN
                        </label>
                        <label className="cursor-pointer">
                          <input
                            type="radio"
                            name="wearLat"
                            value="worn"
                            className="mr-1"
                            checked={wearStatusLat === "worn"}
                            onChange={handleChangeWearStatusLat}
                          />
                          WORN
                        </label>
                      </div>
                    </td>
                  </tr>

                  {/* INITIAL THICKNESS */}
                  <tr>
                    <td className="font-semibold w-1/2">INITIAL THICKNESS</td>
                    <td>
                      <div className="flex flex-row items-center text-black text-base font-medium gap-2">
                        <select
                          className="border px-2 py-1 w-24 mr-1 rounded"
                          value={distallateralinithick}
                          onChange={handleInputdistallateralinithick}
                        >
                          {Array.from({ length: 32 }, (_, i) => {
                          const value = (i * 0.5).toFixed(1);
                          const label = `${value} mm`;
                          return (
                            <option key={value} value={label}>
                              {label}
                            </option>
                          );
                        })}
                        </select>
                      </div>
                    </td>
                  </tr>

                  {/* RECUT */}
                  <tr>
                    <td className="font-semibold">RECUT</td>
                    <td className="w-1/4">
                      <div className="flex flex-row text-black text-base font-medium gap-8">
                        <label className="mr-4 cursor-pointer">
                          <input
                            type="radio"
                            name="recutLat"
                            value="no"
                            className="mr-1"
                            checked={distallateralrecutyn === "no"}
                            onChange={handleInputdistallateralrecutyn}
                          />
                          N
                        </label>
                        <label className="cursor-pointer">
                          <input
                            type="radio"
                            name="recutLat"
                            value="yes"
                            className="mr-1"
                            checked={distallateralrecutyn === "yes"}
                            onChange={handleInputdistallateralrecutyn}
                          />
                          Y
                        </label>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-row items-center text-black text-base font-medium gap-2">
                        <select
                          className="border px-2 py-1 w-24 rounded mr-1"
                          value={distallateralrecutvalue}
                          onChange={handleInputdistallateralrecutvalue}
                        >
                          {Array.from({ length: 32 }, (_, i) => {
                          const value = (i * 0.5).toFixed(1);
                          const label = `${value} mm`;
                          return (
                            <option key={value} value={label}>
                              {label}
                            </option>
                          );
                        })}
                        </select>
                      </div>
                    </td>
                  </tr>

                  {/* WASHER */}
                  <tr>
                    <td className="font-semibold">WASHER</td>
                    <td>
                      <div className="flex flex-row text-black text-base font-medium gap-8">
                        <label className="mr-4 cursor-pointer">
                          <input
                            type="radio"
                            name="washerLat"
                            value="no"
                            className="mr-1"
                            checked={distallateralwasheryn === "no"}
                            onChange={handleInputdistallateralwasheryn}
                          />
                          N
                        </label>
                        <label className="cursor-pointer">
                          <input
                            type="radio"
                            name="washerLat"
                            value="yes"
                            className="mr-1"
                            checked={distallateralwasheryn === "yes"}
                            onChange={handleInputdistallateralwasheryn}
                          />
                          Y
                        </label>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-row items-center text-black text-base font-medium gap-2">
                        <select
                          className="border px-2 py-1 w-24 rounded mr-1"
                          value={distallateralwashervalue}
                          onChange={handleInputdistallateralwashervalue}
                        >
                          {Array.from({ length: 32 }, (_, i) => {
                          const value = (i * 0.5).toFixed(1);
                          const label = `${value} mm`;
                          return (
                            <option key={value} value={label}>
                              {label}
                            </option>
                          );
                        })}
                        </select>
                      </div>
                    </td>
                  </tr>

                  {/* FINAL THICKNESS */}
                  <tr>
                    <td className="font-semibold">FINAL THICKNESS</td>
                    <td>
                      <div className="flex flex-row items-center text-black text-base font-medium gap-2">
                        <select
                          className="border px-2 py-1 w-24 mr-1 rounded"
                          value={distallateralfinalthick}
                          onChange={handleInputdistallateralfinalthick}
                        >
                          {Array.from({ length: 32 }, (_, i) => {
                          const value = (i * 0.5).toFixed(1);
                          const label = `${value} mm`;
                          return (
                            <option key={value} value={label}>
                              {label}
                            </option>
                          );
                        })}
                        </select>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Left image */}
              <div className="w-1/4 flex justify-center">
                <Image
                  src={Lateralcondyle}
                  alt="Medial Condyle"
                  className="w-full h-full"
                />
              </div>
            </div>
          </div>

          <table className="w-full border-separate border-spacing-y-8">
            <tbody>
              <tr className="align-middle">
                <td className="font-bold text-2xl text-black w-1/3">
                  POSTERIAL FEMORAL RESECTION
                </td>
                <td>
                  <div className="flex flex-row items-center gap-4">
                    <p className="text-black text-lg font-medium">
                      <strong>Target Thickness:</strong> 7mm Unworn, 5mm Worn
                      (No Cartilage)
                      <br />
                      When initial thickness misses target – recut
                    </p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div className="w-full flex flex-row">
            <div className="w-full h-fit flex flex-row  text-black text-sm gap-2 pr-2">
              {/* Left image */}
              <div className="w-1/4 flex justify-center">
                <Image
                  src={Medialcondylepost}
                  alt="Medial Condyle"
                  className="w-full h-full"
                />
              </div>

              {/* Right content */}
              <table className="w-3/4 text-black text-base border-separate border-spacing-y-3 h-fit shadow-lg py-2 px-4 rounded-2xl">
                <tbody>
                  {/* Heading */}
                  <tr>
                    <td colSpan="3" className="text-lg font-bold pb-2">
                      MEDIAL CONDYLE
                    </td>
                  </tr>

                  {/* Wear Selection */}
                  <tr>
                    <td colSpan="3">
                      <div className="flex flex-row text-black text-base font-medium gap-8">
                        <label className="mr-6 cursor-pointer">
                          <input
                            type="radio"
                            name="postmedialWear"
                            value="unworn"
                            className="mr-1"
                            checked={postmedialWear === "unworn"}
                            onChange={handlePostmedialWearChange}
                          />
                          UNWORN
                        </label>
                        <label className="cursor-pointer">
                          <input
                            type="radio"
                            name="postmedialWear"
                            value="worn"
                            className="mr-1"
                            checked={postmedialWear === "worn"}
                            onChange={handlePostmedialWearChange}
                          />
                          WORN
                        </label>
                      </div>
                    </td>
                  </tr>

                  {/* INITIAL THICKNESS */}
                  <tr>
                    <td className="font-semibold w-1/2">INITIAL THICKNESS</td>
                    <td>
                      <div className="flex flex-row items-center text-black text-base font-medium gap-2">
                        <select
                          className="border px-2 py-1 w-24 mr-1 rounded"
                          value={postmedialInitialThickness}
                          onChange={handlePostmedialInitialThicknessChange}
                        >
                          {Array.from({ length: 32 }, (_, i) => {
                          const value = (i * 0.5).toFixed(1);
                          const label = `${value} mm`;
                          return (
                            <option key={value} value={label}>
                              {label}
                            </option>
                          );
                        })}
                        </select>
                      </div>
                    </td>
                  </tr>

                  {/* RECUT */}
                  <tr>
                    <td className="font-semibold">RECUT</td>
                    <td className="w-1/4">
                      <div className="flex flex-row text-black text-base font-medium gap-8">
                        <label className="mr-4 cursor-pointer">
                          <input
                            type="radio"
                            name="postmedialRecut"
                            value="no"
                            className="mr-1"
                            checked={postmedialRecutYN === "no"}
                            onChange={handlePostmedialRecutYNChange}
                          />
                          N
                        </label>
                        <label className="cursor-pointer">
                          <input
                            type="radio"
                            name="postmedialRecut"
                            value="yes"
                            className="mr-1"
                            checked={postmedialRecutYN === "yes"}
                            onChange={handlePostmedialRecutYNChange}
                          />
                          Y
                        </label>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-row items-center text-black text-base font-medium gap-2">
                        <select
                          className="border px-2 py-1 w-24 rounded mr-1"
                          value={postmedialRecutValue}
                          onChange={handlePostmedialRecutValueChange}
                        >
                          {Array.from({ length: 32 }, (_, i) => {
                          const value = (i * 0.5).toFixed(1);
                          const label = `${value} mm`;
                          return (
                            <option key={value} value={label}>
                              {label}
                            </option>
                          );
                        })}
                        </select>
                      </div>
                    </td>
                  </tr>

                  {/* FINAL THICKNESS */}
                  <tr>
                    <td className="font-semibold">FINAL THICKNESS</td>
                    <td>
                      <div className="flex flex-row items-center text-black text-base font-medium gap-2">
                        <select
                          className="border px-2 py-1 w-24 mr-1 rounded"
                          value={postmedialFinalThickness}
                          onChange={handlePostmedialFinalThicknessChange}
                        >
                          {Array.from({ length: 32 }, (_, i) => {
                          const value = (i * 0.5).toFixed(1);
                          const label = `${value} mm`;
                          return (
                            <option key={value} value={label}>
                              {label}
                            </option>
                          );
                        })}
                        </select>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="w-full h-fit flex flex-row  text-black text-sm gap-2 pl-2">
              {/* Right content */}
              <table className="w-3/4 text-black text-base border-separate border-spacing-y-3 h-fit shadow-lg py-2 px-4 rounded-2xl">
                <tbody>
                  {/* Heading */}
                  <tr>
                    <td colSpan="3" className="text-lg font-bold pb-2">
                      LATERAL CONDYLE
                    </td>
                  </tr>

                  {/* Wear Selection */}
                  <tr>
                    <td colSpan="3">
                      <div className="flex flex-row text-black text-base font-medium gap-8">
                        <label className="mr-6 cursor-pointer">
                          <input
                            type="radio"
                            name="postlateralWear"
                            value="unworn"
                            className="mr-1"
                            checked={postlateralWear === "unworn"}
                            onChange={handlePostlateralWearChange}
                          />
                          UNWORN
                        </label>
                        <label className="cursor-pointer">
                          <input
                            type="radio"
                            name="postlateralWear"
                            value="worn"
                            className="mr-1"
                            checked={postlateralWear === "worn"}
                            onChange={handlePostlateralWearChange}
                          />
                          WORN
                        </label>
                      </div>
                    </td>
                  </tr>

                  {/* INITIAL THICKNESS */}
                  <tr>
                    <td className="font-semibold w-1/2">INITIAL THICKNESS</td>
                    <td className="w-1/4">
                      <div className="flex flex-row items-center text-black text-base font-medium gap-2">
                        <select
                          className="border px-2 py-1 w-24 mr-1 rounded"
                          value={postlateralInitialThickness}
                          onChange={handlePostlateralInitialThicknessChange}
                        >
                          {Array.from({ length: 32 }, (_, i) => {
                          const value = (i * 0.5).toFixed(1);
                          const label = `${value} mm`;
                          return (
                            <option key={value} value={label}>
                              {label}
                            </option>
                          );
                        })}
                        </select>
                      </div>
                    </td>
                  </tr>

                  {/* RECUT */}
                  <tr>
                    <td className="font-semibold">RECUT</td>
                    <td>
                      <div className="flex flex-row text-black text-base font-medium gap-8">
                        <label className="mr-4 cursor-pointer">
                          <input
                            type="radio"
                            name="postlateralRecut"
                            value="no"
                            className="mr-1"
                            checked={postlateralRecutYN === "no"}
                            onChange={handlePostlateralRecutYNChange}
                          />
                          N
                        </label>
                        <label className="cursor-pointer">
                          <input
                            type="radio"
                            name="postlateralRecut"
                            value="yes"
                            className="mr-1"
                            checked={postlateralRecutYN === "yes"}
                            onChange={handlePostlateralRecutYNChange}
                          />
                          Y
                        </label>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-row items-center text-black text-base font-medium gap-2">
                        <select
                          className="border px-2 py-1 w-24 rounded mr-1"
                          value={postlateralRecutValue}
                          onChange={handlePostlateralRecutValueChange}
                        >
                          {Array.from({ length: 32 }, (_, i) => {
                          const value = (i * 0.5).toFixed(1);
                          const label = `${value} mm`;
                          return (
                            <option key={value} value={label}>
                              {label}
                            </option>
                          );
                        })}
                        </select>
                      </div>
                    </td>
                  </tr>

                  {/* FINAL THICKNESS */}
                  <tr>
                    <td className="font-semibold">FINAL THICKNESS</td>
                    <td>
                      <div className="flex flex-row items-center text-black text-base font-medium gap-2">
                        <select
                          className="border px-2 py-1 w-24 mr-1 rounded"
                          value={postlateralFinalThickness}
                          onChange={handlePostlateralFinalThicknessChange}
                        >
                          {Array.from({ length: 32 }, (_, i) => {
                          const value = (i * 0.5).toFixed(1);
                          const label = `${value} mm`;
                          return (
                            <option key={value} value={label}>
                              {label}
                            </option>
                          );
                        })}
                        </select>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Left image */}
              <div className="w-1/4 flex justify-center">
                <Image
                  src={Lateralcondylepost}
                  alt="Medial Condyle"
                  className="w-full h-full"
                />
              </div>
            </div>
          </div>

          <table className="w-full border-separate border-spacing-y-8">
            <tbody>
              <tr className="align-middle">
                <td className="font-bold text-2xl text-black w-1/3">
                  TIBIAL RESECTION
                </td>
                <td>
                  <div className="flex flex-row items-center gap-4">
                    <p className="text-black text-lg font-medium">
                      <strong>Target:</strong> Equal Thickness measured at Base
                      of Tibial Spines
                    </p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div className="w-3/4 flex justify-center">
            <div className="w-2/3 flex flex-row justify-center gap-8">
              <table className="w-1/4 text-black text-lg border-separate border-spacing-y-0">
                <tbody>
                  {/* TIBIAL LEFT WEAR: UNWORN */}
                  <tr>
                    <td colSpan="1" className="text-lg font-bold pb-2">
                      <label className="mr-6 cursor-pointer">
                        <input
                          type="radio"
                          name="tibialLeftWear"
                          value="unworn"
                          className="mr-1"
                          checked={tibialLeftWear === "unworn"}
                          onChange={handleTibialLeftWearChange}
                        />
                        UNWORN
                      </label>
                    </td>
                  </tr>

                  {/* TIBIAL LEFT WEAR: WORN */}
                  <tr className="text-lg font-bold pb-2">
                    <td colSpan="1">
                      <label className="cursor-pointer">
                        <input
                          type="radio"
                          name="tibialLeftWear"
                          value="worn"
                          className="mr-1"
                          checked={tibialLeftWear === "worn"}
                          onChange={handleTibialLeftWearChange}
                        />
                        WORN
                      </label>
                    </td>
                  </tr>

                  <tr>
                    <td className="h-4"></td>
                  </tr>
                  <tr>
                    <td className="h-4"></td>
                  </tr>
                  <tr>
                    <td className="h-4"></td>
                  </tr>

                  {/* TIBIAL LEFT MEASUREMENT */}
                  <tr>
                    <td>
                      <select
                        className="border px-2 py-1 w-24 mr-1 rounded"
                        value={tibialLeftValue}
                        onChange={handleTibialLeftValueChange}
                      >
                        {Array.from({ length: 32 }, (_, i) => {
                          const value = (i * 0.5).toFixed(1);
                          const label = `${value} mm`;
                          return (
                            <option key={value} value={label}>
                              {label}
                            </option>
                          );
                        })}
                      </select>
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="w-3/5">
                <Image
                  src={Tibial}
                  alt="Medial Condyle"
                  className="w-full h-full"
                />
              </div>

              <table className="w-1/4 text-black text-lg border-separate border-spacing-y-0">
                <tbody>
                  {/* TIBIAL RIGHT - WEAR: UNWORN */}
                  <tr>
                    <td colSpan="1" className="text-lg font-bold pb-2">
                      <label className="mr-6 cursor-pointer">
                        <input
                          type="radio"
                          name="tibialRightWear"
                          value="unworn"
                          className="mr-1"
                          checked={tibialRightWear === "unworn"}
                          onChange={handleTibialRightWearChange}
                        />
                        UNWORN
                      </label>
                    </td>
                  </tr>

                  {/* TIBIAL RIGHT - WEAR: WORN */}
                  <tr className="text-lg font-bold pb-2">
                    <td colSpan="1">
                      <label className="cursor-pointer">
                        <input
                          type="radio"
                          name="tibialRightWear"
                          value="worn"
                          className="mr-1"
                          checked={tibialRightWear === "worn"}
                          onChange={handleTibialRightWearChange}
                        />
                        WORN
                      </label>
                    </td>
                  </tr>

                  <tr>
                    <td className="h-4"></td>
                  </tr>
                  <tr>
                    <td className="h-4"></td>
                  </tr>
                  <tr>
                    <td className="h-4"></td>
                  </tr>

                  {/* TIBIAL RIGHT - MEASUREMENT */}
                  <tr>
                    <td>
                      <select
                        className="border px-2 py-1 w-24 mr-1 rounded"
                        value={tibialRightValue}
                        onChange={handleTibialRightValueChange}
                      >
                        {Array.from({ length: 32 }, (_, i) => {
                          const value = (i * 0.5).toFixed(1);
                          const label = `${value} mm`;
                          return (
                            <option key={value} value={label}>
                              {label}
                            </option>
                          );
                        })}
                      </select>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <table className="w-full border-separate border-spacing-y-0 text-black">
            <tbody>
              {/* ACL CONDTION Row */}
              <tr className="align-middle">
                <td className="font-bold text-lg text-black w-1/3">
                  PCL CONDITION
                </td>
                <td>
                  <div className="flex flex-row text-black text-lg font-medium gap-8">
                    {pclconditionoptions.map((option, index) => (
                      <label
                        key={index}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="dynamicRadio9"
                          value={option}
                          checked={pclcondition === option}
                          onChange={() => setpclcondition(option)}
                          className="form-radio text-blue-600"
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                </td>
              </tr>
              <tr>
                <td colSpan="2" className="h-8"></td>
              </tr>
              <tr className="align-middle">
                <td className="font-bold text-lg text-black w-1/3">
                  TIBIAL V-V RECUT
                </td>
                <td className="w-1/6 text-lg">
                  <label className="mr-4 cursor-pointer">
                    <input
                      type="radio"
                      name="tibialVVRecut"
                      value="no"
                      className="mr-1"
                      checked={tibialVVRecutYN === "no"}
                      onChange={handleTibialVVRecutYNChange}
                    />
                    N
                  </label>
                  <label className="cursor-pointer">
                    <input
                      type="radio"
                      name="tibialVVRecut"
                      value="yes"
                      className="mr-1"
                      checked={tibialVVRecutYN === "yes"}
                      onChange={handleTibialVVRecutYNChange}
                    />
                    Y
                  </label>
                </td>
                <td className="text-lg">
                  <select
                    className="border px-2 py-1 w-24 rounded mr-1"
                    value={tibialVVRecutValue}
                    onChange={handleTibialVVRecutValueChange}
                  >
                    {Array.from({ length: 32 }, (_, i) => {
                          const value = (i * 0.5).toFixed(1);
                          const label = `${value} mm`;
                          return (
                            <option key={value} value={label}>
                              {label}
                            </option>
                          );
                        })}
                  </select>
                </td>
              </tr>
              <tr>
                <td colSpan="2" className="h-8"></td>
              </tr>
              <tr className="align-middle">
                <td className="font-bold text-lg text-black w-1/3">
                  TIBIAL SLOPE RECUT
                </td>
                <td className="w-1/6 text-lg">
                  <label className="mr-4 cursor-pointer">
                    <input
                      type="radio"
                      name="tibialSlopeRecut"
                      value="no"
                      className="mr-1"
                      checked={tibialSlopeRecutYN === "no"}
                      onChange={handleTibialSlopeRecutYNChange}
                    />
                    N
                  </label>
                  <label className="cursor-pointer">
                    <input
                      type="radio"
                      name="tibialSlopeRecut"
                      value="yes"
                      className="mr-1"
                      checked={tibialSlopeRecutYN === "yes"}
                      onChange={handleTibialSlopeRecutYNChange}
                    />
                    Y
                  </label>
                </td>
                <td className="text-lg">
                  <select
                    className="border px-2 py-1 w-24 rounded mr-1"
                    value={tibialSlopeRecutValue}
                    onChange={handleTibialSlopeRecutValueChange}
                  >
                    {Array.from({ length: 32 }, (_, i) => {
                          const value = (i * 0.5).toFixed(1);
                          const label = `${value} mm`;
                          return (
                            <option key={value} value={label}>
                              {label}
                            </option>
                          );
                        })}
                  </select>
                </td>
              </tr>
            </tbody>
          </table>

          <div className="w-1/2 flex text-xl flex-col text-black gap-4">
            <p className="font-bold w-full">
              FINAL CHECK WITH SPACER BLOCK AND TRIAL COMPONENTS
            </p>

            <label className="mr-4 cursor-pointer">
              <input
                type="radio"
                name="finalCheck"
                value="NEGLIGIBLE V-V LAXITY IN EXTENSION"
                className="mr-1 cursor-pointer"
                checked={finalCheck === "NEGLIGIBLE V-V LAXITY IN EXTENSION"}
                onChange={handleFinalCheckChange}
              />
              NEGLIGIBLE V-V LAXITY IN EXTENSION
            </label>

            <label className="cursor-pointer">
              <input
                type="radio"
                name="finalCheck"
                value="2-3 MM OF LATERAL OPENING WITH VARUS LOAD IN 15-30° OF FLEXION"
                className="mr-1 cursor-pointer"
                checked={
                  finalCheck ===
                  "2-3 MM OF LATERAL OPENING WITH VARUS LOAD IN 15-30° OF FLEXION"
                }
                onChange={handleFinalCheckChange}
              />
              2-3 MM OF LATERAL OPENING WITH VARUS LOAD IN 15-30° OF FLEXION
            </label>
          </div>

          <table className="w-full text-sm text-black border-collapse">
            <thead>
              <tr className="font-bold text-lg">
                <th className="text-left p-2">INSERT THICKNESS</th>
                <th className="text-left p-2">NO. OF TICKS</th>
                <th className="text-left p-2">EXTENSION EXT. ORIENT.</th>
                <th className="text-left p-2">90° FLEXION INT. ORIENT.</th>
                <th className="text-left p-2">LIFT–OFF</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, idx) => (
                <tr key={idx} className="align-middle">
                  {/* INSERT THICKNESS */}
                  <td className="p-2 font-bold text-lg">{row.thickness} mm</td>

                  {/* NO. OF TICKS */}
                  <td className="p-2 text-lg font-medium">
                    <input
                      type="text"
                      className="border px-2 py-1 w-16 rounded"
                      value={row.numOfTicks}
                      onChange={(e) =>
                        handleInputChange(idx, "numOfTicks", e.target.value)
                      }
                    />
                  </td>

                  {/* EXTENSION EXT. ORIENT. */}
                  <td className="p-2 text-lg font-medium">
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        className="border px-2 py-1 w-16 rounded"
                        value={row.extensionExtOrient}
                        onChange={(e) =>
                          handleInputChange(
                            idx,
                            "extensionExtOrient",
                            e.target.value
                          )
                        }
                      />
                      <span>DEGREES</span>
                    </div>
                  </td>

                  {/* 90° FLEXION INT. ORIENT. */}
                  <td className="p-2 text-lg font-medium">
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        className="border px-2 py-1 w-16 rounded"
                        value={row.flexionIntOrient}
                        onChange={(e) =>
                          handleInputChange(
                            idx,
                            "flexionIntOrient",
                            e.target.value
                          )
                        }
                      />
                      <span>DEGREES</span>
                    </div>
                  </td>

                  {/* LIFT–OFF */}
                  <td className="p-2 text-lg font-medium">
                    <div className="flex gap-4">
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name={`liftOff${idx}`}
                          value="N"
                          checked={row.liftOff === "N"}
                          onChange={(e) =>
                            handleInputChange(idx, "liftOff", e.target.value)
                          }
                        />
                        N
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name={`liftOff${idx}`}
                          value="Y"
                          checked={row.liftOff === "Y"}
                          onChange={(e) =>
                            handleInputChange(idx, "liftOff", e.target.value)
                          }
                        />
                        Y
                      </label>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <table className="w-full border-separate border-spacing-y-0 text-black">
            <tbody>
              <tr className="align-middle">
                <td className="font-bold text-lg text-black w-1/3">
                  PFJ RESURFACING
                </td>
                <td className="font-medium text-lg text-black flex flex-row gap-8">
                  {femursizeoptions.map((option, index) => (
                    <label
                      key={index}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="dynamicRadio11"
                        value={option}
                        checked={femursize === option}
                        onChange={() => setfemursize(option)}
                        className="form-radio text-blue-600"
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </td>
              </tr>

              <tr>
                <td colSpan="2" className="h-8"></td>
              </tr>

              <tr className="align-middle">
                <td className="font-bold text-lg text-black w-1/3">
                  TRACHELA RESECTION
                </td>
                <td className="font-medium text-lg text-black">
                  <select
                    className="border px-2 py-1 rounded"
                    value={tibialSize}
                    onChange={handleTibialSizeChange}
                  >
                    {Array.from({ length: 32 }, (_, i) => {
                          const value = (i * 0.5).toFixed(1);
                          const label = `${value} mm`;
                          return (
                            <option key={value} value={label}>
                              {label}
                            </option>
                          );
                        })}
                  </select>
                </td>
              </tr>

              <tr>
                <td colSpan="2" className="h-8"></td>
              </tr>

              <tr className="align-middle">
                <td className="font-bold text-lg text-black w-1/3">PATELLA</td>
                <td className="font-medium text-lg text-black">
                  <div className="flex flex-row text-black text-lg font-medium gap-8">
                    {insertthicknessoptions.map((option, index) => (
                      <label
                        key={index}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="dynamicRadio10"
                          value={option}
                          checked={insertthickness === option}
                          onChange={() => setinsertthickness(option)}
                          className="form-radio text-blue-600"
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                </td>
              </tr>

              <tr>
                <td colSpan="2" className="h-8"></td>
              </tr>

              {femursize === "YES" && (
                <>
                  <tr className="align-middle">
                    <td className="font-bold text-lg text-black w-1/3">
                      PRE RESURFACING THICKNESS
                    </td>
                    <td className="font-medium text-lg text-black">
                      <select
                        className="border px-2 py-1 rounded"
                        value={preresurfacingthickness}
                        onChange={handlePreresurfacingThicknessChange}
                      >
                        {Array.from({ length: 32 }, (_, i) => {
                          const value = (i * 0.5).toFixed(1);
                          const label = `${value} mm`;
                          return (
                            <option key={value} value={label}>
                              {label}
                            </option>
                          );
                        })}
                      </select>
                    </td>
                  </tr>

                  <tr>
                    <td colSpan="2" className="h-8"></td>
                  </tr>

                  <tr className="align-middle">
                    <td className="font-bold text-lg text-black w-1/3">
                      POST RESURFACING THICKNESS
                    </td>
                    <td className="font-medium text-lg text-black">
                      <select
                        className="border px-2 py-1 rounded"
                        value={postresurfacingthickness}
                        onChange={handlePostresurfacingThicknessChange}
                      >
                        {Array.from({ length: 32 }, (_, i) => {
                          const value = (i * 0.5).toFixed(1);
                          const label = `${value} mm`;
                          return (
                            <option key={value} value={label}>
                              {label}
                            </option>
                          );
                        })}
                      </select>
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col">
          <div>
            <p className="text-black text-3xl font-semibold">
              COMPONENT SELECTION
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="table-auto border-separate border-spacing-y-8 w-full text-sm text-black">
              <thead>
                <tr>
                  <th className="px-3 py-2 "></th>
                  {colHeaders.map((col) => (
                    <th
                      key={col}
                      className=" px-3 py-2 text-left text-black font-bold text-lg"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rowHeaders.map((row) => (
                  <tr key={row}>
                    <td className="text-black font-bold text-lg px-3 py-2">
                      {row}
                    </td>
                    {colHeaders.map((col) => (
                      <td
                        key={col}
                        className="text-black font-medium text-lg px-2 py-2"
                      >
                        <select
                          className="w-full px-2 py-1 text-black font-medium text-lg rounded"
                          value={selectedValues[col][row]}
                          onChange={(e) =>
                            handleChange(col, row, e.target.value)
                          }
                        >
                          <option value="">Select</option>
                          {(row === "MANUFACTURER"
                            ? optionsData[col]?.MANUFACTURER
                            : row === "MODEL"
                            ? optionsData[col]?.MODEL?.[
                                selectedValues[col]["MANUFACTURER"]
                              ]
                            : row === "SIZE"
                            ? optionsData[col]?.SIZE?.[
                                selectedValues[col]["MODEL"]
                              ]
                            : []
                          )?.map((option, idx) => (
                            <option key={idx} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="w-full flex flex-row justify-center items-center">
          <div className="w-1/2 flex flex-row justify-start items-center">
            <p
              className="font-semibold italic text-[#475467] text-lg cursor-pointer"
              onClick={clearAllFields}
            >
              CLEAR ALL
            </p>
          </div>
          <div className="w-1/2 flex flex-row justify-end items-center">
            <p
              className=" rounded-full px-3 py-[1px] cursor-pointer text-center text-white text-lg font-semibold border-[#005585] border-2"
              style={{ backgroundColor: "rgba(0, 85, 133, 0.9)" }}
              onClick={!isSubmitting ? handlesubmitpop : undefined}
            >
              {isSubmitting ? "SAVING..." : "DRAFT"}
            </p>
          </div>
        </div>
      </div>
      {showAlert && (
        <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-6 py-3 rounded-lg shadow-lg animate-fade-in-out">
            {alertMessage}
          </div>
        </div>
      )}

      {submitconfirmpop && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.7)", // white with 50% opacity
          }}
        >
          <div className="bg-white rounded-lg p-6 w-[90%] max-w-md relative">
            {/* Close Icon */}

            {/* Popup Content */}
            <h2 className="text-xl text-black font-bold mb-4 text-center">
              CONFIRMATION
            </h2>
            <p className="text-gray-700 text-center mb-6">
              Are you sure you want to
              <span className="font-bold text-black"> SUBMIT </span> the surgery
              details?
            </p>

            {/* Buttons */}
            <div className="flex justify-center gap-4">
              <button
                onClick={handleSendremainder}
                className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-6 rounded cursor-pointer"
              >
                Yes
              </button>
              <button
                onClick={() => setsubmitconfirmpop(false)}
                className="bg-gray-300 hover:bg-gray-400 text-black font-semibold py-2 px-6 rounded cursor-pointer"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default page;
