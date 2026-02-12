import { useEffect, useRef, useState } from 'react';

import { useNavigate } from 'react-router-dom';
import { Filter, ListRestartIcon } from "lucide-react";
import Loader from '../../contexts/Loader';
import { FiSearch } from "react-icons/fi";
import { Switch } from "@headlessui/react";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { evaluate } from 'mathjs';
import ResizeMap from "../../Common/ResizeMap"
import { useFindClass } from '../../contexts/FindClassContext';
import PlanTabs from './PlanTabs';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { usePermission } from '../../Common/permission';
const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
import { showWarning } from '../../../../../utils/swalHelper';

const List = () => {
  const { fetchFindClasses, findClasses, loading } = useFindClass();
  const [openMapId, setOpenMapId] = useState(null);
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  useEffect(() => {
    fetchFindClasses()
  }, [fetchFindClasses]);
  const iconContainerRef = useRef(null);
  const [activeParkingVenueId, setActiveParkingVenueId] = useState(null);
  const [notes, setNotes] = useState(null);
  const [activeCongestionVenueId, setActiveCongestionVenueId] = useState(null);
  const [showteamModal, setShowteamModal] = useState(null);
  const [showModal, setShowModal] = useState(null);
  const modalRefs = useRef({}); // store refs by venueId

  const resetModals = () => {
    setActiveParkingVenueId(null);
    setActiveCongestionVenueId(null);
    setShowteamModal(null);
    setShowModal(null);
  };
  // Parking

  const [selectedPlans, setSelectedPlans] = useState([]);

  const [expression, setExpression] = useState('');
  const [result, setResult] = useState('');
  const [clickedIcon, setClickedIcon] = useState(null);

  const venues = ["All venues", ...new Set(findClasses.map(v => v.venueName).filter(Boolean))];
  const [showAll, setShowAll] = useState(false);

  const visibleVenues = showAll ? venues : venues.slice(0, 5);

  const [selectedUserIds, setSelectedUserIds] = useState([]);








  const [searchVenue, setSearchVenue] = useState("");
  const [searchPostcode, setSearchPostcode] = useState("");
  const [selectedVenues, setSelectedVenues] = useState(["All venues"]);
  const [calendarData, setCalendarData] = useState([]);
  const [selectedDays, setSelectedDays] = useState([]);
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);


  const toggleVenue = (venue) => {
    if (venue === "All venues") {
      setSelectedVenues(["All venues"]);
    } else {
      let updated = [...selectedVenues];
      updated = updated.includes("All venues") ? [] : updated;

      if (updated.includes(venue)) {
        updated = updated.filter((v) => v !== venue);
      } else {
        updated.push(venue);
      }

      setSelectedVenues(updated);
    }
  };

  const toggleDay = (day) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [fromDate, setFromDate] = useState(new Date(currentDate.getFullYear(), currentDate.getMonth(), 11));
  const [toDate, setToDate] = useState(null);

  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();

  const getDaysArray = () => {
    const startDay = new Date(year, month, 1).getDay(); // Sunday = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];

    const offset = startDay === 0 ? 6 : startDay - 1;

    for (let i = 0; i < offset; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const calendarDays = getDaysArray();

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getDateStatus = (date) => {
    let isStartOrEnd = false;
    let isInBetween = false;
    let isExcluded = false;
    let isSessionDate = false;
    // console.log('calendarData', calendarData)
    calendarData.forEach((term) => {
      const start = new Date(term.startDate);
      const end = new Date(term.endDate);

      if (!date) return;

      if (isSameDate(date, start) || isSameDate(date, end)) {
        isStartOrEnd = true;
      } else if (date >= start && date <= end) {
        isInBetween = true;
      }

      term.exclusionDates?.forEach((ex) => {
        const exclusionDate = new Date(ex);
        if (isSameDate(date, exclusionDate)) {
          isExcluded = true;
        }
      });
      term.sessionsMap?.forEach((session) => {
        const sessionDate = new Date(session.sessionDate);
        if (isSameDate(date, sessionDate)) {
          isSessionDate = true;
        }
      });
    });

    return { isStartOrEnd, isInBetween, isExcluded, isSessionDate };
  };

  const isSameDate = (d1, d2) =>
    d1 && d2 &&
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear();

  const isInRange = (date) =>
    fromDate && toDate && date && date >= fromDate && date <= toDate;

  const handleDateClick = (date) => {
    if (!fromDate || (fromDate && toDate)) {
      setFromDate(date);
      setToDate(null);
    } else if (fromDate && !toDate) {
      if (date < fromDate) {
        setFromDate(date);
      } else {
        setToDate(date);
      }
    }
  };



  const filteredClasses = Array.isArray(findClasses)
    ? findClasses.filter((venue) => {
      const nameMatch =
        !searchVenue ||
        venue.venueName?.toLowerCase().includes(searchVenue.toLowerCase());

      const postcodeMatch =
        !searchPostcode ||
        (venue?.postal_code || "")
          .toLowerCase()
          .includes(searchPostcode.toLowerCase());

      const venueMatch =
        selectedVenues.length === 0 ||
        selectedVenues.includes("All venues") ||
        selectedVenues.includes(venue.venueName);

      // Normalize class list into an array regardless of whether venue.classes is {} or { Saturday: [...], ... }
      const classList =
        venue.classes && typeof venue.classes === "object"
          ? Object.values(venue.classes).flat()
          : [];

      // Case-insensitive day match
      const dayMatch =
        selectedDays.length === 0 ||
        selectedDays.some((selectedDay) => {
          const lowerDay = selectedDay.toLowerCase();
          // Find a matching key ignoring case
          const matchedKey = Object.keys(venue.classes || {}).find(
            (key) => key.toLowerCase() === lowerDay
          );
          return matchedKey && (venue.classes[matchedKey] || []).length > 0;
        });

      const availableMatch =
        !showAvailableOnly ||
        classList.some((cls) => cls.capacity > 0);

      return (
        nameMatch &&
        postcodeMatch &&
        venueMatch &&
        dayMatch &&
        availableMatch
      );
    })
    : [];




  // console.log('filteredClasses', filteredClasses)
  // console.log('findClasses', findClasses)

  const modalRef = useRef(null);
  const PRef = useRef(null);


  const handleIconClick = (type, venueId, paymentPlans = []) => {
    console.log("🔹 handleIconClick triggered", { type, venueId, paymentPlans });

    switch (type) {
      case "payment":
        console.log("🟢 Opening Payment modal for:", venueId);
        setSelectedPlans(paymentPlans || []);
        setShowModal(prev => {
          const next = prev === venueId ? null : venueId;
          console.log("   ↳ showModal:", next);
          console.log("   ↳ prev:", prev);
          console.log("   ↳ venueId:", venueId);
          return next;
        });
        setShowteamModal(null);
        setOpenMapId(null);
        setActiveCongestionVenueId(null);
        setActiveParkingVenueId(null);
        setNotes(null);
        break;

      case "team":
        console.log("🟡 Opening Team modal for:", venueId);
        setCalendarData(paymentPlans || []);
        setShowteamModal(prev => {
          const next = prev === venueId ? null : venueId;
          console.log("   ↳ showteamModal:", next);
          return next;
        });
        setShowModal(null);
        setOpenMapId(null);
        setActiveCongestionVenueId(null);
        setActiveParkingVenueId(null);
        setNotes(null);
        break;

      case "location":
        console.log("🔵 Opening Location map for:", venueId);
        setOpenMapId(prev => {
          const next = prev === venueId ? null : venueId;
          console.log("   ↳ openMapId:", next);
          return next;
        });
        setShowModal(null);
        setShowteamModal(null);
        setActiveCongestionVenueId(null);
        setActiveParkingVenueId(null);
        setNotes(null);
        break;

      case "congestion":
        console.log("🟠 Showing Congestion Notes for:", venueId);
        setNotes(paymentPlans);
        setActiveCongestionVenueId(prev => {
          const next = prev === venueId ? null : venueId;
          console.log("   ↳ activeCongestionVenueId:", next);
          return next;
        });
        setShowModal(null);
        setShowteamModal(null);
        setOpenMapId(null);
        setActiveParkingVenueId(null);
        break;

      case "parking":
        console.log("🟣 Showing Parking Notes for:", venueId);
        setNotes(paymentPlans);
        setActiveParkingVenueId(prev => {
          const next = prev === venueId ? null : venueId;
          console.log("   ↳ activeParkingVenueId:", next);
          return next;
        });
        setShowModal(null);
        setShowteamModal(null);
        setOpenMapId(null);
        setActiveCongestionVenueId(null);
        break;

      default:
        console.log("⚪ Unknown type:", type);
        break;
    }

    console.log("✅ Completed handleIconClick for", type);
  };


  useEffect(() => {
    const activeVenueId =
      showModal ?? showteamModal ?? openMapId ?? activeCongestionVenueId ?? activeParkingVenueId;

    if (activeVenueId && modalRefs.current[activeVenueId]) {
      modalRefs.current[activeVenueId].scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [showModal, showteamModal, openMapId, activeCongestionVenueId, activeParkingVenueId]);



  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setActiveCongestionVenueId(null); // toggle works now
      }
      if (PRef.current && !PRef.current.contains(event.target)) {
        setActiveParkingVenueId(null); // toggle works now
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);




  const handleBookFreeTrial = (classId) => {
    navigate('/weekly-classes/find-a-class/book-a-free-trial', {
      state: { classId },
    });
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }, 50);
  };
  const handleAddToWaitingList = (classId) => {
    navigate('/weekly-classes/find-a-class/add-to-waiting-list', {
      state: { classId },
    });
  };
  const handleBookMembership = (classId) => {
    navigate('/weekly-classes/find-a-class/book-a-membership', {
      state: { classId },
    });
  };
  // console.log('calendarData', calendarData)



  const isExcluded = (date, term) =>
    term?.exclusionDates?.some(
      (ex) => isSameDate(new Date(ex), date)
    );


  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };
  const { checkPermission } = usePermission();

  const canBookFreeTrial =
    checkPermission({ module: 'class-schedule', action: 'view-listing' }) &&
    checkPermission({ module: 'book-free-trial', action: 'create' });


  const canBookMembership =
    checkPermission({ module: 'class-schedule', action: 'view-listing' }) &&
    checkPermission({ module: 'book-membership', action: 'create' });

  const canAddToWaitingList =
    checkPermission({ module: 'waiting-list', action: 'create' })
  // console.log('selectedPlans', selectedPlans)
  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedOutsideIcons = iconContainerRef.current && !iconContainerRef.current.contains(event.target);
      const clickedOutsidePaymentModal = modalRef.current && !modalRef.current.contains(event.target);
      const clickedOutsideParkingModal = PRef.current && !PRef.current.contains(event.target);

      // Close all modals if click is outside icons AND outside any open modal
      if (clickedOutsideIcons && clickedOutsidePaymentModal && clickedOutsideParkingModal) {
        setShowModal(null);
        setShowteamModal(null);
        setOpenMapId(null);
        setActiveCongestionVenueId(null);
        setActiveParkingVenueId(null);
        setNotes(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const weekOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  console.log('filteredClasses', filteredClasses)
  if (loading) {
    return (
      <>
        <Loader />
      </>
    )
  }
  return (
    <div className="pt-1 bg-gray-50 min-h-screen">

      <div className="md:flex w-full gap-4">
        <div className={`transition-all duration-300 ${isOpen ? " md:w-[20.8%]" : " overflow-hidden"}`}>
          {/* Toggle Button */}

          <AnimatePresence>
            {isOpen && (
              <motion.div className="max-w-[320px] bg-white p-6 rounded-3xl  text-sm space-y-5 transition-all duration-300" initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}>
                {/* Search */}
                <div className="space-y-3">
                  <div className='flex justify-between '>
                    <h2 className="text-[24px] font-semibold">Search by filter</h2>

                    <div className="relative group inline-block">
                      <ListRestartIcon
                        className="cursor-pointer"
                        onClick={() => {
                          setSelectedVenues([]);
                          setSelectedDays([]);
                          setSearchVenue('')
                          setSearchPostcode('')
                          setShowAvailableOnly(false);
                        }}
                      />
                      <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-white border  border-gray-200 text-gray-700 text-xs rounded py-1 px-2 whitespace-nowrap transition-opacity duration-200">
                        Reset Filters
                      </span>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search venue"
                      className="w-full border border-gray-300 rounded-xl px-3 text-[16px] py-3 pl-9 focus:outline-none"
                      value={searchVenue}
                      onChange={(e) => setSearchVenue(e.target.value)}
                    />
                    <FiSearch className="absolute left-3 top-4 text-[20px]" />
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by postcode"
                      className="w-full border border-gray-300 text-[16px] rounded-xl px-3 py-3 pl-9 focus:outline-none"
                      value={searchPostcode}
                      onChange={(e) => setSearchPostcode(e.target.value)}
                    />
                    <FiSearch className="absolute left-3 top-4 text-[20px]" />
                  </div>
                </div>

                {/* Venues */}
                <div>
                  <h3 className="text-[20px] font-medium mb-2 border-b border-gray-300 pb-2">
                    Venues
                  </h3>
                  <div className="space-y-2 pt-2">
                    {visibleVenues.map((venue) => (
                      <label key={venue} className="flex text-[16px] items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedVenues.includes(venue)}
                          onChange={() => toggleVenue(venue)}
                          className="accent-blue-600 p-2 text-[20px]"
                        />
                        {venue}
                      </label>
                    ))}

                    {venues.length > 5 && (
                      <button
                        type="button"
                        onClick={() => setShowAll(!showAll)}
                        className="text-blue-600 text-[16px] mt-1"
                      >
                        {showAll ? "Show less" : "Show more"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Days */}
                <div>
                  <h3 className="text-[20px] font-medium mb-2 border-b border-gray-300 pb-2">
                    Days
                  </h3>
                  <div className="space-y-2 pt-2">
                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                      <label key={day} className="flex text-[16px] items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedDays.includes(day)}
                          onChange={() => toggleDay(day)}
                          className="accent-blue-600"
                        />
                        {day}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Toggle */}
                <div className="pb-4 border-gray-300 border-b">
                  <Switch.Group as="div" className="flex items-center justify-between">
                    <Switch
                      checked={showAvailableOnly}
                      onChange={setShowAvailableOnly}
                      className={`${showAvailableOnly ? "bg-blue-600" : "bg-gray-300"
                        } relative inline-flex h-6 w-11 items-center rounded-full transition`}
                    >
                      <span
                        className={`${showAvailableOnly ? "translate-x-6" : "translate-x-1"
                          } inline-block h-4 w-4 transform bg-white rounded-full transition`}
                      />
                    </Switch>
                    <Switch.Label className="text-[16px] font-medium">
                      Show venues with availability
                    </Switch.Label>
                  </Switch.Group>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div
          className={`${isOpen ? "md:w-[80.2%]" : "w-12/12"} transition-all   duration-300 flex-1 `}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-[#0098d9] text-white rounded-xl mb-4"
          >
            Filters <Filter size={16} />
          </button>
          {
            venues.length > 1 ? (

              <div className={` rounded-4xl mt-5 md:mt-0 w-full`}>
                <div className="space-y-5">
                  {filteredClasses.length === 0 ? (
                    <div className="text-center p-4 text-gray-500">Data not found</div>
                  ) : (
                    filteredClasses.map((venue, idx) => (
                      <>
                        <div
                          key={idx}
                          className="w-full bg-white rounded-[30px] relative p-2 border border-[#E2E1E5]" // ✅ min height
                        >
                          <div className="bg-[#3D444F] text-white p-4 rounded-[22px] mb-2 flex flex-wrap justify-between md:items-center text-sm gap-4">
                            <div className="flex items-center gap-2  truncate  max-w-[80%]">
                              <img src="/images/icons/Location.png" className='w-5' alt="" />
                              <div className="flex  ">
                                <span className="font-semibold text-[16px]">
                                  {venue?.venueName + ', ' + venue.address}
                                  {venue.postal_code && !venue.address.includes(venue.postal_code) && (
                                    <span> PostCode - {venue.postal_code}</span>
                                  )}
                                </span>

                              </div>
                            </div>
                            <div ref={iconContainerRef} className=" md:mt-0 mt-5 flex relative items-center gap-4">
                              <img
                                src="/images/icons/fcDollar.png"
                                onClick={() => handleIconClick('payment', venue.venueId, venue?.paymentGroups[0]?.paymentPlans)} alt=""
                                className={`cursor-pointer w-6 h-6 rounded-full ${showModal === venue.venueId ? 'bg-[#0DD180]' : 'bg-white'}`}
                              />

                              <img
                                src="/images/icons/fcCalendar.png"
                                onClick={() => handleIconClick('team', venue.venueId, venue.terms)}
                                alt=""
                                className={`cursor-pointer w-6 h-6 rounded-full ${showteamModal === venue.venueId ? 'bg-[#0DD180]' : 'bg-white'}`}
                              />

                              <img
                                src="/images/icons/fcLocation.png"
                                onClick={() => handleIconClick('location', venue.venueId)}
                                alt=""
                                className={`cursor-pointer w-6 h-6 rounded-full ${openMapId === venue.venueId ? 'bg-[#0DD180]' : 'bg-white'}`}
                              />

                              <img
                                src="/images/icons/fcCicon.png"
                                onClick={() => handleIconClick('congestion', venue?.venueId, venue?.congestionNote)}
                                alt=""
                                className={`cursor-pointer w-6 h-6 rounded-full ${activeCongestionVenueId === venue.venueId ? 'bg-[#0DD180]' : 'bg-white'}`}
                              />

                              <img
                                src="/images/icons/fcPIcon.png"
                                onClick={() => handleIconClick('parking', venue?.venueId, venue?.parkingNote)}
                                alt=""
                                className={`cursor-pointer w-6 h-6 rounded-full ${activeParkingVenueId === venue.venueId ? 'bg-[#0DD180]' : 'bg-white'}`}
                              />
                            </div>



                          </div>

                          <div className='overflow-x-auto'>
                            <div className="overflow-x-auto p-6 md:flex gap-10 rounded-[22px] bg-[#FCF9F6]">
                              {/* Meta Info */}
                              <div className="w-full lg:w-[25%] justify-between flex gap-8">
                                <div className="space-y-1">
                                  <div className="font-semibold md:text-[18px] text-[16px] 2xl:text-[20px] capitalize text-black">
                                    {venue.venueName}
                                  </div>
                                  <div className="text-[#717073] font-medium text-[15px]">
                                    {(venue.distanceMiles / 1609.34).toFixed(2)} miles
                                  </div>
                                </div>

                                <div className="space-y-4">
                                  {venue?.days.map((day, index) => (
                                    <div key={index} className="space-y-1">
                                      <div className="text-[#384455] text-[16px] capitalize font-semibold">
                                        {day}
                                      </div>
                                      <div className="text-[#717073] font-medium text-[15px]">
                                        {venue.facility || "N/A"}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Classes Section */}
                              <div className="flex-1 pl-10 border-l border-[#E2E1E5] space-y-6">
                                {venue.classes && Object.keys(venue.classes).length > 0 ? (
                                  Object.entries(venue.classes).map(([day, classList]) => (
                                    <div key={day} className="space-y-4">
                                      {classList.map((s, i) => (
                                        <div
                                          key={s.classId}
                                          className="flex items-center justify-between gap-4"
                                        >
                                          {/* Class Info Wrapper */}
                                          <div className="flex items-center gap-12 flex-1">
                                            {/* Class ID/Number */}
                                            <div className="font-bold text-[16px] text-[#282829] w-20">
                                              Class {i + 1}
                                            </div>

                                            {/* Age Range / Name */}
                                            <div className="font-semibold text-[16px] text-[#384455] w-32">
                                              {s.className}
                                            </div>

                                            {/* Time */}
                                            <div className="flex items-center gap-2 whitespace-nowrap w-48">
                                              <img
                                                src="/images/icons/fcTImeIcon.png"
                                                className="w-5 h-5 opacity-70"
                                                alt=""
                                              />
                                              <span className="font-semibold text-[16px] text-[#384455]">
                                                {s.time}
                                              </span>
                                            </div>

                                            {/* Status Badge */}
                                            <div className="w-32">
                                              {s.capacity === 0 ? (
                                                <span className="inline-block px-3 py-1.5 rounded-[8px] bg-[#FEECEC] text-[#FF5C40] text-[14px] font-semibold whitespace-nowrap">
                                                  Fully booked
                                                </span>
                                              ) : (
                                                <span className="inline-block px-3 py-1.5 rounded-[8px] bg-[#EEF8F1] text-[#34AE56] text-[14px] font-semibold whitespace-nowrap">
                                                  +{s.capacity} spaces
                                                </span>
                                              )}
                                            </div>
                                          </div>

                                          {/* Action Buttons */}
                                          <div className="flex gap-3 items-center">
                                            {s.capacity === 0 && canAddToWaitingList ? (
                                              <button
                                                onClick={() => {
                                                  const hasTermGroups =
                                                    Array.isArray(venue.termGroups) && venue.termGroups.length > 0;
                                                  const hasTerms =
                                                    Array.isArray(venue.terms) && venue.terms.length > 0;
                                                  if (!hasTermGroups || !hasTerms) {
                                                    showWarning(
                                                      "Please select term groups first",
                                                      "Term groups and terms are required to book a free trial."
                                                    );
                                                    return;
                                                  }
                                                  handleAddToWaitingList(s.classId);
                                                }}
                                                className="bg-[#237FEA] text-white px-6 py-2.5 rounded-xl text-[14px] font-semibold hover:bg-[#1b6cd1] transition-colors whitespace-nowrap"
                                              >
                                                Add to Waiting List
                                              </button>
                                            ) : (
                                              <>
                                                {s.allowFreeTrial && venue.terms && venue.termGroups && canBookFreeTrial && (
                                                  <button
                                                    onClick={() => {
                                                      const hasTermGroups =
                                                        Array.isArray(venue.termGroups) && venue.termGroups.length > 0;
                                                      const hasTerms =
                                                        Array.isArray(venue.terms) && venue.terms.length > 0;
                                                      if (!hasTermGroups || !hasTerms) {
                                                        showWarning(
                                                          "Please select term groups first",
                                                          "Term groups and terms are required to book a free trial."
                                                        );
                                                        return;
                                                      }
                                                      handleBookFreeTrial(s.classId);
                                                    }}
                                                    className="border border-[#717073] text-black px-6 py-2.5 rounded-xl text-[14px] font-semibold hover:bg-gray-50 transition-colors whitespace-nowrap"
                                                  >
                                                    Book a FREE Trial
                                                  </button>
                                                )}
                                                {canBookMembership && (
                                                  <button
                                                    onClick={() => {
                                                      const hasTermGroups =
                                                        Array.isArray(venue.termGroups) && venue.termGroups.length > 0;
                                                      const hasTerms =
                                                        Array.isArray(venue.terms) && venue.terms.length > 0;
                                                      if (!hasTermGroups || !hasTerms) {
                                                        showWarning(
                                                          "Please select term groups first",
                                                          "Term groups and terms are required to book a free trial."
                                                        );
                                                        return;
                                                      }
                                                      handleBookMembership(s.classId);
                                                    }}
                                                    className="border border-[#717073] text-black px-6 py-2.5 rounded-xl text-[14px] font-semibold hover:bg-gray-50 transition-colors whitespace-nowrap"
                                                  >
                                                    Book a Membership
                                                  </button>
                                                )}
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ))
                                ) : (
                                  <div className="text-center text-gray-500 font-medium py-8">
                                    No classes available for this venue
                                  </div>
                                )}
                              </div>
                            </div>

                            {activeCongestionVenueId === venue.venueId && (
                              <div ref={iconContainerRef} className="absolute right-2 z-10 mt-2">
                                <div className="bg-white rounded-2xl shadow-2xl px-6 py-4 min-w-[300px] max-w-[489px]">
                                  <div className="flex items-start justify-between">
                                    <h2 className="text-red-500 font-semibold text-[18px]">Congestion Information</h2>
                                    <img src="/images/icons/infoIcon.png" alt="" />
                                  </div>
                                  <div className="mt-2 text-[16px] text-gray-700 leading-snug">

                                    {notes ? (
                                      <p>This venue is inside of the congestion zone.</p>
                                    ) : (
                                      <>
                                        <p>There is no congestion charges at this venue.</p>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}

                            {activeParkingVenueId === venue.venueId && (
                              <div ref={iconContainerRef} className="absolute right-2 z-10 mt-2">
                                <div className="bg-white rounded-2xl shadow-2xl px-6 py-4 min-w-[300px] max-w-[489px]">
                                  <div className="flex items-start justify-between">
                                    <h2 className="text-red-500 font-semibold text-[18px]">Parking Information</h2>
                                    <img src="/images/icons/infoIcon.png" alt="" />
                                  </div>
                                  <div className="mt-2 text-[16px] text-gray-700 leading-snug">

                                    {notes ? (
                                      notes
                                    ) : (
                                      <>
                                        <p>This venue has no parking facilities available.</p>
                                        <p>Paid road parking is available.</p>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                            {showteamModal === venue.venueId && (
                              <div
                                ref={iconContainerRef}
                                // ref={iconContainerRef}
                                className="
                                      absolute bg-opacity-30 top-15 flex items-center justify-center z-50
                                      min-w-[200px] sm:min-w-[489px]
                                      left-2 sm:left-auto right-2
                                      px-2 sm:px-0
                                    "
                              >
                                <div className="bg-white rounded-3xl w-full max-w-md sm:max-w-lg p-4 sm:p-6 shadow-2xl">
                                  {/* Header */}
                                  <div ref={(el) => (modalRefs.current[venue.venueId] = el)} className="flex justify-between items-center border-b border-[#E2E1E5] pb-4 mb-4">
                                    <h2 className="text-[24px]  font-semibold">Team Dates</h2>
                                    <button onClick={() => setShowteamModal(null)}>
                                      <img src="/images/icons/cross.png" alt="close" className="w-4 h-4" />
                                    </button>
                                  </div>

                                  {/* Term List */}
                                  <div className="space-y-6 max-h-80 overflow-y-scroll text-center text-[13px] sm:text-[14px] text-[#2E2F3E] font-medium">
                                    {calendarData.map((term) => (
                                      <div key={term.id}>
                                        <h3 className="md:text-[20px] font-semibold mb-1">{term.name} Term {new Date(term.startDate).getFullYear()}</h3>
                                        <p className="md:text-[18px]">
                                          {formatDate(term.startDate)} - {formatDate(term.endDate)}
                                        </p>
                                        <p className="md:text-[18px]">
                                          Half term Exclusion:{" "}
                                          {term.exclusionDates.map((ex, idx) => (
                                            <span key={idx}>
                                              {formatDate(ex)}{idx < term.exclusionDates.length - 1 ? ", " : ""}
                                            </span>
                                          ))}
                                        </p>
                                      </div>
                                    ))}
                                  </div>

                                  {/* Calendar Section */}
                                  <div className="rounded p-4 mt-6 text-center md:text-sm w-full max-w-md mx-auto">
                                    {/* Header */}
                                    <div className="flex justify-center gap-5 items-center mb-3">
                                      <button
                                        onClick={goToPreviousMonth}
                                        className="w-8 h-8 rounded-full bg-white text-black hover:bg-black hover:text-white border border-black flex items-center justify-center"
                                      >
                                        <ChevronLeft className="w-5 h-5" />
                                      </button>
                                      <p className="font-semibold md:text-[20px]">
                                        {currentDate.toLocaleString("default", { month: "long" })} {year}
                                      </p>
                                      <button
                                        onClick={goToNextMonth}
                                        className="w-8 h-8 rounded-full bg-white text-black hover:bg-black hover:text-white border border-black flex items-center justify-center"
                                      >
                                        <ChevronRight className="w-5 h-5" />
                                      </button>
                                    </div>

                                    {/* Day Labels */}
                                    <div className="grid grid-cols-7 text-xs gap-1 md:text-[18px] text-gray-500 mb-1">
                                      {["M", "T", "W", "T", "F", "S", "S"].map((day) => (
                                        <div key={day} className="font-medium text-center">
                                          {day}
                                        </div>
                                      ))}
                                    </div>

                                    {/* Calendar Weeks */}
                                    <div className="grid grid-cols-7 gap-0 text-[16px]">
                                      {calendarDays.map((date, i) => {
                                        const { isStartOrEnd, isInBetween, isExcluded, isSessionDate } = getDateStatus(date);

                                        let className = "aspect-square flex items-center justify-center transition-all duration-200 ";
                                        let innerDiv = null;

                                        if (!date) {
                                          className += "";
                                        } else if (isExcluded) {
                                          className += "bg-gray-400 text-white opacity-60 rounded-full cursor-not-allowed";
                                        } else if (isSessionDate) {
                                          className += "bg-blue-600 text-white font-bold rounded-full"; // DARK BLUE
                                        } else if (isStartOrEnd) {
                                          className += ""; // Outer background
                                          innerDiv = (
                                            <div className="bg-blue-600 text-white rounded-full w-full h-full flex items-center justify-center font-bold">
                                              {date.getDate()}
                                            </div>
                                          );
                                        } else if (isInBetween) {
                                          className += " text-gray-800";
                                        } else {
                                          className += "hover:bg-gray-100 text-gray-800";
                                        }

                                        return (
                                          <div
                                            key={i}
                                            onClick={() => date && !isExcluded && handleDateClick(date)}
                                            className={className}
                                          >
                                            {innerDiv || (date ? date.getDate() : "")}
                                          </div>
                                        );
                                      })}
                                    </div>

                                  </div>
                                </div>
                              </div>

                            )}

                          </div>
                          {showModal === venue.venueId && (
                            <div className=" absolute bg-opacity-30 flex right-2 items-center top-15 justify-center z-50">
                              <div ref={iconContainerRef} className="flex z-[999999999] max-w-[900px] w-[900px] items-center justify-center px-2 py-6 sm:px-2 md:py-2">
                                <div ref={(el) => (modalRefs.current[venue.venueId] = el)} className="bg-white rounded-3xl p-4 sm:p-6 w-full shadow-2xl">
                                  {/* Header */}
                                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#E2E1E5] pb-4 mb-4 gap-2">
                                    <h2 className="font-semibold text-[20px] sm:text-[24px]">Subscription Plan</h2>
                                    <button className="text-gray-400 hover:text-black text-xl font-bold">
                                      <img src="/images/icons/cross.png" onClick={() => setShowModal(null)} alt="close" className="w-5 h-5" />
                                    </button>
                                  </div>
                                  <PlanTabs selectedPlans={selectedPlans} />
                                </div>
                              </div>
                            </div>
                          )}




                        </div>


                        <div>{openMapId === venue.venueId && (
                          <div ref={iconContainerRef}>
                            <div
                              ref={(el) => (modalRefs.current[venue.venueId] = el)}
                              className="mt-2 mb-4 h-[450px] w-full rounded-lg overflow-hidden"
                            >
                              {venue.latitude && venue.longitude ? (
                                <MapContainer
                                  center={[venue.latitude, venue.longitude]}
                                  zoom={13}
                                  scrollWheelZoom={false}
                                  zoomControl={false}
                                  style={{ height: "100%", width: "100%" }}
                                >
                                  <TileLayer
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                                  />
                                  <Marker position={[venue.latitude, venue.longitude]} icon={customIcon}>
                                    <Popup>
                                      <strong>{venue.venueName}</strong>
                                      <br />
                                      {venue.address}
                                    </Popup>
                                  </Marker>
                                  <ZoomControl position="bottomright" />
                                  <ResizeMap />
                                </MapContainer>
                              ) : (
                                <div className="flex items-center justify-center h-full bg-gray-100 text-gray-500 text-lg font-medium">
                                  No map location found
                                </div>
                              )}
                            </div>
                          </div>
                        )}</div>
                      </>
                    ))
                  )}

                </div>

              </div>
            ) : (
              <p className='text-center  p-4 border-dotted border rounded-md'>No Data Found</p>
            )
          }
        </div>



      </div>


    </div >
  );
};

export default List;



