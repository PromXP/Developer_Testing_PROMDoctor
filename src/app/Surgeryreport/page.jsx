"use client";
import React, {
  useState,
  useEffect,
  useRef,
  PureComponent,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { API_URL } from "../libs/global";

import Closeicon from "@/app/assets/closeicon.png";
import Calendar from "@/app/assets/calendar.png";

const page = ({ isOpen, onClose, patient, userData, onSurgeryUpdate }) => {
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
  const [selectedLeg, setSelectedLeg] = useState("left");
  // Auto-switch leg if left surgery is completed
  useEffect(() => {
    const isLeftCompleted =
      !!patient?.post_surgery_details_left?.date_of_surgery &&
      !patient?.post_surgery_details_left?.date_of_surgery
        .toString()
        .startsWith("0001-01-01");

    if (isLeftCompleted && selectedLeg === "left") {
      setSelectedLeg("right");
    }
  }, [patient]);

  const [isManualDate, setIsManualDate] = useState(false);

  function formatDateToDDMMYYYY(dateStr) {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split("-");
    return `${day}-${month}-${year}`;
  }

  const [selectedDate, setSelectedDate] = useState("");
  // Set selected date based on selected leg and completion status
  // useEffect(() => {
  //   const isLeftCompleted =
  //     !!patient?.post_surgery_details_left?.date_of_surgery &&
  //     !patient?.post_surgery_details_left?.date_of_surgery
  //       .toString()
  //       .startsWith("0001-01-01");

  //   const isRightCompleted =
  //     !!patient?.post_surgery_details_right?.date_of_surgery &&
  //     !patient?.post_surgery_details_right?.date_of_surgery
  //       .toString()
  //       .startsWith("0001-01-01");

  //   if (selectedLeg === "left") {
  //     if (!isLeftCompleted) {
  //       setSelectedDate(
  //         formatDateToDDMMYYYY(patient?.surgery_scheduled_left?.date)
  //       );
  //       setIsManualDate(false);
  //     } else {
  //       setSelectedDate("");
  //       setIsManualDate(false);
  //     }
  //   } else if (selectedLeg === "right") {
  //     if (!isRightCompleted) {
  //       setSelectedDate(
  //         formatDateToDDMMYYYY(patient?.surgery_scheduled_right?.date)
  //       );
  //       setIsManualDate(false);
  //     } else {
  //       setSelectedDate("");
  //       setIsManualDate(false);
  //     }
  //   }
  // }, [patient, selectedLeg]);

  const isLeftSurgeryFinalized =
    !!patient?.post_surgery_details_left?.date_of_surgery &&
    !patient?.post_surgery_details_left?.date_of_surgery
      .toString()
      .startsWith("0001-01-01");

  const isRightSurgeryFinalized =
    !!patient?.post_surgery_details_right?.date_of_surgery &&
    !patient?.post_surgery_details_right?.date_of_surgery
      .toString()
      .startsWith("0001-01-01");

  const dateInputRef = useRef(null);

  // const openDatePicker = () => {
  //   dateInputRef.current?.showPicker();
  // };

  // const handleDateChange = (e) => {
  //   const dateValue = e.target.value;
  //   if (dateValue) {
  //     const formattedDate = new Date(dateValue).toLocaleDateString("en-GB", {
  //       day: "2-digit",
  //       month: "short",
  //       year: "numeric",
  //     });
  //     setSelectedDate(formattedDate);
  //   }
  // };

  const [surgery, setSurgery] = useState("");
  const [subdoctor, setSubDoctor] = useState("");
  const [procedure, setProcedure] = useState("");
  const [implant, setImplant] = useState("");
  const [technology, setTechnology] = useState("");

  const [warning, setWarning] = useState("");

  // const handleManualDateChange = (e) => {
  //   setIsManualDate(true);

  //   let value = e.target.value.replace(/\D/g, ""); // Remove all non-digits

  //   if (value.length >= 3 && value.length <= 4) {
  //     value = value.slice(0, 2) + "-" + value.slice(2);
  //   } else if (value.length > 4 && value.length <= 8) {
  //     value =
  //       value.slice(0, 2) + "-" + value.slice(2, 4) + "-" + value.slice(4);
  //   } else if (value.length > 8) {
  //     value = value.slice(0, 8);
  //     value =
  //       value.slice(0, 2) + "-" + value.slice(2, 4) + "-" + value.slice(4);
  //   }

  //   // Until full date entered, show raw value
  //   setSelectedDate(value);

  //   if (value.length === 10) {
  //     const [dayStr, monthStr, yearStr] = value.split("-");
  //     const day = parseInt(dayStr, 10);
  //     const month = parseInt(monthStr, 10);
  //     const year = parseInt(yearStr, 10);

  //     const today = new Date();
  //     const currentYear = today.getFullYear();

  //     // Basic validations
  //     if (
  //       day < 1 ||
  //       day > 31 ||
  //       month < 1 ||
  //       month > 12 ||
  //       year > currentYear
  //     ) {
  //       setWarning("Surgery Date should not be a future date");
  //       // setSelectedDate("");
  //       return;
  //     }

  //     const manualDate = new Date(`${year}-${month}-${day}`);
  //     if (
  //       manualDate.getDate() !== day ||
  //       manualDate.getMonth() + 1 !== month ||
  //       manualDate.getFullYear() !== year
  //     ) {
  //       setWarning("Invalid date combination. Please enter a correct date.");
  //       // setSelectedDate("");
  //       return;
  //     }

  //     today.setHours(0, 0, 0, 0);
  //     manualDate.setHours(0, 0, 0, 0);

  //     if (manualDate > today) {
  //       setWarning("Surgery date cannot be a future date.");
  //       // setSelectedDate("");
  //       return;
  //     }

  //     // If all valid, format as "dd Mmm yyyy"
  //     const formattedDate = manualDate.toLocaleDateString("en-GB", {
  //       day: "2-digit",
  //       month: "short",
  //       year: "numeric",
  //     });

  //     setSelectedDate(formattedDate);
  //   }
  // };
function convertToISO(dateStr, timeStr) {
  if (!dateStr || !timeStr) return "";

  const [year, month, day] = dateStr.split("-");
  const [hour = "00", minute = "00"] = timeStr.split(":");

  const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute));

  return utcDate.toISOString();
}




  const surgerydatacheck = async () => {
    let date = "";
    let time = "";
    let isoFormattedDateTime = "";

    if (selectedLeg === "left") {
      date = patient?.surgery_scheduled_left?.date;
      time = patient?.surgery_scheduled_left?.time;
    } else if (selectedLeg === "right") {
      date = patient?.surgery_scheduled_right?.date;
      time = patient?.surgery_scheduled_right?.time;
    }

    isoFormattedDateTime = convertToISO(date, time);

    if (!date || !time) {
      setWarning("Surgery Date and Time Not found");
      return;
    }
    if (surgery.trim() === "") {
      setWarning("Enter Surgery Name");
      return;
    }
    if (subdoctor.trim() === "") {
      setWarning("Enter Sub Doctor Name");
      return;
    }
    if (procedure.trim() === "") {
      setWarning("Enter Surgery Procedure");
      return;
    }
    if (implant.trim() === "") {
      setWarning("Enter Implant Name");
      return;
    }
    if (technology.trim() === "") {
      setWarning("Enter Technology Name");
      return;
    }

    // let isoFormattedDate = "";

    // if (isManualDate) {
    //   const [day, month, year] = selectedDate.split("-");
    //   isoFormattedDate = new Date(`${year}-${month}-${day}`)
    //     .toISOString()
    //     .split("T")[0];
    // } else {
    //   // Pre-filled already in dd-mm-yyyy format
    //   const [day, month, year] = selectedDate.split("-");
    //   isoFormattedDate = `${year}-${month}-${day}`;
    // }

    if (selectedLeg === "left") {
      const payload = {
        uhid: patient?.uhid || "", // ensure patient object is passed as prop
        post_surgery_details_left: {
          date_of_surgery: isoFormattedDateTime,
          surgeon: patient?.doctor_name, // hardcoded for now
          surgery_name: surgery,
          sub_doctor: subdoctor,
          procedure: procedure,
          implant: implant,
          technology: technology,
        },
      };

      console.log("Left Payload",payload);
    

      try {
        const response = await fetch(
          API_URL + "update-post-surgery-details-left",
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          }
        );

        const result = await response.json();

        if (!response.ok) {
          setWarning(extractErrorMessage(result.detail) || "Failed to update surgery details for left leg");
          console.log(extractErrorMessage(result.detail));

          return;
        }
        console.log("Successfully updated left leg");
        setWarning("Left leg Surgery details updated successfully!");
        if (onSurgeryUpdate) {
          if (selectedLeg === "left") {
            onSurgeryUpdate(payload.post_surgery_details_left);
          } else {
            onSurgeryUpdate(payload.post_surgery_details_right);
          }
        }
        setTimeout(() => {
          setWarning("");
          window.location.reload();
        }, 2000);
      } catch (error) {
        console.error("Error left leg:", error);
        setWarning("Something went wrong while updating left leg.");
      }
    }

    if (selectedLeg === "right") {
      const payload = {
        uhid: patient?.uhid || "", // ensure patient object is passed as prop
        post_surgery_details_right: {
          date_of_surgery: isoFormattedDateTime,
          surgeon: patient?.doctor_name, // hardcoded for now
          surgery_name: surgery,
          sub_doctor: subdoctor,
          procedure: procedure,
          implant: implant,
          technology: technology,
        },
      };
      try {
        const response = await fetch(
          API_URL + "update-post-surgery-details-right",
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          }
        );

        const result = await response.json();

        if (!response.ok) {
          setWarning(
            result.detail || "Failed to update surgery details for Right Leg"
          );
          return;
        }
        console.log("Successfully updated right leg");
        setWarning("Surgery details updated successfully for Right Leg!");
        if (onSurgeryUpdate) {
          onSurgeryUpdate(payload.post_surgery_details);
        }
        setTimeout(() => {
          setWarning("");
          window.location.reload();
        }, 2000);
      } catch (error) {
        console.error("Error right leg:", error);
        setWarning("Something went wrong while updating right leg.");
      }
    }
  };

  // Handle detail being an object or array
const extractErrorMessage = (detail) => {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map(d => d.msg).join(", ");
  if (typeof detail === "object" && detail.msg) return detail.msg;
  return "Unknown error occurred";
};


  useEffect(() => {
    if (warning) {
      const timer = setTimeout(() => setWarning(""), 2000);
      return () => clearTimeout(timer);
    }
  }, [warning]);

  const handleClearAlldsurgerydata = () => {
    setSurgery("");
    setProcedure("");
    setImplant("");
    setTechnology("");
    setSelectedDate("");
  };

  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-40 "
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.7)", // white with 50% opacity
      }}
    >
      <div
        className={`
          min-h-screen w-full flex flex-col items-center
          ${width < 950 ? "p-4 gap-4 justify-center" : "p-4 justify-center"}
        `}
      >
        <div
          className={` bg-white rounded-2xl px-4 py-4 flex flex-col justify-between relative ${
            width < 970 ? "w-full" : "w-[45%]"
          }`}
        >
          <div className="absolute top-2 right-4">
            <Image
              className={`cursor-pointer ${
                width < 530 ? "w-4 h-4" : "w-4 h-4"
              }`}
              src={Closeicon}
              alt="close"
              onClick={onClose}
            />
          </div>

          <div
            className={` bg-white flex flex-col justify-between ${
              width < 970 ? "w-full gap-4" : "w-full gap-5"
            }`}
          >
            <div
              className={`w-full flex ${
                width < 530 ? "flex-col gap-4" : "flex-row"
              }`}
            >
              <p className="w-1/2 font-bold text-black">SURGERY DETAILS</p>
              <div className="w-1/2 flex justify-start gap-2">
                <button
                  onClick={() =>
                    !isLeftSurgeryFinalized && setSelectedLeg("left")
                  }
                  disabled={isLeftSurgeryFinalized}
                  className={`px-4 py-0.5 rounded-full font-semibold text-sm  ${
                    selectedLeg === "left"
                      ? "bg-[#005585] text-white"
                      : "bg-gray-300 text-black "
                  } ${
                    isLeftSurgeryFinalized
                      ? "opacity-50 cursor-not-allowed"
                      : "cursor-pointer"
                  }`}
                >
                  Left
                </button>
                <button
                  onClick={() =>
                    !isRightSurgeryFinalized && setSelectedLeg("right")
                  }
                  disabled={isRightSurgeryFinalized}
                  className={`px-4 py-0.5 rounded-full font-semibold text-sm  ${
                    selectedLeg === "right"
                      ? "bg-[#005585] text-white"
                      : "bg-gray-300 text-black"
                  } ${
                    isRightSurgeryFinalized
                      ? "opacity-50 cursor-not-allowed"
                      : "cursor-pointer"
                  }`}
                >
                  Right
                </button>
              </div>
            </div>

            <div
              className={`w-full flex ${
                width < 530 ? "flex-col gap-4" : "flex-row"
              }`}
            >
              <div
                className={`flex flex-row ${width < 530 ? "w-full" : "w-1/2"}`}
              >
                {/* <div className="w-1/2 flex flex-col">
                  <p className="font-semibold text-[#475467] text-sm">
                    DATE OF SURGERY
                  </p>
                  <div className="w-full flex flex-row gap-6 items-center">
                    <input
                      type="text"
                      placeholder="dd-mm-yyyy"
                      className="w-full text-black py-2 px-4 rounded-sm text-base outline-none"
                      value={selectedDate || ""}
                      onChange={handleManualDateChange}
                      maxLength={10} // Very important: dd-mm-yyyy is 10 characters
                      style={{
                        backgroundColor: "rgba(217, 217, 217, 0.5)",
                      }}
                    />
                  </div>
                </div> */}
                <div className="w-full flex flex-col items-start">
                  <p className="font-semibold text-[#475467] text-sm">
                    SURGEON
                  </p>
                  <p className="font-medium italic text-[#475467] text-sm">
                    {patient?.doctor_name}
                  </p>
                </div>
              </div>
              <div
                className={`flex flex-col ${width < 530 ? "w-full" : "w-1/2"}`}
              >
                <p className="font-semibold text-[#475467] text-sm">
                  SURGERY NAME
                </p>
                <input
                  id="surgery"
                  type="text"
                  value={surgery}
                  onChange={(e) => setSurgery(e.target.value)}
                  className="font-medium italic text-[#475467] text-sm py-1 rounded-md"
                  placeholder="Enter surgery name"
                />
              </div>
            </div>

            <div
              className={`w-full flex ${
                width < 530 ? "flex-col gap-4" : "flex-row"
              }`}
            >
              <div
                className={`flex flex-col ${width < 530 ? "w-full" : "w-1/2"}`}
              >
                <p className="font-semibold text-[#475467] text-sm">
                  SUB DOCTOR NAME
                </p>
                <input
                  id="surgery"
                  type="text"
                  value={subdoctor}
                  onChange={(e) => setSubDoctor(e.target.value)}
                  className="font-medium italic text-[#475467] text-sm py-1 rounded-md"
                  placeholder="Enter Sub Doctor name"
                />
              </div>
              <div
                className={`flex flex-col ${width < 530 ? "w-full" : "w-1/2"}`}
              >
                <p className="font-semibold text-[#475467] text-sm">
                  PROCEDURE
                </p>
                <textarea
                  placeholder="Enter surgery procedure..."
                  rows={3}
                  className="w-full text-black px-4 py-2  text-sm rounded-md"
                  style={{ backgroundColor: "rgba(71, 84, 103, 0.1)" }}
                  value={procedure}
                  onChange={(e) => setProcedure(e.target.value)}
                />
              </div>
            </div>

            <div
              className={`w-full flex ${
                width < 570 ? "flex-col gap-4" : "flex-row"
              }`}
            >
              <div
                className={` flex flex-col ${
                  width < 570 ? "w-full" : "w-[50%]"
                }`}
              >
                <p className="font-semibold text-[#475467] text-sm">IMPLANT</p>
                <input
                  id="surgery"
                  type="text"
                  value={implant}
                  onChange={(e) => setImplant(e.target.value)}
                  className="font-medium italic text-[#475467] text-sm py-1 rounded-md "
                  placeholder="Enter implant name"
                />
              </div>
              <div
                className={` flex flex-col ${
                  width < 570 ? "w-full" : "w-[50%]"
                }`}
              >
                <p className="font-semibold text-[#475467] text-sm">
                  TECHNOLOGY
                </p>
                <input
                  id="surgery"
                  type="text"
                  value={technology}
                  onChange={(e) => setTechnology(e.target.value)}
                  className="font-medium italic text-[#475467] text-sm py-1 rounded-md"
                  placeholder="Enter technology name"
                />
              </div>
            </div>

            <div
              className={`w-full flex ${
                width < 570
                  ? "flex-col gap-4 justify-center items-center"
                  : "flex-row"
              }`}
            >
              <div
                className={`w-1/2 flex flex-row  items-center ${
                  width < 570 ? "justify-center " : "justify-start"
                }`}
              >
                <p
                  className="font-semibold italic text-[#475467] text-sm cursor-pointer"
                  onClick={handleClearAlldsurgerydata}
                >
                  CLEAR MESSAGE
                </p>
              </div>
              <div
                className={`w-1/2 flex flex-row items-center ${
                  width < 570 ? "justify-center " : "justify-end"
                }`}
              >
                <p
                  className="font-semibold rounded-full px-3 py-[1px] cursor-pointer text-center text-white text-sm border-[#005585] border-2"
                  style={{ backgroundColor: "rgba(0, 85, 133, 0.9)" }}
                  onClick={surgerydatacheck}
                >
                  SEND
                </p>
              </div>
            </div>

            {warning && (
              <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-50">
                <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-6 py-3 rounded-lg shadow-lg animate-fade-in-out">
                  {warning}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default page;
