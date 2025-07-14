"use client";
import React, {
  useState,
  useEffect,
  useRef,
  PureComponent,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ScatterChart,
  Scatter,
  ErrorBar,
  LabelList,
  ComposedChart,
  Bar,
} from "recharts";

import Image from "next/image";

import { API_URL } from "../libs/global";

import { Poppins } from "next/font/google";

import ProfileImage from "@/app/assets/profile.png";
import { UserIcon } from "@heroicons/react/24/outline";
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
  ClipboardDocumentCheckIcon,
} from "@heroicons/react/16/solid";
import Patientimg from "@/app/assets/patimg.png";
import Closeicon from "@/app/assets/closeicon.png";
import Malepat from "@/app/assets/man.png";
import Femalepat from "@/app/assets/woman.png";

import Surgeryreport from "@/app/Surgeryreport/page";

import "@/app/globals.css";

// === Helper functions ===
const quantile = (arr, q) => {
  const pos = (arr.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  return arr[base] + rest * (arr[base + 1] - arr[base]);
};

const mean = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;

const computeBoxStats = (data, mean) => {
  const sorted = [...data].sort((a, b) => a - b);
  return {
    min: sorted[0],
    lowerQuartile: quantile(sorted, 0.25),
    median: quantile(sorted, 0.5),
    upperQuartile: quantile(sorted, 0.75),
    max: sorted[sorted.length - 1],
    Patient: mean,
  };
};

// === Shape Components ===
const HorizonBar = (props) => {
  const { cx, cy, payload, dataKey, width = 30 } = props;

  if (cx == null || cy == null || !payload) return null;
  const isMedian = dataKey === "_median";
  const length = isMedian ? 30 : 10;

  return (
    <line
      x1={cx - length / 2}
      y1={cy}
      x2={cx + length / 2}
      y2={cy}
      stroke={dataKey === "_median" ? "#FFFFFF" : "#4A3AFF"}
      strokeWidth={2}
    />
  );
};

const DotBar = ({ x, y, width, height }) => {
  if (x == null || y == null || width == null || height == null) return null;
  return (
    <line
      x1={x + width / 2}
      y1={y + height}
      x2={x + width / 2}
      y2={y}
      stroke="#4A3AFF"
      strokeWidth={3}
      strokeDasharray="0"
    />
  );
};

// === Hook to structure data for chart ===
const useBoxPlot = (boxPlots) => {
  return useMemo(
    () =>
      boxPlots.map((v) => {
        // Ensure all required data points (min, median, etc.) are valid numbers, otherwise set to null.
        const min = !isNaN(v.min) ? v.min : null;
        const max = !isNaN(v.max) ? v.max : null;
        const lowerQuartile = !isNaN(v.lowerQuartile) ? v.lowerQuartile : null;
        const upperQuartile = !isNaN(v.upperQuartile) ? v.upperQuartile : null;
        const median = !isNaN(v.median) ? v.median : null;
        const Patient = !isNaN(v.Patient) ? v.Patient : null;

        return {
          name: v.name,
          min: min,
          bottomWhisker:
            lowerQuartile !== null && min !== null ? lowerQuartile - min : null,
          bottomBox:
            median !== null && lowerQuartile !== null
              ? median - lowerQuartile
              : null,
          topBox:
            upperQuartile !== null && median !== null
              ? upperQuartile - median
              : null,
          topWhisker:
            max !== null && upperQuartile !== null ? max - upperQuartile : null,
          medianLine: 0.0001, // dummy to render median bar
          maxLine: 0.0001, // dummy to render max bar
          minLine: 0.0001, // dummy to render min bar (optional)
          Patient: Patient,
          size: 250,
          _median: median, // actual Y position for rendering line
          _max: max,
          _min: min,
        };
      }),
    [boxPlots]
  );
};

const page = ({ patient1, leftscoreGroups1, rightscoreGroups1, userData, gotoIJR}) => {
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
  const [surgeryPatient, setsurgeryPatient] = useState({});

  const [selectedLeg, setSelectedLeg] = useState("left");

  const [leftscoreGroups, setLeftScoreGroups] = useState({});
  const [rightscoreGroups, setRightScoreGroups] = useState({});

  const [selectedDate, setSelectedDate] = useState("");
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

  useEffect(() => {
    if (!patient?.doctor_assigned) return;
    console.log("Doctor email", patient?.doctor_assigned);

    const fetchPatients = async () => {
      if (!patient?.doctor_assigned) return;

      try {
        const res = await axios.get(
          API_URL + `patients/by-doctor/${patient?.doctor_assigned}`
        );
        const data = res.data;

        console.log("Paitent list", data);

        // Count PRE OP patients for current selected leg
        // const preOp = data.filter(
        //   (patient) =>
        //     getCurrentPeriod(patient, selectedLeg).toLowerCase() === "pre op"
        // ).length;
        // Count POST OP stages
        const stageCounts = {
          "6W": 0,
          "3M": 0,
          "6M": 0,
          "1Y": 0,
          "2Y": 0,
        };

        data.forEach((patient) => {
          const st = getPeriodFromSurgeryDate(
                                selectedLeg === "left"
                                  ? patient?.post_surgery_details_left?.date_of_surgery
                                  : patient?.post_surgery_details_right?.date_of_surgery, patient
                              );
          if(st){
          const status = st.toUpperCase();
       
          if (stageCounts.hasOwnProperty(status)) {
            stageCounts[status]++;
          }
           }
        });
      

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
  }, [patient?.doctor_assigned]);

  useEffect(() => {
    if (!patient) return;

    const isInvalidDateOfSurgery = (date) =>
      !date || date.toString().startsWith("0001-01-01");

    if (selectedLeg === "left") {
      const dateOfSurgery = patient?.post_surgery_details_left?.date_of_surgery;
      const fallbackDate = patient?.surgery_scheduled_left?.date;

      const finalDate = isInvalidDateOfSurgery(dateOfSurgery)
        ? fallbackDate
        : dateOfSurgery;

      setSelectedDate(formatISOToDisplay(finalDate || ""));
    } else if (selectedLeg === "right") {
      const dateOfSurgery =
        patient?.post_surgery_details_right?.date_of_surgery;
      const fallbackDate = patient?.surgery_scheduled_right?.date;

      const finalDate = isInvalidDateOfSurgery(dateOfSurgery)
        ? fallbackDate
        : dateOfSurgery;

      setSelectedDate(formatISOToDisplay(finalDate || ""));
    }
  }, [patient, selectedLeg]);

  const [selectedTime, setSelectedTime] = useState("");
  const [isDateTimeEdited, setIsDateTimeEdited] = useState(false);

  const dateInputRef = useRef(null);
  const timeInputRef = useRef(null);

  const openDatePicker = () => {
    dateInputRef.current?.showPicker();
  };

  const handleClockClick = () => {
    timeInputRef.current?.showPicker();
  };

  const handleDateChange = (e) => {
    const dateValue = e.target.value;
    if (dateValue) {
      setSelectedDate(dateValue);
      handleClockClick(); // Show time picker right after date
    }
  };

  const handleTimeChange = (e) => {
    const timeValue = e.target.value;
    if (timeValue) {
      setSelectedTime(timeValue);
      setIsDateTimeEdited(true);
    }
  };

  const saveDateTime = async () => {
    const finalDateTime = `${selectedDate} ${selectedTime}`;
    console.log("Saved Date & Time:", finalDateTime);
    setIsDateTimeEdited(false);

    if (!selectedDate || !selectedTime) {
      setWarning("Please select both date and time.");
      return;
    }

    const selectedDateTime = new Date(`${selectedDate}T${selectedTime}`);
    const now = new Date();

    if (selectedDateTime < now) {
      setWarning("Selected date and time cannot be in the past.");
      return;
    }

    if (!patient?.uhid) {
      console.error("No patient selected for surgery scheduling.");
      return;
    }

    const payload = {
      uhid: patient?.uhid,
      surgery_scheduled: {
        date: selectedDate,
        time: selectedTime,
      },
    };

    try {
      const response = await fetch(API_URL + "update-surgery-schedule", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Surgery scheduled successfully:", result);
      window.location.reload();
      // Optionally reset form or show success feedback
    } catch (error) {
      console.error("Error scheduling surgery:", error);
    }
  };

  const { width, height } = useWindowSize();

  const normalizePeriod = (period) =>
    period.trim().toUpperCase().replace(/\s+/g, "");

  const getScoreByPeriodAndType = (scores, period, type) => {
    const match = scores.find(
      (s) =>
        normalizePeriod(s.period) === normalizePeriod(period) &&
        s.name.toLowerCase().includes(type.toLowerCase())
    );
    return match ? match.score[0] : null;
  };

  const generateChartData = (patient) => {
    const scores =
      selectedLeg === "left"
        ? patient?.questionnaire_scores_left || []
        : patient?.questionnaire_scores_right || [];

    const periodMap = {
      "-3": "PRE OP",
      "3W": "3W", // 👈 Add this
      SURGERY: "SURGERY",
      "+42": "6W",
      "+90": "3M",
      "+180": "6M",
      "+365": "1Y",
      "+730": "2Y",
    };

    const timeOrder = {
      "-3": -3,
      "3W": 21, // 👈 Approximate 3 weeks in days
      SURGERY: 10,
      "+42": 42,
      "+90": 90,
      "+180": 180,
      "+365": 365,
      "+730": 730,
    };

    // Check if a period exists in the questionnaire_scores
    const hasPeriodData = (periodKey) => {
      return scores.some(
        (s) =>
          normalizePeriod(s.period) === normalizePeriod(periodMap[periodKey])
      );
    };

    // Always include surgery, include others only if data exists
    const periods = Object.keys(periodMap).filter(
      (key) => key === "SURGERY" || hasPeriodData(key)
    );

    const chartData = periods.map((label) => {
      const periodKey = periodMap[label];

      return {
        name: periodKey,
        oks:
          label === "SURGERY"
            ? undefined
            : getScoreByPeriodAndType(scores, periodKey, "Oxford Knee Score"),
        sf12:
          label === "SURGERY"
            ? undefined
            : getScoreByPeriodAndType(scores, periodKey, "SF-12"),
        koos:
          label === "SURGERY"
            ? undefined
            : getScoreByPeriodAndType(scores, periodKey, "KOOS"),
        kss:
          label === "SURGERY"
            ? undefined
            : getScoreByPeriodAndType(scores, periodKey, "KSS"),
        fjs:
          label === "SURGERY"
            ? undefined
            : getScoreByPeriodAndType(scores, periodKey, "FJS"),
        _order: timeOrder[label],
      };
    });

    return chartData
      .sort((a, b) => a._order - b._order)
      .map(({ _order, ...rest }) => rest);
  };

  const data = patient ? generateChartData(patient) : [];

  const rawScores =
    selectedLeg === "left"
      ? patient?.questionnaire_scores_left ?? []
      : patient?.questionnaire_scores_right ?? [];

  // Define the custom order for the periods
  const periodOrder = ["PRE OP", "SURGERY", "6W", "3M", "6M", "1Y", "2Y"];

  // Filter, map and sort the data
  const sf12Data = periodOrder.map((period, index) => {
    const match = rawScores.find(
      (q) =>
        q.name.toLowerCase().includes("short form") &&
        q.name.toLowerCase().includes("12") &&
        q.period?.toLowerCase() === period.toLowerCase()
    );

    return {
      name: period,
      x: index,
      pScore: match?.score?.[1] ?? null,
      mScore: match?.score?.[2] ?? null,
    };
  });

  // Extract name for transformedData (could be expanded with additional properties if needed)
  const transformedData = sf12Data.map(({ name }) => ({ name }));

  // Dynamic PCS Data - Filtering out null pScores and setting error to [10, 10]
  const dataPCS = sf12Data
    .filter((d) => d.pScore !== null)
    .map((d) => ({
      x: d.x - 0.1,
      y: d.pScore,
      error: [10, 10],
    }));

  const dataMCS = sf12Data
    .filter((d) => d.mScore !== null)
    .map((d) => ({
      x: d.x + 0.1,
      y: d.mScore,
      error: [10, 10],
    }));

  // Finding the surgery index, if available
  const surgeryIndex = periodOrder.indexOf("SURGERY");

  const TIMEPOINT_ORDER = [
    "PREOP",
    "6 WEEKS",
    "3 MONTHS",
    "6 MONTHS",
    "1 YEAR",
    "2 YEARS",
  ];

  const normalizeLabel = (label) => {
    const map = {
      "PRE OP": "PREOP",
      "6W": "6 WEEKS",
      "3M": "3 MONTHS",
      "6M": "6 MONTHS",
      "1Y": "1 YEAR",
      "2Y": "2 YEARS",
    };

    const normalizedLabel = label.trim().toUpperCase();
    return map[normalizedLabel] || normalizedLabel;
  };

  const [leftcurrentstatus, setLeftCurrentStatus] = useState("");
  const [rightcurrentstatus, setRightCurrentStatus] = useState("");

  const questionnaire_assigned_left =
    patient?.questionnaire_assigned_left || [];
  const questionnaire_assigned_right =
    patient?.questionnaire_assigned_right || [];

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
console.log("Sttus",currentPeriod);
    return currentPeriod;
  };

  useEffect(() => {
    setLeftCurrentStatus(getPeriodFromSurgeryDate(patient?.post_surgery_details_left?.date_of_surgery));
    setRightCurrentStatus(getPeriodFromSurgeryDate(patient?.post_surgery_details_right?.date_of_surgery));
  }, [questionnaire_assigned_left, questionnaire_assigned_right]);

  const parseValues = (arr) => {
    // console.log("Parse values", arr);

    if (!arr || arr.length === 0) return null;
    return arr
      .flat()
      .map((v) => parseFloat(v))
      .filter((v) => !isNaN(v));
  };

  const boxPlotData = useMemo(() => {
    const scoreGroups =
      selectedLeg === "left" ? leftscoreGroups : rightscoreGroups;

          console.log("OKS Box Plot", scoreGroups);


    if (!scoreGroups) return [];

    let data = Object.entries(scoreGroups)
      .filter(([key]) => key.startsWith("Oxford Knee Score (OKS)"))
      .map(([key, values]) => {
        const label = key.split("|")[1];
        const name = normalizeLabel(label);
        const boxData = parseValues(values);

        const patientValue = (
          selectedLeg === "left"
            ? patient?.questionnaire_scores_left
            : patient?.questionnaire_scores_right
        )?.find(
          (s) =>
            s.name === "Oxford Knee Score (OKS)" &&
            normalizeLabel(s.period) === name
        );

        const dotValue = patientValue?.score?.[0] ?? null;

        return {
          name,
          boxData,
          dotValue,
        };
      });

    // Fill in missing timepoints
    data = data.concat(
      TIMEPOINT_ORDER.filter(
        (timepoint) => !data.some((item) => item.name === timepoint)
      ).map((timepoint) => ({
        name: timepoint,
        boxData: [],
        dotValue: null,
      }))
    );

    // Sort by TIMEPOINT_ORDER
    data.sort(
      (a, b) =>
        TIMEPOINT_ORDER.indexOf(a.name) - TIMEPOINT_ORDER.indexOf(b.name)
    );

    return data;
  }, [leftscoreGroups, rightscoreGroups, selectedLeg, patient]);

  const databox = useBoxPlot(
    (boxPlotData ?? []).map((item, index) => {
      const stats = computeBoxStats(item.boxData, item.dotValue);

      const isValidDot =
        stats.Patient !== undefined &&
        !isNaN(stats.Patient) &&
        stats.Patient < 100;

      if (!isValidDot) {
        stats.Patient = undefined;
      }

      return {
        name: item.name,
        x: index * 10,
        ...stats,
      };
    })
  );

  // SF-12 data processing
  const sf12BoxPlotData = useMemo(() => {
    const scoreGroups =
      selectedLeg === "left" ? leftscoreGroups : rightscoreGroups;

    console.log("SF-12 Box Plot", scoreGroups);

    if (!scoreGroups) return [];

    let data = Object.entries(scoreGroups)
      .filter(([key]) => key.startsWith("Short Form - 12 (SF-12)"))
      .map(([key, values]) => {
        const label = key.split("|")[1];
        const name = normalizeLabel(label);
        const boxData = parseValues(values);

        const patientValue = (
          selectedLeg === "left"
            ? patient?.questionnaire_scores_left
            : patient?.questionnaire_scores_right
        )?.find(
          (s) =>
            s.name === "Short Form - 12 (SF-12)" &&
            normalizeLabel(s.period) === name
        );

        const dotValue = patientValue?.score?.[0] ?? null;

        return {
          name,
          boxData,
          dotValue,
        };
      });

    // Fill in any missing timepoints with empty data
    data = data.concat(
      TIMEPOINT_ORDER.filter(
        (timepoint) => !data.some((item) => item.name === timepoint)
      ).map((timepoint) => ({
        name: timepoint,
        boxData: [],
        dotValue: null,
      }))
    );

    // Sort the data based on the TIMEPOINT_ORDER
    data.sort(
      (a, b) =>
        TIMEPOINT_ORDER.indexOf(a.name) - TIMEPOINT_ORDER.indexOf(b.name)
    );

    return data;
  }, [leftscoreGroups, rightscoreGroups, selectedLeg, patient]);

  const sf12Databox = useBoxPlot(
    (sf12BoxPlotData ?? []).map((item, index) => {
      const stats = computeBoxStats(item.boxData, item.dotValue);

      const isValidDot =
        stats.Patient !== undefined &&
        !isNaN(stats.Patient) &&
        stats.Patient <= 100;

      if (!isValidDot) {
        stats.Patient = undefined; // strip rogue dot
      }

      return {
        name: item.name,
        x: index * 10,
        ...stats,
      };
    })
  );

  // KOOS data
  const koosBoxPlotData = useMemo(() => {
    const scoreGroups =
      selectedLeg === "left" ? leftscoreGroups : rightscoreGroups;

    if (!scoreGroups) return [];

    let data = Object.entries(scoreGroups)
      .filter(([key]) =>
        key.startsWith(
          "Knee Injury and Ostheoarthritis Outcome Score, Joint Replacement (KOOS, JR)"
        )
      )
      .map(([key, values]) => {
        const label = key.split("|")[1];
        const name = normalizeLabel(label);
        const boxData = parseValues(values);

        const sc =
          selectedLeg === "left"
            ? patient?.questionnaire_scores_left
            : patient?.questionnaire_scores_right;
        const patientValue = sc?.find(
          (s) =>
            s.name ===
              "Knee Injury and Ostheoarthritis Outcome Score, Joint Replacement (KOOS, JR)" &&
            normalizeLabel(s.period) === name
        );

        const dotValue = patientValue?.score?.[0] ?? null;

        return {
          name,
          boxData,
          dotValue,
        };
      });

    // Add missing timepoints with default data
    data = data.concat(
      TIMEPOINT_ORDER.filter(
        (timepoint) => !data.some((item) => item.name === timepoint)
      ).map((timepoint) => ({
        name: timepoint,
        boxData: [],
        dotValue: null,
      }))
    );

    // Sort by TIMEPOINT_ORDER
    data.sort(
      (a, b) =>
        TIMEPOINT_ORDER.indexOf(a.name) - TIMEPOINT_ORDER.indexOf(b.name)
    );

    return data;
  }, [leftscoreGroups, rightscoreGroups, selectedLeg, patient]);

  const koosDatabox = useBoxPlot(
    (koosBoxPlotData ?? []).map((item, index) => {
      const stats = computeBoxStats(item.boxData, item.dotValue);

      // console.log("KOOS Stats", koosBoxPlotData);

      const isValidDot =
        stats.Patient !== undefined &&
        !isNaN(stats.Patient) &&
        stats.Patient < 100;

      if (!isValidDot) {
        stats.Patient = undefined;
      }

      return {
        name: item.name,
        x: index * 10,
        ...stats,
      };
    })
  );

  // KSS data
  const kssBoxPlotData = useMemo(() => {
    const scoreGroups =
      selectedLeg === "left" ? leftscoreGroups : rightscoreGroups;

    if (!scoreGroups) return [];

    let data = Object.entries(scoreGroups)
      .filter(([key]) => key.startsWith("Knee Society Score (KSS)"))
      .map(([key, values]) => {
        const label = key.split("|")[1];
        const name = normalizeLabel(label);
        const boxData = parseValues(values);

        const patientValue = (
          selectedLeg === "left"
            ? patient?.questionnaire_scores_left
            : patient?.questionnaire_scores_right
        )?.find(
          (s) =>
            s.name === "Knee Society Score (KSS)" &&
            normalizeLabel(s.period) === name
        );

        const dotValue = patientValue?.score?.[0] ?? null;

        return {
          name,
          boxData,
          dotValue,
        };
      });

    // Fill in missing timepoints
    data = data.concat(
      TIMEPOINT_ORDER.filter(
        (timepoint) => !data.some((item) => item.name === timepoint)
      ).map((timepoint) => ({
        name: timepoint,
        boxData: [],
        dotValue: null,
      }))
    );

    // Sort by defined timepoint order
    data.sort(
      (a, b) =>
        TIMEPOINT_ORDER.indexOf(a.name) - TIMEPOINT_ORDER.indexOf(b.name)
    );

    return data;
  }, [leftscoreGroups, rightscoreGroups, selectedLeg, patient]);

  const kssDatabox = useBoxPlot(
    (kssBoxPlotData ?? []).map((item, index) => {
      const stats = computeBoxStats(item.boxData, item.dotValue);

      const isValidDot =
        stats.Patient !== undefined &&
        !isNaN(stats.Patient) &&
        stats.Patient < 100;

      if (!isValidDot) {
        stats.Patient = undefined;
      }

      return {
        name: item.name,
        x: index * 10,
        ...stats,
      };
    })
  );

  // FJS data
  const fjsBoxPlotData = useMemo(() => {
    const scoreGroups =
      selectedLeg === "left" ? leftscoreGroups : rightscoreGroups;
    if (!scoreGroups) return [];

    let data = Object.entries(scoreGroups)
      .filter(([key]) => key.startsWith("Forgotten Joint Score (FJS)"))
      .map(([key, values]) => {
        const label = key.split("|")[1];
        const name = normalizeLabel(label);
        const boxData = parseValues(values);

        const patientValue = (
          selectedLeg === "left"
            ? patient?.questionnaire_scores_left
            : patient?.questionnaire_scores_right
        )?.find(
          (s) =>
            s.name === "Forgotten Joint Score (FJS)" &&
            normalizeLabel(s.period) === name
        );

        const dotValue = patientValue?.score?.[0] ?? null;

        return {
          name,
          boxData,
          dotValue,
        };
      });

    // Fill missing timepoints
    data = data.concat(
      TIMEPOINT_ORDER.filter(
        (timepoint) => !data.some((item) => item.name === timepoint)
      ).map((timepoint) => ({
        name: timepoint,
        boxData: [],
        dotValue: null,
      }))
    );

    // Sort by the explicit timepoint order
    data.sort(
      (a, b) =>
        TIMEPOINT_ORDER.indexOf(a.name) - TIMEPOINT_ORDER.indexOf(b.name)
    );

    return data;
  }, [leftscoreGroups, rightscoreGroups, selectedLeg, patient]);

  const allLabels = [
    "PREOP",
    "6 WEEKS",
    "3 MONTHS",
    "6 MONTHS",
    "1 YEAR",
    "2 YEARS",
  ];

  const fjsDatabox = useBoxPlot(
    allLabels.map((label, index) => {
      // Check if data for the label exists
      const item = fjsBoxPlotData.find((data) => data.name === label);

      // If no data is found for that label, use a default value (e.g., null or empty data)
      const stats = item
        ? computeBoxStats(item.boxData, item.dotValue)
        : {
            min: null,
            bottomWhisker: null,
            bottomBox: null,
            topBox: null,
            topWhisker: null,
            median: null,
            max: null,
            Patient: null,
          };

      return {
        name: label,
        x: index * 10, // or some other index-based calculation
        ...stats,
      };
    })
  );

  const handleManualDateChange = (e) => {
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
    setSelectedDate(value);

    if (value.length === 10) {
      const [dayStr, monthStr, yearStr] = value.split("-");
      const day = parseInt(dayStr, 10);
      const month = parseInt(monthStr, 10);
      const year = parseInt(yearStr, 10);

      const today = new Date();
      const currentYear = today.getFullYear();

      if (
        day < 1 ||
        day > 31 ||
        month < 1 ||
        month > 12 ||
        year > currentYear
      ) {
        setWarning("Surgery Date should not be a future date");
        setSelectedDate("");
        return;
      }

      const manualDate = new Date(`${year}-${month}-${day}`);
      if (
        manualDate.getDate() !== day ||
        manualDate.getMonth() + 1 !== month ||
        manualDate.getFullYear() !== year
      ) {
        setWarning("Invalid date combination. Please enter a correct date.");
        setSelectedDate("");
        return;
      }

      today.setHours(0, 0, 0, 0);
      manualDate.setHours(0, 0, 0, 0);

      if (manualDate > today) {
        setWarning("Surgery date cannot be a future date.");
        setSelectedDate("");
        return;
      }

      // ✅ Just store plain dd-mm-yyyy
      const formattedDate = `${dayStr}-${monthStr}-${yearStr}`;
      if (formattedDate) {
        const formattedDate1 = new Date(formattedDate).toLocaleDateString(
          "en-GB",
          {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }
        );
        setSelectedDate(formattedDate);
      }
      // setSelectedDate(formattedDate);
    }
  };

  const handleManualTimeChange = (e) => {
    let value = e.target.value.replace(/\D/g, ""); // Remove all non-digit characters

    // Add colon after HH
    if (value.length >= 3) {
      value = value.slice(0, 2) + ":" + value.slice(2, 4);
    }

    if (value.length > 5) {
      value = value.slice(0, 5); // Limit to 5 characters (HH:MM)
    }

    setSelectedTime(value);

    // Validate only when 5 characters entered (HH:MM)
    if (value.length === 5) {
      const [hourStr, minuteStr] = value.split(":");
      const hour = parseInt(hourStr, 10);
      const minute = parseInt(minuteStr, 10);

      if (
        isNaN(hour) ||
        isNaN(minute) ||
        hour < 0 ||
        hour > 23 ||
        minute < 0 ||
        minute > 59
      ) {
        setWarning("Please enter a valid time in HH:MM format");
        setSelectedTime("");
        return;
      }

      // Optional: Convert to 24-hour format or store as-is
      const formattedTime = `${hourStr.padStart(2, "0")}:${minuteStr.padStart(
        2,
        "0"
      )}`;
      setSelectedTime(formattedTime);
    }
  };

  const [warning, setWarning] = useState("");

  function formatForStorage(dateString) {
    const [day, month, year] = dateString.split("-");
    if (!day || !month || !year) return "";

    // Create a UTC ISO string manually
    const date = new Date(
      Date.UTC(Number(year), Number(month) - 1, Number(day))
    );
    return date.toISOString().replace("Z", "+00:00");
  }

  function formatISOToDisplay(dateString) {
    if (!dateString) return "";

    const date = new Date(dateString);

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Month is 0-indexed
    const year = date.getFullYear();

    return `${year}-${month}-${day}`;
  }

  const [selectedDate1, setSelectedDate1] = useState(""); // e.g. "2025-05-23"
  const [selectedTime1, setSelectedTime1] = useState(""); // e.g. "14:30"

  // const [editMode, setEditMode] = useState({});
  // const [editValues, setEditValues] = useState({
  //   uhid: patient?.uhid || "",
  //   surgeon: patient?.post_surgery_details?.surgeon || "",
  //   surgery_name: patient?.post_surgery_details?.surgery_name || "",
  //   sub_doctor_name: patient?.post_surgery_details?.sub_doctor || "",
  //   procedure: patient?.post_surgery_details?.procedure || "",
  //   implant: patient?.post_surgery_details?.implant || "",
  //   technology: patient?.post_surgery_details?.technology || "",
  //   surgery_date:
  //     formatISOToDisplay(patient?.post_surgery_details?.date_of_surgery) || "", // <-- Added this line
  // });

  //   const [selectedLeg, setSelectedLeg] = useState("left");
  const fieldRefs = useRef({});
  const [editMode, setEditMode] = useState({
    post_surgery_details_left: {},
    post_surgery_details_right: {},
  });

  const [editValues, setEditValues] = useState({
    uhid: "",
    post_surgery_details_left: {
      surgery_date: "",
      surgeon: "",
      surgery_name: "",
      sub_doctor: "",
      procedure: "",
      implant: "",
      technology: "",
    },
    post_surgery_details_right: {
      surgery_date: "",
      surgeon: "",
      surgery_name: "",
      sub_doctor: "",
      procedure: "",
      implant: "",
      technology: "",
    },
  });

  // Update when `patient` is loaded
  useEffect(() => {
    if (!patient) return;

    const processDateTime = (surgeryDetails, scheduledDetails) => {
      const rawDateTime = surgeryDetails?.date_of_surgery || "";
      const isDefaultDate =
        rawDateTime.startsWith("0001") || rawDateTime === "";

      let dateStr = "";
      let timeStr = "";

      if (!isDefaultDate) {
        const dt = new Date(rawDateTime);
        if (!isNaN(dt.getTime())) {
          dateStr =
            String(dt.getDate()).padStart(2, "0") +
            "-" +
            String(dt.getMonth() + 1).padStart(2, "0") +
            "-" +
            dt.getFullYear();
          timeStr =
            String(dt.getHours()).padStart(2, "0") +
            ":" +
            String(dt.getMinutes()).padStart(2, "0");
        }
      } else if (scheduledDetails?.date && scheduledDetails?.time) {
        // Fallback to scheduled values if date_of_surgery is invalid
        const [year, month, day] = scheduledDetails.date.split("-");
        dateStr = `${day}-${month}-${year}`;
        timeStr = scheduledDetails.time;
      }

      return { dateStr, timeStr, rawDateTime };
    };

    const left = processDateTime(
      patient.post_surgery_details_left,
      patient.surgery_scheduled_left
    );
    const right = processDateTime(
      patient.post_surgery_details_right,
      patient.surgery_scheduled_right
    );

    setEditValues({
      uhid: patient.uhid || "",
      post_surgery_details_left: {
        ...patient.post_surgery_details_left,
        surgery_date: left.rawDateTime,
        date_only: left.dateStr,
        time_only: left.timeStr,
        surgeon: patient.post_surgery_details_left?.surgeon || "",
        surgery_name: patient.post_surgery_details_left?.surgery_name || "",
        sub_doctor: patient.post_surgery_details_left?.sub_doctor || "",
        procedure: patient.post_surgery_details_left?.procedure || "",
        implant: patient.post_surgery_details_left?.implant || "",
        technology: patient.post_surgery_details_left?.technology || "",
      },
      post_surgery_details_right: {
        ...patient.post_surgery_details_right,
        surgery_date: right.rawDateTime,
        date_only: right.dateStr,
        time_only: right.timeStr,
        surgeon: patient.post_surgery_details_right?.surgeon || "",
        surgery_name: patient.post_surgery_details_right?.surgery_name || "",
        sub_doctor: patient.post_surgery_details_right?.sub_doctor || "",
        procedure: patient.post_surgery_details_right?.procedure || "",
        implant: patient.post_surgery_details_right?.implant || "",
        technology: patient.post_surgery_details_right?.technology || "",
      },
    });

    // Also update UI date/time
    if (selectedLeg === "left") {
      setSelectedDate(left.dateStr);
      setSelectedTime(left.timeStr);
    } else {
      setSelectedDate(right.dateStr);
      setSelectedTime(right.timeStr);
    }
  }, [patient, selectedLeg]);

  const [previousValues, setPreviousValues] = useState({});
  const isLeft = selectedLeg === "left";
  const isRight = selectedLeg === "right";

  const legKey =
    selectedLeg === "left"
      ? "post_surgery_details_left"
      : "post_surgery_details_right";

  useEffect(() => {
    const handleClickOutside = (event) => {
      const legKey =
        selectedLeg === "left"
          ? "post_surgery_details_left"
          : "post_surgery_details_right";

      Object.keys(fieldRefs.current).forEach((field) => {
        if (
          editMode[legKey]?.[field] &&
          fieldRefs.current[field] &&
          !fieldRefs.current[field].contains(event.target)
        ) {
          const restoredValue =
            previousValues[field] ?? editValues[legKey][field];

          setEditValues((prev) => ({
            ...prev,
            [legKey]: {
              ...prev[legKey],
              [field]: previousValues[field] ?? prev[legKey][field],
            },
          }));

          // 👇 Add this to sync UI time/date
          if (field === "surgery_date" && restoredValue) {
            const dt = new Date(restoredValue);
            setSelectedDate(
              String(dt.getDate()).padStart(2, "0") +
                "-" +
                String(dt.getMonth() + 1).padStart(2, "0") +
                "-" +
                dt.getFullYear()
            );

            setSelectedTime(dt.toTimeString().slice(0, 5));
          }

          setEditMode((prev) => ({
            ...prev,
            [legKey]: {
              ...prev[legKey],
              [field]: false,
            },
          }));

          setPreviousValues((prev) => {
            const updated = { ...prev };
            delete updated[field];
            return updated;
          });
        }
      });
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [editMode, previousValues, selectedLeg]);

  const handleEditClick = (field) => {
    const legKey =
      selectedLeg === "left"
        ? "post_surgery_details_left"
        : "post_surgery_details_right";

    setPreviousValues((prev) => ({
      ...prev,
      [field]: editValues[legKey][field],
    }));

    setEditMode((prev) => ({
      ...prev,
      [legKey]: {
        ...prev[legKey],
        [field]: true,
      },
    }));
  };

  const handleChange = (field, value) => {
    const legKey =
      selectedLeg === "left"
        ? "post_surgery_details_left"
        : "post_surgery_details_right";

    setEditValues((prev) => ({
      ...prev,
      [legKey]: {
        ...prev[legKey],
        [field]: value,
      },
    }));
  };

  function toLocalISOString(date) {
    const pad = (n) => String(n).padStart(2, "0");

    return (
      date.getFullYear() +
      "-" +
      pad(date.getMonth() + 1) +
      "-" +
      pad(date.getDate()) +
      "T" +
      pad(date.getHours()) +
      ":" +
      pad(date.getMinutes()) +
      ":" +
      pad(date.getSeconds())
    );
  }

  const handleSaveClick = async (field) => {
    const legKey =
      selectedLeg === "left"
        ? "post_surgery_details_left"
        : "post_surgery_details_right";
    let combinedDateTime = null;

    if (field === "surgery_date" && selectedDate) {
      // const isoDate = formatForStorage(selectedDate);

      // console.log("ISO Date", selectedDate);
      const [day, month, year] = selectedDate.split("-");
      const formattedDate = `${year}-${month.padStart(2, "0")}-${day.padStart(
        2,
        "0"
      )}`;
      combinedDateTime = new Date(`${formattedDate}T${selectedTime}:00`);

      // console.log("Combined Date Time", combinedDateTime.toISOString());
      setEditValues((prev) => ({
        ...prev,
        [legKey]: {
          ...prev[legKey],
          [field]: toLocalISOString(combinedDateTime),
        },
      }));
    }

    setPreviousValues((prev) => {
      const updated = { ...prev };
      delete updated[field];
      return updated;
    });

    setEditMode((prev) => ({
      ...prev,
      [legKey]: {
        ...prev[legKey],
        [field]: false,
      },
    }));

    // console.log("Edited Values",new Date(editValues[legKey].surgery_date).toISOString().split("T")[0] );

    if (editValues.uhid === "") return setWarning("UHID not found");

    const originalDetails = editValues[legKey];

    const payload = {
      uhid: editValues.uhid,
      [legKey]: {
        date_of_surgery:
          field === "surgery_date"
            ? toLocalISOString(combinedDateTime)
            : originalDetails.surgery_date,
        surgeon: originalDetails.surgeon,
        surgery_name: originalDetails.surgery_name,
        sub_doctor: originalDetails.sub_doctor,
        procedure: originalDetails.procedure,
        implant: originalDetails.implant,
        technology: originalDetails.technology,
      },
    };

    // console.log("Payload surgery", payload);
    // return;

    try {
      const response = await fetch(
        API_URL +
          (selectedLeg === "left"
            ? "update-post-surgery-details-left"
            : "update-post-surgery-details-right"),
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        setWarning(
          extractErrorMessage(result.detail) ||
            "Failed to update surgery details for left leg"
        );
        console.log(extractErrorMessage(result.detail));
        return;
      }

      // console.log(`Successfully updated ${selectedLeg} leg`);
      setWarning(
        `Surgery details updated successfully for ${selectedLeg} leg!`
      );
      // if (onSurgeryUpdate) {
      //   onSurgeryUpdate(result);
      // }
    } catch (error) {
      console.error(`Error ${selectedLeg} leg:`, error);
      setWarning(`Something went wrong while updating ${selectedLeg} leg.`);
    }
  };

  const extractErrorMessage = (detail) => {
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) return detail.map((d) => d.msg).join(", ");
    if (typeof detail === "object" && detail.msg) return detail.msg;
    return "Unknown error occurred";
  };

  const isPostSurgeryDetailsFilled = (details) => {
    if (!details || typeof details !== "object") return false;

    const { surgeon, surgery_name, procedure, implant, technology } = details;

    const isValidField = (field) =>
      typeof field === "string" &&
      field.trim() !== "" &&
      field.trim().toLowerCase() !== "string";

    return (
      isValidField(surgeon) &&
      isValidField(surgery_name) &&
      isValidField(procedure) &&
      isValidField(implant) &&
      isValidField(technology)
    );
  };

  const isreporteditcheckleft = (details, details1) => {
    let a1 = true;
    let a2 = true;

    const currentPeriodLeft = getPeriodFromSurgeryDate(patient?.post_surgery_details_left?.date_of_surgery);
    const currentPeriodRight = getPeriodFromSurgeryDate(patient?.post_surgery_details_right?.date_of_surgery);

    const isValidField = (field) =>
      typeof field === "string" &&
      field.trim() !== "" &&
      field.trim().toLowerCase() !== "string";

    const checkFields = (data) => {
      if (!data || typeof data !== "object") return false;

      const { surgeon, surgery_name, procedure, implant, technology } = data;
      return (
        isValidField(surgeon) &&
        isValidField(surgery_name) &&
        isValidField(procedure) &&
        isValidField(implant) &&
        isValidField(technology)
      );
    };

    const checkFields1 = (data) => {
      if (!data || typeof data !== "object") return false;

      const { surgeon, surgery_name, procedure, implant, technology } = data;
      return (
        isValidField(surgeon) &&
        isValidField(surgery_name) &&
        isValidField(procedure) &&
        isValidField(implant) &&
        isValidField(technology)
      );
    };

    // If currentPeriod for left leg is null, allow details1 validation
    if (currentPeriodLeft) {
      a1 = checkFields(details);
    }

    // If currentPeriod for right leg is null, allow details validation
    if (currentPeriodRight) {
      a2 = checkFields1(details1);
    }

    // Default to checking details (left leg)
    return a1 && a2;
  };

  const isreporteditcheckright = (details) => {
    // console.log("Right Leg",getCurrentPeriod("right"));

    if (!details || typeof details !== "object") return false;

    const { surgeon, surgery_name, procedure, implant, technology } = details;

    const isValidField = (field) =>
      typeof field === "string" &&
      field.trim() !== "" &&
      field.trim().toLowerCase() !== "string";

    return (
      isValidField(surgeon) &&
      isValidField(surgery_name) &&
      isValidField(procedure) &&
      isValidField(implant) &&
      isValidField(technology)
    );
  };

  const getSelectedLegData = () => {
    return selectedLeg === "left"
      ? surgeryPatient?.post_surgery_details_left ||
          patient?.post_surgery_details_left
      : selectedLeg === "right"
      ? surgeryPatient?.post_surgery_details_right ||
        patient?.post_surgery_details_right
      : surgeryPatient?.post_surgery_details || patient?.post_surgery_details;
  };

  const editModeKey = isLeft
    ? "post_surgery_details_left"
    : "post_surgery_details_right";
  const currentEditMode = editMode[editModeKey] || {};
  // console.log("Edit Mode", currentEditMode);
  const currentEditValues = editValues[editModeKey] || {};

  // console.log("Box plot:", JSON.stringify(databox, null, 2));

  const [isOpen, setIsOpen] = useState(false);

  // Inside your component
  const [selectedQuestionnaires, setSelectedQuestionnaires] = useState([
    "oks",
    "sf12",
    "koos",
    "kss",
    "fjs", // initially all selected
  ]);

  function toggleQuestionnaire(key) {
    setSelectedQuestionnaires(
      (prev) =>
        prev.includes(key)
          ? prev.filter((item) => item !== key) // remove if already selected
          : [...prev, key] // add if not selected
    );
  }

  useEffect(() => {
    if (warning) {
      const timer = setTimeout(() => setWarning(""), 2000);
      return () => clearTimeout(timer);
    }
  }, [warning]);

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


    function getPeriodFromSurgeryDate(surgeryDateStr,patient) {
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
    const diffInDays = Math.floor((today - surgeryDate) / (1000 * 60 * 60 * 24));

    if (diffInDays < 0) {
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
      <div className="flex flex-col md:flex-row w-[95%] mx-auto mt-4 items-center justify-between">
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
                        alt="UHID"
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
                      width < 760 ? "w-full" : "w-2/5"
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
                      width < 760 ? "w-full" : "w-3/5 justify-center"
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
                      <p className="text-[#475467] font-semibold text-5">BMI</p>
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
                    <div className="w-1/2 flex flex-row justify-start items-center">
                      <p
                        className=" rounded-full px-3 py-[1px] cursor-pointer text-center text-white text-lg font-semibold border-[#005585] border-2"
                        style={{ backgroundColor: "rgba(0, 85, 133, 0.9)" }}
                        onClick={()=>{gotoIJR(patient);}}
                      >
                        VIEW SURGERY REPORT
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        className={` h-fit mx-auto flex  mt-5 gap-4 ${
          width < 1415
            ? "w-full flex-col justify-center items-center"
            : "w-[95%] flex-col"
        }`}
      >
        <div className="flex justify-start gap-2">
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

        <div
          className={`w-full flex   gap-4 ${
            width < 1415
              ? "flex-col justify-center items-center h-[1000px]"
              : "flex-row h-[400px]"
          }`}
        >
          <div
            className={` flex flex-col bg-white px-4 py-2 rounded-2xl shadow-lg ${
              width < 1415 ? "w-full h-1/2" : "w-full"
            }`}
          >
            <p className="font-bold text-sm text-black">PROM ANALYSIS</p>
            <ResponsiveContainer width="100%" height="90%">
              <LineChart
                data={data}
                margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="8 10" vertical={false} />

                <XAxis
                  dataKey="name"
                  label={{
                    value: "DAYS",
                    position: "insideBottom",
                    offset: -5,
                    style: {
                      fill: "#615E83", // label color
                      fontSize: 14, // label font size
                      fontWeight: 700,
                    },
                  }}
                  tick={{ fill: "#615E83", fontSize: 12, fontWeight: 600 }} // tick values
                />

                <YAxis
                  label={{
                    value: "SCORE",
                    angle: -90,
                    position: "insideLeft",
                    style: {
                      fill: "#615E83", // label color
                      fontSize: 14, // label font size
                      fontWeight: 700,
                    },
                    dx: 15,
                  }}
                  tick={{ fill: "#615E83", fontSize: 12, fontWeight: 600 }} // tick values
                  domain={[0, 100]}
                />

                <Tooltip
                  isAnimationActive={false}
                  content={({ active, payload, label }) => {
                    if (label === "SURGERY" || !active || !payload?.length)
                      return null;

                    // console.log("PROM Payload" + payload);

                    return (
                      <div className="bg-white p-2 border rounded shadow text-black">
                        <p className="font-semibold">{label}</p>
                        {payload.map((entry, index) => (
                          <p key={index} style={{ color: entry.stroke }}>
                            {entry.name}: {entry.value}
                          </p>
                        ))}
                      </div>
                    );
                  }}
                />

                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  iconSize={10}
                  wrapperStyle={{ paddingBottom: 20 }}
                  content={() => {
                    const labels = {
                      oks: "OKS",
                      sf12: "SF-12",
                      koos: "KOOS",
                      kss: "KSS",
                      fjs: "FJS",
                    };

                    const colors = {
                      oks: "#4F46E5",
                      sf12: "#A855F7",
                      koos: "#10B981",
                      kss: "#F97316",
                      fjs: "#3B82F6",
                    };

                    return (
                      <ul className="flex gap-6 list-none m-0 p-0">
                        {Object.entries(labels).map(([key, label]) => (
                          <li
                            key={key}
                            className="flex items-center gap-2 cursor-pointer select-none"
                            onClick={() => toggleQuestionnaire(key)}
                          >
                            <input
                              type="checkbox"
                              checked={selectedQuestionnaires.includes(key)}
                              readOnly
                              className="accent-blue-600 w-4 h-4"
                            />
                            <span
                              style={{
                                fontWeight: 700,
                                fontSize: 12,
                                color: selectedQuestionnaires.includes(key)
                                  ? colors[key] // Active → real color
                                  : "#A0AEC0", // Inactive → gray color
                              }}
                            >
                              {label}
                            </span>
                          </li>
                        ))}
                      </ul>
                    );
                  }}
                />

                <ReferenceLine
                  x="SURGERY"
                  stroke="limegreen"
                  strokeWidth={2}
                  ifOverflow="visible"
                  isFront
                />

                {["oks", "sf12", "koos", "kss", "fjs"].map((key, i) => {
                  const colors = [
                    "#4F46E5", // Indigo
                    "#A855F7", // Purple
                    "#10B981", // Emerald
                    "#F97316", // Orange
                    "#3B82F6", // Blue
                  ];

                  const labels = {
                    oks: "Oxford Knee Score",
                    sf12: "Short Form - 12",
                    koos: "KOOS",
                    kss: "Knee Society Score",
                    fjs: "Forgotten Joint Score",
                  };

                  if (!selectedQuestionnaires.includes(key)) {
                    return null; // Don't render if not selected
                  }

                  return (
                    <Line
                      key={key}
                      type="monotone"
                      dataKey={key}
                      connectNulls={true} // Continue connecting lines even when there's no data
                      name={labels[key]}
                      stroke={colors[i]}
                      strokeWidth={2}
                      dot={({ cx, cy, payload, index }) => {
                        // Check if the value exists before rendering the dot
                        if (payload[key] == null || payload[key] === 0) {
                          return null; // Don't render the dot if there's no data
                        }

                        return (
                          <circle
                            key={`dot-${index}`} // Ensure unique key
                            cx={cx}
                            cy={cy}
                            r={3}
                            stroke={colors[i]}
                            strokeWidth={1}
                            fill={colors[i]}
                          />
                        );
                      }}
                      activeDot={({ payload }) => {
                        // Only show active dot if there's data
                        if (payload[key] == null || payload[key] === 0) {
                          return null; // Don't render active dot if there's no data
                        }

                        return (
                          <circle
                            r={6}
                            stroke="black"
                            strokeWidth={2}
                            fill="white"
                          />
                        );
                      }}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* <div
            className={`bg-white rounded-2xl px-4 pt-4 pb-8 flex flex-col shadow-lg justify-between 
    ${width < 1415 ? "w-full h-1/2" : "w-1/2"} 
    ${
      !isPostSurgeryDetailsFilled(getSelectedLegData())
        ? "pointer-events-none opacity-50"
        : ""
    }
  `}
          >
            <p className="w-full font-bold text-black h-[10%]">
              SURGERY DETAILS
            </p>

            <div className="w-full flex flex-col justify-between h-[90%]">
              <div
                className={`w-full flex ${
                  width < 530 ? "flex-col gap-4" : "flex-row gap-4"
                }`}
              >
                <div
                  ref={(el) => (fieldRefs.current.surgery_date = el)}
                  className={`flex flex-row ${
                    width < 530 ? "w-full" : "w-1/2"
                  }`}
                >
                  <div className="w-full flex flex-col">
                    <p className="font-semibold text-[#475467] text-sm">
                      DATE OF SURGERY
                    </p>
                    {editMode[legKey]?.surgery_date ? (
                      <div className="flex w-full gap-2">
                        <input
                          type="text"
                          placeholder="dd-mm-yyyy"
                          className=" flex-1 border bg-gray-100 text-black p-1 rounded-md text-sm w-1/2"
                          value={selectedDate || ""}
                          onChange={handleManualDateChange}
                          maxLength={10} // Very important: dd-mm-yyyy is 10 character
                        />
                        <input
                          type="text"
                          placeholder="HH:MM"
                          className="flex-1 border bg-gray-100 text-black p-1 rounded-md text-sm w-1/2"
                          value={selectedTime || ""}
                          onChange={handleManualTimeChange}
                          maxLength={5} // HH:MM is exactly 5 characters
                        />

                        <button
                          onClick={() => handleSaveClick("surgery_date")}
                          className="text-green-600 text-xs cursor-pointer"
                        >
                          <ClipboardDocumentCheckIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <p className="font-medium italic text-[#475467] text-sm">
                          {selectedDate || "Not Available"}{" "}
                          {selectedTime || "Not Available"}
                        </p>
                        <button
                          onClick={() => handleEditClick("surgery_date")}
                          className="text-gray-400 hover:text-gray-600 cursor-pointer"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div
                  ref={(el) => (fieldRefs.current.surgery_name = el)}
                  className={`flex flex-col ${
                    width < 530 ? "w-full" : "w-1/2"
                  }`}
                >
                  <p className="font-semibold text-[#475467] text-sm">
                    SURGERY NAME
                  </p>
                  {editMode[legKey]?.surgery_name ? (
                    <div className="flex w-full gap-2">
                      <input
                        value={editValues.surgery_name}
                        onChange={(e) =>
                          handleChange("surgery_name", e.target.value)
                        }
                        className="border flex-1 bg-gray-100 text-black p-1 rounded-md text-sm"
                      />
                      <button
                        onClick={() => handleSaveClick("surgery_name")}
                        className="text-green-600 text-xs cursor-pointer "
                      >
                        <ClipboardDocumentCheckIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="font-medium italic text-[#475467] text-sm">
                        {editValues[legKey]?.surgery_name || "Not Available"}
                      </p>
                      <button
                        onClick={() => handleEditClick("surgery_name")}
                        className="text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div
                className={`w-full flex ${
                  width < 530 ? "flex-col gap-4" : "flex-row"
                }`}
              >
                <div
                  ref={(el) => (fieldRefs.current.surgeon = el)}
                  className={`flex flex-col ${
                    width < 530 ? "w-full" : "w-1/3"
                  }`}
                >
                  <p className="font-semibold text-[#475467] text-sm">
                    SURGEON
                  </p>
                  {editMode[legKey]?.surgeon ? (
                    <div className="flex w-full gap-2">
                      <input
                        value={editValues.surgeon}
                        onChange={(e) =>
                          handleChange("surgeon", e.target.value)
                        }
                        className="border flex-1 bg-gray-100 text-black p-1 rounded-md text-sm"
                      />
                      <button
                        onClick={() => handleSaveClick("surgeon")}
                        className="text-green-600 text-xs cursor-pointer"
                      >
                        <ClipboardDocumentCheckIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="font-medium italic text-[#475467] text-sm">
                        {editValues[legKey]?.surgeon || "Not Available"}
                      </p>
                      <button
                        onClick={() => handleEditClick("surgeon")}
                        className="text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div
                  ref={(el) => (fieldRefs.current.sub_doctor = el)}
                  className={`flex flex-col ${
                    width < 530 ? "w-full" : "w-1/3"
                  }`}
                >
                  <p className="font-semibold text-[#475467] text-sm">
                    SUB DOCTOR NAME
                  </p>
                  {editMode[legKey]?.sub_doctor ? (
                    <div className="flex gap-2">
                      <input
                        value={editValues.sub_doctor}
                        onChange={(e) =>
                          handleChange("sub_doctor", e.target.value)
                        }
                        className="border bg-gray-100 text-black p-1 rounded-md text-sm"
                      />
                      <button
                        onClick={() => handleSaveClick("sub_doctor")}
                        className="text-green-600 text-xs cursor-pointer"
                      >
                        <ClipboardDocumentCheckIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="font-medium italic text-[#475467] text-sm">
                        {editValues[legKey]?.sub_doctor || "Not Available"}
                      </p>
                      <button
                        onClick={() => handleEditClick("sub_doctor")}
                        className="text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div
                  ref={(el) => (fieldRefs.current.procedure = el)}
                  className={`flex flex-col ${
                    width < 530 ? "w-full" : "w-1/3"
                  }`}
                >
                  <p className="font-semibold text-[#475467] text-sm">
                    PROCEDURE
                  </p>
                  {editMode[legKey]?.procedure ? (
                    <div className="flex gap-2">
                      <textarea
                        rows={3}
                        cols={30}
                        className="border bg-gray-100 text-black p-1 rounded-md text-sm resize-none"
                        value={editValues.procedure}
                        onChange={(e) =>
                          handleChange("procedure", e.target.value)
                        }
                      />
                      <button
                        onClick={() => handleSaveClick("procedure")}
                        className="text-green-600 text-xs cursor-pointer"
                      >
                        <ClipboardDocumentCheckIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-[#475467] text-sm">
                        {editValues[legKey]?.procedure?.toLowerCase() ||
                          "Not Available"}
                      </p>
                      <button
                        onClick={() => handleEditClick("procedure")}
                        className="text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div
                className={`w-full flex ${
                  width < 570 ? "flex-col gap-4" : "flex-row"
                }`}
              >
                <div
                  ref={(el) => (fieldRefs.current.implant = el)}
                  className={`flex flex-col ${
                    width < 570 ? "w-full" : "w-[50%]"
                  }`}
                >
                  <p className="font-semibold text-[#475467] text-sm">
                    IMPLANT
                  </p>
                  {editMode[legKey]?.implant ? (
                    <div className="flex gap-2">
                      <input
                        value={editValues.implant}
                        onChange={(e) =>
                          handleChange("implant", e.target.value)
                        }
                        className="border bg-gray-100 text-black p-1 rounded-md text-sm"
                      />
                      <button
                        onClick={() => handleSaveClick("implant")}
                        className="text-green-600 text-xs cursor-pointer"
                      >
                        <ClipboardDocumentCheckIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-[#475467] text-sm">
                        {editValues[legKey]?.implant || "Not Available"}
                      </p>
                      <button
                        onClick={() => handleEditClick("implant")}
                        className="text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div
                  ref={(el) => (fieldRefs.current.technology = el)}
                  className={`flex flex-col ${
                    width < 570 ? "w-full" : "w-[50%]"
                  }`}
                >
                  <p className="font-semibold text-[#475467] text-sm">
                    TECHNOLOGY
                  </p>
                  {editMode[legKey]?.technology ? (
                    <div className="flex gap-2">
                      <input
                        value={editValues.technology}
                        onChange={(e) =>
                          handleChange("technology", e.target.value)
                        }
                        className="border bg-gray-100 text-black p-1 rounded-md text-sm"
                      />
                      <button
                        onClick={() => handleSaveClick("technology")}
                        className="text-green-600 text-xs cursor-pointer"
                      >
                        <ClipboardDocumentCheckIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="font-medium italic text-[#475467] text-sm">
                        {editValues[legKey]?.technology || "Not Available"}
                      </p>
                      <button
                        onClick={() => handleEditClick("technology")}
                        className="text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div> */}



        </div>

        <div
          className={`w-full flex   gap-4 ${
            width < 1415
              ? "flex-col justify-center items-center h-[1000px]"
              : "flex-row h-[400px]"
          }`}
        >
          <div
            className={`flex flex-col bg-white px-4 py-2 rounded-2xl shadow-lg ${
              width < 1415 ? "w-full h-1/2" : "w-1/2"
            }`}
          >
            <p className="font-bold text-sm text-black">
              SHORT FORM 12 (PCS vs MCS)
            </p>
            <ResponsiveContainer width="100%" height="90%">
              <ScatterChart
                margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="8 10" vertical={false} />

                <XAxis
                  type="number"
                  dataKey="x"
                  domain={[-0.5, transformedData.length - 0.5]}
                  tickFormatter={(tick) => {
                    const i = Math.round(tick);
                    return transformedData[i]?.name || "";
                  }}
                  ticks={transformedData.map((_, index) => index)}
                  allowDecimals={false}
                  tick={{ fill: "#615E83", fontSize: 12, fontWeight: 600 }}
                  label={{
                    value: "DAYS",
                    position: "insideBottom",
                    offset: -5,
                    fontWeight: "bold",
                    fill: "#615E83",
                    style: {
                      fill: "#615E83", // label color
                      fontSize: 14, // label font size
                      fontWeight: 700,
                    },
                  }}
                />

                <YAxis
                  type="number"
                  dataKey="y"
                  domain={["dataMin - 10", "dataMax + 10"]}
                  tick={{ fill: "#615E83", fontSize: 12, fontWeight: 600 }}
                  label={{
                    value: "Score ",
                    angle: -90,
                    position: "insideLeft",
                    offset: 10,
                    fontWeight: "bold",
                    fill: "#615E83",
                    style: {
                      fill: "#615E83", // label color
                      fontSize: 14, // label font size
                      fontWeight: 700,
                    },
                  }}
                />

                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div
                          style={{
                            backgroundColor: "white",
                            border: "1px solid #ccc",
                            borderRadius: 5,
                            padding: 8,
                            fontSize: 12,
                            fontWeight: 500,
                            color: "#333",
                          }}
                        >
                          <p style={{ margin: 0 }}>
                            Value: {payload[0].payload.y}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />

                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  iconSize={10}
                  wrapperStyle={{ paddingBottom: 20 }}
                  content={() => {
                    const labels = {
                      pcs: "Physical Component Summary (PCS)",
                      mcs: "Mental Component Summary (MCS)",
                    };

                    const colors = {
                      pcs: "#4A3AFF",
                      mcs: "#962DFF",
                    };

                    return (
                      <ul
                        style={{
                          display: "flex",
                          gap: "20px",
                          listStyle: "none",
                          margin: 0,
                          padding: 0,
                        }}
                      >
                        {Object.entries(labels).map(([key, label]) => (
                          <li
                            key={key}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <span
                              style={{
                                display: "inline-block",
                                width: 7,
                                height: 7,
                                borderRadius: "50%",
                                backgroundColor: colors[key],
                              }}
                            />
                            <span
                              style={{
                                fontWeight: 600,
                                fontSize: 10,
                                color: "black",
                              }}
                            >
                              {label}
                            </span>
                          </li>
                        ))}
                      </ul>
                    );
                  }}
                />

                <ReferenceLine
                  x={surgeryIndex}
                  stroke="limegreen"
                  strokeWidth={2}
                  label={{
                    value: "Surgery",
                    position: "top",
                    fill: "limegreen",
                    fontWeight: "bold",
                    fontSize: 12,
                  }}
                />

                {/* Physical Component Summary (PCS) Scatter */}
                <Scatter
                  name="Physical (PCS)"
                  data={dataPCS.filter(
                    (point) => point.y != null && point.x != null
                  )} // Filter out invalid data
                  fill="red"
                >
                  <ErrorBar
                    dataKey="error"
                    direction="y"
                    width={4}
                    stroke="#4A3AFF"
                  />
                </Scatter>

                {/* Mental Component Summary (MCS) Scatter */}
                <Scatter
                  name="Mental (MCS)"
                  data={dataMCS.filter(
                    (point) => point.y != null && point.x != null
                  )} // Filter out invalid data
                  fill="red"
                >
                  <ErrorBar
                    dataKey="error"
                    direction="y"
                    width={4}
                    stroke="#962DFF"
                  />
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          <div
            className={`flex flex-col bg-white px-4 py-2 rounded-2xl shadow-lg ${
              width < 1415 ? "w-full h-1/2" : "w-1/2"
            }`}
          >
            <p className="font-bold text-sm text-black">OXFORD KNEE SCORE </p>
            <ResponsiveContainer width="100%" height="90%">
              <ComposedChart
                data={databox.filter(
                  (item) =>
                    item.min !== undefined &&
                    item._median !== undefined &&
                    item._min !== undefined &&
                    item._max !== undefined
                )} // Filter out undefined data
                barCategoryGap="70%"
                margin={{ top: 20, bottom: 20, left: 0, right: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload || !Array.isArray(payload))
                      return null;

                    const safeLabel =
                      typeof label === "number" || typeof label === "string"
                        ? label
                        : "Unknown";

                    // Map original names to renamed keys
                    const renameMap = {
                      bottomWhisker: "poorestFunctionObserved",
                      bottomBox: "belowAverageFunctionRange",
                      topBox: "aboveAverageFunctionRange",
                      topWhisker: "bestFunctionObserved",
                      _median: "groupMedianFunctionScore",
                      _min: "lowestFunctionScore",
                      _max: "highestFunctionScore",
                      Patient: "patientFunctionScore",
                    };

                    // Create a dictionary of renamed keys to their values and colors
                    const renamedValues = {};

                    payload.forEach((entry) => {
                      const originalName = entry?.name;
                      const renamedName =
                        renameMap[originalName] || originalName;
                      renamedValues[renamedName] = {
                        value: entry?.value,
                        color: entry?.color ?? "#000",
                      };
                    });

                    // Desired display order
                    const displayOrder = [
                      "patientFunctionScore",
                      "highestFunctionScore",
                      "bestFunctionObserved",
                      "aboveAverageFunctionRange",
                      "groupMedianFunctionScore",
                      "belowAverageFunctionRange",
                      "poorestFunctionObserved",
                      "lowestFunctionScore",
                    ];

                    return (
                      <div
                        style={{
                          background: "#fff",
                          padding: "8px",
                          border: "1px solid #ccc",
                        }}
                      >
                        <p
                          style={{ fontWeight: "bold", margin: 0 }}
                        >{`Timepoint: ${safeLabel}`}</p>
                        {displayOrder.map((key, index) => {
                          const entry = renamedValues[key];
                          if (!entry) return null; // skip if no value for this key

                          return (
                            <p
                              key={index}
                              style={{ margin: 0, color: entry.color }}
                            >
                              {key}:{" "}
                              {typeof entry.value === "number"
                                ? entry.value.toFixed(2)
                                : "N/A"}
                            </p>
                          );
                        })}
                      </div>
                    );
                  }}
                  cursor={{ fill: "rgba(97, 94, 131, 0.1)" }}
                />
                ;
                <Bar stackId="a" dataKey="min" fill="none" />
                <Bar stackId="a" dataKey="bottomWhisker" shape={<DotBar />} />
                <Bar stackId="a" dataKey="bottomBox" fill="#4A3AFF" />
                <Bar stackId="a" dataKey="topBox" fill="#4A3AFF" />
                <Bar stackId="a" dataKey="topWhisker" shape={<DotBar />} />
                {/* Median Line */}
                <Scatter
                  data={databox.filter((item) => item._median !== undefined)} // Ensure valid data
                  shape={(props) => <HorizonBar {...props} dataKey="_median" />}
                  dataKey="_median"
                />
                {/* Min Line */}
                <Scatter
                  data={databox.filter((item) => item._min !== undefined)} // Ensure valid data
                  shape={(props) => (
                    <HorizonBar {...props} dataKey="_min" stroke="#4A3AFF" />
                  )}
                  dataKey="_min"
                />
                {/* Max Line */}
                <Scatter
                  data={databox.filter((item) => item._max !== undefined)} // Ensure valid data
                  shape={(props) => <HorizonBar {...props} dataKey="_max" />}
                  dataKey="_max"
                />
                <ZAxis type="number" dataKey="size" range={[0, 250]} />
                <Scatter
                  data={databox.filter(
                    (item) =>
                      item.Patient !== undefined &&
                      item.Patient !== null &&
                      !isNaN(item.Patient) &&
                      item.Patient < 100 // optional: clamp to realistic max
                  )}
                  dataKey="Patient"
                  fill="#04CE00"
                  stroke="#04CE00"
                  shape={(props) => (
                    <circle
                      cx={props.cx}
                      cy={props.cy}
                      r={4}
                      fill="#04CE00"
                      stroke="#FFF"
                    />
                  )}
                />
                <XAxis
                  dataKey="name"
                  type="category"
                  allowDuplicatedCategory={false}
                  tick={{
                    fill: "#615E83",
                    fontSize: 14,
                    fontWeight: "500",
                  }}
                  axisLine={{ stroke: "#615E83" }}
                  tickLine={{ stroke: "#615E83" }}
                />
                <YAxis
                  label={{
                    value: "SCORE",
                    angle: -90,
                    position: "insideLeft",
                    offset: 20,
                    style: {
                      textAnchor: "middle",
                      fill: "#615E83",
                      fontSize: 14,
                      fontWeight: "bold",
                    },
                  }}
                  tick={{ fill: "#615E83", fontSize: 16, fontWeight: "500" }}
                  axisLine={{ stroke: "#615E83" }}
                  tickLine={{ stroke: "#615E83" }}
                  domain={[0, 48]}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div
          className={`w-full flex   gap-4 ${
            width < 1415
              ? "flex-col justify-center items-center h-[1000px]"
              : "flex-row h-[400px]"
          }`}
        >
          <div
            className={`flex flex-col bg-white px-4 py-2 rounded-2xl shadow-lg ${
              width < 1415 ? "w-full h-1/2" : "w-1/2"
            }`}
          >
            <p className="font-bold text-sm text-black">SHORT FORM 12</p>
            <ResponsiveContainer width="100%" height="90%">
              <ComposedChart
                data={sf12Databox}
                barCategoryGap="70%"
                margin={{ top: 20, bottom: 20, left: 0, right: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload || !Array.isArray(payload))
                      return null;

                    const safeLabel =
                      typeof label === "number" || typeof label === "string"
                        ? label
                        : "Unknown";

                    // Map original names to renamed keys
                    const renameMap = {
                      bottomWhisker: "poorestFunctionObserved",
                      bottomBox: "belowAverageFunctionRange",
                      topBox: "aboveAverageFunctionRange",
                      topWhisker: "bestFunctionObserved",
                      _median: "groupMedianFunctionScore",
                      _min: "lowestFunctionScore",
                      _max: "highestFunctionScore",
                      Patient: "patientFunctionScore",
                    };

                    // Store renamed entries by key
                    const renamedEntries = {};

                    payload.forEach((entry) => {
                      const value = entry?.value;
                      const color = entry?.color ?? "#000";

                      let renamedName = renameMap[entry?.name] ?? entry?.name;

                      renamedEntries[renamedName] = { value, color };
                    });

                    // Desired display order
                    const displayOrder = [
                      "patientFunctionScore",
                      "highestFunctionScore",
                      "bestFunctionObserved",
                      "aboveAverageFunctionRange",
                      "groupMedianFunctionScore",
                      "belowAverageFunctionRange",
                      "poorestFunctionObserved",
                      "lowestFunctionScore",
                    ];

                    return (
                      <div
                        style={{
                          background: "#fff",
                          padding: "8px",
                          border: "1px solid #ccc",
                        }}
                      >
                        <p
                          style={{ fontWeight: "bold", margin: 0 }}
                        >{`Timepoint: ${safeLabel}`}</p>
                        {displayOrder.map((key, index) => {
                          const entry = renamedEntries[key];
                          if (!entry) return null; // skip if no data for this key

                          return (
                            <p
                              key={index}
                              style={{ margin: 0, color: entry.color }}
                            >
                              {key}:{" "}
                              {typeof entry.value === "number"
                                ? entry.value.toFixed(2)
                                : "N/A"}
                            </p>
                          );
                        })}
                      </div>
                    );
                  }}
                  cursor={{ fill: "rgba(97, 94, 131, 0.1)" }}
                />
                ;
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  iconSize={10}
                  wrapperStyle={{ paddingBottom: 20 }}
                  content={() => {
                    const labels = {
                      other: "Other Patients",
                      oks: "Short Form 12",
                    };

                    const colors = {
                      other: "#4A3AFF",
                      oks: "#04CE00",
                    };

                    return (
                      <ul
                        style={{
                          display: "flex",
                          gap: "20px",
                          listStyle: "none",
                          margin: 0,
                          padding: 0,
                        }}
                      >
                        {Object.entries(labels).map(([key, label]) => (
                          <li
                            key={key}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <span
                              style={{
                                display: "inline-block",
                                width: 7,
                                height: 7,
                                borderRadius: "50%",
                                backgroundColor: colors[key],
                              }}
                            />
                            <span
                              style={{
                                fontWeight: 600,
                                fontSize: 10,
                                color: "black",
                              }}
                            >
                              {label}
                            </span>
                          </li>
                        ))}
                      </ul>
                    );
                  }}
                />
                <Bar stackId="a" dataKey="min" fill="none" />
                <Bar stackId="a" dataKey="bottomWhisker" shape={<DotBar />} />
                <Bar stackId="a" dataKey="bottomBox" fill="#4A3AFF" />
                <Bar stackId="a" dataKey="topBox" fill="#4A3AFF" />
                <Bar stackId="a" dataKey="topWhisker" shape={<DotBar />} />
                {/* Median Line */}
                <Scatter
                  data={sf12Databox}
                  shape={(props) => <HorizonBar {...props} dataKey="_median" />}
                  dataKey="_median"
                />
                {/* Min Line */}
                <Scatter
                  data={sf12Databox}
                  shape={(props) => (
                    <HorizonBar {...props} dataKey="_min" stroke="#4A3AFF" />
                  )}
                  dataKey="_min"
                />
                {/* Max Line */}
                <Scatter
                  data={sf12Databox}
                  shape={(props) => <HorizonBar {...props} dataKey="_max" />}
                  dataKey="_max"
                />
                <ZAxis type="number" dataKey="size" range={[0, 250]} />
                <Scatter
                  data={sf12Databox.filter(
                    (item) =>
                      item.Patient !== undefined &&
                      item.Patient !== null &&
                      !isNaN(item.Patient) &&
                      item.Patient <= 100 // Optional: clamp to a reasonable max, adjust as needed
                  )}
                  dataKey="Patient"
                  fill="#04CE00"
                  stroke="#04CE00"
                  shape={(props) => (
                    <circle
                      cx={props.cx}
                      cy={props.cy}
                      r={4}
                      fill="#04CE00"
                      stroke="#FFF"
                    />
                  )}
                />
                <XAxis
                  dataKey="name"
                  type="category"
                  allowDuplicatedCategory={false}
                  tick={{
                    fill: "#615E83",
                    fontSize: 14,
                    fontWeight: "500",
                  }}
                  axisLine={{ stroke: "#615E83" }}
                  tickLine={{ stroke: "#615E83" }}
                />
                <YAxis
                  label={{
                    value: "SCORE",
                    angle: -90,
                    position: "insideLeft",
                    offset: 20,
                    style: {
                      textAnchor: "middle",
                      fill: "#615E83",
                      fontSize: 14,
                      fontWeight: "bold",
                    },
                  }}
                  tick={{ fill: "#615E83", fontSize: 16, fontWeight: "500" }}
                  axisLine={{ stroke: "#615E83" }}
                  tickLine={{ stroke: "#615E83" }}
                  domain={[0, 100]}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div
            className={`flex flex-col bg-white px-4 py-2 rounded-2xl shadow-lg ${
              width < 1415 ? "w-full h-1/2" : "w-1/2"
            }`}
          >
            <p className="font-bold text-sm text-black">
              KNEE INJURY AND OSTHEOARTHRITIS OUTCOME SCORE (KOOS)
            </p>
            <ResponsiveContainer width="100%" height="90%">
              <ComposedChart
                data={koosDatabox}
                barCategoryGap="70%"
                margin={{ top: 20, bottom: 20, left: 0, right: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload || !Array.isArray(payload))
                      return null;

                    const safeLabel =
                      typeof label === "number" || typeof label === "string"
                        ? label
                        : "Unknown";

                    // Map original names to renamed keys
                    const renameMap = {
                      bottomWhisker: "poorestFunctionObserved",
                      bottomBox: "belowAverageFunctionRange",
                      topBox: "aboveAverageFunctionRange",
                      topWhisker: "bestFunctionObserved",
                      _median: "groupMedianFunctionScore",
                      _min: "lowestFunctionScore",
                      _max: "highestFunctionScore",
                      Patient: "patientFunctionScore",
                    };

                    // Collect renamed entries here
                    const renamedEntries = {};

                    payload.forEach((entry) => {
                      const value = entry?.value;
                      const color = entry?.color ?? "#000";

                      // Rename or fallback to original name
                      const renamedName = renameMap[entry?.name] ?? entry?.name;

                      renamedEntries[renamedName] = { value, color };
                    });

                    // Specify your desired display order here
                    const displayOrder = [
                      "patientFunctionScore",
                      "highestFunctionScore",
                      "bestFunctionObserved",
                      "aboveAverageFunctionRange",
                      "groupMedianFunctionScore",
                      "belowAverageFunctionRange",
                      "poorestFunctionObserved",
                      "lowestFunctionScore",
                    ];

                    return (
                      <div
                        style={{
                          background: "#fff",
                          padding: "8px",
                          border: "1px solid #ccc",
                        }}
                      >
                        <p
                          style={{ fontWeight: "bold", margin: 0 }}
                        >{`Day: ${safeLabel}`}</p>
                        {displayOrder.map((key, index) => {
                          const entry = renamedEntries[key];
                          if (!entry) return null; // Skip if this key doesn't exist

                          return (
                            <p
                              key={index}
                              style={{ margin: 0, color: entry.color }}
                            >
                              {key}:{" "}
                              {typeof entry.value === "number"
                                ? entry.value.toFixed(2)
                                : "N/A"}
                            </p>
                          );
                        })}
                      </div>
                    );
                  }}
                  cursor={{ fill: "rgba(97, 94, 131, 0.1)" }}
                />
                ;
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  iconSize={10}
                  wrapperStyle={{ paddingBottom: 20 }}
                  content={() => {
                    const labels = {
                      other: "Other Patients",
                      oks: "Knee Injury and Osteoarthritis Outcome Score (KOOS)",
                    };

                    const colors = {
                      other: "#4A3AFF",
                      oks: "#04CE00",
                    };

                    return (
                      <ul
                        style={{
                          display: "flex",
                          gap: "20px",
                          listStyle: "none",
                          margin: 0,
                          padding: 0,
                        }}
                      >
                        {Object.entries(labels).map(([key, label]) => (
                          <li
                            key={key}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <span
                              style={{
                                display: "inline-block",
                                width: 7,
                                height: 7,
                                borderRadius: "50%",
                                backgroundColor: colors[key],
                              }}
                            />
                            <span
                              style={{
                                fontWeight: 600,
                                fontSize: 10,
                                color: "black",
                              }}
                            >
                              {label}
                            </span>
                          </li>
                        ))}
                      </ul>
                    );
                  }}
                />
                <Bar stackId="a" dataKey="min" fill="none" />
                <Bar stackId="a" dataKey="bottomWhisker" shape={<DotBar />} />
                <Bar stackId="a" dataKey="bottomBox" fill="#4A3AFF" />
                <Bar stackId="a" dataKey="topBox" fill="#4A3AFF" />
                <Bar stackId="a" dataKey="topWhisker" shape={<DotBar />} />
                {/* Median Line */}
                <Scatter
                  data={koosDatabox}
                  shape={(props) => <HorizonBar {...props} dataKey="_median" />}
                  dataKey="_median"
                />
                {/* Min Line */}
                <Scatter
                  data={koosDatabox}
                  shape={(props) => (
                    <HorizonBar {...props} dataKey="_min" stroke="#4A3AFF" />
                  )}
                  dataKey="_min"
                />
                {/* Max Line */}
                <Scatter
                  data={koosDatabox}
                  shape={(props) => <HorizonBar {...props} dataKey="_max" />}
                  dataKey="_max"
                />
                <ZAxis type="number" dataKey="size" range={[0, 250]} />
                <Scatter
                  data={koosDatabox.filter(
                    (item) =>
                      item.Patient !== undefined &&
                      item.Patient !== null &&
                      !isNaN(item.Patient) &&
                      item.Patient < 100 // Optional: clamp to a reasonable max, adjust as needed
                  )}
                  dataKey="Patient"
                  fill="#04CE00"
                  stroke="#04CE00"
                  shape={(props) => (
                    <circle
                      cx={props.cx}
                      cy={props.cy}
                      r={4}
                      fill="#04CE00"
                      stroke="#FFF"
                    />
                  )}
                />
                <XAxis
                  dataKey="name"
                  type="category"
                  allowDuplicatedCategory={false}
                  tick={{
                    fill: "#615E83",
                    fontSize: 14,
                    fontWeight: "500",
                  }}
                  axisLine={{ stroke: "#615E83" }}
                  tickLine={{ stroke: "#615E83" }}
                />
                <YAxis
                  label={{
                    value: "SCORE",
                    angle: -90,
                    position: "insideLeft",
                    offset: 20,
                    style: {
                      textAnchor: "middle",
                      fill: "#615E83",
                      fontSize: 14,
                      fontWeight: "bold",
                    },
                  }}
                  tick={{ fill: "#615E83", fontSize: 16, fontWeight: "500" }}
                  axisLine={{ stroke: "#615E83" }}
                  tickLine={{ stroke: "#615E83" }}
                  domain={[0, 28]} // Set domain to match your data range
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div
          className={`w-full flex   gap-4 ${
            width < 1415
              ? "flex-col justify-center items-center h-[500px]"
              : "flex-row h-[400px]"
          }`}
        >
          <div
            className={`flex flex-col bg-white px-4 py-2 rounded-2xl shadow-lg ${
              width < 1415 ? "w-full h-1/2" : "w-1/2"
            }`}
          >
            <p className="font-bold text-sm text-black">
              KNEE SOCIETY SCORE (KSS)
            </p>
            <ResponsiveContainer width="100%" height="90%">
              <ComposedChart
                data={kssDatabox}
                barCategoryGap="70%"
                margin={{ top: 20, bottom: 20, left: 0, right: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload || !Array.isArray(payload))
                      return null;

                    const safeLabel =
                      typeof label === "number" || typeof label === "string"
                        ? label
                        : "Unknown";

                    // Map original names to renamed keys
                    const renameMap = {
                      bottomWhisker: "poorestFunctionObserved",
                      bottomBox: "belowAverageFunctionRange",
                      topBox: "aboveAverageFunctionRange",
                      topWhisker: "bestFunctionObserved",
                      _median: "groupMedianFunctionScore",
                      _min: "lowestFunctionScore",
                      _max: "highestFunctionScore",
                      Patient: "patientFunctionScore",
                    };

                    // Collect renamed entries here
                    const renamedEntries = {};

                    payload.forEach((entry) => {
                      const value = entry?.value;
                      const color = entry?.color ?? "#000";

                      // Rename or fallback to original name
                      const renamedName = renameMap[entry?.name] ?? entry?.name;

                      renamedEntries[renamedName] = { value, color };
                    });

                    // Order in which you want to display the entries
                    const displayOrder = [
                      "patientFunctionScore",
                      "highestFunctionScore",
                      "bestFunctionObserved",
                      "aboveAverageFunctionRange",
                      "groupMedianFunctionScore",
                      "belowAverageFunctionRange",
                      "poorestFunctionObserved",
                      "lowestFunctionScore",
                    ];

                    return (
                      <div
                        style={{
                          background: "#fff",
                          padding: "8px",
                          border: "1px solid #ccc",
                        }}
                      >
                        <p
                          style={{ fontWeight: "bold", margin: 0 }}
                        >{`Day: ${safeLabel}`}</p>
                        {displayOrder.map((key, index) => {
                          const entry = renamedEntries[key];
                          if (!entry) return null;

                          return (
                            <p
                              key={index}
                              style={{ margin: 0, color: entry.color }}
                            >
                              {key}:{" "}
                              {typeof entry.value === "number"
                                ? entry.value.toFixed(2)
                                : "N/A"}
                            </p>
                          );
                        })}
                      </div>
                    );
                  }}
                  cursor={{ fill: "rgba(97, 94, 131, 0.1)" }}
                />
                ;
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  iconSize={10}
                  wrapperStyle={{ paddingBottom: 20 }}
                  content={() => {
                    const labels = {
                      other: "Other Patients",
                      oks: "Knee Scociety Score",
                    };

                    const colors = {
                      other: "#4A3AFF",
                      oks: "#04CE00",
                    };

                    return (
                      <ul
                        style={{
                          display: "flex",
                          gap: "20px",
                          listStyle: "none",
                          margin: 0,
                          padding: 0,
                        }}
                      >
                        {Object.entries(labels).map(([key, label]) => (
                          <li
                            key={key}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <span
                              style={{
                                display: "inline-block",
                                width: 7,
                                height: 7,
                                borderRadius: "50%",
                                backgroundColor: colors[key],
                              }}
                            />
                            <span
                              style={{
                                fontWeight: 600,
                                fontSize: 10,
                                color: "black",
                              }}
                            >
                              {label}
                            </span>
                          </li>
                        ))}
                      </ul>
                    );
                  }}
                />
                <Bar stackId="a" dataKey="min" fill="none" />
                <Bar stackId="a" dataKey="bottomWhisker" shape={<DotBar />} />
                <Bar stackId="a" dataKey="bottomBox" fill="#4A3AFF" />
                <Bar stackId="a" dataKey="topBox" fill="#4A3AFF" />
                <Bar stackId="a" dataKey="topWhisker" shape={<DotBar />} />
                {/* Median Line */}
                <Scatter
                  data={kssDatabox}
                  shape={(props) => <HorizonBar {...props} dataKey="_median" />}
                  dataKey="_median"
                />
                {/* Min Line */}
                <Scatter
                  data={kssDatabox}
                  shape={(props) => (
                    <HorizonBar {...props} dataKey="_min" stroke="#4A3AFF" />
                  )}
                  dataKey="_min"
                />
                {/* Max Line */}
                <Scatter
                  data={kssDatabox}
                  shape={(props) => <HorizonBar {...props} dataKey="_max" />}
                  dataKey="_max"
                />
                <ZAxis type="number" dataKey="size" range={[0, 250]} />
                <Scatter
                  data={kssDatabox.filter(
                    (item) =>
                      item.Patient !== undefined &&
                      item.Patient !== null &&
                      !isNaN(item.Patient) &&
                      item.Patient < 100 // Optional: clamp to a reasonable max, adjust as needed
                  )}
                  dataKey="Patient"
                  fill="#04CE00"
                  stroke="#04CE00"
                  shape={(props) => (
                    <circle
                      cx={props.cx}
                      cy={props.cy}
                      r={4}
                      fill="#04CE00"
                      stroke="#FFF"
                    />
                  )}
                />
                <XAxis
                  dataKey="name"
                  type="category"
                  allowDuplicatedCategory={false}
                  tick={{
                    fill: "#615E83",
                    fontSize: 14,
                    fontWeight: "500",
                  }}
                  axisLine={{ stroke: "#615E83" }}
                  tickLine={{ stroke: "#615E83" }}
                />
                <YAxis
                  label={{
                    value: "SCORE",
                    angle: -90,
                    position: "insideLeft",
                    offset: 20,
                    style: {
                      textAnchor: "middle",
                      fill: "#615E83",
                      fontSize: 14,
                      fontWeight: "bold",
                    },
                  }}
                  tick={{ fill: "#615E83", fontSize: 16, fontWeight: "500" }}
                  axisLine={{ stroke: "#615E83" }}
                  tickLine={{ stroke: "#615E83" }}
                  domain={[0, 100]} // Set domain to match your data range
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div
            className={`flex flex-col bg-white px-4 py-2 rounded-2xl shadow-lg ${
              width < 1415 ? "w-full h-full" : "w-1/2"
            }`}
          >
            <p className="font-bold text-sm text-black">
              FORGOTTEN JOINT SCORE (FJS){" "}
            </p>
            <ResponsiveContainer width="100%" height="90%">
              <ComposedChart
                data={fjsDatabox}
                barCategoryGap="70%"
                margin={{ top: 20, bottom: 20, left: 0, right: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />

                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload || !Array.isArray(payload))
                      return null;

                    const safeLabel =
                      typeof label === "number" || typeof label === "string"
                        ? label
                        : "Unknown";

                    // Map original names to renamed keys
                    const renameMap = {
                      bottomWhisker: "poorestFunctionObserved",
                      bottomBox: "belowAverageFunctionRange",
                      topBox: "aboveAverageFunctionRange",
                      topWhisker: "bestFunctionObserved",
                      _median: "groupMedianFunctionScore",
                      _min: "lowestFunctionScore",
                      _max: "highestFunctionScore",
                      Patient: "patientFunctionScore",
                    };

                    // Collect renamed entries here
                    const renamedEntries = {};

                    payload.forEach((entry) => {
                      const value = entry?.value;
                      const color = entry?.color ?? "#000";

                      // Rename or fallback to original name
                      const renamedName = renameMap[entry?.name] ?? entry?.name;

                      renamedEntries[renamedName] = { value, color };
                    });

                    // Order in which you want to display the entries
                    const displayOrder = [
                      "patientFunctionScore",
                      "highestFunctionScore",
                      "bestFunctionObserved",
                      "aboveAverageFunctionRange",
                      "groupMedianFunctionScore",
                      "belowAverageFunctionRange",
                      "poorestFunctionObserved",
                      "lowestFunctionScore",
                    ];

                    return (
                      <div
                        style={{
                          background: "#fff",
                          padding: "8px",
                          border: "1px solid #ccc",
                        }}
                      >
                        <p
                          style={{ fontWeight: "bold", margin: 0 }}
                        >{`Day: ${safeLabel}`}</p>
                        {displayOrder.map((name, index) => {
                          const entry = renamedEntries[name];
                          if (!entry) return null;
                          const value = entry.value;

                          return (
                            <p
                              key={index}
                              style={{
                                margin: 0,
                                color: entry.color ?? "#000",
                              }}
                            >
                              {name}:{" "}
                              {value !== null && typeof value === "number"
                                ? value.toFixed(2)
                                : "No Data Available"}
                            </p>
                          );
                        })}
                      </div>
                    );
                  }}
                  cursor={{ fill: "rgba(97, 94, 131, 0.1)" }}
                />

                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  iconSize={10}
                  wrapperStyle={{ paddingBottom: 20 }}
                  content={() => {
                    const labels = {
                      other: "Other Patients",
                      oks: "Forgotten Joint Score",
                    };

                    const colors = {
                      other: "#4A3AFF",
                      oks: "#04CE00",
                    };

                    return (
                      <ul
                        style={{
                          display: "flex",
                          gap: "20px",
                          listStyle: "none",
                          margin: 0,
                          padding: 0,
                        }}
                      >
                        {Object.entries(labels).map(([key, label]) => (
                          <li
                            key={key}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <span
                              style={{
                                display: "inline-block",
                                width: 7,
                                height: 7,
                                borderRadius: "50%",
                                backgroundColor: colors[key],
                              }}
                            />
                            <span
                              style={{
                                fontWeight: 600,
                                fontSize: 10,
                                color: "black",
                              }}
                            >
                              {label}
                            </span>
                          </li>
                        ))}
                      </ul>
                    );
                  }}
                />

                <Bar stackId="a" dataKey="min" fill="none" />
                <Bar stackId="a" dataKey="bottomWhisker" shape={<DotBar />} />
                <Bar stackId="a" dataKey="bottomBox" fill="#4A3AFF" />
                <Bar stackId="a" dataKey="topBox" fill="#4A3AFF" />
                <Bar stackId="a" dataKey="topWhisker" shape={<DotBar />} />

                {/* Median Line */}
                <Scatter
                  data={fjsDatabox}
                  shape={(props) => <HorizonBar {...props} dataKey="_median" />}
                  dataKey="_median"
                />

                {/* Min Line */}
                <Scatter
                  data={fjsDatabox}
                  shape={(props) => (
                    <HorizonBar {...props} dataKey="_min" stroke="#4A3AFF" />
                  )}
                  dataKey="_min"
                />

                {/* Max Line */}
                <Scatter
                  data={fjsDatabox}
                  shape={(props) => <HorizonBar {...props} dataKey="_max" />}
                  dataKey="_max"
                />

                <ZAxis type="number" dataKey="size" range={[0, 250]} />
                <Scatter
                  data={fjsDatabox.filter(
                    (item) =>
                      item.Patient !== undefined &&
                      item.Patient !== null &&
                      !isNaN(item.Patient) &&
                      item.Patient < 100 // Optional: clamp to a reasonable max, adjust as needed
                  )}
                  dataKey="Patient"
                  fill="#04CE00"
                  stroke="#04CE00"
                  shape={(props) => (
                    <circle
                      cx={props.cx}
                      cy={props.cy}
                      r={4}
                      fill="#04CE00"
                      stroke="#FFF"
                    />
                  )}
                />
                <XAxis
                  dataKey="name"
                  type="category"
                  allowDuplicatedCategory={false}
                  tick={{
                    fill: "#615E83",
                    fontSize: 14,
                    fontWeight: "500",
                  }}
                  axisLine={{ stroke: "#615E83" }}
                  tickLine={{ stroke: "#615E83" }}
                />

                <YAxis
                  label={{
                    value: "SCORE",
                    angle: -90,
                    position: "insideLeft",
                    offset: 20,
                    style: {
                      textAnchor: "middle",
                      fill: "#615E83",
                      fontSize: 14,
                      fontWeight: "bold",
                    },
                  }}
                  tick={{ fill: "#615E83", fontSize: 16, fontWeight: "500" }}
                  axisLine={{ stroke: "#615E83" }}
                  tickLine={{ stroke: "#615E83" }}
                  domain={[0, 60]} // Set domain to match your data range
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {warning && (
        <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-6 py-3 rounded-lg shadow-lg animate-fade-in-out">
            {warning}
          </div>
        </div>
      )}

      <Surgeryreport
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        patient={patient}
        userData={userData}
        onSurgeryUpdate={(updatedDetails) => {
          setsurgeryPatient((prev) => ({
            ...prev,
            post_surgery_details: updatedDetails,
          }));
        }}
      />
    </>
  );
};

export default page;
