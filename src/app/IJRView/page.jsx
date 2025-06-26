"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Image from "next/image";

import { API_URL } from "../libs/global";

import {
  ChevronRightIcon,
  ArrowUpRightIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PencilIcon,
  CheckCircleIcon,
  PencilSquareIcon,
  ChevronLeftIcon,
  ClipboardDocumentCheckIcon,
  XMarkIcon,
} from "@heroicons/react/16/solid";

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

  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const showWarning = (message) => {
    setAlertMessage(message);
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 4000);
  };

  const [isEdithospital, setisEdithospital] = useState(false);
  const [selectedHospital, setselectedHospital] = useState("Parvathy Hopital");
  const hospitaloptions = ["Parvathy Hopital"];
  const handlehospitalchange = () => {
    if (!selectedHospital) {
      showWarning("Hospital Required");
      return;
    }

    const payload = {
      uhid: patient?.uhid,
      updates: {
        hospital_name: selectedHospital,
      },
    };

    handleSendremainder(payload);
  };

  const [isEditanaesthetic, setisEditanaesthetic] = useState(false);
  const [selectedanaesthetic, setselectedanaesthetic] = useState("");
  const anaestheticoptions = [
    "GENERAL",
    "NERVE BLOCK",
    "EPIDURAL",
    "SPINAL (INTRATHECAL)",
  ];
  const handleanaestheticchange = () => {
    if (!selectedanaesthetic) {
      showWarning("Anaesthetic type Required");
      return;
    }

    const payload = {
      uhid: patient?.uhid,
      updates: {
        anaesthetic_type: selectedanaesthetic,
      },
    };

    handleSendremainder(payload);
  };

  const [isEditasagrade, setisEditasagrade] = useState(false);
  const [asagrade, setasagrade] = useState("");
  const asagradeoptions = ["1", "2", "3", "4", "5"];
  const handleasagradechange = () => {
    if (!asagrade) {
      showWarning("ASA grade Required");
      return;
    }

    const payload = {
      uhid: patient?.uhid,
      updates: {
        asa_grade: asagrade,
      },
    };

    handleSendremainder(payload);
  };

  const [editedRom, setEditedRom] = useState([]);
  const [originalRom, setOriginalRom] = useState([]);
  const [editingRomIndex, setEditingRomIndex] = useState(null);

  useEffect(() => {
    const romData = patientsurgery?.[0]?.rom || [];
    setEditedRom([...romData]); // editable copy
    setOriginalRom([...romData]); // original reference
  }, [patientsurgery]);

  const updateRomField = (index, field, value) => {
    const updated = [...editedRom];
    updated[index] = { ...updated[index], [field]: value }; // safe copy
    setEditedRom(updated);
  };

  const handleRomSave = async (index) => {
    const updatedEntry = editedRom[index];

    if (
      !updatedEntry.period ||
      !updatedEntry.flexion ||
      !updatedEntry.extension
    ) {
      alert("All fields are required.");
      return;
    }

    const payload = {
      uhid: patientsurgery?.[0]?.patuhid,
      updates: {
        rom: [updatedEntry],
      },
    };

    handleSendremainder(payload);
  };

  const handleRomCancel = (index) => {
    const reverted = [...editedRom];
    reverted[index] = { ...originalRom[index] }; // ❗ Restore old value
    setEditedRom(reverted);
    setEditingRomIndex(null);
  };

  const [isEditconsultant, setisEditconsultant] = useState(false);
  const [consultant, setconsultant] = useState("DR. VETRI KUMAR M K");
  const consultantoptions = ["DR. VETRI KUMAR M K"];
  const handleconsultantchange = () => {
    if (!consultant) {
      showWarning("Consultant Required");
      return;
    }

    const payload = {
      uhid: patient?.uhid,
      updates: {
        consultant_incharge: consultant,
      },
    };

    handleSendremainder(payload);
  };

  const [isEditoperatingsurgeon, setisEditoperatingsurgeon] = useState(false);
  const [operatingsurgeon, setoperatingsurgeon] = useState(
    "DR. VETRI KUMAR M K"
  );
  const operatingsurgeonoptions = ["DR. VETRI KUMAR M K", "DR. VINOTH"];
  const handleoperatingsurgeonchange = () => {
    if (!operatingsurgeon) {
      showWarning("Operation surgeon Required");
      return;
    }

    const payload = {
      uhid: patient?.uhid,
      updates: {
        operating_surgeon: operatingsurgeon,
      },
    };

    handleSendremainder(payload);
  };

  const [isEditfirstassisstant, setisEditfirstassisstant] = useState(false);
  const [firstassisstant, setfirstassisstant] = useState("DR. VINOTH");
  const firstassisstantoptions = ["DR. VETRI KUMAR M K", "DR. VINOTH"];
  const handlefirstassisstantchange = () => {
    if (!firstassisstant) {
      showWarning("First Assistant Required");
      return;
    }

    const payload = {
      uhid: patient?.uhid,
      updates: {
        first_assistant: firstassisstant,
      },
    };

    handleSendremainder(payload);
  };

  const [isEditsecondassisstant, setisEditsecondassisstant] = useState(false);
  const [secondassisstant, setsecondassisstant] = useState("DR. MILAN");
  const secondassisstantoptions = ["DR. VINOTH", "DR. MILAN"];
  const handlesecondassisstantchange = () => {
    if (!secondassisstant) {
      showWarning("Second Assistant Required");
      return;
    }

    const payload = {
      uhid: patient?.uhid,
      updates: {
        second_assistant: secondassisstant,
      },
    };

    handleSendremainder(payload);
  };

  const [isEditmanageproc, setisEditmanageproc] = useState(false);
  const [manageproc, setmanagproc] = useState("");
  const procedureoptions = [
    "PRIMARY TKA",
    "PRIMARY UKA",
    "REVISION HTO TO TKA",
    "REVISION UKA TO TKA",
    "TKA TO REVISION TKA",
  ];
  const handlemanageprocchange = () => {
    if (!manageproc) {
      showWarning("Manage Procedures Required");
      return;
    }

    const payload = {
      uhid: patient?.uhid,
      updates: {
        mag_proc: manageproc,
      },
    };

    handleSendremainder(payload);
  };

  const [isEditknees, setisEditknees] = useState(false);
  const [selectedKnees, setSelectedKnees] = useState([]); // e.g., ["left", "right"]
  const toggleKnee = (knee) => {
    setSelectedKnees((prev) =>
      prev.includes(knee) ? prev.filter((k) => k !== knee) : [...prev, knee]
    );
  };
  const handlekneechange = () => {
    if (selectedKnees.length === 0) {
      showWarning("Side Required");
      return;
    }

    const payload = {
      uhid: patient?.uhid,
      updates: {
        side: selectedKnees.join(", "),
      },
    };

    handleSendremainder(payload);
  };

  const [isEditsurgindi, setisEditsurgindi] = useState(false);
  const [surgindi, setsurgindi] = useState("");
  const surgindioptions = ["DEFORMITY", "VARUS", "VALGUS", "PF"];
  const handlesurgindichange = () => {
    if (!surgindi) {
      showWarning("Indication of Surgery Required");
      return;
    }

    const payload = {
      uhid: patient?.uhid,
      updates: {
        surgery_indication: surgindi,
      },
    };

    handleSendremainder(payload);
  };

  const [isEdittechassit, setisEdittechassit] = useState(false);
  const [techassist, settechassist] = useState("");
  const techassistoptions = ["COMPUTER GUIDE", "ROBOTIC", "PSI"];
  const handletechassistchange = () => {
    if (!techassist) {
      showWarning("Technological Assistance Required");
      return;
    }

    const payload = {
      uhid: patient?.uhid,
      updates: {
        tech_assist: techassist,
      },
    };

    handleSendremainder(payload);
  };

  const [isEditalignphil, setisEditalignphil] = useState(false);
  const [alignphil, setalignphil] = useState("");
  const alignphiloptions = ["MA", "KA", "RKA", "FA", "IKA", "HYBRID"];
  const handlealignphilchange = () => {
    if (!alignphil) {
      showWarning("Allignment Philosophy Required");
      return;
    }

    const payload = {
      uhid: patient?.uhid,
      updates: {
        align_phil: alignphil,
      },
    };

    handleSendremainder(payload);
  };

  const [isEdittoruused, setisEdittoruused] = useState(false);
  const [toruused, settourused] = useState("");
  const tourusedoptions = ["Yes", "No"];
  const handletorusedchange = () => {
    if (!toruused) {
      showWarning("Tourniquet Used Required");
      return;
    }

    const payload = {
      uhid: patient?.uhid,
      updates: {
        torq_used: toruused,
      },
    };

    handleSendremainder(payload);
  };

  const [isEditopname, setisEditopname] = useState(false);
  const [opname, setopname] = useState("");
  const handleChangeopname = (event) => {
    setopname(event.target.value);
  };
  const handleopnamechange = () => {
    if (!opname) {
      showWarning("Surgery Name Required");
      return;
    }

    const payload = {
      uhid: patient?.uhid,
      updates: {
        op_name: opname,
      },
    };

    handleSendremainder(payload);
  };

  const [isEditopdate, setisEditopdate] = useState(false);
  const [surgerydate, setsurgeryDate] = useState("");
  const handleManualsurgeryDateChange = (e) => {
    let value = e.target.value.replace(/\D/g, ""); // Remove all non-digits

    if (value.length >= 3 && value.length <= 4) {
      value = value.slice(0, 2) + "-" + value.slice(2);
    } else if (value.length > 4 && value.length <= 8) {
      value =
        value.slice(0, 2) + "-" + value.slice(2, 4) + "-" + value.slice(4);
    } else if (value.length > 8) {
      value = value.slice(0, 8);
      value =
        value.slice(0, 2) + "-" + value.slice(2, 4) + "-" + value.slice(4);
    }

    // Until full date entered, show raw value
    setsurgeryDate(value);

    if (value.length === 10) {
      const [dayStr, monthStr, yearStr] = value.split("-");
      const day = parseInt(dayStr, 10);
      const month = parseInt(monthStr, 10);
      const year = parseInt(yearStr, 10);

      const today = new Date();
      const currentYear = today.getFullYear();

      // Basic validations
      if (day < 1 || day > 31 || month < 1 || month > 12) {
        showWarning("Please enter a valid surgery date");
        setS("");
        return;
      }

      // Check valid real date
      const manualDate = new Date(`${year}-${month}-${day}`);
      if (
        manualDate.getDate() !== day ||
        manualDate.getMonth() + 1 !== month ||
        manualDate.getFullYear() !== year
      ) {
        showWarning("Invalid date combination. Please enter a correct date.");
        setsurgeryDate("");
        return;
      }

      // Check if future or today
      today.setHours(0, 0, 0, 0);
      manualDate.setHours(0, 0, 0, 0);

      // If all valid, format as "dd Mmm yyyy"
      const formattedDate = manualDate.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "numeric",
        year: "numeric",
      });

      // Final validated date components
      const isoDate = `${year.toString().padStart(4, "0")}-${month
        .toString()
        .padStart(2, "0")}-${day.toString().padStart(2, "0")}`;

      setsurgeryDate(isoDate); // This avoids time zone issues
    }
  };
  const handleopdatechange = () => {
    if (!surgerydate) {
      showWarning("Surgery Date Required");
      return;
    }

    const payload = {
      uhid: patient?.uhid,
      updates: {
        op_date: surgerydate,
      },
    };

    handleSendremainder(payload);
  };

  const [isEditoptime, setisEditoptime] = useState(false);
  const [optime, setoptime] = useState("");
  const handleOptimeChange = (e) => {
    let value = e.target.value.replace(/\D/g, ""); // remove non-digits

    if (value.length > 4) value = value.slice(0, 4); // limit to 4 digits

    if (value.length >= 3) {
      value = value.slice(0, 2) + ":" + value.slice(2); // format as HH:MM
    }

    setoptime(value);
  };
  const handleoptimechange = () => {
    if (!optime) {
      showWarning("Surgery Time Required");
      return;
    }

    const payload = {
      uhid: patient?.uhid,
      updates: {
        op_time: optime,
      },
    };

    handleSendremainder(payload);
  };
  // ACL CONDITION
  const [aclcondition, setACLCondition] = useState("");
  const aclconditionoptions = ["INTACT", "TORN", "RECONSTRUCTED"];
  const [isEditACL, setIsEditACL] = useState(false);

  const handleACLChange = (e) => setACLCondition(e.target.value);

  const handleACLSave = () => {
    if (!aclcondition) return showWarning("ACL Condition is required");
    const payload = {
      uhid: patient?.uhid,
      updates: {
        "bone_resection.acl": aclcondition,
      },
    };
    handleSendremainder(payload);
    setIsEditACL(false);
  };

  // PCL CONDITION
  const [pclcondition, setPCLCondition] = useState("");
  const pclconditionoptions = ["INTACT", "TORN", "EXCISED"];
  const [isEditPCL, setIsEditPCL] = useState(false);

  const handlePCLChange = (e) => setPCLCondition(e.target.value);

  const handlePCLSave = () => {
    if (!pclcondition) return showWarning("PCL Condition is required");
    const payload = {
      uhid: patient?.uhid,
      updates: {
        "bone_resection.pcl": pclcondition,
      },
    };
    handleSendremainder(payload);
    setIsEditPCL(false);
  };

  // WEAR STATUS
  const [wearStatus, setWearStatus] = useState("");
  const [isEditWearStatus, setIsEditWearStatus] = useState(false);

  const handleWearStatusChange = (e) => setWearStatus(e.target.value);

  const handleWearStatusSave = () => {
    if (!wearStatus) return showWarning("Wear status is required");
    const payload = {
      uhid: patient?.uhid,
      updates: {
        "bone_resection.distal_medial.wear": wearStatus,
      },
    };
    handleSendremainder(payload);
    setIsEditWearStatus(false);
  };

  // DISTAL MEDIAL INITIAL THICKNESS
  const [distalmedialinithick, setDistalMedialInitThick] = useState("");
  const [isEditInitThick, setIsEditInitThick] = useState(false);

  const handleInitThickChange = (e) => setDistalMedialInitThick(e.target.value);

  const handleInitThickSave = () => {
    if (!distalmedialinithick)
      return showWarning("Initial thickness is required");
    const payload = {
      uhid: patient?.uhid,
      updates: {
        "bone_resection.distal_medial.initial_thickness": distalmedialinithick,
      },
    };
    handleSendremainder(payload);
    setIsEditInitThick(false);
  };

  // DISTAL MEDIAL RECUT
  const [distalmedialrecutyn, setDistalMedialRecutYN] = useState("");
  const [isEditRecutYN, setIsEditRecutYN] = useState(false);

  const handleRecutYNChange = (e) => setDistalMedialRecutYN(e.target.value);

  const handleRecutYNSave = () => {
    if (!distalmedialrecutyn) return showWarning("Recut status is required");
    const payload = {
      uhid: patient?.uhid,
      updates: {
        "bone_resection.distal_medial.recut": distalmedialrecutyn,
      },
    };
    handleSendremainder(payload);
    setIsEditRecutYN(false);
  };

  // DISTAL MEDIAL RECUT VALUE
  const [distalmedialrecutvalue, setDistalMedialRecutValue] = useState("");
  const [isEditRecutValue, setIsEditRecutValue] = useState(false);

  const handleRecutValueChange = (e) =>
    setDistalMedialRecutValue(e.target.value);

  const handleRecutValueSave = () => {
    if (!distalmedialrecutvalue) return showWarning("Recut value is required");
    const payload = {
      uhid: patient?.uhid,
      updates: {
        "bone_resection.distal_medial.recutvalue": distalmedialrecutvalue,
      },
    };
    handleSendremainder(payload);
    setIsEditRecutValue(false);
  };

  // DISTAL MEDIAL WASHER
  const [distalmedialwasheryn, setDistalMedialWasherYN] = useState("");
  const [isEditWasherYN, setIsEditWasherYN] = useState(false);

  const handleWasherYNChange = (e) => setDistalMedialWasherYN(e.target.value);

  const handleWasherYNSave = () => {
    if (!distalmedialwasheryn) return showWarning("Washer status is required");
    const payload = {
      uhid: patient?.uhid,
      updates: {
        "bone_resection.distal_medial.washer": distalmedialwasheryn,
      },
    };
    handleSendremainder(payload);
    setIsEditWasherYN(false);
  };

  // DISTAL MEDIAL WASHER VALUE
  const [distalmedialwashervalue, setDistalMedialWasherValue] = useState("");
  const [isEditWasherValue, setIsEditWasherValue] = useState(false);

  const handleWasherValueChange = (e) =>
    setDistalMedialWasherValue(e.target.value);

  const handleWasherValueSave = () => {
    if (!distalmedialwashervalue)
      return showWarning("Washer value is required");
    const payload = {
      uhid: patient?.uhid,
      updates: {
        "bone_resection.distal_medial.washervalue": distalmedialwashervalue,
      },
    };
    handleSendremainder(payload);
    setIsEditWasherValue(false);
  };

  // DISTAL MEDIAL FINAL THICKNESS
  const [distalmedialfinalthick, setDistalMedialFinalThick] = useState("");
  const [isEditFinalThick, setIsEditFinalThick] = useState(false);

  const handleFinalThickChange = (e) =>
    setDistalMedialFinalThick(e.target.value);

  const handleFinalThickSave = () => {
    if (!distalmedialfinalthick)
      return showWarning("Final thickness is required");
    const payload = {
      uhid: patient?.uhid,
      updates: {
        "bone_resection.distal_medial.final_thickness": distalmedialfinalthick,
      },
    };
    handleSendremainder(payload);
    setIsEditFinalThick(false);
  };

  const [isEditWearStatusLat, setIsEditWearStatusLat] = useState(false);
  const [wearStatusLat, setWearStatusLat] = useState("");
  const handleChangeWearStatusLat = (e) => setWearStatusLat(e.target.value);

  const [isEditDistalLateralInitThick, setIsEditDistalLateralInitThick] =
    useState(false);
  const [originalDistalLateralInitThick, setOriginalDistalLateralInitThick] =
    useState("");
  const [distalLateralInitThick, setDistalLateralInitThick] = useState("");
  const handleInputDistalLateralInitThick = (e) =>
    setDistalLateralInitThick(e.target.value);

  const [isEditDistalLateralRecutYN, setIsEditDistalLateralRecutYN] =
    useState(false);
  const [originalDistalLateralRecutYN, setOriginalDistalLateralRecutYN] =
    useState("");
  const [distalLateralRecutYN, setDistalLateralRecutYN] = useState("");
  const handleInputDistalLateralRecutYN = (e) =>
    setDistalLateralRecutYN(e.target.value);

  const [isEditDistalLateralRecutValue, setIsEditDistalLateralRecutValue] =
    useState(false);
  const [originalDistalLateralRecutValue, setOriginalDistalLateralRecutValue] =
    useState("");
  const [distalLateralRecutValue, setDistalLateralRecutValue] = useState("");
  const handleInputDistalLateralRecutValue = (e) =>
    setDistalLateralRecutValue(e.target.value);

  const [isEditDistalLateralWasherYN, setIsEditDistalLateralWasherYN] =
    useState(false);
  const [originalDistalLateralWasherYN, setOriginalDistalLateralWasherYN] =
    useState("");
  const [distalLateralWasherYN, setDistalLateralWasherYN] = useState("");
  const handleInputDistalLateralWasherYN = (e) =>
    setDistalLateralWasherYN(e.target.value);

  const [isEditDistalLateralWasherValue, setIsEditDistalLateralWasherValue] =
    useState(false);
  const [
    originalDistalLateralWasherValue,
    setOriginalDistalLateralWasherValue,
  ] = useState("");
  const [distalLateralWasherValue, setDistalLateralWasherValue] = useState("");
  const handleInputDistalLateralWasherValue = (e) =>
    setDistalLateralWasherValue(e.target.value);

  const [isEditDistalLateralFinalThick, setIsEditDistalLateralFinalThick] =
    useState(false);
  const [originalDistalLateralFinalThick, setOriginalDistalLateralFinalThick] =
    useState("");
  const [distalLateralFinalThick, setDistalLateralFinalThick] = useState("");
  const handleInputDistalLateralFinalThick = (e) =>
    setDistalLateralFinalThick(e.target.value);

  const [isEditPostMedialWear, setIsEditPostMedialWear] = useState(false);
  const [originalPostMedialWear, setOriginalPostMedialWear] = useState("");
  const [postMedialWear, setPostMedialWear] = useState("");
  const handlePostMedialWearChange = (e) => setPostMedialWear(e.target.value);

  const [isEditPostMedialInitThick, setIsEditPostMedialInitThick] =
    useState(false);
  const [originalPostMedialInitThick, setOriginalPostMedialInitThick] =
    useState("");
  const [postMedialInitThick, setPostMedialInitThick] = useState("");
  const handlePostMedialInitThickChange = (e) =>
    setPostMedialInitThick(e.target.value);

  const [isEditPostMedialRecutYN, setIsEditPostMedialRecutYN] = useState(false);
  const [originalPostMedialRecutYN, setOriginalPostMedialRecutYN] =
    useState("");
  const [postMedialRecutYN, setPostMedialRecutYN] = useState("");
  const handlePostMedialRecutYNChange = (e) =>
    setPostMedialRecutYN(e.target.value);

  const [isEditPostMedialRecutValue, setIsEditPostMedialRecutValue] =
    useState(false);
  const [originalPostMedialRecutValue, setOriginalPostMedialRecutValue] =
    useState("");
  const [postMedialRecutValue, setPostMedialRecutValue] = useState("");
  const handlePostMedialRecutValueChange = (e) =>
    setPostMedialRecutValue(e.target.value);

  const [isEditPostMedialFinalThick, setIsEditPostMedialFinalThick] =
    useState(false);
  const [originalPostMedialFinalThick, setOriginalPostMedialFinalThick] =
    useState("");
  const [postMedialFinalThick, setPostMedialFinalThick] = useState("");
  const handlePostMedialFinalThickChange = (e) =>
    setPostMedialFinalThick(e.target.value);

  const [isEditPostLateralWear, setIsEditPostLateralWear] = useState(false);
  const [originalPostLateralWear, setOriginalPostLateralWear] = useState("");
  const [postLateralWear, setPostLateralWear] = useState("");
  const handlePostLateralWearChange = (e) => setPostLateralWear(e.target.value);

  const [isEditPostLateralInitThick, setIsEditPostLateralInitThick] =
    useState(false);
  const [originalPostLateralInitThick, setOriginalPostLateralInitThick] =
    useState("");
  const [postLateralInitThick, setPostLateralInitThick] = useState("");
  const handlePostLateralInitThickChange = (e) =>
    setPostLateralInitThick(e.target.value);

  const [isEditPostLateralRecutYN, setIsEditPostLateralRecutYN] =
    useState(false);
  const [originalPostLateralRecutYN, setOriginalPostLateralRecutYN] =
    useState("");
  const [postLateralRecutYN, setPostLateralRecutYN] = useState("");
  const handlePostLateralRecutYNChange = (e) =>
    setPostLateralRecutYN(e.target.value);

  const [isEditPostLateralRecutValue, setIsEditPostLateralRecutValue] =
    useState(false);
  const [originalPostLateralRecutValue, setOriginalPostLateralRecutValue] =
    useState("");
  const [postLateralRecutValue, setPostLateralRecutValue] = useState("");
  const handlePostLateralRecutValueChange = (e) =>
    setPostLateralRecutValue(e.target.value);

  const [isEditPostLateralFinalThick, setIsEditPostLateralFinalThick] =
    useState(false);
  const [originalPostLateralFinalThick, setOriginalPostLateralFinalThick] =
    useState("");
  const [postLateralFinalThick, setPostLateralFinalThick] = useState("");
  const handlePostLateralFinalThickChange = (e) =>
    setPostLateralFinalThick(e.target.value);

  const handleWearStatusLatSave = () => {
    if (!wearStatusLat) return showWarning("Wear status is required");
    const payload = {
      uhid: patient?.uhid,
      updates: {
        "bone_resection.distal_lateral.wear": wearStatusLat,
      },
    };
    handleSendremainder(payload);
    setIsEditWearStatusLat(false);
  };

  const handleDistalLateralInitThickSave = () => {
    if (!distalLateralInitThick)
      return showWarning("Initial thickness is required");
    const payload = {
      uhid: patient?.uhid,
      updates: {
        "bone_resection.distal_lateral.initial_thickness":
          distalLateralInitThick,
      },
    };
    handleSendremainder(payload);
    setIsEditDistalLateralInitThick(false);
  };

  const handleDistalLateralRecutYNSave = () => {
    if (!distalLateralRecutYN) return showWarning("Recut (Yes/No) is required");
    const payload = {
      uhid: patient?.uhid,
      updates: {
        "bone_resection.distal_lateral.recut": distalLateralRecutYN,
      },
    };
    handleSendremainder(payload);
    setIsEditDistalLateralRecutYN(false);
  };

  const handleDistalLateralRecutValueSave = () => {
    if (!distalLateralRecutValue) return showWarning("Recut value is required");
    const payload = {
      uhid: patient?.uhid,
      updates: {
        "bone_resection.distal_lateral.recutvalue": distalLateralRecutValue,
      },
    };
    handleSendremainder(payload);
    setIsEditDistalLateralRecutValue(false);
  };

  const handleDistalLateralWasherYNSave = () => {
    if (!distalLateralWasherYN)
      return showWarning("Washer (Yes/No) is required");
    const payload = {
      uhid: patient?.uhid,
      updates: {
        "bone_resection.distal_lateral.washer": distalLateralWasherYN,
      },
    };
    handleSendremainder(payload);
    setIsEditDistalLateralWasherYN(false);
  };

  const handleDistalLateralWasherValueSave = () => {
    if (!distalLateralWasherValue)
      return showWarning("Washer value is required");
    const payload = {
      uhid: patient?.uhid,
      updates: {
        "bone_resection.distal_lateral.washervalue": distalLateralWasherValue,
      },
    };
    handleSendremainder(payload);
    setIsEditDistalLateralWasherValue(false);
  };

  const handleDistalLateralFinalThickSave = () => {
    if (!distalLateralFinalThick)
      return showWarning("Final thickness is required");
    const payload = {
      uhid: patient?.uhid,
      updates: {
        "bone_resection.distal_lateral.final_thickness":
          distalLateralFinalThick,
      },
    };
    handleSendremainder(payload);
    setIsEditDistalLateralFinalThick(false);
  };

  const handlePostMedialWearSave = () => {
    if (!postMedialWear) return showWarning("Wear is required");
    const payload = {
      uhid: patient?.uhid,
      updates: {
        "bone_resection.posterial_medial.wear": postMedialWear,
      },
    };
    handleSendremainder(payload);
    setIsEditPostMedialWear(false);
  };

  const handlePostMedialInitThickSave = () => {
    if (!postMedialInitThick)
      return showWarning("Initial thickness is required");
    const payload = {
      uhid: patient?.uhid,
      updates: {
        "bone_resection.posterial_medial.initial_thickness":
          postMedialInitThick,
      },
    };
    handleSendremainder(payload);
    setIsEditPostMedialInitThick(false);
  };

  const handlePostMedialRecutYNSave = () => {
    if (!postMedialRecutYN) return showWarning("Recut (Yes/No) is required");
    const payload = {
      uhid: patient?.uhid,
      updates: {
        "bone_resection.posterial_medial.recut": postMedialRecutYN,
      },
    };
    handleSendremainder(payload);
    setIsEditPostMedialRecutYN(false);
  };

  const handlePostMedialRecutValueSave = () => {
    if (!postMedialRecutValue) return showWarning("Recut value is required");
    const payload = {
      uhid: patient?.uhid,
      updates: {
        "bone_resection.posterial_medial.recutvalue": postMedialRecutValue,
      },
    };
    handleSendremainder(payload);
    setIsEditPostMedialRecutValue(false);
  };

  const handlePostMedialFinalThickSave = () => {
    if (!postMedialFinalThick)
      return showWarning("Final thickness is required");
    const payload = {
      uhid: patient?.uhid,
      updates: {
        "bone_resection.posterial_medial.final_thickness": postMedialFinalThick,
      },
    };
    handleSendremainder(payload);
    setIsEditPostMedialFinalThick(false);
  };

  const handlePostLateralWearSave = () => {
    if (!postLateralWear) return showWarning("Wear is required");
    const payload = {
      uhid: patient?.uhid,
      updates: {
        "bone_resection.posterial_lateral.wear": postLateralWear,
      },
    };
    handleSendremainder(payload);
    setIsEditPostLateralWear(false);
  };

  const handlePostLateralInitThickSave = () => {
    if (!postLateralInitThick)
      return showWarning("Initial thickness is required");
    const payload = {
      uhid: patient?.uhid,
      updates: {
        "bone_resection.posterial_lateral.initial_thickness":
          postLateralInitThick,
      },
    };
    handleSendremainder(payload);
    setIsEditPostLateralInitThick(false);
  };

  const handlePostLateralRecutYNSave = () => {
    if (!postLateralRecutYN) return showWarning("Recut (Yes/No) is required");
    const payload = {
      uhid: patient?.uhid,
      updates: {
        "bone_resection.posterial_lateral.recut": postLateralRecutYN,
      },
    };
    handleSendremainder(payload);
    setIsEditPostLateralRecutYN(false);
  };

  const handlePostLateralRecutValueSave = () => {
    if (!postLateralRecutValue) return showWarning("Recut value is required");
    const payload = {
      uhid: patient?.uhid,
      updates: {
        "bone_resection.posterial_lateral.recutvalue": postLateralRecutValue,
      },
    };
    handleSendremainder(payload);
    setIsEditPostLateralRecutValue(false);
  };

  const handlePostLateralFinalThickSave = () => {
    if (!postLateralFinalThick)
      return showWarning("Final thickness is required");
    const payload = {
      uhid: patient?.uhid,
      updates: {
        "bone_resection.posterial_lateral.final_thickness":
          postLateralFinalThick,
      },
    };
    handleSendremainder(payload);
    setIsEditPostLateralFinalThick(false);
  };

  const [isEditTibialLeftWear, setIsEditTibialLeftWear] = useState(false);
  const [originalTibialLeftWear, setOriginalTibialLeftWear] = useState("");
  const [tibialLeftWear, setTibialLeftWear] = useState("");
  const handleTibialLeftWearChange = (e) => setTibialLeftWear(e.target.value);

  const handleTibialLeftWearSave = () => {
    if (!tibialLeftWear) return showWarning("Tibial Left Wear is required");
    const payload = {
      uhid: patient?.uhid,
      updates: {
        "bone_resection.tibial_resection_left.wear": tibialLeftWear,
      },
    };
    handleSendremainder(payload);
    setIsEditTibialLeftWear(false);
  };

  const [isEditTibialLeftValue, setIsEditTibialLeftValue] = useState(false);
  const [originalTibialLeftValue, setOriginalTibialLeftValue] = useState("");
  const [tibialLeftValue, setTibialLeftValue] = useState("");
  const handleTibialLeftValueChange = (e) => setTibialLeftValue(e.target.value);

  const handleTibialLeftValueSave = () => {
    if (!tibialLeftValue) return showWarning("Tibial Left Value is required");
    const payload = {
      uhid: patient?.uhid,
      updates: {
        "bone_resection.tibial_resection_left.value": tibialLeftValue,
      },
    };
    handleSendremainder(payload);
    setIsEditTibialLeftValue(false);
  };

  const [isEditTibialRightWear, setIsEditTibialRightWear] = useState(false);
  const [originalTibialRightWear, setOriginalTibialRightWear] = useState("");
  const [tibialRightWear, setTibialRightWear] = useState("");
  const handleTibialRightWearChange = (e) => setTibialRightWear(e.target.value);

  const handleTibialRightWearSave = () => {
    if (!tibialRightWear) return showWarning("Tibial Right Wear is required");
    const payload = {
      uhid: patient?.uhid,
      updates: {
        "bone_resection.tibial_resection_right.wear": tibialRightWear,
      },
    };
    handleSendremainder(payload);
    setIsEditTibialRightWear(false);
  };

  const [isEditTibialRightValue, setIsEditTibialRightValue] = useState(false);
  const [originalTibialRightValue, setOriginalTibialRightValue] = useState("");
  const [tibialRightValue, setTibialRightValue] = useState("");
  const handleTibialRightValueChange = (e) =>
    setTibialRightValue(e.target.value);

  const handleTibialRightValueSave = () => {
    if (!tibialRightValue) return showWarning("Tibial Right Value is required");
    const payload = {
      uhid: patient?.uhid,
      updates: {
        "bone_resection.tibial_resection_right.value": tibialRightValue,
      },
    };
    handleSendremainder(payload);
    setIsEditTibialRightValue(false);
  };

  const [isEditTibialVVRecutYN, setIsEditTibialVVRecutYN] = useState(false);
  const [originalTibialVVRecutYN, setOriginalTibialVVRecutYN] = useState("");
  const [tibialVVRecutYN, setTibialVVRecutYN] = useState("");
  const handleTibialVVRecutYNChange = (e) => setTibialVVRecutYN(e.target.value);

  const handleTibialVVRecutYNSave = () => {
    if (!tibialVVRecutYN)
      return showWarning("Tibial VV Recut (Yes/No) is required");
    const payload = {
      uhid: patient?.uhid,
      updates: {
        "bone_resection.tibialvvrecut.vvrecut": tibialVVRecutYN,
      },
    };
    handleSendremainder(payload);
    setIsEditTibialVVRecutYN(false);
  };

  const [isEditTibialVVRecutValue, setIsEditTibialVVRecutValue] =
    useState(false);
  const [originalTibialVVRecutValue, setOriginalTibialVVRecutValue] =
    useState("");
  const [tibialVVRecutValue, setTibialVVRecutValue] = useState("");
  const handleTibialVVRecutValueChange = (e) =>
    setTibialVVRecutValue(e.target.value);

  const handleTibialVVRecutValueSave = () => {
    if (!tibialVVRecutValue)
      return showWarning("Tibial VV Recut Value is required");
    const payload = {
      uhid: patient?.uhid,
      updates: {
        "bone_resection.tibialvvrecut.vvrecutvalue": tibialVVRecutValue,
      },
    };
    handleSendremainder(payload);
    setIsEditTibialVVRecutValue(false);
  };

  const [isEditTibialSlopeRecutYN, setIsEditTibialSlopeRecutYN] =
    useState(false);
  const [originalTibialSlopeRecutYN, setOriginalTibialSlopeRecutYN] =
    useState("");
  const [tibialSlopeRecutYN, setTibialSlopeRecutYN] = useState("");
  const handleTibialSlopeRecutYNChange = (e) =>
    setTibialSlopeRecutYN(e.target.value);

  const handleTibialSlopeRecutYNSave = () => {
    if (!tibialSlopeRecutYN)
      return showWarning("Tibial Slope Recut (Yes/No) is required");
    const payload = {
      uhid: patient?.uhid,
      updates: {
        "bone_resection.tibialsloperecut.sloperecut": tibialSlopeRecutYN,
      },
    };
    handleSendremainder(payload);
    setIsEditTibialSlopeRecutYN(false);
  };

  const [isEditTibialSlopeRecutValue, setIsEditTibialSlopeRecutValue] =
    useState(false);
  const [originalTibialSlopeRecutValue, setOriginalTibialSlopeRecutValue] =
    useState("");
  const [tibialSlopeRecutValue, setTibialSlopeRecutValue] = useState("");
  const handleTibialSlopeRecutValueChange = (e) =>
    setTibialSlopeRecutValue(e.target.value);

  const handleTibialSlopeRecutValueSave = () => {
    if (!tibialSlopeRecutValue)
      return showWarning("Tibial Slope Recut Value is required");
    const payload = {
      uhid: patient?.uhid,
      updates: {
        "bone_resection.tibialsloperecut.sloperecutvalue":
          tibialSlopeRecutValue,
      },
    };
    handleSendremainder(payload);
    setIsEditTibialSlopeRecutValue(false);
  };

  // FINAL CHECK
  const [isEditFinalCheck, setIsEditFinalCheck] = useState(false);
  const [originalFinalCheck, setOriginalFinalCheck] = useState("");
  const [finalCheck, setFinalCheck] = useState("");
  const handleFinalCheckChange = (e) => setFinalCheck(e.target.value);

  const handleFinalCheckSave = () => {
    if (!finalCheck) return showWarning("Final Check is required");
    const payload = {
      uhid: patient?.uhid,
      updates: {
        "bone_resection.final_check": finalCheck,
      },
    };
    handleSendremainder(payload);
    setIsEditFinalCheck(false);
  };

  // FEMUR SIZE
  const [isEditFemurShape, setIsEditFemurShape] = useState(false);
  const [originalFemurShape, setOriginalFemurShape] = useState("");
  const [femurShape, setFemurShape] = useState("");
  const femursizeoptions = ["SPHERIKA", "SPHERIKA ST", "SPHERE"];
  const handleFemurShapeChange = (e) => setFemursize(e.target.value);

  const handleFemurShapeSave = () => {
    if (!femurShape) return showWarning("Femur Shape is required");
    const payload = {
      uhid: patient?.uhid,
      updates: {
        "bone_resection.femur_size.shape": femurShape,
      },
    };
    handleSendremainder(payload);
    setIsEditFemurShape(false);
  };

  // INSERT THICKNESS
  const [isEditInsertThickness, setIsEditInsertThickness] = useState(false);
  const [originalInsertThickness, setOriginalInsertThickness] = useState("");
  const [insertthickness, setInsertthickness] = useState("");
  const insertthicknessoptions = ["CR", "Vit E CR/CS", "CS"];
  const handleInsertThicknessChange = (e) => setInsertthickness(e.target.value);

  const handleInsertThicknessSave = () => {
    if (!insertthickness) return showWarning("Insert Thickness is required");
    const payload = {
      uhid: patient?.uhid,
      updates: {
        "bone_resection.insert_thickness.shape": insertthickness,
      },
    };
    handleSendremainder(payload);
    setIsEditInsertThickness(false);
  };

  // Femor Size
  const [isEditFemorSize, setIsEditFemorSize] = useState(false);
  const [originalFemorSize, setOriginalFemorSize] = useState("");
  const [femorSize, setFemorSize] = useState("");
  const handleFemorSizeChange = (e) => setFemorSize(e.target.value);

  const handleFemorSizeSave = () => {
    if (!femorSize) return showWarning("Femor Size is required");
    const payload = {
      uhid: patient?.uhid,
      updates: {
        "bone_resection.femur_size.size": femorSize,
      },
    };
    handleSendremainder(payload);
    setIsEditFemorSize(false);
  };

  // Tibial Size
  const [isEditTibialSize, setIsEditTibialSize] = useState(false);
  const [originalTibialSize, setOriginalTibialSize] = useState("");
  const [tibialSize, setTibialSize] = useState("");
  const handleTibialSizeChange = (e) => setTibialSize(e.target.value);

  const handleTibialSizeSave = () => {
    if (!tibialSize) return showWarning("Tibial Size is required");
    const payload = {
      uhid: patient?.uhid,
      updates: {
        "bone_resection.tibial_size": tibialSize,
      },
    };
    handleSendremainder(payload);
    setIsEditTibialSize(false);
  };

  // Insert Thickness
  const [isEditInsertThicknesssize, setIsEditInsertThicknesssize] =
    useState(false);
  const [originalInsertThicknesssize, setOriginalInsertThicknesssize] =
    useState("");
  const [insertThicknesssize, setInsertThicknesssize] = useState("");
  const handleInsertThicknesssizeChange = (e) =>
    setInsertThicknesssize(e.target.value);

  const handleInsertThicknesssizeSave = () => {
    if (!insertThicknesssize)
      return showWarning("Insert Thickness is required");
    const payload = {
      uhid: patient?.uhid,
      updates: {
        "bone_resection.insert_thickness.size": insertThicknesssize,
      },
    };
    handleSendremainder(payload);
    setIsEditInsertThicknesssize(false);
  };

  // Patella Size
  const [isEditPatellaSize, setIsEditPatellaSize] = useState(false);
  const [originalPatellaSize, setOriginalPatellaSize] = useState("");
  const [patellaSize, setPatellaSize] = useState("");
  const handlePatellaSizeChange = (e) => setPatellaSize(e.target.value);

  const handlePatellaSizeSave = () => {
    if (!patellaSize) return showWarning("Patella Size is required");
    const payload = {
      uhid: patient?.uhid,
      updates: {
        "bone_resection.patella_size": patellaSize,
      },
    };
    handleSendremainder(payload);
    setIsEditPatellaSize(false);
  };

  const [editingIndex, setEditingIndex] = useState(null);
  const [editedThicknessTable, setEditedThicknessTable] = useState([]);

  // Initialize editedThicknessTable when patientsurgery changes
  useEffect(() => {
    if (patientsurgery?.[0]?.bone_resection?.thickness_table) {
      setEditedThicknessTable(
        patientsurgery[0].bone_resection.thickness_table.map((row) => ({
          ...row,
        }))
      );
    }
  }, [patientsurgery]);

  const handleFieldChange = (idx, field, value) => {
    const updated = [...editedThicknessTable];
    updated[idx] = { ...updated[idx], [field]: value };
    setEditedThicknessTable(updated);
  };

  const handleEdit = (idx) => {
    setEditingIndex(idx);
  };

  const handleCancel = () => {
    // Revert edits by resetting from patientsurgery
    setEditedThicknessTable(
      patientsurgery[0].bone_resection.thickness_table.map((row) => ({
        ...row,
      }))
    );
    setEditingIndex(null);
  };

  const handleSave = async (idx) => {
    const row = editedThicknessTable[idx];

    // Basic validation example (adjust as needed)
    if (
      row.numOfTicks === "" ||
      row.extensionExtOrient === "" ||
      row.flexionIntOrient === "" ||
      row.liftOff === ""
    ) {
      return showWarning("All fields except Thickness are required.");
    }

    // Construct update payload
    // Assuming whole table is updated for simplicity; you can update just one row if backend supports
    const payload = {
      uhid: patient?.uhid,
      updates: {
        "bone_resection.thickness_table": editedThicknessTable,
      },
    };

    handleSendremainder(payload);
    setEditingIndex(null);
  };

  const colHeaders = ["FEMUR", "TIBIA", "INSERT", "PATELLA"];
  const rowHeaders = ["MANUFACTURER", "MODEL", "SIZE"];

  const options = {
    FEMUR: {
      MICROPORT: {
        EVOLUTION: ["1", "2", "3", "4", "5"],
        MODEL_A: ["2", "3", "4"],
      },
      "BIORAD MEDISYS": {
        EVOLUTION: ["1", "2"],
        MODEL_B: ["3", "4", "5"],
      },
    },
    TIBIA: {
      MICROPORT: {
        EVOLUTION: ["1", "2", "3", "4", "5"],
        MODEL_A: ["2", "3", "4"],
      },
      "BIORAD MEDISYS": {
        EVOLUTION: ["1", "2"],
        MODEL_B: ["3", "4", "5"],
      },
    },
    INSERT: {
      MICROPORT: {
        EVOLUTION: ["10 mm", "12 mm", "14 mm", "16 mm"],
        MODEL_A: ["12 mm", "14 mm"],
      },
      "BIORAD MEDISYS": {
        EVOLUTION: ["10 mm", "12 mm"],
        MODEL_B: ["14 mm", "16 mm"],
      },
    },
    PATELLA: {
      MICROPORT: {
        EVOLUTION: ["1", "2", "3", "4", "5"],
        MODEL_A: ["2", "3", "4"],
      },
      "BIORAD MEDISYS": {
        EVOLUTION: ["1", "2"],
        MODEL_B: ["3", "4", "5"],
      },
    },
  };

  const [editedComponents, setEditedComponents] = useState({});
  const [editingCol, setEditingCol] = useState(null);

  useEffect(() => {
    if (patientsurgery?.[0]?.components_details) {
      const copy = {};
      colHeaders.forEach((col) => {
        copy[col] = { ...patientsurgery[0].components_details[col] };
      });
      setEditedComponents(copy);
      setEditingCol(null);
    }
  }, [patientsurgery]);

  const handleCellChange = (col, row, value) => {
    setEditedComponents((prev) => {
      let updatedCol = { ...prev[col], [row]: value };

      // If manufacturer changed, clear model and size for that col
      if (row === "MANUFACTURER") {
        updatedCol.MODEL = "";
        updatedCol.SIZE = "";
      }

      // If model changed, clear size for that col
      if (row === "MODEL") {
        updatedCol.SIZE = "";
      }

      return { ...prev, [col]: updatedCol };
    });
  };

  const handleSaveColumn = async (col) => {
    for (const row of rowHeaders) {
      if (!editedComponents[col]?.[row]) {
        showWarning(`Field ${col} - ${row} cannot be empty.`);
        return;
      }
    }

    const payload = {
      uhid: patient?.uhid,
      updates: {
        [`components_details.${col}`]: editedComponents[col],
      },
    };

    await handleSendremainder(payload);
    setEditingCol(null);
  };

  const handleCancelColumn = (col) => {
    if (patientsurgery?.[0]?.components_details) {
      setEditedComponents((prev) => ({
        ...prev,
        [col]: { ...patientsurgery[0].components_details[col] },
      }));
    }
    setEditingCol(null);
  };

  const isoDate = patientsurgery?.[0]?.op_date;
  const istDate = new Date(isoDate);

  // Convert to IST and extract date
  const dateOnlyIST = istDate.toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearAllFields = () => {};

  const handleSendremainder = async (payload) => {
    setIsSubmitting(true); // 🔒 Lock submission

    try {
      const response = await fetch(`${API_URL}updatepatientsurgeryrecord`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to send data: ${errorText}`);
      }

      const result = await response.json();
      console.log("Submission successful:", result);
      showWarning("Data Successfully Modified");
    } catch (error) {
      console.error("Error submitting data:", error);
      showWarning("Submission failed. Please try again.");
    } finally {
      setIsSubmitting(false); // 🔓 Unlock submission
      window.location.reload(); // 🔁 Force reload if needed
    }
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
                            : "w-1/3"
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
                      {isEdithospital ? (
                        <div className="flex flex-row gap-2">
                          <select
                            id="dropdown"
                            value={selectedHospital}
                            onChange={(e) =>
                              setselectedHospital(e.target.value)
                            }
                            className="w-1/2 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            {hospitaloptions.map((hospital, index) => (
                              <option key={index} value={hospital}>
                                {hospital}
                              </option>
                            ))}
                          </select>
                          <div className="flex gap-1">
                            <button
                              onClick={handlehospitalchange}
                              className="text-green-600 text-xs cursor-pointer"
                            >
                              <ClipboardDocumentCheckIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => {
                                setisEdithospital(false);
                                setselectedHospital("Parvathy Hopital");
                              }}
                              className="text-red-600 text-xs cursor-pointer"
                            >
                              <XMarkIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-row gap-2">
                          <p className="text-black text-xl font-semibold">
                            {patientsurgery?.[0].hospital_name}
                          </p>
                          <button
                            onClick={() => {
                              setisEdithospital(true);
                            }}
                            className="text-gray-400 hover:text-gray-600 cursor-pointer"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>

                  {/* Anaesthetic Types */}
                  <tr>
                    <td className="w-1/3 align-top font-bold">
                      ANAESTHETIC TYPES
                    </td>
                    <td>
                      {isEditanaesthetic ? (
                        <div className="flex flex-row gap-2">
                          <div className="flex flex-wrap gap-6">
                            {anaestheticoptions.map((option, index) => (
                              <label
                                key={index}
                                className="flex items-center gap-2 cursor-pointer"
                              >
                                <input
                                  type="radio"
                                  name="dynamicRadio1"
                                  value={option}
                                  checked={selectedanaesthetic === option}
                                  onChange={() =>
                                    setselectedanaesthetic(option)
                                  }
                                  className="form-radio text-blue-600"
                                />
                                <span>{option}</span>
                              </label>
                            ))}
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={handleanaestheticchange}
                              className="text-green-600 text-xs cursor-pointer"
                            >
                              <ClipboardDocumentCheckIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => {
                                setisEditanaesthetic(false);
                                setselectedanaesthetic("");
                              }}
                              className="text-red-600 text-xs cursor-pointer"
                            >
                              <XMarkIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-row gap-2">
                          <p className="text-black text-xl font-semibold">
                            {patientsurgery?.[0].anaesthetic_type}
                          </p>
                          <button
                            onClick={() => {
                              setisEditanaesthetic(true);
                            }}
                            className="text-gray-400 hover:text-gray-600 cursor-pointer"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>

                  {/* ASA Grade */}
                  <tr>
                    <td className="w-1/3 align-top font-bold">ASA GRADE</td>
                    <td>
                      {isEditasagrade ? (
                        <div className="flex flex-row gap-2">
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
                          <div className="flex gap-1">
                            <button
                              onClick={handleasagradechange}
                              className="text-green-600 text-xs cursor-pointer"
                            >
                              <ClipboardDocumentCheckIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => {
                                setisEditasagrade(false);
                                setasagrade("");
                              }}
                              className="text-red-600 text-xs cursor-pointer"
                            >
                              <XMarkIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-row gap-2">
                          <p className="text-black text-xl font-semibold">
                            {patientsurgery?.[0].asa_grade}
                          </p>
                          <button
                            onClick={() => {
                              setisEditasagrade(true);
                            }}
                            className="text-gray-400 hover:text-gray-600 cursor-pointer"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>

                  {/* PRE OP ROM */}
                  <tr>
                    <td className="w-1/3 align-middle font-bold">ROM</td>
                    <td>
                      <table className="w-5/6 border-separate border-spacing-y-4 text-xl">
                        <thead className="font-semibold">
                          <tr>
                            <th className="text-left">Period</th>
                            <th className="text-left">Flexion</th>
                            <th className="text-left">Extension</th>
                            <th className="text-left">Action</th>
                          </tr>
                        </thead>
                        <tbody className="font-medium">
                          {editedRom.map((entry, index) => (
                            <tr key={index}>
                              {editingRomIndex === index ? (
                                <>
                                  <td>
                                    <input
                                      value={entry.period}
                                      onChange={(e) =>
                                        updateRomField(
                                          index,
                                          "period",
                                          e.target.value
                                        )
                                      }
                                    />
                                  </td>
                                  <td>
                                    <input
                                      value={entry.flexion}
                                      onChange={(e) =>
                                        updateRomField(
                                          index,
                                          "flexion",
                                          e.target.value
                                        )
                                      }
                                    />
                                  </td>
                                  <td>
                                    <input
                                      value={entry.extension}
                                      onChange={(e) =>
                                        updateRomField(
                                          index,
                                          "extension",
                                          e.target.value
                                        )
                                      }
                                    />
                                  </td>
                                  <td className="flex gap-4">
                                    <button
                                      onClick={() => handleRomSave(index)}
                                      className="cursor-pointer text-green-600"
                                    >
                                      <ClipboardDocumentCheckIcon className="w-5 h-5" />
                                    </button>
                                    <button
                                      onClick={() => handleRomCancel(index)}
                                      className="cursor-pointer text-red-600"
                                    >
                                      <XMarkIcon className="w-5 h-5" />
                                    </button>
                                  </td>
                                </>
                              ) : (
                                <>
                                  <td>{entry.period}</td>
                                  <td>{entry.flexion}</td>
                                  <td>{entry.extension}</td>
                                  <td>
                                    <button
                                      onClick={() => setEditingRomIndex(index)}
                                      className="cursor-pointer"
                                    >
                                      <PencilIcon className="w-4 h-4" />
                                    </button>
                                  </td>
                                </>
                              )}
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
                      {isEditconsultant ? (
                        <div className="flex flex-row gap-2">
                          <select
                            id="dropdown"
                            value={consultant}
                            onChange={(e) => setconsultant(e.target.value)}
                            className="w-1/2 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            {consultantoptions.map((consultant, index) => (
                              <option key={index} value={consultant}>
                                {consultant}
                              </option>
                            ))}
                          </select>
                          <div className="flex gap-1">
                            <button
                              onClick={handleconsultantchange}
                              className="text-green-600 text-xs cursor-pointer"
                            >
                              <ClipboardDocumentCheckIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => {
                                setisEditconsultant(false);
                                setconsultant("DR. VETRI KUMAR M K");
                              }}
                              className="text-red-600 text-xs cursor-pointer"
                            >
                              <XMarkIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-row gap-2">
                          <p className="text-black text-xl font-semibold">
                            {patientsurgery?.[0].consultant_incharge}
                          </p>
                          <button
                            onClick={() => {
                              setisEditconsultant(true);
                            }}
                            className="text-gray-400 hover:text-gray-600 cursor-pointer"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>

                  {/* OPERATING SURGEON row */}
                  <tr className="items-center">
                    <td className="w-1/4 align-middle">OPERATING SURGEON</td>
                    <td>
                      {isEditoperatingsurgeon ? (
                        <div className="flex flex-row gap-2">
                          <select
                            id="dropdown"
                            value={operatingsurgeon}
                            onChange={(e) =>
                              setoperatingsurgeon(e.target.value)
                            }
                            className="w-1/2 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            {operatingsurgeonoptions.map((surgeon, index) => (
                              <option key={index} value={surgeon}>
                                {surgeon}
                              </option>
                            ))}
                          </select>
                          <div className="flex gap-1">
                            <button
                              onClick={handleoperatingsurgeonchange}
                              className="text-green-600 text-xs cursor-pointer"
                            >
                              <ClipboardDocumentCheckIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => {
                                setisEditoperatingsurgeon(false);
                                setoperatingsurgeon("DR. VETRI KUMAR M K");
                              }}
                              className="text-red-600 text-xs cursor-pointer"
                            >
                              <XMarkIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-row gap-2">
                          <p className="text-black text-xl font-semibold">
                            {patientsurgery?.[0].operating_surgeon}
                          </p>
                          <button
                            onClick={() => {
                              setisEditoperatingsurgeon(true);
                            }}
                            className="text-gray-400 hover:text-gray-600 cursor-pointer"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>

                  {/* FIRST ASSISTANT row */}
                  <tr className="items-center">
                    <td className="w-1/4 align-middle">FIRST ASSISTANT</td>
                    <td>
                      {isEditfirstassisstant ? (
                        <div className="flex flex-row gap-2">
                          <select
                            id="dropdown"
                            value={firstassisstant}
                            onChange={(e) => setfirstassisstant(e.target.value)}
                            className="w-1/2 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            {firstassisstantoptions.map(
                              (firstassisstant, index) => (
                                <option key={index} value={firstassisstant}>
                                  {firstassisstant}
                                </option>
                              )
                            )}
                          </select>
                          <div className="flex gap-1">
                            <button
                              onClick={handlefirstassisstantchange}
                              className="text-green-600 text-xs cursor-pointer"
                            >
                              <ClipboardDocumentCheckIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => {
                                setisEditfirstassisstant(false);
                                setfirstassisstant("DR. VINOTH");
                              }}
                              className="text-red-600 text-xs cursor-pointer"
                            >
                              <XMarkIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-row gap-2">
                          <p className="text-black text-xl font-semibold">
                            {patientsurgery?.[0].first_assistant}
                          </p>
                          <button
                            onClick={() => {
                              setisEditfirstassisstant(true);
                            }}
                            className="text-gray-400 hover:text-gray-600 cursor-pointer"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>

                  {/* SECOND ASSISTANT row */}
                  <tr className="items-center">
                    <td className="w-1/4 align-middle">SECOND ASSISTANT</td>
                    <td>
                      {isEditsecondassisstant ? (
                        <div className="flex flex-row gap-2">
                          <select
                            id="dropdown"
                            value={secondassisstant}
                            onChange={(e) =>
                              setsecondassisstant(e.target.value)
                            }
                            className="w-1/2 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            {secondassisstantoptions.map(
                              (secondassisstant, index) => (
                                <option key={index} value={secondassisstant}>
                                  {secondassisstant}
                                </option>
                              )
                            )}
                          </select>
                          <div className="flex gap-1">
                            <button
                              onClick={handlesecondassisstantchange}
                              className="text-green-600 text-xs cursor-pointer"
                            >
                              <ClipboardDocumentCheckIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => {
                                setisEditsecondassisstant(false);
                                setsecondassisstant("DR. MILAN");
                              }}
                              className="text-red-600 text-xs cursor-pointer"
                            >
                              <XMarkIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-row gap-2">
                          <p className="text-black text-xl font-semibold">
                            {patientsurgery?.[0].second_assistant}
                          </p>
                          <button
                            onClick={() => {
                              setisEditsecondassisstant(true);
                            }}
                            className="text-gray-400 hover:text-gray-600 cursor-pointer"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                        </div>
                      )}
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
              {isEditmanageproc ? (
                <div className="flex flex-row gap-2 text-black text-lg font-medium">
                  <div className="flex flex-wrap gap-6">
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
                  <div className="flex gap-1">
                    <button
                      onClick={handlemanageprocchange}
                      className="text-green-600 text-xs cursor-pointer"
                    >
                      <ClipboardDocumentCheckIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => {
                        setisEditmanageproc(false);
                        setmanagproc("");
                      }}
                      className="text-red-600 text-xs cursor-pointer"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-row gap-2">
                  <p className="text-black text-xl font-semibold">
                    {patientsurgery?.[0].mag_proc}
                  </p>
                  <button
                    onClick={() => {
                      setisEditmanageproc(true);
                    }}
                    className="text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                </div>
              )}
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
                      {isEditknees ? (
                        <div className="flex flex-row gap-2 text-black text-lg font-medium">
                          <div
                            className={`flex flex-row justify-between items-between gap-6  ${
                              width < 700 ? "w-full" : "w-1/2"
                            }`}
                          >
                            {/* Left Knee */}
                            <div
                              onClick={() => toggleKnee("Left Knee")}
                              className={`w-1/2 h-fit py-2 rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer ${
                                selectedKnees.includes("Left Knee")
                                  ? "border-2 border-black"
                                  : ""
                              }`}
                            >
                              <Image
                                src={LeftKnee}
                                alt="Left Knee"
                                className="w-12 h-12"
                              />
                              <p className="font-semibold text-lg text-black">
                                Left Knee
                              </p>
                            </div>

                            {/* Right Knee */}
                            <div
                              onClick={() => toggleKnee("Right Knee")}
                              className={`w-1/2 h-fit py-2 rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer ${
                                selectedKnees.includes("Right Knee")
                                  ? "border-2 border-black"
                                  : ""
                              }`}
                            >
                              <Image
                                src={RightKnee}
                                alt="Right Knee"
                                className="w-12 h-12"
                              />
                              <p className="font-semibold text-lg text-black">
                                Right Knee
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={handlekneechange}
                              className="text-green-600 text-xs cursor-pointer"
                            >
                              <ClipboardDocumentCheckIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => {
                                setisEditknees(false);
                                setSelectedKnees([]);
                              }}
                              className="text-red-600 text-xs cursor-pointer"
                            >
                              <XMarkIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-row gap-2">
                          <div className="flex flex-row gap-10">
                            {/* Left Knee */}
                            {patientsurgery?.[0].side?.includes(
                              "Left Knee"
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
                            {patientsurgery?.[0].side?.includes(
                              "Right Knee"
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
                          <button
                            onClick={() => {
                              setisEditknees(true);
                            }}
                            className="text-gray-400 hover:text-gray-600 cursor-pointer"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>

                  {/* INDICATION OF SURGERY Row */}
                  <tr className="align-middle">
                    <td className="font-bold text-lg text-black w-1/4">
                      INDICATION OF SURGERY
                    </td>
                    <td>
                      {isEditsurgindi ? (
                        <div className="flex flex-row gap-2 text-black text-lg font-medium">
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
                          <div className="flex gap-1">
                            <button
                              onClick={handlesurgindichange}
                              className="text-green-600 text-xs cursor-pointer"
                            >
                              <ClipboardDocumentCheckIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => {
                                setisEditsurgindi(false);
                                setsurgindi("");
                              }}
                              className="text-red-600 text-xs cursor-pointer"
                            >
                              <XMarkIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-row gap-2">
                          <p className="text-black text-xl font-semibold">
                            {patientsurgery?.[0].surgery_indication}
                          </p>
                          <button
                            onClick={() => {
                              setisEditsurgindi(true);
                            }}
                            className="text-gray-400 hover:text-gray-600 cursor-pointer"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                        </div>
                      )}
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
                      {isEdittechassit ? (
                        <div className="flex flex-row gap-2 text-black text-lg font-medium">
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
                          <div className="flex gap-1">
                            <button
                              onClick={handletechassistchange}
                              className="text-green-600 text-xs cursor-pointer"
                            >
                              <ClipboardDocumentCheckIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => {
                                setisEdittechassit(false);
                                settechassist("");
                              }}
                              className="text-red-600 text-xs cursor-pointer"
                            >
                              <XMarkIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-row gap-2">
                          <p className="text-black text-xl font-semibold">
                            {patientsurgery?.[0].tech_assist}
                          </p>
                          <button
                            onClick={() => {
                              setisEdittechassit(true);
                            }}
                            className="text-gray-400 hover:text-gray-600 cursor-pointer"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>

                  {/* ALIGNMENT PHILOSOPHY Row */}
                  <tr className="align-middle">
                    <td className="font-bold text-lg text-black w-1/4">
                      ALLIGNMENT PHILOSOPHY
                    </td>
                    <td>
                      {isEditalignphil ? (
                        <div className="flex flex-row gap-2 text-black text-lg font-medium">
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
                          <div className="flex gap-1">
                            <button
                              onClick={handlealignphilchange}
                              className="text-green-600 text-xs cursor-pointer"
                            >
                              <ClipboardDocumentCheckIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => {
                                setisEditalignphil(false);
                                setalignphil("");
                              }}
                              className="text-red-600 text-xs cursor-pointer"
                            >
                              <XMarkIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-row gap-2">
                          <p className="text-black text-xl font-semibold">
                            {patientsurgery?.[0].align_phil}
                          </p>
                          <button
                            onClick={() => {
                              setisEditalignphil(true);
                            }}
                            className="text-gray-400 hover:text-gray-600 cursor-pointer"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                        </div>
                      )}
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
                      {isEdittoruused ? (
                        <div className="flex flex-row gap-2 text-black text-lg font-medium">
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
                          <div className="flex gap-1">
                            <button
                              onClick={handletorusedchange}
                              className="text-green-600 text-xs cursor-pointer"
                            >
                              <ClipboardDocumentCheckIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => {
                                setisEdittoruused(false);
                                settourused("");
                              }}
                              className="text-red-600 text-xs cursor-pointer"
                            >
                              <XMarkIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-row gap-2">
                          <p className="text-black text-xl font-semibold">
                            {patientsurgery?.[0].torq_used}
                          </p>
                          <button
                            onClick={() => {
                              setisEdittoruused(true);
                            }}
                            className="text-gray-400 hover:text-gray-600 cursor-pointer"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>

                  <tr className="align-middle">
                    <td className="font-bold text-lg text-black w-1/3">
                      SUGERY NAME
                    </td>
                    <td>
                      {isEditopname ? (
                        <div className="flex flex-row gap-2 text-black text-lg font-medium">
                          <div className="flex flex-row items-center gap-4">
                            <input
                              id="opname"
                              type="text"
                              placeholder=""
                              value={opname}
                              onChange={handleChangeopname}
                              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black font-semibold text-lg"
                            />
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={handleopnamechange}
                              className="text-green-600 text-xs cursor-pointer"
                            >
                              <ClipboardDocumentCheckIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => {
                                setisEditopname(false);
                                setopname("");
                              }}
                              className="text-red-600 text-xs cursor-pointer"
                            >
                              <XMarkIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-row gap-2">
                          <p className="text-black text-xl font-semibold">
                            {patientsurgery?.[0].op_name}
                          </p>
                          <button
                            onClick={() => {
                              setisEditopname(true);
                            }}
                            className="text-gray-400 hover:text-gray-600 cursor-pointer"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>

                  <tr className="align-middle">
                    <td className="font-bold text-lg text-black w-1/4">
                      OPERATIVE DATE
                    </td>
                    <td>
                      <div className="flex flex-row items-center gap-4">
                        {isEditopdate ? (
                          <div className="flex flex-row gap-2 text-black text-lg font-medium">
                            <div className="flex flex-row items-center gap-4">
                              <input
                                type="text"
                                placeholder="dd-mm-yyyy"
                                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black font-semibold text-lg"
                                value={surgerydate || ""}
                                onChange={handleManualsurgeryDateChange}
                                maxLength={10} // Very important: dd-mm-yyyy is 10 characters
                              />
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={handleopdatechange}
                                className="text-green-600 text-xs cursor-pointer"
                              >
                                <ClipboardDocumentCheckIcon className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => {
                                  setisEditopdate(false);
                                  setsurgeryDate("");
                                }}
                                className="text-red-600 text-xs cursor-pointer"
                              >
                                <XMarkIcon className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-row gap-2">
                            <p className="text-black text-xl font-semibold">
                              {dateOnlyIST}
                            </p>
                            <button
                              onClick={() => {
                                setisEditopdate(true);
                              }}
                              className="text-gray-400 hover:text-gray-600 cursor-pointer"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* OPERATIVE TIME Row */}
                  <tr className="align-middle">
                    <td className="font-bold text-lg text-black w-1/4">
                      OPERATIVE TIME
                    </td>
                    <td>
                      {isEditoptime ? (
                        <div className="flex flex-row gap-2 text-black text-lg font-medium">
                          <div className="flex flex-row items-center gap-4">
                            <input
                              id="optime"
                              type="text"
                              placeholder="HH:MM (24 HRS)"
                              value={optime}
                              maxLength={5}
                              onChange={handleOptimeChange}
                              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black font-semibold text-lg"
                            />
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={handleoptimechange}
                              className="text-green-600 text-xs cursor-pointer"
                            >
                              <ClipboardDocumentCheckIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => {
                                setisEditoptime(false);
                                setoptime("");
                              }}
                              className="text-red-600 text-xs cursor-pointer"
                            >
                              <XMarkIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-row gap-2">
                          <p className="text-black text-xl font-semibold">
                            {patientsurgery?.[0].op_time}
                          </p>
                          <button
                            onClick={() => {
                              setisEditoptime(true);
                            }}
                            className="text-gray-400 hover:text-gray-600 cursor-pointer"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                        </div>
                      )}
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
                      {isEditACL ? (
                        <div className="flex flex-row gap-2 text-black text-lg font-medium">
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
                                  onChange={() => setACLCondition(option)}
                                  className="form-radio text-blue-600"
                                />
                                <span>{option}</span>
                              </label>
                            ))}
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={handleACLSave}
                              className="text-green-600 text-xs cursor-pointer"
                            >
                              <ClipboardDocumentCheckIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => {
                                setIsEditACL(false);
                                setACLCondition("");
                              }}
                              className="text-red-600 text-xs cursor-pointer"
                            >
                              <XMarkIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-row gap-2">
                          <p className="text-black text-xl font-semibold">
                            {patientsurgery?.[0].bone_resection.acl}
                          </p>
                          <button
                            onClick={() => {
                              setIsEditACL(true);
                            }}
                            className="text-gray-400 hover:text-gray-600 cursor-pointer"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                        </div>
                      )}
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
                          <strong>Target Thickness:</strong> 8mm Unworn, 6mm
                          Worn (No Cartilage)
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
                        {isEditWearStatus ? (
                          <div className="flex flex-row gap-2 text-black text-lg font-medium">
                            <div className="flex flex-row text-black text-lg font-medium gap-8">
                              <label className="mr-6 cursor-pointer">
                                <input
                                  type="radio"
                                  name="wear"
                                  value="unworn"
                                  className="mr-1"
                                  checked={wearStatus === "unworn"}
                                  onChange={handleWearStatusChange}
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
                                  onChange={handleWearStatusChange}
                                />
                                WORN
                              </label>
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={handleWearStatusSave}
                                className="text-green-600 text-xs cursor-pointer"
                              >
                                <ClipboardDocumentCheckIcon className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => {
                                  setIsEditWearStatus(false);
                                  setWearStatus("");
                                }}
                                className="text-red-600 text-xs cursor-pointer"
                              >
                                <XMarkIcon className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-row gap-2">
                            <p className="text-black text-xl font-semibold">
                              {
                                patientsurgery?.[0].bone_resection.distal_medial
                                  .wear
                              }
                            </p>
                            <button
                              onClick={() => {
                                setIsEditWearStatus(true);
                              }}
                              className="text-gray-400 hover:text-gray-600 cursor-pointer"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>

                    {/* INITIAL THICKNESS */}
                    <tr>
                      <td className="font-semibold w-1/4">INITIAL THICKNESS</td>
                      <td className="w-1/4 text-black text-lg">
                        {isEditInitThick ? (
                          <div className="flex flex-row gap-2 text-black text-lg font-medium">
                            <div className="flex flex-row items-center text-black text-lg font-medium gap-2">
                              <input
                                type="text"
                                className="border px-2 py-1 w-24 mr-1 rounded"
                                value={distalmedialinithick}
                                onChange={handleInitThickChange}
                              />
                              mm
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={handleWearStatusSave}
                                className="text-green-600 text-xs cursor-pointer"
                              >
                                <ClipboardDocumentCheckIcon className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => {
                                  setIsEditInitThick(false);
                                  setDistalMedialInitThick("");
                                }}
                                className="text-red-600 text-xs cursor-pointer"
                              >
                                <XMarkIcon className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-row gap-2">
                            <p className="text-black text-xl font-medium">
                              {
                                patientsurgery?.[0].bone_resection.distal_medial
                                  .initial_thickness
                              }{" "}
                              mm
                            </p>
                            <button
                              onClick={() => {
                                setIsEditInitThick(true);
                              }}
                              className="text-gray-400 hover:text-gray-600 cursor-pointer"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>

                    {/* RECUT */}
                    <tr>
                      <td className="font-semibold">RECUT</td>
                      <td>
                        {isEditRecutYN ? (
                          <div className="flex flex-row gap-2 text-black text-lg font-medium">
                            <div className="flex flex-row text-black text-lg font-medium gap-8">
                              <label className="mr-4 cursor-pointer">
                                <input
                                  type="radio"
                                  name="recut"
                                  value="no"
                                  className="mr-1"
                                  checked={distalmedialrecutyn === "no"}
                                  onChange={handleRecutYNChange}
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
                                  onChange={handleRecutYNChange}
                                />{" "}
                                Y
                              </label>
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={handleRecutYNSave}
                                className="text-green-600 text-xs cursor-pointer"
                              >
                                <ClipboardDocumentCheckIcon className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => {
                                  setIsEditRecutYN(false);
                                  setDistalMedialRecutYN("");
                                }}
                                className="text-red-600 text-xs cursor-pointer"
                              >
                                <XMarkIcon className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-row gap-2">
                            <p className="text-black text-xl font-medium">
                              {
                                patientsurgery?.[0].bone_resection.distal_medial
                                  .recut
                              }
                            </p>
                            <button
                              onClick={() => {
                                setIsEditRecutYN(true);
                              }}
                              className="text-gray-400 hover:text-gray-600 cursor-pointer"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                      <td>
                        {isEditRecutValue ? (
                          <div className="flex flex-row gap-2 text-black text-lg font-medium">
                            <div className="flex flex-row items-center text-black text-lg font-medium gap-2">
                              <input
                                type="text"
                                className="border px-2 py-1 w-24 mr-1 rounded"
                                value={distalmedialinithick}
                                onChange={handleRecutValueChange}
                              />
                              mm
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={handleRecutValueSave}
                                className="text-green-600 text-xs cursor-pointer"
                              >
                                <ClipboardDocumentCheckIcon className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => {
                                  setIsEditRecutValue(false);
                                  setDistalMedialRecutValue("");
                                }}
                                className="text-red-600 text-xs cursor-pointer"
                              >
                                <XMarkIcon className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-row gap-2">
                            <p className="text-black text-xl font-medium">
                              {
                                patientsurgery?.[0].bone_resection.distal_medial
                                  .recutvalue
                              }
                              mm
                            </p>
                            <button
                              onClick={() => {
                                setIsEditRecutValue(true);
                              }}
                              className="text-gray-400 hover:text-gray-600 cursor-pointer"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>

                    {/* WASHER */}
                    <tr>
                      <td className="font-semibold">WASHER</td>
                      <td>
                        {isEditWasherYN ? (
                          <div className="flex flex-row gap-2 text-black text-lg font-medium">
                            <div className="flex flex-row text-black text-lg font-medium gap-8">
                              <label className="mr-4 cursor-pointer">
                                <input
                                  type="radio"
                                  name="washer"
                                  value="no"
                                  className="mr-1"
                                  checked={distalmedialwasheryn === "no"}
                                  onChange={handleWasherYNChange}
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
                                  onChange={handleWasherYNChange}
                                />{" "}
                                Y
                              </label>
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={handleWasherYNSave}
                                className="text-green-600 text-xs cursor-pointer"
                              >
                                <ClipboardDocumentCheckIcon className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => {
                                  setIsEditWasherYN(false);
                                  setDistalMedialWasherYN("");
                                }}
                                className="text-red-600 text-xs cursor-pointer"
                              >
                                <XMarkIcon className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-row gap-2">
                            <p className="text-black text-xl font-medium">
                              {
                                patientsurgery?.[0].bone_resection.distal_medial
                                  .washer
                              }
                            </p>
                            <button
                              onClick={() => {
                                setIsEditWasherYN(true);
                              }}
                              className="text-gray-400 hover:text-gray-600 cursor-pointer"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                      <td>
                        {isEditWasherValue ? (
                          <div className="flex flex-row gap-2 text-black text-lg font-medium">
                            <div className="flex flex-row items-center text-black text-lg font-medium gap-2">
                              <input
                                type="text"
                                className="border px-2 py-1 w-24 mr-1 rounded"
                                value={distalmedialwashervalue}
                                onChange={handleWasherValueChange}
                              />
                              mm
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={handleWasherValueSave}
                                className="text-green-600 text-xs cursor-pointer"
                              >
                                <ClipboardDocumentCheckIcon className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => {
                                  setIsEditWasherValue(false);
                                  setDistalMedialWasherValue("");
                                }}
                                className="text-red-600 text-xs cursor-pointer"
                              >
                                <XMarkIcon className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-row gap-2">
                            <p className="text-black text-xl font-medium">
                              {
                                patientsurgery?.[0].bone_resection.distal_medial
                                  .washervalue
                              }
                              mm
                            </p>
                            <button
                              onClick={() => {
                                setIsEditWasherValue(true);
                              }}
                              className="text-gray-400 hover:text-gray-600 cursor-pointer"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>

                    {/* FINAL THICKNESS */}
                    <tr>
                      <td className="font-semibold">FINAL THICKNESS</td>
                      <td>
                        {isEditFinalThick ? (
                          <div className="flex flex-row gap-2 text-black text-lg font-medium">
                            <div className="flex flex-row items-center text-black text-lg font-medium gap-2">
                              <input
                                type="text"
                                className="border px-2 py-1 w-24 mr-1 rounded"
                                value={distalmedialfinalthick}
                                onChange={handleFinalThickChange}
                              />
                              mm
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={handleFinalThickSave}
                                className="text-green-600 text-xs cursor-pointer"
                              >
                                <ClipboardDocumentCheckIcon className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => {
                                  setIsEditFinalThick(false);
                                  setDistalMedialFinalThick("");
                                }}
                                className="text-red-600 text-xs cursor-pointer"
                              >
                                <XMarkIcon className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-row gap-2">
                            <p className="text-black text-xl font-medium">
                              {
                                patientsurgery?.[0].bone_resection.distal_medial
                                  .final_thickness
                              }
                              mm
                            </p>
                            <button
                              onClick={() => {
                                setIsEditFinalThick(true);
                              }}
                              className="text-gray-400 hover:text-gray-600 cursor-pointer"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                          </div>
                        )}
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
                        {isEditWearStatusLat ? (
                          <div className="flex flex-row gap-2 text-black text-lg font-medium">
                            <div className="flex flex-row text-black text-lg font-medium gap-8">
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
                            <div className="flex gap-1">
                              <button
                                onClick={handleWearStatusLatSave}
                                className="text-green-600 text-xs cursor-pointer"
                              >
                                <ClipboardDocumentCheckIcon className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => {
                                  setIsEditWearStatusLat(false);
                                  setWearStatusLat("");
                                }}
                                className="text-red-600 text-xs cursor-pointer"
                              >
                                <XMarkIcon className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-row gap-2">
                            <p className="text-black text-xl font-semibold">
                              {
                                patientsurgery?.[0].bone_resection
                                  .distal_lateral.wear
                              }
                            </p>
                            <button
                              onClick={() => {
                                setIsEditWearStatusLat(true);
                              }}
                              className="text-gray-400 hover:text-gray-600 cursor-pointer"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>

                    {/* INITIAL THICKNESS */}
                    <tr>
                      <td className="font-semibold w-1/4">INITIAL THICKNESS</td>
                      <td>
                        {isEditDistalLateralInitThick ? (
                          <div className="flex flex-row gap-2 text-black text-lg font-medium">
                            <div className="flex flex-row items-center text-black text-lg font-medium gap-2">
                              <input
                                type="text"
                                className="border px-2 py-1 w-24 mr-1 rounded"
                                value={distalLateralInitThick}
                                onChange={handleInputDistalLateralInitThick}
                              />
                              mm
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={handleDistalLateralInitThickSave}
                                className="text-green-600 text-xs cursor-pointer"
                              >
                                <ClipboardDocumentCheckIcon className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => {
                                  setIsEditDistalLateralInitThick(false);
                                  setDistalLateralInitThick("");
                                }}
                                className="text-red-600 text-xs cursor-pointer"
                              >
                                <XMarkIcon className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-row gap-2">
                            <p className="text-black text-xl font-medium">
                              {
                                patientsurgery?.[0].bone_resection
                                  .distal_lateral.initial_thickness
                              }
                              mm
                            </p>
                            <button
                              onClick={() => {
                                setIsEditDistalLateralInitThick(true);
                              }}
                              className="text-gray-400 hover:text-gray-600 cursor-pointer"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>

                    {/* RECUT */}
                    <tr>
                      <td className="font-semibold">RECUT</td>
                      <td className="w-1/4">
                        {isEditDistalLateralRecutYN ? (
                          <div className="flex flex-row gap-2 text-black text-lg font-medium">
                            <div className="flex flex-row text-black text-lg font-medium gap-8">
                              <label className="mr-4 cursor-pointer">
                                <input
                                  type="radio"
                                  name="recutlat"
                                  value="no"
                                  className="mr-1"
                                  checked={distalLateralRecutYN === "no"}
                                  onChange={handleInputDistalLateralRecutYN}
                                />{" "}
                                N
                              </label>
                              <label className="cursor-pointer">
                                <input
                                  type="radio"
                                  name="recutlat"
                                  value="yes"
                                  className="mr-1"
                                  checked={distalLateralRecutYN === "yes"}
                                  onChange={handleInputDistalLateralRecutYN}
                                />{" "}
                                Y
                              </label>
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={handleDistalLateralRecutYNSave}
                                className="text-green-600 text-xs cursor-pointer"
                              >
                                <ClipboardDocumentCheckIcon className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => {
                                  setIsEditDistalLateralRecutYN(false);
                                  setDistalLateralRecutYN("");
                                }}
                                className="text-red-600 text-xs cursor-pointer"
                              >
                                <XMarkIcon className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-row gap-2">
                            <p className="text-black text-xl font-medium">
                              {
                                patientsurgery?.[0].bone_resection
                                  .distal_lateral.recut
                              }
                            </p>
                            <button
                              onClick={() => {
                                setIsEditDistalLateralRecutYN(true);
                              }}
                              className="text-gray-400 hover:text-gray-600 cursor-pointer"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                      <td>
                        {isEditDistalLateralRecutValue ? (
                          <div className="flex flex-row gap-2 text-black text-lg font-medium">
                            <div className="flex flex-row items-center text-black text-lg font-medium gap-2">
                              <input
                                type="text"
                                className="border px-2 py-1 w-24 mr-1 rounded"
                                value={distalLateralRecutValue}
                                onChange={handleInputDistalLateralRecutValue}
                              />
                              mm
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={handleDistalLateralRecutValueSave}
                                className="text-green-600 text-xs cursor-pointer"
                              >
                                <ClipboardDocumentCheckIcon className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => {
                                  setIsEditDistalLateralRecutValue(false);
                                  setDistalLateralRecutValue("");
                                }}
                                className="text-red-600 text-xs cursor-pointer"
                              >
                                <XMarkIcon className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-row gap-2">
                            <p className="text-black text-xl font-medium">
                              {
                                patientsurgery?.[0].bone_resection
                                  .distal_lateral.recutvalue
                              }
                              mm
                            </p>
                            <button
                              onClick={() => {
                                setIsEditDistalLateralRecutValue(true);
                              }}
                              className="text-gray-400 hover:text-gray-600 cursor-pointer"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>

                    {/* WASHER */}
                    <tr>
                      <td className="font-semibold">WASHER</td>
                      <td>
                        {isEditDistalLateralWasherYN ? (
                          <div className="flex flex-row gap-2 text-black text-lg font-medium">
                            <div className="flex flex-row text-black text-lg font-medium gap-8">
                              <label className="mr-4 cursor-pointer">
                                <input
                                  type="radio"
                                  name="washerlat"
                                  value="no"
                                  className="mr-1"
                                  checked={distalLateralWasherYN === "no"}
                                  onChange={handleInputDistalLateralWasherYN}
                                />{" "}
                                N
                              </label>
                              <label className="cursor-pointer">
                                <input
                                  type="radio"
                                  name="washerlat"
                                  value="yes"
                                  className="mr-1"
                                  checked={distalLateralWasherYN === "yes"}
                                  onChange={handleInputDistalLateralWasherYN}
                                />{" "}
                                Y
                              </label>
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={handleDistalLateralWasherYNSave}
                                className="text-green-600 text-xs cursor-pointer"
                              >
                                <ClipboardDocumentCheckIcon className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => {
                                  setIsEditDistalLateralWasherYN(false);
                                  setDistalLateralWasherYN("");
                                }}
                                className="text-red-600 text-xs cursor-pointer"
                              >
                                <XMarkIcon className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-row gap-2">
                            <p className="text-black text-xl font-medium">
                              {
                                patientsurgery?.[0].bone_resection
                                  .distal_lateral.washer
                              }
                            </p>
                            <button
                              onClick={() => {
                                setIsEditDistalLateralWasherYN(true);
                              }}
                              className="text-gray-400 hover:text-gray-600 cursor-pointer"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                      <td>
                        {isEditDistalLateralWasherValue ? (
                          <div className="flex flex-row gap-2 text-black text-lg font-medium">
                            <div className="flex flex-row items-center text-black text-lg font-medium gap-2">
                              <input
                                type="text"
                                className="border px-2 py-1 w-24 mr-1 rounded"
                                value={distalLateralWasherValue}
                                onChange={handleInputDistalLateralWasherValue}
                              />
                              mm
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={handleDistalLateralWasherValueSave}
                                className="text-green-600 text-xs cursor-pointer"
                              >
                                <ClipboardDocumentCheckIcon className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => {
                                  setIsEditDistalLateralWasherValue(false);
                                  setDistalLateralWasherValue("");
                                }}
                                className="text-red-600 text-xs cursor-pointer"
                              >
                                <XMarkIcon className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-row gap-2">
                            <p className="text-black text-xl font-medium">
                              {
                                patientsurgery?.[0].bone_resection
                                  .distal_lateral.washervalue
                              }
                              mm
                            </p>
                            <button
                              onClick={() => {
                                setIsEditDistalLateralWasherValue(true);
                              }}
                              className="text-gray-400 hover:text-gray-600 cursor-pointer"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>

                    {/* FINAL THICKNESS */}
                    <tr>
                      <td className="font-semibold">FINAL THICKNESS</td>
                      <td>
                        {isEditDistalLateralFinalThick ? (
                          <div className="flex flex-row gap-2 text-black text-lg font-medium">
                            <div className="flex flex-row items-center text-black text-lg font-medium gap-2">
                              <input
                                type="text"
                                className="border px-2 py-1 w-24 mr-1 rounded"
                                value={distalLateralFinalThick}
                                onChange={handleInputDistalLateralFinalThick}
                              />
                              mm
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={handleDistalLateralFinalThickSave}
                                className="text-green-600 text-xs cursor-pointer"
                              >
                                <ClipboardDocumentCheckIcon className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => {
                                  setIsEditDistalLateralFinalThick(false);
                                  setDistalLateralFinalThick("");
                                }}
                                className="text-red-600 text-xs cursor-pointer"
                              >
                                <XMarkIcon className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-row gap-2">
                            <p className="text-black text-xl font-medium">
                              {
                                patientsurgery?.[0].bone_resection
                                  .distal_lateral.final_thickness
                              }
                              mm
                            </p>
                            <button
                              onClick={() => {
                                setIsEditDistalLateralFinalThick(true);
                              }}
                              className="text-gray-400 hover:text-gray-600 cursor-pointer"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                          </div>
                        )}
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
                          <strong>Target Thickness:</strong> 7mm Unworn, 5mm
                          Worn (No Cartilage)
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
                        {isEditPostMedialWear ? (
                          <div className="flex flex-row gap-2 text-black text-lg font-medium">
                            <div className="flex flex-row text-black text-lg font-medium gap-8">
                              <label className="mr-6 cursor-pointer">
                                <input
                                  type="radio"
                                  name="wearpostmed"
                                  value="unworn"
                                  className="mr-1"
                                  checked={postMedialWear === "unworn"}
                                  onChange={handlePostMedialWearChange}
                                />
                                UNWORN
                              </label>
                              <label className="cursor-pointer">
                                <input
                                  type="radio"
                                  name="wearpostmed"
                                  value="worn"
                                  className="mr-1"
                                  checked={postMedialWear === "worn"}
                                  onChange={handlePostMedialWearChange}
                                />
                                WORN
                              </label>
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={handlePostMedialWearSave}
                                className="text-green-600 text-xs cursor-pointer"
                              >
                                <ClipboardDocumentCheckIcon className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => {
                                  setIsEditPostMedialWear(false);
                                  setPostMedialWear("");
                                }}
                                className="text-red-600 text-xs cursor-pointer"
                              >
                                <XMarkIcon className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-row gap-2">
                            <p className="text-black text-xl font-semibold">
                              {
                                patientsurgery?.[0].bone_resection
                                  .posterial_medial.wear
                              }
                            </p>
                            <button
                              onClick={() => {
                                setIsEditPostMedialWear(true);
                              }}
                              className="text-gray-400 hover:text-gray-600 cursor-pointer"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>

                    {/* INITIAL THICKNESS */}
                    <tr>
                      <td className="font-semibold w-1/4">INITIAL THICKNESS</td>
                      <td>
                        {isEditPostMedialInitThick ? (
                          <div className="flex flex-row gap-2 text-black text-lg font-medium">
                            <div className="flex flex-row items-center text-black text-lg font-medium gap-2">
                              <input
                                type="text"
                                className="border px-2 py-1 w-24 mr-1 rounded"
                                value={postMedialInitThick}
                                onChange={handlePostMedialInitThickChange}
                              />
                              mm
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={handlePostMedialInitThickSave}
                                className="text-green-600 text-xs cursor-pointer"
                              >
                                <ClipboardDocumentCheckIcon className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => {
                                  setIsEditPostMedialInitThick(false);
                                  setPostMedialInitThick("");
                                }}
                                className="text-red-600 text-xs cursor-pointer"
                              >
                                <XMarkIcon className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-row gap-2">
                            <p className="text-black text-xl font-medium">
                              {
                                patientsurgery?.[0].bone_resection
                                  .posterial_medial.initial_thickness
                              }
                              mm
                            </p>
                            <button
                              onClick={() => {
                                setIsEditPostMedialInitThick(true);
                              }}
                              className="text-gray-400 hover:text-gray-600 cursor-pointer"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>

                    {/* RECUT */}
                    <tr>
                      <td className="font-semibold">RECUT</td>
                      <td className="w-1/4">
                        {isEditPostMedialRecutYN ? (
                          <div className="flex flex-row gap-2 text-black text-lg font-medium">
                            <div className="flex flex-row text-black text-lg font-medium gap-8">
                              <label className="mr-4 cursor-pointer">
                                <input
                                  type="radio"
                                  name="recutpostmed"
                                  value="no"
                                  className="mr-1"
                                  checked={postMedialRecutYN === "no"}
                                  onChange={handlePostMedialRecutYNChange}
                                />{" "}
                                N
                              </label>
                              <label className="cursor-pointer">
                                <input
                                  type="radio"
                                  name="recutpostmed"
                                  value="yes"
                                  className="mr-1"
                                  checked={postMedialRecutYN === "yes"}
                                  onChange={handlePostMedialRecutYNChange}
                                />{" "}
                                Y
                              </label>
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={handlePostMedialRecutYNSave}
                                className="text-green-600 text-xs cursor-pointer"
                              >
                                <ClipboardDocumentCheckIcon className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => {
                                  setIsEditPostMedialRecutYN(false);
                                  setPostMedialRecutYN("");
                                }}
                                className="text-red-600 text-xs cursor-pointer"
                              >
                                <XMarkIcon className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-row gap-2">
                            <p className="text-black text-xl font-medium">
                              {
                                patientsurgery?.[0].bone_resection
                                  .posterial_medial.recut
                              }
                            </p>
                            <button
                              onClick={() => {
                                setIsEditPostMedialRecutYN(true);
                              }}
                              className="text-gray-400 hover:text-gray-600 cursor-pointer"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                      <td>
                        {isEditPostMedialRecutValue ? (
                          <div className="flex flex-row gap-2 text-black text-lg font-medium">
                            <div className="flex flex-row items-center text-black text-lg font-medium gap-2">
                              <input
                                type="text"
                                className="border px-2 py-1 w-24 mr-1 rounded"
                                value={postMedialRecutValue}
                                onChange={handlePostMedialRecutValueChange}
                              />
                              mm
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={handlePostMedialRecutValueSave}
                                className="text-green-600 text-xs cursor-pointer"
                              >
                                <ClipboardDocumentCheckIcon className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => {
                                  setIsEditPostMedialRecutValue(false);
                                  setPostMedialRecutValue("");
                                }}
                                className="text-red-600 text-xs cursor-pointer"
                              >
                                <XMarkIcon className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-row gap-2">
                            <p className="text-black text-xl font-medium">
                              {
                                patientsurgery?.[0].bone_resection
                                  .posterial_medial.recutvalue
                              }
                              mm
                            </p>
                            <button
                              onClick={() => {
                                setIsEditPostMedialRecutValue(true);
                              }}
                              className="text-gray-400 hover:text-gray-600 cursor-pointer"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>

                    {/* FINAL THICKNESS */}
                    <tr>
                      <td className="font-semibold">FINAL THICKNESS</td>
                      <td>
                        {isEditPostMedialFinalThick ? (
                          <div className="flex flex-row gap-2 text-black text-lg font-medium">
                            <div className="flex flex-row items-center text-black text-lg font-medium gap-2">
                              <input
                                type="text"
                                className="border px-2 py-1 w-24 mr-1 rounded"
                                value={postMedialFinalThick}
                                onChange={handlePostMedialFinalThickChange}
                              />
                              mm
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={handlePostMedialFinalThickSave}
                                className="text-green-600 text-xs cursor-pointer"
                              >
                                <ClipboardDocumentCheckIcon className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => {
                                  setIsEditPostMedialFinalThick(false);
                                  setPostMedialFinalThick("");
                                }}
                                className="text-red-600 text-xs cursor-pointer"
                              >
                                <XMarkIcon className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-row gap-2">
                            <p className="text-black text-xl font-medium">
                              {
                                patientsurgery?.[0].bone_resection
                                  .posterial_medial.final_thickness
                              }
                              mm
                            </p>
                            <button
                              onClick={() => {
                                setIsEditPostMedialFinalThick(true);
                              }}
                              className="text-gray-400 hover:text-gray-600 cursor-pointer"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                          </div>
                        )}
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
                        {isEditPostLateralWear ? (
                          <div className="flex flex-row gap-2 text-black text-lg font-medium">
                            <div className="flex flex-row text-black text-lg font-medium gap-8">
                              <label className="mr-6 cursor-pointer">
                                <input
                                  type="radio"
                                  name="wearpostlat"
                                  value="unworn"
                                  className="mr-1"
                                  checked={postLateralWear === "unworn"}
                                  onChange={handlePostLateralWearChange}
                                />
                                UNWORN
                              </label>
                              <label className="cursor-pointer">
                                <input
                                  type="radio"
                                  name="wearpostlat"
                                  value="worn"
                                  className="mr-1"
                                  checked={postLateralWear === "worn"}
                                  onChange={handlePostLateralWearChange}
                                />
                                WORN
                              </label>
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={handlePostLateralWearSave}
                                className="text-green-600 text-xs cursor-pointer"
                              >
                                <ClipboardDocumentCheckIcon className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => {
                                  setIsEditPostLateralWear(false);
                                  setPostLateralWear("");
                                }}
                                className="text-red-600 text-xs cursor-pointer"
                              >
                                <XMarkIcon className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-row gap-2">
                            <p className="text-black text-xl font-semibold">
                              {
                                patientsurgery?.[0].bone_resection
                                  .posterial_lateral.wear
                              }
                            </p>
                            <button
                              onClick={() => {
                                setIsEditPostLateralWear(true);
                              }}
                              className="text-gray-400 hover:text-gray-600 cursor-pointer"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>

                    {/* INITIAL THICKNESS */}
                    <tr>
                      <td className="font-semibold w-1/4">INITIAL THICKNESS</td>
                      <td className="w-1/4">
                        {isEditPostLateralInitThick ? (
                          <div className="flex flex-row gap-2 text-black text-lg font-medium">
                            <div className="flex flex-row items-center text-black text-lg font-medium gap-2">
                              <input
                                type="text"
                                className="border px-2 py-1 w-24 mr-1 rounded"
                                value={postLateralInitThick}
                                onChange={handlePostLateralInitThickChange}
                              />
                              mm
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={handlePostLateralInitThickSave}
                                className="text-green-600 text-xs cursor-pointer"
                              >
                                <ClipboardDocumentCheckIcon className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => {
                                  setIsEditPostLateralInitThick(false);
                                  setPostLateralInitThick("");
                                }}
                                className="text-red-600 text-xs cursor-pointer"
                              >
                                <XMarkIcon className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-row gap-2">
                            <p className="text-black text-xl font-medium">
                              {
                                patientsurgery?.[0].bone_resection
                                  .posterial_lateral.initial_thickness
                              }
                              mm
                            </p>
                            <button
                              onClick={() => {
                                setIsEditPostLateralInitThick(true);
                              }}
                              className="text-gray-400 hover:text-gray-600 cursor-pointer"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>

                    {/* RECUT */}
                    <tr>
                      <td className="font-semibold">RECUT</td>
                      <td>
                        {isEditPostLateralRecutYN ? (
                          <div className="flex flex-row gap-2 text-black text-lg font-medium">
                            <div className="flex flex-row text-black text-lg font-medium gap-8">
                              <label className="mr-4 cursor-pointer">
                                <input
                                  type="radio"
                                  name="recutpostlat"
                                  value="no"
                                  className="mr-1"
                                  checked={postLateralRecutYN === "no"}
                                  onChange={setPostLateralRecutYN}
                                />{" "}
                                N
                              </label>
                              <label className="cursor-pointer">
                                <input
                                  type="radio"
                                  name="recutpostlat"
                                  value="yes"
                                  className="mr-1"
                                  checked={postLateralRecutYN === "yes"}
                                  onChange={setPostLateralRecutYN}
                                />{" "}
                                Y
                              </label>
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={handlePostLateralRecutYNSave}
                                className="text-green-600 text-xs cursor-pointer"
                              >
                                <ClipboardDocumentCheckIcon className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => {
                                  setIsEditPostLateralRecutYN(false);
                                  setPostLateralRecutYN("");
                                }}
                                className="text-red-600 text-xs cursor-pointer"
                              >
                                <XMarkIcon className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-row gap-2">
                            <p className="text-black text-xl font-medium">
                              {
                                patientsurgery?.[0].bone_resection
                                  .posterial_lateral.recut
                              }
                            </p>
                            <button
                              onClick={() => {
                                setIsEditPostLateralRecutYN(true);
                              }}
                              className="text-gray-400 hover:text-gray-600 cursor-pointer"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                      <td>
                        {isEditPostLateralRecutValue ? (
                          <div className="flex flex-row gap-2 text-black text-lg font-medium">
                            <div className="flex flex-row items-center text-black text-lg font-medium gap-2">
                              <input
                                type="text"
                                className="border px-2 py-1 w-24 mr-1 rounded"
                                value={postLateralRecutValue}
                                onChange={handlePostLateralRecutValueChange}
                              />
                              mm
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={handlePostLateralRecutValueSave}
                                className="text-green-600 text-xs cursor-pointer"
                              >
                                <ClipboardDocumentCheckIcon className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => {
                                  setIsEditPostLateralRecutValue(false);
                                  setPostLateralRecutValue("");
                                }}
                                className="text-red-600 text-xs cursor-pointer"
                              >
                                <XMarkIcon className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-row gap-2">
                            <p className="text-black text-xl font-medium">
                              {
                                patientsurgery?.[0].bone_resection
                                  .posterial_lateral.recutvalue
                              }
                              mm
                            </p>
                            <button
                              onClick={() => {
                                setIsEditPostLateralRecutValue(true);
                              }}
                              className="text-gray-400 hover:text-gray-600 cursor-pointer"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>

                    {/* FINAL THICKNESS */}
                    <tr>
                      <td className="font-semibold">FINAL THICKNESS</td>
                      <td>
                        {isEditPostLateralFinalThick ? (
                          <div className="flex flex-row gap-2 text-black text-lg font-medium">
                            <div className="flex flex-row items-center text-black text-lg font-medium gap-2">
                              <input
                                type="text"
                                className="border px-2 py-1 w-24 mr-1 rounded"
                                value={postLateralFinalThick}
                                onChange={handlePostLateralFinalThickChange}
                              />
                              mm
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={handlePostLateralFinalThickSave}
                                className="text-green-600 text-xs cursor-pointer"
                              >
                                <ClipboardDocumentCheckIcon className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => {
                                  setIsEditPostLateralFinalThick(false);
                                  setPostLateralFinalThick("");
                                }}
                                className="text-red-600 text-xs cursor-pointer"
                              >
                                <XMarkIcon className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-row gap-2">
                            <p className="text-black text-xl font-medium">
                              {
                                patientsurgery?.[0].bone_resection
                                  .posterial_lateral.final_thickness
                              }
                              mm
                            </p>
                            <button
                              onClick={() => {
                                setIsEditPostLateralFinalThick(true);
                              }}
                              className="text-gray-400 hover:text-gray-600 cursor-pointer"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                          </div>
                        )}
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
                          {isEditTibialLeftWear ? (
                            <div className="flex flex-col gap-8 text-black text-lg font-medium">
                              <div className="flex flex-col text-black text-lg font-medium gap-8">
                                <label className="cursor-pointer flex flex-row">
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
                                <label className="cursor-pointer flex flex-row">
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
                              </div>
                              <div className="flex gap-1">
                                <button
                                  onClick={handleTibialLeftWearSave}
                                  className="text-green-600 text-xs cursor-pointer"
                                >
                                  <ClipboardDocumentCheckIcon className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setIsEditTibialLeftWear(false);
                                    setTibialLeftWear("");
                                  }}
                                  className="text-red-600 text-xs cursor-pointer"
                                >
                                  <XMarkIcon className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-row gap-2">
                              <p className="text-black text-xl font-semibold">
                                {
                                  patientsurgery?.[0].bone_resection
                                    .tibial_resection_left.wear
                                }
                              </p>
                              <button
                                onClick={() => {
                                  setIsEditTibialLeftWear(true);
                                }}
                                className="text-gray-400 hover:text-gray-600 cursor-pointer"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                            </div>
                          )}
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
                          {isEditTibialLeftValue ? (
                            <div className="flex flex-row gap-2 text-black text-lg font-medium">
                              <div className="flex flex-row items-center text-black text-lg font-medium gap-2">
                                <input
                                  type="text"
                                  className="border px-2 py-1 w-24 mr-1 rounded"
                                  value={tibialLeftValue}
                                  onChange={handleTibialLeftValueChange}
                                />
                                mm
                              </div>
                              <div className="flex gap-1">
                                <button
                                  onClick={handleTibialLeftValueSave}
                                  className="text-green-600 text-xs cursor-pointer"
                                >
                                  <ClipboardDocumentCheckIcon className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setIsEditTibialLeftValue(false);
                                    setTibialLeftValue("");
                                  }}
                                  className="text-red-600 text-xs cursor-pointer"
                                >
                                  <XMarkIcon className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-row gap-2">
                              <p className="text-black text-xl font-medium">
                                {
                                  patientsurgery?.[0].bone_resection
                                    .tibial_resection_left.value
                                }
                                mm
                              </p>
                              <button
                                onClick={() => {
                                  setIsEditTibialLeftValue(true);
                                }}
                                className="text-gray-400 hover:text-gray-600 cursor-pointer"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                            </div>
                          )}
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
                          {isEditTibialRightWear ? (
                            <div className="flex flex-col gap-8 text-black text-lg font-medium">
                              <div className="flex flex-col text-black text-lg font-medium gap-8">
                                <label className="cursor-pointer flex flex-row">
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
                                <label className="cursor-pointer flex flex-row">
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
                              </div>
                              <div className="flex gap-1">
                                <button
                                  onClick={handleTibialRightWearSave}
                                  className="text-green-600 text-xs cursor-pointer"
                                >
                                  <ClipboardDocumentCheckIcon className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setIsEditTibialRightWear(false);
                                    setTibialRightWear("");
                                  }}
                                  className="text-red-600 text-xs cursor-pointer"
                                >
                                  <XMarkIcon className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-row gap-2">
                              <p className="text-black text-xl font-semibold">
                                {
                                  patientsurgery?.[0].bone_resection
                                    .tibial_resection_right.wear
                                }
                              </p>
                              <button
                                onClick={() => {
                                  setIsEditTibialRightWear(true);
                                }}
                                className="text-gray-400 hover:text-gray-600 cursor-pointer"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                            </div>
                          )}
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
                          {isEditTibialRightValue ? (
                            <div className="flex flex-row gap-2 text-black text-lg font-medium">
                              <div className="flex flex-row items-center text-black text-lg font-medium gap-2">
                                <input
                                  type="text"
                                  className="border px-2 py-1 w-24 mr-1 rounded"
                                  value={tibialRightValue}
                                  onChange={handleTibialRightValueChange}
                                />
                                mm
                              </div>
                              <div className="flex gap-1">
                                <button
                                  onClick={handleTibialRightValueSave}
                                  className="text-green-600 text-xs cursor-pointer"
                                >
                                  <ClipboardDocumentCheckIcon className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setIsEditTibialRightValue(false);
                                    setTibialRightValue("");
                                  }}
                                  className="text-red-600 text-xs cursor-pointer"
                                >
                                  <XMarkIcon className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-row gap-2">
                              <p className="text-black text-xl font-medium">
                                {
                                  patientsurgery?.[0].bone_resection
                                    .tibial_resection_right.value
                                }
                                mm
                              </p>
                              <button
                                onClick={() => {
                                  setIsEditTibialRightValue(true);
                                }}
                                className="text-gray-400 hover:text-gray-600 cursor-pointer"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                            </div>
                          )}
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
                        {isEditPCL ? (
                          <div className="flex flex-row gap-2 text-black text-lg font-medium">
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
                                    onChange={() => setPCLCondition(option)}
                                    className="form-radio text-blue-600"
                                  />
                                  <span>{option}</span>
                                </label>
                              ))}
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={handlePCLSave}
                                className="text-green-600 text-xs cursor-pointer"
                              >
                                <ClipboardDocumentCheckIcon className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => {
                                  setIsEditPCL(false);
                                  setPCLCondition("");
                                }}
                                className="text-red-600 text-xs cursor-pointer"
                              >
                                <XMarkIcon className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-row gap-2">
                            <p className="text-black text-xl font-semibold">
                              {patientsurgery?.[0].bone_resection.pcl}
                            </p>
                            <button
                              onClick={() => {
                                setIsEditPCL(true);
                              }}
                              className="text-gray-400 hover:text-gray-600 cursor-pointer"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                          </div>
                        )}
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
                      {isEditTibialVVRecutYN ? (
                        <div className="flex flex-row gap-2 text-black text-lg font-medium">
                          <div className="flex flex-row text-black text-lg font-medium gap-8">
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
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={handleTibialVVRecutYNSave}
                              className="text-green-600 text-xs cursor-pointer"
                            >
                              <ClipboardDocumentCheckIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => {
                                setIsEditTibialVVRecutYN(false);
                                setTibialVVRecutYN("");
                              }}
                              className="text-red-600 text-xs cursor-pointer"
                            >
                              <XMarkIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-row gap-2">
                          <p className="text-black text-xl font-semibold">
                            {
                              patientsurgery?.[0].bone_resection.tibialvvrecut
                                .vvrecut
                            }
                          </p>
                          <button
                            onClick={() => {
                              setIsEditTibialVVRecutYN(true);
                            }}
                            className="text-gray-400 hover:text-gray-600 cursor-pointer"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="text-lg">
                      {isEditTibialVVRecutValue ? (
                        <div className="flex flex-row gap-2 text-black text-lg font-medium">
                          <div className="flex flex-row items-center text-black text-lg font-medium gap-2">
                            <input
                              type="text"
                              className="border px-2 py-1 w-24 mr-1 rounded"
                              value={tibialVVRecutValue}
                              onChange={handleTibialVVRecutValueChange}
                            />
                            mm
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={handleTibialVVRecutValueSave}
                              className="text-green-600 text-xs cursor-pointer"
                            >
                              <ClipboardDocumentCheckIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => {
                                setIsEditTibialVVRecutValue(false);
                                setIsEditTibialVVRecutValue("");
                              }}
                              className="text-red-600 text-xs cursor-pointer"
                            >
                              <XMarkIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-row gap-2">
                          <p className="text-black text-xl font-medium">
                            {
                              patientsurgery?.[0].bone_resection.tibialvvrecut
                                .vvrecutvalue
                            }
                            deg
                          </p>
                          <button
                            onClick={() => {
                              setIsEditTibialVVRecutValue(true);
                            }}
                            className="text-gray-400 hover:text-gray-600 cursor-pointer"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                        </div>
                      )}
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
                      {isEditTibialSlopeRecutYN ? (
                        <div className="flex flex-row gap-2 text-black text-lg font-medium">
                          <div className="flex flex-row text-black text-lg font-medium gap-8">
                            <label className="mr-4 cursor-pointer">
                              <input
                                type="radio"
                                name="tibialslopeRecut"
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
                                name="tibialslopeRecut"
                                value="yes"
                                className="mr-1"
                                checked={tibialSlopeRecutYN === "yes"}
                                onChange={handleTibialSlopeRecutYNChange}
                              />
                              Y
                            </label>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={handleTibialVVRecutYNSave}
                              className="text-green-600 text-xs cursor-pointer"
                            >
                              <ClipboardDocumentCheckIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => {
                                setIsEditTibialSlopeRecutYN(false);
                                setTibialSlopeRecutYN("");
                              }}
                              className="text-red-600 text-xs cursor-pointer"
                            >
                              <XMarkIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-row gap-2">
                          <p className="text-black text-xl font-semibold">
                            {
                              patientsurgery?.[0].bone_resection
                                .tibialsloperecut.sloperecut
                            }
                          </p>
                          <button
                            onClick={() => {
                              setIsEditTibialSlopeRecutYN(true);
                            }}
                            className="text-gray-400 hover:text-gray-600 cursor-pointer"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="text-lg">
                      {isEditTibialSlopeRecutValue ? (
                        <div className="flex flex-row gap-2 text-black text-lg font-medium">
                          <div className="flex flex-row items-center text-black text-lg font-medium gap-2">
                            <input
                              type="text"
                              className="border px-2 py-1 w-24 mr-1 rounded"
                              value={tibialSlopeRecutValue}
                              onChange={handleTibialSlopeRecutValueChange}
                            />
                            mm
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={handleTibialSlopeRecutValueSave}
                              className="text-green-600 text-xs cursor-pointer"
                            >
                              <ClipboardDocumentCheckIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => {
                                setIsEditTibialSlopeRecutValue(false);
                                setTibialSlopeRecutValue("");
                              }}
                              className="text-red-600 text-xs cursor-pointer"
                            >
                              <XMarkIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-row gap-2">
                          <p className="text-black text-xl font-medium">
                            {
                              patientsurgery?.[0].bone_resection
                                .tibialsloperecut.sloperecutvalue
                            }
                            deg
                          </p>
                          <button
                            onClick={() => {
                              setIsEditTibialSlopeRecutValue(true);
                            }}
                            className="text-gray-400 hover:text-gray-600 cursor-pointer"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="w-1/2 flex text-lg flex-col text-black gap-4">
                <p className="font-bold w-full">
                  FINAL CHECK WITH SPACER BLOCK AND TRIAL COMPONENTS
                </p>
                {isEditFinalCheck ? (
                  <div className="flex flex-row gap-2 text-black text-lg font-medium">
                    <div className="flex flex-col items-start text-black text-lg font-medium gap-2">
                      <label className="cursor-pointer flex flex-row">
                        <input
                          type="radio"
                          name="finalCheck"
                          value="NEGLIGIBLE V-V LAXITY IN EXTENSION"
                          className="mr-1 cursor-pointer"
                          checked={
                            finalCheck === "NEGLIGIBLE V-V LAXITY IN EXTENSION"
                          }
                          onChange={handleFinalCheckChange}
                        />
                        NEGLIGIBLE V-V LAXITY IN EXTENSION
                      </label>

                      <label className="cursor-pointer flex flex-row">
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
                        2-3 MM OF LATERAL OPENING WITH VARUS LOAD IN 15-30° OF
                        FLEXION
                      </label>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={handleFinalCheckSave}
                        className="text-green-600 text-xs cursor-pointer"
                      >
                        <ClipboardDocumentCheckIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          setIsEditFinalCheck(false);
                          setFinalCheck("");
                        }}
                        className="text-red-600 text-xs cursor-pointer"
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-row gap-2">
                    <p className="text-black text-xl font-medium">
                      {patientsurgery?.[0].bone_resection.final_check}
                    </p>
                    <button
                      onClick={() => {
                        setIsEditFinalCheck(true);
                      }}
                      className="text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-[800px] table-auto w-full text-sm text-black border-separate border-spacing-y-8">
                  <thead>
                    <tr className="font-bold text-lg">
                      <th className="text-left p-2">INSERT THICKNESS</th>
                      <th className="text-left p-2">NO. OF TICKS</th>
                      <th className="text-left p-2">EXTENSION EXT. ORIENT.</th>
                      <th className="text-left p-2">
                        90° FLEXION INT. ORIENT.
                      </th>
                      <th className="text-left p-2">LIFT–OFF</th>
                      <th className="text-left p-2">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {editedThicknessTable.map((row, idx) => (
                      <tr key={idx} className="align-middle">
                        {/* INSERT THICKNESS (non-editable) */}
                        <td className="p-2 font-bold text-lg">
                          {row.thickness} mm
                        </td>

                        {/* NO. OF TICKS */}
                        <td className="p-2 text-lg font-medium">
                          {editingIndex === idx ? (
                            <input
                              type="text"
                              value={row.numOfTicks}
                              onChange={(e) =>
                                handleFieldChange(
                                  idx,
                                  "numOfTicks",
                                  e.target.value
                                )
                              }
                              className=" px-1"
                            />
                          ) : (
                            row.numOfTicks
                          )}
                        </td>

                        {/* EXTENSION EXT. ORIENT. */}
                        <td className="p-2 text-lg font-medium">
                          {editingIndex === idx ? (
                            <input
                              type="number"
                              value={row.extensionExtOrient}
                              onChange={(e) =>
                                handleFieldChange(
                                  idx,
                                  "extensionExtOrient",
                                  e.target.value
                                )
                              }
                              className=" px-1"
                            />
                          ) : (
                            <>
                              {row.extensionExtOrient}{" "}
                              <span className="ml-1">DEGREES</span>
                            </>
                          )}
                        </td>

                        {/* 90° FLEXION INT. ORIENT. */}
                        <td className="p-2 text-lg font-medium">
                          {editingIndex === idx ? (
                            <input
                              type="number"
                              value={row.flexionIntOrient}
                              onChange={(e) =>
                                handleFieldChange(
                                  idx,
                                  "flexionIntOrient",
                                  e.target.value
                                )
                              }
                              className=" px-1"
                            />
                          ) : (
                            <>
                              {row.flexionIntOrient}{" "}
                              <span className="ml-1">DEGREES</span>
                            </>
                          )}
                        </td>

                        {/* LIFT–OFF */}
                        <td className="p-2 text-lg font-medium">
                          {editingIndex === idx ? (
                            <select
                              value={row.liftOff}
                              onChange={(e) =>
                                handleFieldChange(
                                  idx,
                                  "liftOff",
                                  e.target.value
                                )
                              }
                              className=" px-1"
                            >
                              <option value="Y">Y</option>
                              <option value="N">N</option>
                            </select>
                          ) : (
                            row.liftOff
                          )}
                        </td>

                        {/* Actions */}
                        <td className="p-2 text-lg">
                          {editingIndex === idx ? (
                            <>
                              <button
                                className="mr-2 px-3 py-1 cursor-pointer text-green-600"
                                onClick={() => handleSave(idx)}
                              >
                                <ClipboardDocumentCheckIcon className="w-5 h-5" />
                              </button>
                              <button
                                className="px-3 py-1 cursor-pointer text-red-600"
                                onClick={handleCancel}
                              >
                                <XMarkIcon className="w-5 h-5" />
                              </button>
                            </>
                          ) : (
                            <button
                              className="px-3 py-1 text-black rounded cursor-pointer"
                              onClick={() => handleEdit(idx)}
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
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
                      {isEditFemorSize ? (
                        <div className="flex flex-row gap-2 text-black text-lg font-medium">
                          <div className="flex flex-row items-center text-black text-lg font-medium gap-2">
                            <input
                              type="text"
                              className="border px-2 py-1 w-24 mr-1 rounded"
                              value={femorSize}
                              onChange={handleFemorSizeChange}
                            />
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={handleFemorSizeSave}
                              className="text-green-600 text-xs cursor-pointer"
                            >
                              <ClipboardDocumentCheckIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => {
                                setIsEditFemorSize(false);
                                setFemorSize("");
                              }}
                              className="text-red-600 text-xs cursor-pointer"
                            >
                              <XMarkIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-row gap-2">
                          <p className="text-black text-xl font-medium">
                            {patientsurgery?.[0].bone_resection.femur_size.size}
                          </p>
                          <button
                            onClick={() => {
                              setIsEditFemorSize(true);
                            }}
                            className="text-gray-400 hover:text-gray-600 cursor-pointer"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="flex flex-row text-black text-lg font-medium gap-8">
                        {isEditFemurShape ? (
                          <div className="flex flex-row gap-2 text-black text-lg font-medium">
                            <div className="flex flex-row items-center text-black text-lg font-medium gap-8">
                              {femursizeoptions.map((option, index) => (
                                <label
                                  key={index}
                                  className="flex items-center gap-2 cursor-pointer"
                                >
                                  <input
                                    type="radio"
                                    name="dynamicRadio11"
                                    value={option}
                                    checked={femurShape === option}
                                    onChange={() => setFemurShape(option)}
                                    className="form-radio text-blue-600"
                                  />
                                  <span>{option}</span>
                                </label>
                              ))}
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={handleFemurShapeSave}
                                className="text-green-600 text-xs cursor-pointer"
                              >
                                <ClipboardDocumentCheckIcon className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => {
                                  setIsEditFemurShape(false);
                                  setFemorSize("");
                                }}
                                className="text-red-600 text-xs cursor-pointer"
                              >
                                <XMarkIcon className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-row gap-2">
                            <p className="text-black text-xl font-medium">
                              {
                                patientsurgery?.[0].bone_resection.femur_size
                                  .shape
                              }
                            </p>
                            <button
                              onClick={() => {
                                setIsEditFemurShape(true);
                              }}
                              className="text-gray-400 hover:text-gray-600 cursor-pointer"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                          </div>
                        )}
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
                      {isEditTibialSize ? (
                        <div className="flex flex-row gap-2 text-black text-lg font-medium">
                          <div className="flex flex-row items-center text-black text-lg font-medium gap-2">
                            <input
                              type="text"
                              className="border px-2 py-1 w-24 mr-1 rounded"
                              value={tibialSize}
                              onChange={handleTibialSizeChange}
                            />
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={handleTibialSizeSave}
                              className="text-green-600 text-xs cursor-pointer"
                            >
                              <ClipboardDocumentCheckIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => {
                                setIsEditTibialSize(false);
                                setTibialSize("");
                              }}
                              className="text-red-600 text-xs cursor-pointer"
                            >
                              <XMarkIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-row gap-2">
                          <p className="text-black text-xl font-medium">
                            {patientsurgery?.[0].bone_resection.tibial_size}
                          </p>
                          <button
                            onClick={() => {
                              setIsEditTibialSize(true);
                            }}
                            className="text-gray-400 hover:text-gray-600 cursor-pointer"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                        </div>
                      )}
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
                      {isEditInsertThicknesssize ? (
                        <div className="flex flex-row gap-2 text-black text-lg font-medium">
                          <div className="flex flex-row items-center text-black text-lg font-medium gap-2">
                            <input
                              type="text"
                              className="border px-2 py-1 w-24 mr-1 rounded"
                              value={insertThicknesssize}
                              onChange={handleInsertThicknesssizeChange}
                            />
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={handleInsertThicknesssizeSave}
                              className="text-green-600 text-xs cursor-pointer"
                            >
                              <ClipboardDocumentCheckIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => {
                                setIsEditInsertThicknesssize(false);
                                setInsertThicknesssize("");
                              }}
                              className="text-red-600 text-xs cursor-pointer"
                            >
                              <XMarkIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-row gap-2">
                          <p className="text-black text-xl font-medium">
                            {
                              patientsurgery?.[0].bone_resection
                                .insert_thickness.size
                            }
                          </p>
                          <button
                            onClick={() => {
                              setIsEditInsertThicknesssize(true);
                            }}
                            className="text-gray-400 hover:text-gray-600 cursor-pointer"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                    <td>
                      {isEditInsertThickness ? (
                        <div className="flex flex-row gap-2 text-black text-lg font-medium">
                          <div className="flex flex-row items-center text-black text-lg font-medium gap-8">
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
                                  onChange={() => setInsertthickness(option)}
                                  className="form-radio text-blue-600"
                                />
                                <span>{option}</span>
                              </label>
                            ))}
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={handleInsertThicknessSave}
                              className="text-green-600 text-xs cursor-pointer"
                            >
                              <ClipboardDocumentCheckIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => {
                                setIsEditInsertThickness(false);
                                setInsertthickness("");
                              }}
                              className="text-red-600 text-xs cursor-pointer"
                            >
                              <XMarkIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-row gap-2">
                          <p className="text-black text-xl font-medium">
                            {
                              patientsurgery?.[0].bone_resection
                                .insert_thickness.shape
                            }
                          </p>
                          <button
                            onClick={() => {
                              setIsEditInsertThickness(true);
                            }}
                            className="text-gray-400 hover:text-gray-600 cursor-pointer"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                        </div>
                      )}
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
                      {isEditPatellaSize ? (
                        <div className="flex flex-row gap-2 text-black text-lg font-medium">
                          <div className="flex flex-row items-center text-black text-lg font-medium gap-2">
                            <input
                              type="text"
                              className="border px-2 py-1 w-24 mr-1 rounded"
                              value={patellaSize}
                              onChange={handlePatellaSizeChange}
                            />
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={handlePatellaSizeSave}
                              className="text-green-600 text-xs cursor-pointer"
                            >
                              <ClipboardDocumentCheckIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => {
                                setIsEditPatellaSize(false);
                                setPatellaSize("");
                              }}
                              className="text-red-600 text-xs cursor-pointer"
                            >
                              <XMarkIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-row gap-2">
                          <p className="text-black text-xl font-medium">
                            {patientsurgery?.[0].bone_resection.patella_size}
                          </p>
                          <button
                            onClick={() => {
                              setIsEditPatellaSize(true);
                            }}
                            className="text-gray-400 hover:text-gray-600 cursor-pointer"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                        </div>
                      )}
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
                <table className="table-auto border-separate border-spacing-y-8 w-full text-lg text-black">
                  <thead>
                    <tr>
                      <th className="px-3 py-2 "></th>
                      {colHeaders.map((col) => (
                        <th
                          key={col}
                          className=" px-3 py-2 text-black font-bold text-lg text-left"
                        >
                          <div className="flex items-center gap-4">
                            <span>{col}</span>
                            {editingCol === col ? (
                              <div className="flex gap-2">
                                <button
                                  className="px-2 py-1 text-green-600 text-xs cursor-pointer"
                                  onClick={() => handleSaveColumn(col)}
                                >
                                  <ClipboardDocumentCheckIcon className="w-5 h-5" />
                                </button>
                                <button
                                  className="px-2 py-1 text-red-600 text-xs cursor-pointer"
                                  onClick={() => handleCancelColumn(col)}
                                >
                                  <XMarkIcon className="w-5 h-5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                className="px-2 py-1 text-gray-400 hover:text-gray-600 cursor-pointer"
                                onClick={() => setEditingCol(col)}
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="text-lg">
                    {rowHeaders.map((row) => (
                      <tr key={row}>
                        <td className="font-semibold">{row}</td>
                        {colHeaders.map((col) => {
                          if (editingCol === col) {
                            if (row === "MANUFACTURER") {
                              return (
                                <td key={col}>
                                  <select
                                    value={
                                      editedComponents[col]?.MANUFACTURER || ""
                                    }
                                    onChange={(e) =>
                                      handleCellChange(
                                        col,
                                        "MANUFACTURER",
                                        e.target.value
                                      )
                                    }
                                  >
                                    <option value="">
                                      Select Manufacturer
                                    </option>
                                    {Object.keys(options[col]).map((manu) => (
                                      <option key={manu} value={manu}>
                                        {manu}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                              );
                            }
                            if (row === "MODEL") {
                              const selectedManu =
                                editedComponents[col]?.MANUFACTURER;
                              const modelOptions = selectedManu
                                ? Object.keys(options[col][selectedManu])
                                : [];
                              return (
                                <td key={col}>
                                  <select
                                    value={editedComponents[col]?.MODEL || ""}
                                    onChange={(e) =>
                                      handleCellChange(
                                        col,
                                        "MODEL",
                                        e.target.value
                                      )
                                    }
                                    disabled={!selectedManu}
                                  >
                                    <option value="">Select Model</option>
                                    {modelOptions.map((model) => (
                                      <option key={model} value={model}>
                                        {model}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                              );
                            }
                            if (row === "SIZE") {
                              const selectedManu =
                                editedComponents[col]?.MANUFACTURER;
                              const selectedModel =
                                editedComponents[col]?.MODEL;
                              const sizeOptions =
                                selectedManu && selectedModel
                                  ? options[col][selectedManu][selectedModel] ||
                                    []
                                  : [];
                              return (
                                <td key={col}>
                                  <select
                                    value={editedComponents[col]?.SIZE || ""}
                                    onChange={(e) =>
                                      handleCellChange(
                                        col,
                                        "SIZE",
                                        e.target.value
                                      )
                                    }
                                    disabled={!selectedModel}
                                  >
                                    <option value="">Select Size</option>
                                    {sizeOptions.map((size) => (
                                      <option key={size} value={size}>
                                        {size}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                              );
                            }
                          }
                          return (
                            <td key={col}>
                              <p>{editedComponents[col]?.[row] || "N/A"}</p>
                            </td>
                          );
                        })}
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
      {showAlert && (
        <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-6 py-3 rounded-lg shadow-lg animate-fade-in-out">
            {alertMessage}
          </div>
        </div>
      )}
    </>
  );
};

export default page;
