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
      console.log("user from localStorage1 :", uid + " " + pass);

      if (uid !== "undefined" && pass !== "undefined") {
        console.log("user from localStorage 2:", uid + " " + pass);

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
    setLeftCurrentStatus(getCurrentPeriod("left"));
    setRightCurrentStatus(getCurrentPeriod("right"));
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

  const [selectedHospital, setselectedHospital] = useState("Parvathy Hopital");
  const hospitaloptions = ["Parvathy Hopital"];

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
  const operatingsurgeonoptions = ["DR. VETRI KUMAR M K", "DR. VINOTH"];

  const [firstassisstant, setfirstassisstant] = useState("DR. VINOTH");
  const firstassisstantoptions = ["DR. VETRI KUMAR M K", "DR. VINOTH"];

  const [secondassisstant, setsecondassisstant] = useState("DR. MILAN");
  const secondassisstantoptions = ["DR. VINOTH", "DR. MILAN"];

  const [manageproc, setmanagproc] = useState("");
  const procedureoptions = [
    "PRIMARY TKA",
    "PRIMARY UKA",
    "REVISION HTO TO TKA",
    "REVISION UKA TO TKA",
    "TKA TO REVISION TKA",
  ];

  const [surgindi, setsurgindi] = useState("");
  const surgindioptions = ["DEFORMITY", "VARUS", "VALGUS", "PF"];

  const [techassist, settechassist] = useState("");
  const techassistoptions = ["COMPUTER GUIDE", "ROBOTIC", "PSI"];

  const [alignphil, setalignphil] = useState("");
  const alignphiloptions = ["MA", "KA", "RKA", "FA", "IKA", "HYBRID"];

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

  const rowHeaders = ["MANUFACTURER", "MODEL", "SIZE"];
  const colHeaders = ["FEMUR", "TIBIA", "INSERT", "PATELLA"];

  const optionsData = {
    FEMUR: {
      MANUFACTURER: ["BIORD'S MEDISYS"],
      MODEL: {
        "BIORD'S MEDISYS": ["EXCEL MPK"],
      },
      SIZE: {
        "EXCEL MPK": ["A", "B", "C", "D", "E", "F", "G", "H"],
      },
    },
    TIBIA: {
      MANUFACTURER: ["BIORD'S MEDISYS"],
      MODEL: {
        "BIORD'S MEDISYS": ["EXCEL MPK"],
      },
      SIZE: {
        "EXCEL MPK": ["1", "2", "3", "4", "5", "6"],
      },
    },
    INSERT: {
      MANUFACTURER: ["BIORD'S MEDISYS"],
      MODEL: {
        "BIORD'S MEDISYS": ["EXCEL MPK"],
      },
      SIZE: {
        "EXCEL MPK": ["7 mm", "8 mm", "9 mm", "11 mm", "13 mm"],
      },
    },
    PATELLA: {
      MANUFACTURER: ["BIORD'S MEDISYS"],
      MODEL: {
        "BIORD'S MEDISYS": ["EXCEL MPK"],
      },
      SIZE: {
        "EXCEL MPK": ["26 mm", "28 mm", "32 mm", "36 mm"],
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

  const isoDate = patient?.post_surgery_details_left?.date_of_surgery;
  const istDate = new Date(isoDate);

  // Convert to IST and extract date
  const dateOnlyIST = istDate.toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearAllFields = () => {
    setselectedHospital("Parvathy Hopital");
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

    if (!isNonEmpty(payload.patuhid)) errors.patuhid = "UHID is required.";
    if (!isNonEmpty(payload.hospital_name))
      errors.hospital_name = "Hospital name is required.";
    if (!isNonEmpty(payload.anaesthetic_type))
      errors.anaesthetic_type = "Anaesthetic type is required.";
    if (!isNonEmpty(payload.asa_grade))
      errors.asa_grade = "ASA grade is required.";

    if (
      !payload.rom ||
      !Array.isArray(payload.rom) ||
      payload.rom.length === 0
    ) {
      errors.rom = "ROM details are required.";
    } else {
      const rom = payload.rom[0];
      if (!isNonEmpty(rom.period))
        errors.rom_period = "ROM period is required.";
      if (!isNonEmpty(rom.flexion))
        errors.rom_flexion = "ROM flexion is required.";
      if (!isNonEmpty(rom.extension))
        errors.rom_extension = "ROM extension is required.";
    }

    if (!isNonEmpty(payload.consultant_incharge))
      errors.consultant_incharge = "Consultant Incharge is required.";
    if (!isNonEmpty(payload.operating_surgeon))
      errors.operating_surgeon = "Operating Surgeon is required.";
    if (!isNonEmpty(payload.first_assistant))
      errors.first_assistant = "First Assistant is required.";
    if (!isNonEmpty(payload.second_assistant))
      errors.second_assistant = "Second Assistant is required.";
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
    if (!isNonEmpty(payload.op_name))
      errors.op_name = "Operation name is required.";

    if (!isValidDate(payload.op_date))
      errors.op_date = "Valid operation date (YYYY-MM-DD) is required.";
    if (!isValidTime(payload.op_time))
      errors.op_time = "Valid operative time (HH:MM) is required.";

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

    return errors;
  };

  const handleSendremainder = async () => {
    const payload = {
      patuhid: patient?.uhid,
      hospital_name: selectedHospital,
      anaesthetic_type: selected,
      asa_grade: asagrade,
      rom: [
        {
          period: "preop",
          flexion: preopflexion,
          extension: preopextension,
        },
      ],
      consultant_incharge: consultant,
      operating_surgeon: operatingsurgeon,
      first_assistant: firstassisstant,
      second_assistant: secondassisstant,
      mag_proc: manageproc,
      side: patient?.current_status,
      surgery_indication: surgindi,
      tech_assist: techassist,
      align_phil: alignphil,
      torq_used: toruused,
      op_name: patient?.post_surgery_details_left?.surgery_name,
      op_date: dateOnlyIST,
      op_time: optime,
      components_details: selectedValues,
      posting_timestamp: new Date().toISOString(),
    };
    // console.log("Surgery Data", payload);
    // return;
    setIsSubmitting(true); // 🔒 Lock submission

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
    const payload = {
      patuhid: patient?.uhid,
      hospital_name: selectedHospital,
      anaesthetic_type: selected,
      asa_grade: asagrade,
      rom: [
        {
          period: "preop",
          flexion: preopflexion,
          extension: preopextension,
        },
      ],
      consultant_incharge: consultant,
      operating_surgeon: operatingsurgeon,
      first_assistant: firstassisstant,
      second_assistant: secondassisstant,
      mag_proc: manageproc,
      side: patient?.current_status,
      surgery_indication: surgindi,
      tech_assist: techassist,
      align_phil: alignphil,
      torq_used: toruused,
      op_name: patient?.post_surgery_details_left?.surgery_name,
      op_date: dateOnlyIST,
      op_time: optime,
      components_details: selectedValues,
      posting_timestamp: new Date().toISOString(),
    };

    const errors = validatePayloadAndWarn(payload);
    const firstErrorKey = Object.keys(errors)[0];

    if (firstErrorKey) {
      showWarning(errors[firstErrorKey]); // Show specific field error
      return; // Stop submission
    }
    else{
    // handleSendremainder();
    setsubmitconfirmpop(true);
    }
  };

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
                  SELECT HOSPITAL *
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
                <td className="w-1/4 align-top font-bold">
                  ANAESTHETIC TYPES *
                </td>
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
                <td className="w-1/4 align-top font-bold">ASA GRADE *</td>
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
                <td className="w-1/4 align-middle font-bold">PRE OP - ROM *</td>
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
                <td className="w-1/3 align-middle">CONSULTANT IN-CHARGE *</td>
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
                <td className="w-1/4 align-middle">OPERATING SURGEON *</td>
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
                <td className="w-1/4 align-middle">FIRST ASSISTANT *</td>
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
                <td className="w-1/4 align-middle">SECOND ASSISTANT *</td>
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
                    {patient?.current_status?.includes("Left Knee") && (
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
                    {patient?.current_status?.includes("Right Knee") && (
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
                <td className="font-bold text-lg text-black w-1/4">
                  INDICATION OF SURGERY
                </td>
                <td>
                  <div className="flex flex-row text-black text-lg font-medium gap-8">
                    {surgindioptions.map((option, index) => (
                      <label
                        key={index}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="dynamicRadio4"
                          value={option}
                          checked={surgindi === option}
                          onChange={() => setsurgindi(option)}
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
                  OPERATIVE NAME
                </td>
                <td>
                  <div className="flex flex-row items-center gap-4">
                    <p className="text-black text-lg font-semibold">
                      {patient?.post_surgery_details_left?.surgery_name}
                    </p>
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
              {isSubmitting ? "ON PROGRESS..." : "SUBMIT"}
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
