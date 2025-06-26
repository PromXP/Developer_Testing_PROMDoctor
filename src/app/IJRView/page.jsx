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

const page = ({ goToReport, goToIJRAdd }) => {
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
  const [patientsurgery, setpatientsurgery] = useState(null);

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
            console.log("Patient set:", response.data.user);

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

  useEffect(() => {
    const fetchsurgery = async () => {
      console.log(
        "Fetching surgery with UHID:",
        sessionStorage.getItem("patientUHID")
      );

      if (!patient?.uhid) return;

      try {
        const res = await axios.get(
          `${API_URL}getsurgeryrecordspat?uhid=${patient.uhid}`
        );
        setpatientsurgery(res.data.surgery_records);
      } catch (err) {
        console.error("Failed to fetch patients", err);
      }
    };

    if (patient?.uhid) fetchsurgery();
  }, [patient?.uhid]);

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
    let value = e.target.value.replace(/\D/g, ""); // remove non-digits

    if (value.length > 4) value = value.slice(0, 4); // limit to 4 digits

    if (value.length >= 3) {
      value = value.slice(0, 2) + ":" + value.slice(2); // format as HH:MM
    }

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

  const isoDate = patientsurgery?.[0]?.op_date;
  const istDate = new Date(isoDate);

  // Convert to IST and extract date
  const dateOnlyIST = istDate.toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearAllFields = () => {};

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
    console.log("Surgery Data", payload);

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

  return (
    <div className="flex flex-col gap-8 p-8 ">
      <div className="flex flex-col md:flex-row w-full mx-auto items-center justify-between">
        <div
          className={`w-full rounded-lg flex ${width < 760 ? "py-0" : "py-4"}`}
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
                          : "w-1/3"
                      }`}
                    >
                      <p className="text-[#475467] font-semibold text-5">BMI</p>
                      <p className="text-[#04CE00] font-bold text-6">
                        {patient?.bmi}
                      </p>
                    </div>
                    <div
                      className={` flex flex-col gap-3 ${
                        width < 530
                          ? "justify-center items-center w-full"
                          : "w-1/3"
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
                    <div className="w-1/3 flex flex-row justify-start items-center">
                      <p
                        className=" rounded-full px-3 py-[1px] cursor-pointer text-center text-white text-lg font-semibold border-[#005585] border-2"
                        style={{ backgroundColor: "rgba(0, 85, 133, 0.9)" }}
                        onClick={() => {
                          goToReport(patient);
                        }}
                      >
                        VIEW PROM REPORT
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {patientsurgery?.[0] ? (
        <>
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
                    HOSPITAL NAME
                  </td>
                  <td className="w-fit">
                    <p className="text-black text-xl font-semibold">
                      {patientsurgery?.[0].hospital_name}
                    </p>
                  </td>
                </tr>

                {/* Anaesthetic Types */}
                <tr>
                  <td className="w-1/3 align-top font-bold">
                    ANAESTHETIC TYPES
                  </td>
                  <td>
                    <p className="text-black text-xl font-semibold">
                      {patientsurgery?.[0].anaesthetic_type}
                    </p>
                  </td>
                </tr>

                {/* ASA Grade */}
                <tr>
                  <td className="w-1/3 align-top font-bold">ASA GRADE</td>
                  <td>
                    <p className="text-black text-xl font-semibold">
                      {patientsurgery?.[0].asa_grade}
                    </p>
                  </td>
                </tr>

                {/* PRE OP ROM */}
                <tr>
                  <td className="w-1/3 align-middle font-bold">ROM</td>
                  <td>
                    <table className="w-5/6 border-separate border-spacing-y-4 text-xl ">
                      <thead className="font-semibold">
                        <tr>
                          <th className="text-left">Period</th>
                          <th className="text-left">Flexion</th>
                          <th className="text-left">Extension</th>
                        </tr>
                      </thead>
                      <tbody className="font-medium">
                        {patientsurgery?.[0].rom?.map((entry, index) => (
                          <tr key={index}>
                            <td className="">{entry.period}</td>
                            <td className="">{entry.flexion}</td>
                            <td className="">{entry.extension}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex flex-col">
            <div>
              <p className="text-black text-3xl font-semibold">
                SURGEON DETAILS
              </p>
            </div>
            <table className="w-full text-black text-lg font-semibold border-separate border-spacing-y-8">
              <tbody>
                {/* CONSULTANT IN-CHARGE row */}
                <tr className="items-center">
                  <td className="w-1/3 align-middle">CONSULTANT IN-CHARGE</td>
                  <td>
                    <p className="text-black text-xl font-semibold">
                      {patientsurgery?.[0].consultant_incharge}
                    </p>
                  </td>
                </tr>

                {/* OPERATING SURGEON row */}
                <tr className="items-center">
                  <td className="w-1/4 align-middle">OPERATING SURGEON</td>
                  <td>
                    <p className="text-black text-xl font-semibold">
                      {patientsurgery?.[0].operating_surgeon}
                    </p>
                  </td>
                </tr>

                {/* FIRST ASSISTANT row */}
                <tr className="items-center">
                  <td className="w-1/4 align-middle">FIRST ASSISTANT</td>
                  <td>
                    <p className="text-black text-xl font-semibold">
                      {patientsurgery?.[0].first_assistant}
                    </p>
                  </td>
                </tr>

                {/* SECOND ASSISTANT row */}
                <tr className="items-center">
                  <td className="w-1/4 align-middle">SECOND ASSISTANT</td>
                  <td>
                    <p className="text-black text-xl font-semibold">
                      {patientsurgery?.[0].second_assistant}
                    </p>
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
            <p className="text-black text-xl font-semibold">
              {patientsurgery?.[0].mag_proc}
            </p>
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
                      {patientsurgery?.[0].side?.includes("Left Knee") && (
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
                      {patientsurgery?.[0].side?.includes("Right Knee") && (
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
                    <p className="text-black text-xl font-semibold">
                      {patientsurgery?.[0].surgery_indication}
                    </p>
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
                    <p className="text-black text-xl font-semibold">
                      {patientsurgery?.[0].tech_assist}
                    </p>
                  </td>
                </tr>

                {/* ALIGNMENT PHILOSOPHY Row */}
                <tr className="align-middle">
                  <td className="font-bold text-lg text-black w-1/4">
                    ALLIGNMENT PHILOSOPHY
                  </td>
                  <td>
                    <p className="text-black text-xl font-semibold">
                      {patientsurgery?.[0].align_phil}
                    </p>
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
                    <p className="text-black text-xl font-semibold">
                      {patientsurgery?.[0].torq_used}
                    </p>
                  </td>
                </tr>

                <tr className="align-middle">
                  <td className="font-bold text-lg text-black w-1/3">
                    SUGERY NAME
                  </td>
                  <td>
                    <p className="text-black text-xl font-semibold">
                      {patientsurgery?.[0].op_name}
                    </p>
                  </td>
                </tr>

                <tr className="align-middle">
                  <td className="font-bold text-lg text-black w-1/4">
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
                    <p className="text-black text-xl font-semibold">
                      {patientsurgery?.[0].op_time}
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-12">
            <div>
              <p className="text-black text-3xl font-semibold">
                BONE RESECTION
              </p>
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
                      {patientsurgery?.[0].bone_resection.acl}
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

            <div className="w-full h-96 flex flex-row text-black text-sm ">
              {/* Left image */}
              <div className="w-1/3 flex justify-center">
                <Image
                  src={Medialcondyle}
                  alt="Medial Condyle"
                  className="w-2/3 h-full"
                />
              </div>

              {/* Right content */}
              <table className="w-2/3 text-black text-lg border-separate border-spacing-y-2">
                <tbody>
                  {/* Heading */}
                  <tr>
                    <td colSpan="3" className="text-lg font-bold pb-2">
                      MEDIAL CONDYLE
                    </td>
                  </tr>

                  {/* Wear Selection */}
                  <tr>
                    <td colSpan="1">
                      {patientsurgery?.[0].bone_resection.distal_medial.wear}
                    </td>
                  </tr>

                  {/* INITIAL THICKNESS */}
                  <tr>
                    <td className="font-semibold w-1/4">INITIAL THICKNESS</td>
                    <td className="w-1/4">
                      {
                        patientsurgery?.[0].bone_resection.distal_medial
                          .intial_thickness
                      }
                      mm
                    </td>
                  </tr>

                  {/* RECUT */}
                  <tr>
                    <td className="font-semibold">RECUT</td>
                    <td>
                      {patientsurgery?.[0].bone_resection.distal_medial.recut}
                    </td>
                    <td>
                      {
                        patientsurgery?.[0].bone_resection.distal_medial
                          .recutvalue
                      }
                      mm
                    </td>
                  </tr>

                  {/* WASHER */}
                  <tr>
                    <td className="font-semibold">WASHER</td>
                    <td>
                      {patientsurgery?.[0].bone_resection.distal_medial.washer}
                    </td>
                    <td>
                      {
                        patientsurgery?.[0].bone_resection.distal_medial
                          .washervalue
                      }
                      mm
                    </td>
                  </tr>

                  {/* FINAL THICKNESS */}
                  <tr>
                    <td className="font-semibold">FINAL THICKNESS</td>
                    <td>
                      {
                        patientsurgery?.[0].bone_resection.distal_medial
                          .final_thickness
                      }
                      mm
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="w-full h-96 flex flex-row text-black text-sm ">
              {/* Left image */}
              <div className="w-1/3 flex justify-center">
                <Image
                  src={Lateralcondyle}
                  alt="Medial Condyle"
                  className="w-2/3 h-full"
                />
              </div>

              {/* Right content */}
              <table className="w-2/3 text-black text-lg border-separate border-spacing-y-2">
                <tbody>
                  {/* Heading */}
                  <tr>
                    <td colSpan="3" className="text-lg font-bold pb-2">
                      LATERAL CONDYLE
                    </td>
                  </tr>

                  {/* LATERAL SECTION */}

                  {/* Wear Selection */}
                  <tr>
                    <td colSpan="1">
                      {patientsurgery?.[0].bone_resection.distal_lateral.wear}
                    </td>
                  </tr>

                  {/* INITIAL THICKNESS */}
                  <tr>
                    <td className="font-semibold w-1/4">INITIAL THICKNESS</td>
                    <td>
                      {
                        patientsurgery?.[0].bone_resection.distal_lateral
                          .intial_thickness
                      }
                      mm
                    </td>
                  </tr>

                  {/* RECUT */}
                  <tr>
                    <td className="font-semibold">RECUT</td>
                    <td className="w-1/4">
                      {patientsurgery?.[0].bone_resection.distal_lateral.recut}
                    </td>
                    <td>
                      {
                        patientsurgery?.[0].bone_resection.distal_lateral
                          .recutvalue
                      }
                      mm
                    </td>
                  </tr>

                  {/* WASHER */}
                  <tr>
                    <td className="font-semibold">WASHER</td>
                    <td>
                      {patientsurgery?.[0].bone_resection.distal_lateral.washer}
                    </td>
                    <td>
                      {
                        patientsurgery?.[0].bone_resection.distal_lateral
                          .washervalue
                      }
                      mm
                    </td>
                  </tr>

                  {/* FINAL THICKNESS */}
                  <tr>
                    <td className="font-semibold">FINAL THICKNESS</td>
                    <td>
                      {
                        patientsurgery?.[0].bone_resection.distal_lateral
                          .final_thickness
                      }
                      mm
                    </td>
                  </tr>
                </tbody>
              </table>
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

            <div className="w-full h-96 flex flex-row  text-black text-sm ">
              {/* Left image */}
              <div className="w-1/3 flex justify-center">
                <Image
                  src={Medialcondylepost}
                  alt="Medial Condyle"
                  className="w-2/3 h-full"
                />
              </div>

              {/* Right content */}
              <table className="w-2/3 text-black text-lg border-separate border-spacing-y-2">
                <tbody>
                  {/* Heading */}
                  <tr>
                    <td colSpan="3" className="text-lg font-bold pb-2">
                      MEDIAL CONDYLE
                    </td>
                  </tr>

                  {/* Wear Selection */}
                  <tr>
                    <td colSpan="1">
                      {patientsurgery?.[0].bone_resection.posterial_medial.wear}
                    </td>
                  </tr>

                  {/* INITIAL THICKNESS */}
                  <tr>
                    <td className="font-semibold w-1/4">INITIAL THICKNESS</td>
                    <td>
                      {
                        patientsurgery?.[0].bone_resection.posterial_medial
                          .intial_thickness
                      }
                      mm
                    </td>
                  </tr>

                  {/* RECUT */}
                  <tr>
                    <td className="font-semibold">RECUT</td>
                    <td className="w-1/4">
                      {
                        patientsurgery?.[0].bone_resection.posterial_medial
                          .recut
                      }
                    </td>
                    <td>
                      {
                        patientsurgery?.[0].bone_resection.posterial_medial
                          .recutvalue
                      }
                      mm
                    </td>
                  </tr>

                  {/* FINAL THICKNESS */}
                  <tr>
                    <td className="font-semibold">FINAL THICKNESS</td>
                    <td>
                      {
                        patientsurgery?.[0].bone_resection.posterial_medial
                          .final_thickness
                      }
                      mm
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="w-full h-96 flex flex-row  text-black text-sm ">
              {/* Left image */}
              <div className="w-1/3 flex justify-center">
                <Image
                  src={Lateralcondylepost}
                  alt="Medial Condyle"
                  className="w-2/3 h-full"
                />
              </div>

              {/* Right content */}
              <table className="w-2/3 text-black text-lg border-separate border-spacing-y-2">
                <tbody>
                  {/* Heading */}
                  <tr>
                    <td colSpan="3" className="text-lg font-bold pb-2">
                      LATERAL CONDYLE
                    </td>
                  </tr>

                  {/* Wear Selection */}
                  <tr>
                    <td colSpan="1">
                      {
                        patientsurgery?.[0].bone_resection.posterial_lateral
                          .wear
                      }
                    </td>
                  </tr>

                  {/* INITIAL THICKNESS */}
                  <tr>
                    <td className="font-semibold w-1/4">INITIAL THICKNESS</td>
                    <td className="w-1/4">
                      {
                        patientsurgery?.[0].bone_resection.posterial_lateral
                          .intial_thickness
                      }
                      mm
                    </td>
                  </tr>

                  {/* RECUT */}
                  <tr>
                    <td className="font-semibold">RECUT</td>
                    <td>
                      {
                        patientsurgery?.[0].bone_resection.posterial_lateral
                          .recut
                      }
                    </td>
                    <td>
                      {
                        patientsurgery?.[0].bone_resection.posterial_lateral
                          .recutvalue
                      }
                      mm
                    </td>
                  </tr>

                  {/* FINAL THICKNESS */}
                  <tr>
                    <td className="font-semibold">FINAL THICKNESS</td>
                    <td>
                      {
                        patientsurgery?.[0].bone_resection.posterial_lateral
                          .final_thickness
                      }
                      mm
                    </td>
                  </tr>
                </tbody>
              </table>
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
                        <strong>Target:</strong> Equal Thickness measured at
                        Base of Tibial Spines
                      </p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="w-3/4 flex justify-center items-center">
              <div className="w-2/3 flex flex-row justify-center">
                <table className="w-1/5 text-black text-lg border-separate border-spacing-y-0">
                  <tbody>
                    {/* TIBIAL LEFT WEAR: UNWORN */}
                    <tr>
                      <td colSpan="1" className="text-lg font-bold pb-2">
                        {
                          patientsurgery?.[0].bone_resection
                            .tibial_resection_left.wear
                        }
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
                    <tr>
                      <td className="h-4"></td>
                    </tr>

                    {/* TIBIAL LEFT MEASUREMENT */}
                    <tr>
                      <td>
                        {
                          patientsurgery?.[0].bone_resection
                            .tibial_resection_left.value
                        }
                        mm
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

                <table className="w-1/5 text-black text-lg border-separate border-spacing-y-0">
                  <tbody>
                    {/* TIBIAL RIGHT - WEAR: UNWORN */}
                    <tr>
                      <td colSpan="1" className="text-lg font-bold pb-2">
                        {
                          patientsurgery?.[0].bone_resection
                            .tibial_resection_right.wear
                        }
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
                    <tr>
                      <td className="h-4"></td>
                    </tr>

                    {/* TIBIAL RIGHT - MEASUREMENT */}
                    <tr>
                      <td>
                        {
                          patientsurgery?.[0].bone_resection
                            .tibial_resection_right.value
                        }
                        mm
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
                      {patientsurgery?.[0].bone_resection.pcl}
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
                    {patientsurgery?.[0].bone_resection.tibialvvrecut.vvrecut}
                  </td>
                  <td className="text-lg">
                    {
                      patientsurgery?.[0].bone_resection.tibialvvrecut
                        .vvrecutvalue
                    }
                    deg
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
                    {
                      patientsurgery?.[0].bone_resection.tibialsloperecut
                        .sloperecut
                    }
                  </td>
                  <td className="text-lg">
                    {
                      patientsurgery?.[0].bone_resection.tibialsloperecut
                        .sloperecutvalue
                    }
                    deg
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="w-1/2 flex text-lg flex-col text-black gap-4">
              <p className="font-bold w-full">
                FINAL CHECK WITH SPACER BLOCK AND TRIAL COMPONENTS
              </p>

              {patientsurgery?.[0].bone_resection.final_check}
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[800px] table-auto w-full text-sm text-black border-separate border-spacing-y-8">
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
                  {patientsurgery?.[0].bone_resection.thickness_table.map(
                    (row, idx) => (
                      <tr key={idx} className="align-middle">
                        {/* INSERT THICKNESS */}
                        <td className="p-2 font-bold text-lg">
                          {row.thickness} mm
                        </td>

                        {/* NO. OF TICKS */}
                        <td className="p-2 text-lg font-medium">
                          {row.numOfTicks}
                        </td>

                        {/* EXTENSION EXT. ORIENT. */}
                        <td className="p-2 text-lg font-medium">
                          {row.extensionExtOrient}{" "}
                          <span className="ml-1">DEGREES</span>
                        </td>

                        {/* 90° FLEXION INT. ORIENT. */}
                        <td className="p-2 text-lg font-medium">
                          {row.flexionIntOrient}{" "}
                          <span className="ml-1">DEGREES</span>
                        </td>

                        {/* LIFT–OFF */}
                        <td className="p-2 text-lg font-medium">
                          {row.liftOff}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            <table className="w-full border-separate border-spacing-y-0 text-black">
              <tbody>
                <tr className="align-middle">
                  <td className="font-bold text-lg text-black w-1/3">
                    FEMUR SIZE
                  </td>
                  <td className="font-medium text-lg text-black">
                    {patientsurgery?.[0].bone_resection.femur_size.size}
                  </td>
                  <td>
                    <div className="flex flex-row text-black text-lg font-medium gap-8">
                      {patientsurgery?.[0].bone_resection.femur_size.shape}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td colSpan="2" className="h-8"></td>
                </tr>
                <tr className="align-middle">
                  <td className="font-bold text-lg text-black w-1/3">
                    TIBIAL SIZE
                  </td>
                  <td className="font-medium text-lg text-black">
                    {patientsurgery?.[0].bone_resection.tibial_size}
                  </td>
                </tr>
                <tr>
                  <td colSpan="2" className="h-8"></td>
                </tr>
                <tr className="align-middle">
                  <td className="font-bold text-lg text-black w-1/3">
                    INSERT THICKNESS
                  </td>
                  <td className="font-medium text-lg text-black">
                    {patientsurgery?.[0].bone_resection.insert_thickness.size}
                  </td>
                  <td>
                    <div className="flex flex-row text-black text-lg font-medium gap-8">
                      {
                        patientsurgery?.[0].bone_resection.insert_thickness
                          .shape
                      }
                    </div>
                  </td>
                </tr>
                <tr>
                  <td colSpan="2" className="h-8"></td>
                </tr>
                <tr className="align-middle">
                  <td className="font-bold text-lg text-black w-1/3">
                    PATELLA SIZE
                  </td>

                  <td className="font-medium text-lg text-black">
                    {patientsurgery?.[0].bone_resection.patella_size}
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
                        className=" px-3 py-2 text-black font-bold text-lg text-left"
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
                          <p className="w-full px-2 py-1 text-black font-medium text-lg rounded">
                            {patientsurgery?.[0].components_details[col][row] ||
                              "N/A"}
                          </p>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="w-full flex flex-col justify-center items-center gap-8">
          <p className="text-red-500 text-2xl font-bold">
            NO SURGERY DATA AVAILABLE
          </p>
          <div className=" flex flex-row justify-start items-center">
            <p
              className=" rounded-full px-3 py-[1px] cursor-pointer text-center text-white text-lg font-semibold border-[#006400] border-2"
              style={{ backgroundColor: "rgba(0, 128, 0, 0.9)" }}
              onClick={() => {
                goToIJRAdd(patient);
              }}
            >
              ADD SURGERY DETAILS
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default page;
