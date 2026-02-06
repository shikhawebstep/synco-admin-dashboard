import { createContext, useContext, useState, useCallback } from "react";
import { useNavigate } from 'react-router-dom';
import { showSuccess, showError, showLoading, showWarning } from "../../../../utils/swalHelper";
const BookFreeTrialContext = createContext();

export const BookFreeTrialProvider = ({ children }) => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [bookFreeTrials, setBookFreeTrials] = useState([]);
  const [bookMembership, setBookMembership] = useState([]);
  const token = localStorage.getItem("adminToken");
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [status, setStatus] = useState(null);
  const [statsMembership, setStatsMembership] = useState([]);
  const [statsFreeTrial, setStatsFreeTrial] = useState([]);
  const [bookedByAdmin, setBookedByAdmin] = useState([]);
  const [addToWaitingList, setaddToWaitingList] = useState(null);
  const [showCancelTrial, setshowCancelTrial] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [removeWaiting, setRemoveWaiting] = useState(false);
  const [isBooked, setIsBooked] = useState(false);

  const [isEditBookFreeTrial, setIsEditBookFreeTrial] = useState(false);
  const [singleBookFreeTrials, setSingleBookFreeTrials] = useState([]);
  const [capacityData, setCapacityData] = useState([]);
  const [singleBookFreeTrialsOnly, setSingleBookFreeTrialsOnly] = useState([]);
  const [serviceHistory, setServiceHistory] = useState([]);
  const [myVenues, setMyVenues] = useState([]);
  const [error, setError] = useState(null); // ✅ Add error state

  function formatLocalDate(dateString) {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return null;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0"); // months are 0-indexed
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`; // returns "2025-08-24"
  }

  const [formData, setFormData] = useState({
    area: "",
    name: "",
    address: "",
    facility: "",
    parking: false,
    congestion: false,
    parkingNote: "",
    entryNote: "",
  });

  // Book a Free Trial

  const fetchBookFreeTrials = useCallback(
    async (
      studentName = "",
      venueName = "",
      status1 = false,
      status2 = false,
      otherDateRange = [],
      dateoftrial = [],
      forOtherDate = [],
      BookedBy = []

    ) => {
      const token = localStorage.getItem("adminToken");
      if (!token) return;
      // console.log('status1', status1)
      // console.log('satus2', status2)
      // console.log('otherDateRange', otherDateRange)
      // console.log('dateoftrial', dateoftrial)
      // console.log('forOtherDate', forOtherDate)

      const shouldShowLoader = studentName || venueName || status1 || status2 || otherDateRange || dateoftrial || forOtherDate;
      // if (shouldShowLoader) setLoading(true);

      try {
        const queryParams = new URLSearchParams();

        // Student & Venue filters
        if (studentName) queryParams.append("studentName", studentName);
        if (venueName) queryParams.append("venueName", venueName);

        // Status filters
        if (status1) queryParams.append("status", "attended");
        if (status2) queryParams.append("status", "not attend");
        if (BookedBy && Array.isArray(BookedBy) && BookedBy.length > 0) {
          BookedBy.forEach(agent => queryParams.append("bookedBy", agent));
        }

        if (Array.isArray(dateoftrial) && dateoftrial.length === 2) {
          const [from, to] = dateoftrial;
          if (from && to) {
            queryParams.append("dateTrialFrom", formatLocalDate(from));
            queryParams.append("dateTrialTo", formatLocalDate(to));
          }
        }

        // 🔹 Handle general (createdAt range)
        if (Array.isArray(otherDateRange) && otherDateRange.length === 2) {
          const [from, to] = otherDateRange;
          if (from && to) {
            queryParams.append("fromDate", formatLocalDate(from));
            queryParams.append("toDate", formatLocalDate(to));
          }
        }

        if (Array.isArray(forOtherDate) && forOtherDate.length === 2) {
          const [from, to] = forOtherDate;
          if (from && to) {
            queryParams.append("fromDate", formatLocalDate(from));
            queryParams.append("toDate", formatLocalDate(to));
          }
        }
        // Trial dates (support array or single value)
        // const trialDates = Array.isArray(dateoftrial) ? dateoftrial : [dateoftrial];
        // trialDates
        //   .filter(Boolean)
        //   .map(d => formatLocalDate(d))
        //   .filter(Boolean)
        //   .forEach(d => queryParams.append("trialDate", d));

        const url = `${API_BASE_URL}/api/admin/book/free-trials${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
        const response = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const resultRaw = await response.json();
        const result = resultRaw.data.trials || [];
        const venues = resultRaw.data.venue || [];
        const bookedByAdmin = resultRaw.data.bookedByAdmin || []
        setBookedByAdmin(bookedByAdmin);
        setMyVenues(Array.isArray(venues) ? venues : []);
        setStatsFreeTrial(resultRaw.data.stats)
        setBookFreeTrials(result);
      } catch (error) {
        console.error("Failed to fetch bookFreeTrials:", error);
      } finally {
        // if (shouldShowLoader) setLoading(false); // only stop loader if it was started
      }
    },
    []
  );

  const fetchBookFreeTrialsLoading = useCallback(
    async (
      studentName = "",
      venueName = "",
      status1 = false,
      status2 = false,
      otherDateRange = [],
      dateoftrial = [],
      forOtherDate = [],
      BookedBy = []
    ) => {
      const token = localStorage.getItem("adminToken");
      if (!token) return;

      const hasFilters =
        studentName ||
        venueName ||
        status1 ||
        status2 ||
        (Array.isArray(otherDateRange) && otherDateRange.length === 2) ||
        (Array.isArray(dateoftrial) && dateoftrial.length === 2) ||
        (Array.isArray(forOtherDate) && forOtherDate.length === 2) ||
        (Array.isArray(BookedBy) && BookedBy.length > 0);

      setLoading(true); // ✅ start loader

      try {
        const queryParams = new URLSearchParams();

        // Student & Venue filters
        if (studentName) queryParams.append("studentName", studentName);
        if (venueName) queryParams.append("venueName", venueName);

        // Status filters
        if (status1) queryParams.append("status", "attended");
        if (status2) queryParams.append("status", "not attend");

        // BookedBy filter
        if (BookedBy && Array.isArray(BookedBy) && BookedBy.length > 0) {
          BookedBy.forEach((agent) => queryParams.append("bookedBy", agent));
        }

        // Trial date range
        if (Array.isArray(dateoftrial) && dateoftrial.length === 2) {
          const [from, to] = dateoftrial;
          if (from && to) {
            queryParams.append("dateTrialFrom", formatLocalDate(from));
            queryParams.append("dateTrialTo", formatLocalDate(to));
          }
        }

        // CreatedAt range (general)
        if (Array.isArray(otherDateRange) && otherDateRange.length === 2) {
          const [from, to] = otherDateRange;
          if (from && to) {
            queryParams.append("fromDate", formatLocalDate(from));
            queryParams.append("toDate", formatLocalDate(to));
          }
        }

        // Other date range
        if (Array.isArray(forOtherDate) && forOtherDate.length === 2) {
          const [from, to] = forOtherDate;
          if (from && to) {
            queryParams.append("fromDate", formatLocalDate(from));
            queryParams.append("toDate", formatLocalDate(to));
          }
        }

        const url = `${API_BASE_URL}/api/admin/book/free-trials${queryParams.toString() ? `?${queryParams.toString()}` : ""
          }`;

        const response = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const resultRaw = await response.json();
        const result = resultRaw.data.trials || [];
        const venues = resultRaw.data.venue || [];
        const bookedByAdmin = resultRaw.data.bookedByAdmin || [];

        setBookedByAdmin(bookedByAdmin);
        setMyVenues(Array.isArray(venues) ? venues : []);
        setStatsFreeTrial(resultRaw.data.stats);
        setBookFreeTrials(result);
      } catch (error) {
        console.error("Failed to fetch bookFreeTrials:", error);
      } finally {
        setLoading(false); // ✅ stop loader
      }
    },
    []
  );

  const fetchBookFreeTrialsID = useCallback(async (ID) => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/venue/${ID}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const resultRaw = await response.json();
      const result = resultRaw.data || [];
      setSingleBookFreeTrials(result);
    } catch (error) {
      console.error("Failed to fetch bookFreeTrials:", error);
    } finally {
      setLoading(false);
    }
  }, []);
  const fetchBookFreeTrialsByID = useCallback(async (ID) => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/class-schedule/${ID}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const resultRaw = await response.json();
      const result = resultRaw.data || [];
      setSingleBookFreeTrialsOnly(result);
    } catch (error) {
      console.error("Failed to fetch bookFreeTrials:", error);
    } finally {
      setLoading(false);
    }
  }, []);
  const createBookFreeTrials = async (bookFreeTrialData, islead) => {
    setLoading(true);
    console.log('bookFreeTrialData', bookFreeTrialData)
    console.log('islead', islead)

    const headers = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    let url = `${API_BASE_URL}/api/admin/book/free-trials/`;

    if (islead) {
      // if isLead exists (true / string / non-null)  
      url += `${encodeURIComponent(islead)}`;
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(bookFreeTrialData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || result.keyInformation || "Failed to create class schedule");
      }
      setIsBooked(true);

      await showSuccess("Success!", result.message || "Free Trial has been created successfully.");

      setTimeout(() => {
        navigate(`/weekly-classes/trial/list`)
      }, 1000);
      return result;

    } catch (error) {
      console.error("Error creating class schedule:", error);
      await showError("Error", error.message || "Something went wrong while creating class schedule.");
      throw error;
    } finally {
      await fetchBookFreeTrials();
      setLoading(false);
    }
  };
  const updateBookFreeTrials = async (bookFreeTrialId, updatedBookFreeTrialData) => {
    setLoading(true);

    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    if (token) {
      myHeaders.append("Authorization", `Bearer ${token}`);
    }

    const requestOptions = {
      method: "PUT",
      headers: myHeaders,
      body: JSON.stringify(updatedBookFreeTrialData),
      redirect: "follow",
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/class-schedule/${bookFreeTrialId}`, requestOptions);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update bookFreeTrial");
      }

      const result = await response.json();

      await showSuccess("Success!", result.message || "BookFreeTrial has been updated successfully.");
      return result;
    } catch (error) {
      console.error("Error updating bookFreeTrial:", error);
      await showError("Error", error.message || "Something went wrong while updating bookFreeTrial.");
      throw error;
    } finally {
      await fetchBookFreeTrials();
      setLoading(false);
    }
  };
  const updateBookFreeTrialsFamily = async (bookFreeTrialId, updatedBookFreeTrialData, updateType) => {
    setLoading(true);
    // console.log('updatedBookFreeTrialData',updatedBookFreeTrialData)
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    if (token) {
      myHeaders.append("Authorization", `Bearer ${token}`);
    }

    const requestOptions = {
      method: "PUT",
      headers: myHeaders,
      body: JSON.stringify({ students: updatedBookFreeTrialData })
      , redirect: "follow",
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/service-history/update-booking/information/${bookFreeTrialId}`, requestOptions);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update bookFreeTrial");
      }

      const result = await response.json();

      await showSuccess("Success!", result.message || "BookFreeTrial has been updated successfully.");

      return result;
    } catch (error) {
      console.error("Error updating bookFreeTrial:", error);
      await showError("Error", error.message || "Something went wrong while updating bookFreeTrial.");
      throw error;
    } finally {
      if (updateType !== "leadsbooking") {
        navigate(`/weekly-classes/trial/list`);
      }
      setLoading(false);
    }
  };

  const deleteBookFreeTrial = useCallback(async (id) => {
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/class-schedule/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to delete bookFreeTrial");
      }

      await showSuccess("Success!", data.message || "BookFreeTrial deleted successfully");
      await fetchBookFreeTrials(); // Refresh the list
    } catch (err) {
      console.error("Failed to delete bookFreeTrial:", err);
      await showError("Error", err.message || "Something went wrong");
    }
  }, [token, fetchBookFreeTrials]);

  const serviceHistoryFetchById = useCallback(async (ID) => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/service-history/account-profile/${ID}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const resultRaw = await response.json();
      const result = resultRaw.data || [];
      setServiceHistory(result);
    } catch (error) {
      console.error("Failed to fetch bookFreeTrials:", error);
    } finally {
      setLoading(false);
    }
  }, []);
  const sendFreeTrialmail = async (bookingIds) => {
    setLoading(true);

    const headers = {
      "Content-Type": "application/json",
    };
    // console.log('bookingIds', bookingIds)
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/book/free-trials/send-email`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          bookingIds: bookingIds, // make sure bookingIds is an array like [96, 97]
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to create Membership");
      }

      await showSuccess("Success!", result.message || "Trial emails have been sent successfully.");

      return result;

    } catch (error) {
      console.error("Error creating class schedule:", error);
      await showError("Error", error.message || "Something went wrong while creating class schedule.");
      throw error;
    } finally {
      await fetchBookFreeTrials();
      setLoading(false);
    }
  };
  const cancelFreeTrial = async (bookingIds) => {
    setLoading(true);

    const headers = {
      "Content-Type": "application/json",
    };
    // console.log('bookingIds', bookingIds)
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/cancel-freeTrial`, {
        method: "POST",
        headers,
        body: JSON.stringify(bookingIds, // make sure bookingIds is an array like [96, 97]
        ),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to create Membership");
      }

      await showSuccess("Success!", result.message || "Trial has been cancelled successfully.");
      navigate(`/weekly-classes/trial/list`)
      return result;

    } catch (error) {
      console.error("Error cancelling free trial:", error);
      await showError("Error", error.message || "Something went wrong while cancelling free trial.");

      throw error;
    } finally {
      await fetchBookFreeTrials();
      setLoading(false);
    }
  };
  const rebookFreeTrialsubmit = async (bookingIds) => {
    setLoading(true);

    const headers = {
      "Content-Type": "application/json",
    };
    // console.log('bookingIds', bookingIds)
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/reebooking`, {
        method: "POST",
        headers,
        body: JSON.stringify(bookingIds, // make sure bookingIds is an array like [96, 97]
        ),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to create Membership");
      }

      await showSuccess("Success!", result.message || "Trial has been rebooked successfully.");

      return result;

    } catch (error) {
      console.error("Error creating class schedule:", error);
      await showError("Error", error.message || "Something went wrong while creating class schedule.");
      throw error;
    } finally {
      await fetchBookFreeTrials();
      setLoading(false);
    }
  };
  const sendCancelFreeTrialmail = async (bookingIds) => {
    setLoading(true);

    const headers = {
      "Content-Type": "application/json",
    };
    // console.log('bookingIds', bookingIds)
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/reebooking/trial/send-email`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          bookingIds: bookingIds, // make sure bookingIds is an array like [96, 97]
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to create Membership");
      }

      await showSuccess("Success!", result.message || "Trial email has been sent successfully.");
      // navigate(`/weekly-classes/trial/list`)
      return result;

    } catch (error) {
      console.error("Error sending trial email:", error);
      await showError("Error", error.message || "Something went wrong while sending trial email.");

      throw error;
    } finally {
      await fetchBookFreeTrials();
      setLoading(false);
    }
  };
  const noMembershipSubmit = async (bookingIds, comesfrom) => {
    setLoading(true);

    const headers = {
      "Content-Type": "application/json",
    };
    // console.log('bookingIds', bookingIds)
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/no-membership`, {
        method: "POST",
        headers,
        body: JSON.stringify(bookingIds, // make sure bookingIds is an array like [96, 97]
        ),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to Cancel Waiting List");
      }

      await showSuccess("Success!", result.message);
      navigate(`/weekly-classes/trial/list`);

      return result;

    } catch (error) {
      console.error("Error creating no membership:", error);
      await showError("Error", error.message || "Something went wrong while creating no membership.");


      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Book a Membership
  const fetchBookMemberships = useCallback(
    async (
      studentName = "",
      venueName = "",
      status1 = false,
      status2 = false,
      dateRangeMembership = [],
      month0 = false,  // 👉 will always be [fromDate, toDate] for trialDate
      month1 = false,
      month2 = false,
      month3 = false,
      otherDateRange = [],        // 👉 will always be [fromDate, toDate] for general
      BookedBy = []
    ) => {
      const token = localStorage.getItem("adminToken");
      if (!token) return;

      const shouldShowLoader =
        studentName ||
        venueName ||
        status1 ||
        status2 ||
        dateRangeMembership.length ||
        otherDateRange.length;

      // if (shouldShowLoader) setLoading(true);

      try {
        const queryParams = new URLSearchParams();

        if (studentName) queryParams.append("studentName", studentName);
        if (venueName) queryParams.append("venueName", venueName);

        if (status1) queryParams.append("status", "pending");
        if (status2) queryParams.append("status", "active");
        if (month0) queryParams.append("duration", "12 Month");
        if (month1) queryParams.append("duration", "6 Month");
        if (month2) queryParams.append("duration", "3 Month");
        if (month3) queryParams.append("duration", "1 Month");

        if (Array.isArray(BookedBy) && BookedBy.length > 0) {
          BookedBy.forEach(agent => queryParams.append("bookedBy", agent));
        }

        // 🔹 Handle trialDate (dateBooked range)
        if (Array.isArray(dateRangeMembership) && dateRangeMembership.length === 2) {
          const [from, to] = dateRangeMembership;
          if (from && to) {
            queryParams.append("dateFrom", formatLocalDate(from));
            queryParams.append("dateTo", formatLocalDate(to));
          }
        }

        // 🔹 Handle general (createdAt range)
        if (Array.isArray(otherDateRange) && otherDateRange.length === 2) {
          const [from, to] = otherDateRange;
          if (from && to) {
            queryParams.append("fromDate", formatLocalDate(from));
            queryParams.append("toDate", formatLocalDate(to));
          }
        }

        const url = `${API_BASE_URL}/api/admin/book-membership${queryParams.toString() ? `?${queryParams.toString()}` : ""
          }`;

        const response = await fetch(url, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });

        const resultRaw = await response.json();
        const result = resultRaw.data.membership || [];
        const venues = resultRaw.data.venue || [];
        const bookedByAdmin = resultRaw.data.bookedByAdmins || [];
        const MyStats = resultRaw.stats || [];

        setBookedByAdmin(bookedByAdmin);
        setStatsMembership(MyStats);
        setMyVenues(Array.isArray(venues) ? venues : []);
        setBookMembership(result);
      } catch (error) {
        console.error("Failed to fetch bookMemberships:", error);
      } finally {
        // if (shouldShowLoader) setLoading(false);
      }
    },
    [API_BASE_URL]
  );
  const fetchBookMembershipsLoading = useCallback(
    async (
      studentName = "",
      venueName = "",
      status1 = false,
      status2 = false,
      dateRangeMembership = [],   // 👉 will always be [fromDate, toDate] for trialDate
      month1 = false,
      month2 = false,
      month3 = false,
      otherDateRange = [],        // 👉 will always be [fromDate, toDate] for general
      BookedBy = []
    ) => {
      const token = localStorage.getItem("adminToken");
      if (!token) return;

      const shouldShowLoader =
        studentName ||
        venueName ||
        status1 ||
        status2 ||
        dateRangeMembership.length ||
        otherDateRange.length;

      setLoading(true);

      try {
        const queryParams = new URLSearchParams();

        if (studentName) queryParams.append("studentName", studentName);
        if (venueName) queryParams.append("venueName", venueName);

        if (status1) queryParams.append("status", "pending");
        if (status2) queryParams.append("status", "active");

        if (month1) queryParams.append("duration", "6");
        if (month2) queryParams.append("duration", "3");
        if (month3) queryParams.append("duration", "1");

        if (Array.isArray(BookedBy) && BookedBy.length > 0) {
          BookedBy.forEach(agent => queryParams.append("bookedBy", agent));
        }

        // 🔹 Handle trialDate (dateBooked range)
        if (Array.isArray(dateRangeMembership) && dateRangeMembership.length === 2) {
          const [from, to] = dateRangeMembership;
          if (from && to) {
            queryParams.append("dateFrom", formatLocalDate(from));
            queryParams.append("dateTo", formatLocalDate(to));
          }
        }

        // 🔹 Handle general (createdAt range)
        if (Array.isArray(otherDateRange) && otherDateRange.length === 2) {
          const [from, to] = otherDateRange;
          if (from && to) {
            queryParams.append("fromDate", formatLocalDate(from));
            queryParams.append("toDate", formatLocalDate(to));
          }
        }

        const url = `${API_BASE_URL}/api/admin/book-membership${queryParams.toString() ? `?${queryParams.toString()}` : ""
          }`;

        const response = await fetch(url, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });

        const resultRaw = await response.json();
        const result = resultRaw.data.membership || [];
        const venues = resultRaw.data.venue || [];
        const bookedByAdmin = resultRaw.data.bookedByAdmins || [];
        const MyStats = resultRaw.stats || [];

        setBookedByAdmin(bookedByAdmin);
        setStatsMembership(MyStats);
        setMyVenues(Array.isArray(venues) ? venues : []);
        setBookMembership(result);
      } catch (error) {
        console.error("Failed to fetch bookMemberships:", error);
      } finally {
        setLoading(false);
      }
    },
    [API_BASE_URL]
  );
  const updateBookMembershipFamily = async (bookFreeTrialId, updatedBookFreeTrialData, updateType) => {
    setLoading(true);
    // console.log('updatedBookFreeTrialData',updatedBookFreeTrialData)
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    if (token) {
      myHeaders.append("Authorization", `Bearer ${token}`);
    }

    const requestOptions = {
      method: "PUT",
      headers: myHeaders,
      body: JSON.stringify({ students: updatedBookFreeTrialData })
      , redirect: "follow",
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/book-membership/${bookFreeTrialId}`, requestOptions);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update bookFreeTrial");
      }

      const result = await response.json();

      await showSuccess("Success!", result.message || "BookFreeTrial has been updated successfully.");

      return result;
    } catch (error) {
      console.error("Error updating bookFreeTrial:", error);
      await showError("Error", error.message || "Something went wrong while updating bookFreeTrial.");
      throw error;
    } finally {
      if (updateType !== "leadsbooking") {
        navigate(`/weekly-classes/all-members/list`)
      }

      setLoading(false);
    }
  };

  const serviceHistoryMembership = useCallback(async (ID) => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/book-membership/account-information/${ID}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const resultRaw = await response.json();

      // Check API-level error
      if (!resultRaw.status) {
        throw new Error(resultRaw.message || "Failed to fetch booking info");
      }

      const result = resultRaw.data || [];
      setServiceHistory(result);
    } catch (err) {
      console.error("Failed to fetch booking info:", err);
      setError(err.message || "Something went wrong");
      setServiceHistory([]); // clear previous data if error
    } finally {
      setLoading(false);
    }
  }, []);
  const createBookMembership = async (bookFreeMembershipData, leadId) => {
    setLoading(true);

    const headers = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    let url = `${API_BASE_URL}/api/admin/book-membership/`;

    if (leadId) {
      // if leadId exists (true / string / non-null)  
      url += `${encodeURIComponent(leadId)}`;
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(bookFreeMembershipData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to create Membership");
      }

      await showSuccess("Success!", result.message || "Membership has been created successfully.");
      navigate(`/weekly-classes/all-members/list`)
      return result;

    } catch (error) {
      console.error("Error creating class schedule:", error);
      await showError("Error", error.message || "Something went wrong while creating class schedule.");
      throw error;
    } finally {
      await fetchBookMemberships();
      setLoading(false);
    }
  };
  const createBookLeads = async (bookFreeMembershipData) => {
    setLoading(true);

    const headers = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/one-to-one/booking/create`, {
        method: "POST",
        headers,
        body: JSON.stringify(bookFreeMembershipData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to create Membership");
      }

      await showSuccess("Success!", result.message || "Membership has been created successfully.");
      navigate(`/one-to-one`)
      return result;

    } catch (error) {
      console.error("Error creating class schedule:", error);
      await showError("Error", error.message || "Something went wrong while creating class schedule.");
      throw error;
    } finally {
      // await fetchBookMemberships();
      setLoading(false);
    }
  };
  const createBookBirthday = async (bookFreeMembershipData) => {
    setLoading(true);

    const headers = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/birthday-party/booking/create`, {
        method: "POST",
        headers,
        body: JSON.stringify(bookFreeMembershipData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to create Membership");
      }

      await showSuccess("Success!", result.message || "Membership has been created successfully.");
      navigate(`/birthday-party/leads`)
      return result;

    } catch (error) {
      console.error("Error creating class schedule:", error);
      await showError("Error", error.message || "Something went wrong while creating class schedule.");
      throw error;
    } finally {
      // await fetchBookMemberships();
      setLoading(false);
    }
  };
  const createBookMembershipByfreeTrial = async (bookFreeMembershipData, trialId) => {
    setLoading(true);

    const headers = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/service-history/trial-to-membership/${trialId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(bookFreeMembershipData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to create Membership");
      }

      await showSuccess("Success!", result.message || "Membership has been created successfully.");
      navigate(`/weekly-classes/all-members/list`)
      return result;

    } catch (error) {
      console.error("Error creating class schedule:", error);
      await showError("Error", error.message || "Something went wrong while creating class schedule.");
      throw error;
    } finally {
      await fetchBookMemberships();
      setLoading(false);
    }
  };
  const createBookMembershipByWaitingList = async (bookFreeMembershipData, trialId) => {
    setLoading(true);

    const headers = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/waiting-list/convert-membership/${trialId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(bookFreeMembershipData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to create Membership");
      }

      await showSuccess("Success!", result.message || "Membership has been created successfully.");
      navigate(`/weekly-classes/all-members/list`)
      return result;

    } catch (error) {
      console.error("Error creating class schedule:", error);
      await showError("Error", error.message || "Something went wrong while creating class schedule.");
      throw error;
    } finally {
      await fetchBookMemberships();
      setLoading(false);
    }
  };
  const sendBookMembershipMail = async (bookingIds) => {
    setLoading(true);

    const headers = {
      "Content-Type": "application/json",
    };
    // console.log('bookingIds', bookingIds)
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/book-membership/send/email`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          bookingIds: bookingIds, // make sure bookingIds is an array like [96, 97]
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to create Membership");
      }

      await showSuccess("Success!", result.message || "Membership email has been sent successfully.");

      return result;

    } catch (error) {
      console.error("Error sending membership email:", error);
      await showError("Error", error.message || "Something went wrong while sending membership email.");
      throw error;
    } finally {
      navigate(`/weekly-classes/all-members/list`);

      await fetchBookMemberships();
      setLoading(false);
    }
  };
  const cancelMembershipSubmit = async (bookingIds, comesfrom) => {
    setLoading(true);

    const headers = {
      "Content-Type": "application/json",
    };
    // console.log('bookingIds', bookingIds)
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/cancel-membership/`, {
        method: "POST",
        headers,
        body: JSON.stringify(bookingIds, // make sure bookingIds is an array like [96, 97]
        ),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to create Membership");
      }

      await showSuccess("Success!", result.message || "Trialsssssss has been created successfully.");
      if (comesfrom === "allMembers") {
        navigate(`/weekly-classes/all-members/list`);
      } else {
        navigate(`/weekly-classes/all-members/membership-sales`);
      }

      return result;

    } catch (error) {
      console.error("Error creating class schedule:", error);
      await showError("Error", error.message || "Something went wrong while creating class schedule.");
      throw error;
    } finally {
      setLoading(false);
    }
  };
  const cancelHolidaySubmit = async (bookingIds, comesfrom) => {
    setLoading(true);

    const headers = {
      "Content-Type": "application/json",
    };
    // console.log('bookingIds', bookingIds)
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/holiday/booking/cancel/${bookingIds.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(bookingIds, // make sure bookingIds is an array like [96, 97]
        ),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to create Membership");
      }

      await showSuccess("Success!", result.message || "Trialsssssss has been created successfully.");
      if (comesfrom === "allMembers") {
        navigate(`/holiday-camp/members/list`);
      } else {
        navigate(`/holiday-camp/members/list`);
      }

      return result;

    } catch (error) {
      console.error("Error creating class schedule:", error);
      await showError("Error", error.message || "Something went wrong while creating class schedule.");
      throw error;
    } finally {
      setLoading(false);
    }
  };
  const transferMembershipSubmit = async (bookingIds, comesfrom) => {
    setLoading(true);

    const headers = {
      "Content-Type": "application/json",
    };
    // console.log('bookingIds', bookingIds)
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/book-membership/transfer/class`, {
        method: "POST",
        headers,
        body: JSON.stringify(bookingIds, // make sure bookingIds is an array like [96, 97]
        ),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result?.message?.includes("No slots left")) {
          showWarning("Warning", result.message || "No slots left in the target class for transfer.");
          return;
        }

        showError("Error", result.message || "Failed to transfer membership.");
        return;
      }




      await showSuccess("Success!", result.message || "Trialsssssss has been created successfully.");
      if (comesfrom === "allMembers") {
        navigate(`/weekly-classes/all-members/list`);
      } else {
        navigate(`/weekly-classes/all-members/membership-sales`);
      }

      return result;

    } catch (error) {
      console.error("Error creating class schedule:", error);
      await showError("Error", error.message || "Something went wrong while creating class schedule.");
      throw error;
    } finally {
      setLoading(false);
    }
  };
  const freezerMembershipSubmit = async (bookingIds, comesfrom) => {
    setLoading(true);

    const headers = {
      "Content-Type": "application/json",
    };
    // console.log('bookingIds', bookingIds)
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/membership/freeze`, {
        method: "POST",
        headers,
        body: JSON.stringify(bookingIds, // make sure bookingIds is an array like [96, 97]
        ),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to create Membership");
      }

      await showSuccess("Success!", result.message || "Membership has been frozen successfully.");
      if (comesfrom === "allMembers") {
        navigate(`/weekly-classes/all-members/list`);
      } else {
        navigate(`/weekly-classes/all-members/membership-sales`);
      }

      return result;

    } catch (error) {
      console.error("Error freezing membership:", error);
      await showError("Error", error.message || "Something went wrong while freezing membership.");
      throw error;
    } finally {
      setLoading(false);
    }
  };
  const reactivateDataSubmit = async (bookingIds, comesfrom) => {
    setLoading(true);

    const headers = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      if (!bookingIds || Object.keys(bookingIds).length === 0) {
        throw new Error("No booking IDs provided");
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/membership/reactivate`, {
        method: "POST",
        headers,
        body: JSON.stringify(bookingIds), // sending as object
      });

      let result;

      try {
        result = await response.json(); // try parsing JSON
      } catch {
        throw new Error("Server did not return valid JSON"); // avoid white page
      }

      if (!response.ok) {
        throw new Error(result?.message || "Failed to reactivate membership");
      }

      await showSuccess("Success!", result.message || "Membership has been reactivated successfully.");

      if (comesfrom === "allMembers") {
        navigate(`/weekly-classes/all-members/list`);
      } else {
        navigate(`/weekly-classes/all-members/membership-sales`);
      }

      return result;

    } catch (error) {
      console.error("Error reactivating membership:", error);
      await showError("Error", error.message || "Something went wrong while reactivating membership.");
      throw error;

    } finally {
      setLoading(false);
    }
  };
  const fetchMembershipSales = useCallback(
    async (
      studentName = "",
      venueName = "",
      status1 = false,
      status2 = false,
      dateRangeMembership = [],
      month0 = false,   // 👉 will always be [fromDate, toDate] for trialDate
      month1 = false,
      month2 = false,
      month3 = false,
      otherDateRange = [],        // 👉 will always be [fromDate, toDate] for general
      BookedBy = []
    ) => {
      const token = localStorage.getItem("adminToken");
      if (!token) return;

      const shouldShowLoader =
        studentName ||
        venueName ||
        status1 ||
        status2 ||
        dateRangeMembership.length ||
        otherDateRange.length;

      // if (shouldShowLoader) setLoading(true);

      try {
        const queryParams = new URLSearchParams();

        if (studentName) queryParams.append("studentName", studentName);
        if (venueName) queryParams.append("venueName", venueName);

        if (status1) queryParams.append("status", "pending");
        if (status2) queryParams.append("status", "active");
        if (month0) queryParams.append("duration", "12 Month");
        if (month1) queryParams.append("duration", "6 Month");
        if (month2) queryParams.append("duration", "3 Month");
        if (month3) queryParams.append("duration", "1 Month");

        if (Array.isArray(BookedBy) && BookedBy.length > 0) {
          BookedBy.forEach(agent => queryParams.append("bookedBy", agent));
        }

        // 🔹 Handle trialDate (dateBooked range)
        if (Array.isArray(dateRangeMembership) && dateRangeMembership.length === 2) {
          const [from, to] = dateRangeMembership;
          if (from && to) {
            queryParams.append("dateFrom", formatLocalDate(from));
            queryParams.append("dateTo", formatLocalDate(to));
          }
        }

        // 🔹 Handle general (createdAt range)
        if (Array.isArray(otherDateRange) && otherDateRange.length === 2) {
          const [from, to] = otherDateRange;
          if (from && to) {
            queryParams.append("fromDate", formatLocalDate(from));
            queryParams.append("toDate", formatLocalDate(to));
          }
        }

        const url = `${API_BASE_URL}/api/admin/book-membership/active${queryParams.toString() ? `?${queryParams.toString()}` : ""
          }`;

        const response = await fetch(url, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });

        const resultRaw = await response.json();
        const result = resultRaw.data.memberShipSales || [];
        const venues = resultRaw.data.venue || [];
        const bookedByAdmin = resultRaw.data.bookedByAdmins || [];
        const MyStats = resultRaw.stats || [];

        setBookedByAdmin(bookedByAdmin);
        setStatsMembership(MyStats);
        setMyVenues(Array.isArray(venues) ? venues : []);
        setBookMembership(result);
      } catch (error) {
        console.error("Failed to fetch bookMemberships:", error);
      } finally {
        // if (shouldShowLoader) setLoading(false);
      }
    },
    [API_BASE_URL]
  );
  const fetchMembershipSalesLoading = useCallback(
    async (
      studentName = "",
      venueName = "",
      status1 = false,
      status2 = false,
      dateRangeMembership = [],   // 👉 will always be [fromDate, toDate] for trialDate
      month1 = false,
      month2 = false,
      month3 = false,
      otherDateRange = [],        // 👉 will always be [fromDate, toDate] for general
      BookedBy = []
    ) => {
      const token = localStorage.getItem("adminToken");
      if (!token) return;

      const shouldShowLoader =
        studentName ||
        venueName ||
        status1 ||
        status2 ||
        dateRangeMembership.length ||
        otherDateRange.length;

      setLoading(true);

      try {
        const queryParams = new URLSearchParams();

        if (studentName) queryParams.append("studentName", studentName);
        if (venueName) queryParams.append("venueName", venueName);

        if (status1) queryParams.append("status", "pending");
        if (status2) queryParams.append("status", "active");

        if (month1) queryParams.append("duration", "6");
        if (month2) queryParams.append("duration", "3");
        if (month3) queryParams.append("duration", "1");

        if (Array.isArray(BookedBy) && BookedBy.length > 0) {
          BookedBy.forEach(agent => queryParams.append("bookedBy", agent));
        }

        // 🔹 Handle trialDate (dateBooked range)
        if (Array.isArray(dateRangeMembership) && dateRangeMembership.length === 2) {
          const [from, to] = dateRangeMembership;
          if (from && to) {
            queryParams.append("dateFrom", formatLocalDate(from));
            queryParams.append("dateTo", formatLocalDate(to));
          }
        }

        // 🔹 Handle general (createdAt range)
        if (Array.isArray(otherDateRange) && otherDateRange.length === 2) {
          const [from, to] = otherDateRange;
          if (from && to) {
            queryParams.append("fromDate", formatLocalDate(from));
            queryParams.append("toDate", formatLocalDate(to));
          }
        }

        const url = `${API_BASE_URL}/api/admin/book-membership/active${queryParams.toString() ? `?${queryParams.toString()}` : ""
          }`;

        const response = await fetch(url, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });

        const resultRaw = await response.json();
        const result = resultRaw.data.memberShipSales || [];
        const venues = resultRaw.data.venue || [];
        const bookedByAdmin = resultRaw.data.bookedByAdmins || [];
        const MyStats = resultRaw.stats || [];

        setBookedByAdmin(bookedByAdmin);
        setStatsMembership(MyStats);
        setMyVenues(Array.isArray(venues) ? venues : []);
        setBookMembership(result);
      } catch (error) {
        console.error("Failed to fetch bookMemberships:", error);
      } finally {
        setLoading(false);
      }
    },
    [API_BASE_URL]
  );
  const sendActiveBookMembershipMail = async (bookingIds) => {
    setLoading(true);

    const headers = {
      "Content-Type": "application/json",
    };
    // console.log('bookingIds', bookingIds)
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/book-membership/send-email/active-selected`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          bookingIds: bookingIds, // make sure bookingIds is an array like [96, 97]
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to create Membership");
      }

      await showSuccess("Success!", result.message || "Trialsssssss has been created successfully.");

      return result;

    } catch (error) {
      console.error("Error creating membership:", error);
      await showError("Error", error.message || "Something went wrong while creating membership.");
      throw error;
    } finally {
      await fetchMembershipSales();
      setLoading(false);
    }
  };

  // Add to Waiting List 
  const addtoWaitingListSubmit = async (bookingIds, comesfrom) => {
    if (!bookingIds || bookingIds.length === 0) {
      await showError("Warning", "Please select at least one booking to add to the waiting list.");
      return;
    }

    setLoading(true);

    try {
      const headers = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/admin/book-membership/add-to/waiting-list`,
        {
          method: "POST",
          headers,
          body: JSON.stringify(bookingIds), // bookingIds should be like [96, 97]
        }
      );

      const result = await response.json();

      if (!response.ok) {
        // Handle API-level errors gracefully
        showError("Error", result.message || result.error || "Failed to add to waiting list.");
        return;
      }

      // ✅ Success alert
      await showSuccess("Success!", result.message || "Members have been successfully added to the waiting list.");


      // ✅ Navigate safely based on source
      if (comesfrom === "allMembers") {
        navigate("/weekly-classes/all-members/list");
      } else {
        navigate("/weekly-classes/all-members/membership-sales");
      }
      setaddToWaitingList(false)

      return result;
    } catch (error) {
      console.error("Error adding to waiting list:", error);

      showError("Error", error.message || "Something went wrong while processing the request.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAddtoWaitingList = useCallback(
    async (
      studentName = "",
      venueName = "",
      status1 = false,
      status2 = false,
      forHigh = false,
      otherDateRange = [],
      dateoftrial = [],
      forOtherDate = [],
      BookedBy = []

    ) => {
      const token = localStorage.getItem("adminToken");
      if (!token) return;
      // console.log('status1', status1)
      // console.log('satus2', status2)
      // console.log('otherDateRange', otherDateRange)
      // console.log('dateoftrial', dateoftrial)
      // console.log('forOtherDate', forOtherDate)

      const shouldShowLoader = studentName || venueName || status1 || status2 || otherDateRange || dateoftrial || forOtherDate;
      // if (shouldShowLoader) setLoading(true);

      try {
        const queryParams = new URLSearchParams();

        // Student & Venue filters
        if (studentName) queryParams.append("studentName", studentName);
        if (venueName) queryParams.append("venueName", venueName);

        // Status filters
        if (status1) queryParams.append("interest", "low");
        if (status2) queryParams.append("interest", "Medium");
        if (forHigh) queryParams.append("interest", "High");
        if (BookedBy && Array.isArray(BookedBy) && BookedBy.length > 0) {
          BookedBy.forEach(agent => queryParams.append("bookedBy", agent));
        }

        if (Array.isArray(dateoftrial) && dateoftrial.length === 2) {
          const [from, to] = dateoftrial;
          if (from && to) {
            queryParams.append("dateTrialFrom", formatLocalDate(from));
            queryParams.append("dateTrialTo", formatLocalDate(to));
          }
        }

        // 🔹 Handle general (createdAt range)
        if (Array.isArray(otherDateRange) && otherDateRange.length === 2) {
          const [from, to] = otherDateRange;
          if (from && to) {
            queryParams.append("fromDate", formatLocalDate(from));
            queryParams.append("toDate", formatLocalDate(to));
          }
        }

        if (Array.isArray(forOtherDate) && forOtherDate.length === 2) {
          const [from, to] = forOtherDate;
          if (from && to) {
            queryParams.append("fromDate", formatLocalDate(from));
            queryParams.append("toDate", formatLocalDate(to));
          }
        }

        const url = `${API_BASE_URL}/api/admin/waiting-list/${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
        const response = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const resultRaw = await response.json();
        const result = resultRaw.data.waitingList || [];
        const venues = resultRaw.data.venue || [];
        const bookedByAdmin = resultRaw.data.bookedByAdmins || []
        setBookedByAdmin(bookedByAdmin);
        setMyVenues(Array.isArray(venues) ? venues : []);
        setStatsFreeTrial(resultRaw.data.stats)
        setBookFreeTrials(result);
      } catch (error) {
        console.error("Failed to fetch bookFreeTrials:", error);
      } finally {
        // if (shouldShowLoader) setLoading(false); // only stop loader if it was started
      }
    },
    []
  );
  const cancelWaitingListSpot = async (bookingIds, comesfrom) => {
    setLoading(true);

    const headers = {
      "Content-Type": "application/json",
    };
    // console.log('bookingIds', bookingIds)
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/waiting-list/from/remove`, {
        method: "POST",
        headers,
        body: JSON.stringify(bookingIds, // make sure bookingIds is an array like [96, 97]
        ),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to Cancel Waiting List");
      }

      await showSuccess("Success!", result.message || "Trialsssssss has been created successfully.");
      if (comesfrom === "allMembers") {
        navigate(`/weekly-classes/all-members/list`);
      } else if (comesfrom === "waitingList") {
        navigate(`/weekly-classes/find-a-class/add-to-waiting-list/list`);
      } else {
        navigate(`/weekly-classes/all-members/membership-sales`);
      }
      setRemoveWaiting(false);
      setshowCancelTrial(false)


      return result;

    } catch (error) {
      console.error("Error cancelling waiting list spot:", error);
      await showError("Error", error.message || "Something went wrong while cancelling waiting list spot.");
      throw error;
    } finally {
      setLoading(false);
    }
  };
  const sendWaitingListMail = async (bookingIds) => {
    setLoading(true);

    const headers = {
      "Content-Type": "application/json",
    };
    // console.log('bookingIds', bookingIds)
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/waiting-list/send-email`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          bookingIds: bookingIds, // make sure bookingIds is an array like [96, 97]
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to create Membership");
      }

      await showSuccess("Success!", result.message || "Trialsssssss has been created successfully.");

      return result;

    } catch (error) {
      console.error("Error creating class schedule:", error);
      await showError("Error", error.message || "Something went wrong while creating class schedule.");
      throw error;
    } finally {
      await fetchAddtoWaitingList();
      setLoading(false);
    }
  };
  const serviceHistoryWaitingList = useCallback(async (ID) => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/waiting-list/service-history/${ID}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const resultRaw = await response.json();
      const result = resultRaw.data || [];
      setServiceHistory(result);
    } catch (error) {
      console.error("Failed to fetch bookFreeTrials:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCapacity = useCallback(async (venueName = "") => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    const queryParams = new URLSearchParams();
    if (venueName) queryParams.append("venueName", venueName);

    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/admin/capacity${queryParams.toString() ? `?${queryParams.toString()}` : ""}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const result = await res.json();
      setCapacityData(result?.data ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);
  const fetchCapacitySearch = useCallback(async (
    venueNames = [],   // now array instead of string
    otherDateRange = []
  ) => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;
    setSearchLoading(true);

    const queryParams = new URLSearchParams();

    if (Array.isArray(venueNames) && venueNames.length > 0) {
      venueNames.forEach((name) => queryParams.append("venueName", name));
    }

    if (Array.isArray(otherDateRange) && otherDateRange.length === 2) {
      const [from, to] = otherDateRange;
      if (from && to) {
        queryParams.append("fromDate", formatLocalDate(from));
        queryParams.append("toDate", formatLocalDate(to));
      }
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/admin/capacity${queryParams.toString() ? `?${queryParams.toString()}` : ""}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const result = await res.json();
      setCapacityData(result?.data ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setSearchLoading(false);
    }
  }, []);
  const createWaitinglist = async (waitingListData, islead) => {
    setLoading(true);

    const headers = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    let url = `${API_BASE_URL}/api/admin/waiting-list/`;

    if (islead) {
      // if isLead exists (true / string / non-null)  
      url += `${encodeURIComponent(islead)}`;
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(waitingListData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to create Membership");
      }

      await showSuccess("Success!", result.message || "Membership has been created successfully.");

      navigate(`/weekly-classes/find-a-class/add-to-waiting-list/list`)
      return result;

    } catch (error) {
      console.error("Error creating class schedule:", error);
      await showError("Error", error.message || "Something went wrong while creating class schedule.");
      throw error;
    } finally {
      await fetchAddtoWaitingList();
      setLoading(false);
    }
  };
  const createHolidayWaitinglist = async (waitingListData, islead) => {
    setLoading(true);

    const headers = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    let url = `${API_BASE_URL}/api/admin/holiday/booking/waiting-list/create`;

    if (islead) {
      // if isLead exists (true / string / non-null)  
      url += `${encodeURIComponent(islead)}`;
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(waitingListData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to create Membership");
      }

      await showSuccess("Success!", result.message || "Membership has been created successfully.");
      navigate(`/holiday-camp/members/list`)
      return result;

    } catch (error) {
      console.error("Error creating class schedule:", error);
      await showError("Error", error.message || "Something went wrong while creating class schedule.");
      throw error;
    } finally {
      await fetchAddtoWaitingList();
      setLoading(false);
    }
  };

  // Cancellation 
  const fetchFullCancellations = useCallback(
    async (
      studentName = "",
      venueName = "",
      status1 = false,
      status2 = false,
      otherDateRange = [],
      dateoftrial = [],
      forOtherDate = [],
      BookedBy = []

    ) => {
      const token = localStorage.getItem("adminToken");
      if (!token) return;
      // console.log('status1', status1)
      // console.log('satus2', status2)
      // console.log('otherDateRange', otherDateRange)
      // console.log('dateoftrial', dateoftrial)
      // console.log('forOtherDate', forOtherDate)

      const shouldShowLoader =
        !studentName && !venueName && !status1 && !status2 &&
        (!Array.isArray(otherDateRange) || otherDateRange.length === 0) &&
        (!Array.isArray(dateoftrial) || dateoftrial.length === 0) &&
        (!Array.isArray(forOtherDate) || forOtherDate.length === 0) &&
        (!Array.isArray(BookedBy) || BookedBy.length === 0);
      if (shouldShowLoader) setLoading(true);

      try {
        const queryParams = new URLSearchParams();

        // Student & Venue filters
        if (studentName) queryParams.append("studentName", studentName);
        if (venueName) queryParams.append("venueName", venueName);

        // Status filters
        if (status1) queryParams.append("status", "request_to_cancel");
        if (status2) queryParams.append("status", "cancelled");
        if (BookedBy && Array.isArray(BookedBy) && BookedBy.length > 0) {
          BookedBy.forEach(agent => queryParams.append("bookedBy", agent));
        }

        if (Array.isArray(dateoftrial) && dateoftrial.length === 2) {
          const [from, to] = dateoftrial;
          if (from && to) {
            queryParams.append("dateTrialFrom", formatLocalDate(from));
            queryParams.append("dateTrialTo", formatLocalDate(to));
          }
        }

        // 🔹 Handle general (createdAt range)
        if (Array.isArray(otherDateRange) && otherDateRange.length === 2) {
          const [from, to] = otherDateRange;
          if (from && to) {
            queryParams.append("fromDate", formatLocalDate(from));
            queryParams.append("toDate", formatLocalDate(to));
          }
        }

        if (Array.isArray(forOtherDate) && forOtherDate.length === 2) {
          const [from, to] = forOtherDate;
          if (from && to) {
            queryParams.append("fromDate", formatLocalDate(from));
            queryParams.append("toDate", formatLocalDate(to));
          }
        }
        // Trial dates (support array or single value)
        // const trialDates = Array.isArray(dateoftrial) ? dateoftrial : [dateoftrial];
        // trialDates
        //   .filter(Boolean)
        //   .map(d => formatLocalDate(d))
        //   .filter(Boolean)
        //   .forEach(d => queryParams.append("trialDate", d));

        const url = `${API_BASE_URL}/api/admin/cancellation/full-cancellation/${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
        const response = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const resultRaw = await response.json();
        const result = resultRaw.data.cancellationData || [];
        const venues = resultRaw.data.allVenue || [];
        const filteredVenues = venues.filter(v => v !== null && v !== undefined);
        const bookedByAdmin = resultRaw.data.bookedByAdmin || []
        setBookedByAdmin(bookedByAdmin);
        if (filteredVenues.length > 0) {
          setMyVenues(filteredVenues);
        }

        setStatsFreeTrial(resultRaw.data.stats)
        setBookFreeTrials(result);
      } catch (error) {
        console.error("Failed to fetch bookFreeTrials:", error);
      } finally {
        if (shouldShowLoader) setLoading(false); // only stop loader if it was started
      }
    },
    []
  );
  const fetchRequestToCancellations = useCallback(
    async (
      studentName = "",
      venueName = "",
      status1 = false,
      status2 = false,
      otherDateRange = [],
      dateoftrial = [],
      forOtherDate = [],
      BookedBy = []

    ) => {
      const token = localStorage.getItem("adminToken");
      if (!token) return;
      // console.log('status1', status1)
      // console.log('satus2', status2)
      // console.log('otherDateRange', otherDateRange)
      // console.log('dateoftrial', dateoftrial)
      // console.log('forOtherDate', forOtherDate)

      const shouldShowLoader =
        !studentName && !venueName && !status1 && !status2 &&
        (!Array.isArray(otherDateRange) || otherDateRange.length === 0) &&
        (!Array.isArray(dateoftrial) || dateoftrial.length === 0) &&
        (!Array.isArray(forOtherDate) || forOtherDate.length === 0) &&
        (!Array.isArray(BookedBy) || BookedBy.length === 0);
      if (shouldShowLoader) setLoading(true);

      try {
        const queryParams = new URLSearchParams();

        // Student & Venue filters
        if (studentName) queryParams.append("studentName", studentName);
        if (venueName) queryParams.append("venueName", venueName);

        // Status filters
        if (status1) queryParams.append("status", "request_to_cancel");
        if (status2) queryParams.append("status", "cancelled");
        if (BookedBy && Array.isArray(BookedBy) && BookedBy.length > 0) {
          BookedBy.forEach(agent => queryParams.append("bookedBy", agent));
        }

        if (Array.isArray(dateoftrial) && dateoftrial.length === 2) {
          const [from, to] = dateoftrial;
          if (from && to) {
            queryParams.append("dateTrialFrom", formatLocalDate(from));
            queryParams.append("dateTrialTo", formatLocalDate(to));
          }
        }

        // 🔹 Handle general (createdAt range)
        if (Array.isArray(otherDateRange) && otherDateRange.length === 2) {
          const [from, to] = otherDateRange;
          if (from && to) {
            queryParams.append("fromDate", formatLocalDate(from));
            queryParams.append("toDate", formatLocalDate(to));
          }
        }

        if (Array.isArray(forOtherDate) && forOtherDate.length === 2) {
          const [from, to] = forOtherDate;
          if (from && to) {
            queryParams.append("fromDate", formatLocalDate(from));
            queryParams.append("toDate", formatLocalDate(to));
          }
        }
        // Trial dates (support array or single value)
        // const trialDates = Array.isArray(dateoftrial) ? dateoftrial : [dateoftrial];
        // trialDates
        //   .filter(Boolean)
        //   .map(d => formatLocalDate(d))
        //   .filter(Boolean)
        //   .forEach(d => queryParams.append("trialDate", d));

        const url = `${API_BASE_URL}/api/admin/cancellation/request-to-cancel/${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
        const response = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const resultRaw = await response.json();
        const result = resultRaw.data.cancellationData || [];
        const venues = resultRaw.data.allVenue || [];
        const filteredVenues = venues.filter(v => v !== null && v !== undefined);
        const bookedByAdmin = resultRaw.data.bookedByAdmin || []
        setBookedByAdmin(bookedByAdmin);
        if (filteredVenues.length > 0) {
          setMyVenues(filteredVenues);
        }
        setBookFreeTrials(result);
      } catch (error) {
        console.error("Failed to fetch bookFreeTrials:", error);
      } finally {
        if (shouldShowLoader) setLoading(false); // only stop loader if it was started
      }
    },
    []
  );
  const fetchAllCancellations = useCallback(
    async (
      studentName = "",
      venueName = "",
      status1 = false,
      status2 = false,
      otherDateRange = [],
      dateoftrial = [],
      forOtherDate = [],
      BookedBy = []

    ) => {
      const token = localStorage.getItem("adminToken");
      if (!token) return;
      // console.log('status1', status1)
      // console.log('satus2', status2)
      // console.log('otherDateRange', otherDateRange)
      // console.log('dateoftrial', dateoftrial)
      // console.log('forOtherDate', forOtherDate)

      const shouldShowLoader =
        !studentName && !venueName && !status1 && !status2 &&
        (!Array.isArray(otherDateRange) || otherDateRange.length === 0) &&
        (!Array.isArray(dateoftrial) || dateoftrial.length === 0) &&
        (!Array.isArray(forOtherDate) || forOtherDate.length === 0) &&
        (!Array.isArray(BookedBy) || BookedBy.length === 0);
      if (shouldShowLoader) setLoading(true);

      try {
        const queryParams = new URLSearchParams();

        // Student & Venue filters
        if (studentName) queryParams.append("studentName", studentName);
        if (venueName) queryParams.append("venueName", venueName);

        // Status filters
        if (status1) queryParams.append("status", "request_to_cancel");
        if (status2) queryParams.append("status", "cancelled");
        if (BookedBy && Array.isArray(BookedBy) && BookedBy.length > 0) {
          BookedBy.forEach(agent => queryParams.append("bookedBy", agent));
        }

        if (Array.isArray(dateoftrial) && dateoftrial.length === 2) {
          const [from, to] = dateoftrial;
          if (from && to) {
            queryParams.append("dateTrialFrom", formatLocalDate(from));
            queryParams.append("dateTrialTo", formatLocalDate(to));
          }
        }

        // 🔹 Handle general (createdAt range)
        if (Array.isArray(otherDateRange) && otherDateRange.length === 2) {
          const [from, to] = otherDateRange;
          if (from && to) {
            queryParams.append("fromDate", formatLocalDate(from));
            queryParams.append("toDate", formatLocalDate(to));
          }
        }

        if (Array.isArray(forOtherDate) && forOtherDate.length === 2) {
          const [from, to] = forOtherDate;
          if (from && to) {
            queryParams.append("fromDate", formatLocalDate(from));
            queryParams.append("toDate", formatLocalDate(to));
          }
        }
        // Trial dates (support array or single value)
        // const trialDates = Array.isArray(dateoftrial) ? dateoftrial : [dateoftrial];
        // trialDates
        //   .filter(Boolean)
        //   .map(d => formatLocalDate(d))
        //   .filter(Boolean)
        //   .forEach(d => queryParams.append("trialDate", d));

        const url = `${API_BASE_URL}/api/admin/cancellation/all/${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
        const response = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const resultRaw = await response.json();
        const result = resultRaw.data.cancellationData || [];
        const venues = resultRaw.data.allVenue || [];
        const bookedByAdmin = resultRaw.data.bookedByAdmin || []
        const filteredVenues = venues.filter(v => v !== null && v !== undefined);
        setBookedByAdmin(bookedByAdmin);
        if (filteredVenues.length > 0) {
          setMyVenues(filteredVenues);
        }
        setStatsFreeTrial(resultRaw.data.stats)
        setBookFreeTrials(result);
      } catch (error) {
        console.error("Failed to fetch bookFreeTrials:", error);
      } finally {
        if (shouldShowLoader) setLoading(false); // only stop loader if it was started
      }
    },
    []
  );
  const sendRequestTomail = async (bookingIds) => {
    setLoading(true);

    const headers = {
      "Content-Type": "application/json",
    };
    // console.log('bookingIds', bookingIds)
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/cancellation/request-to-cancel/send-email`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          bookingIds: bookingIds, // make sure bookingIds is an array like [96, 97]
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to create Membership");
      }

      await showSuccess("Success!", result.message || "Trialsssssss has been created successfully.");
      navigate("/weekly-classes/cancellation");
      return result;

    } catch (error) {
      console.error("Error creating class schedule:", error);
      await showError("Error", error.message || "Something went wrong while creating class schedule.");
      throw error;
    } finally {
      await fetchRequestToCancellations();
      setLoading(false);
    }
  };
  const sendAllmail = async (bookingIds) => {
    setLoading(true);

    const headers = {
      "Content-Type": "application/json",
    };
    // console.log('bookingIds', bookingIds)
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/cancellation/all/send-email`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          bookingIds: bookingIds, // make sure bookingIds is an array like [96, 97]
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to create Membership");
      }

      await showSuccess("Success!", result.message || "Trialsssssss has been created successfully.");
      navigate("/weekly-classes/cancellation", { state: 'allCancellation' });
      return result;

    } catch (error) {
      console.error("Error creating class schedule:", error);
      await showError("Error", error.message || "Something went wrong while creating class schedule.");
      throw error;
    } finally {
      await fetchAllCancellations();
      setLoading(false);
    }
  };
  const sendFullTomail = async (bookingIds) => {
    setLoading(true);

    const headers = {
      "Content-Type": "application/json",
    };
    // console.log('bookingIds', bookingIds)
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/cancellation/full-cancellation/send-email`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          bookingIds: bookingIds, // make sure bookingIds is an array like [96, 97]
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to create Membership");
      }

      await showSuccess("Success!", result.message || "Trialsssssss has been created successfully.");
      navigate("/weekly-classes/cancellation", { state: 'fullCancellation' });

      return result;

    } catch (error) {
      console.error("Error creating class schedule:", error);
      await showError("Error", error.message || "Something went wrong while creating class schedule.");
      throw error;
    } finally {
      await fetchFullCancellations();
      setLoading(false);
    }
  };
  const updateWaitingListFamily = async (bookFreeTrialId, updatedBookFreeTrialData, updateType) => {
    setLoading(true);
    // console.log('updatedBookFreeTrialData',updatedBookFreeTrialData)
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    if (token) {
      myHeaders.append("Authorization", `Bearer ${token}`);
    }

    const requestOptions = {
      method: "PUT",
      headers: myHeaders,
      body: JSON.stringify({ students: updatedBookFreeTrialData })
      , redirect: "follow",
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/waiting-list/service-history/update/${bookFreeTrialId}`, requestOptions);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update bookFreeTrial");
      }

      const result = await response.json();

      await showSuccess("Success!", result.message || "BookFreeTrial has been updated successfully.");

      return result;
    } catch (error) {
      console.error("Error updating bookFreeTrial:", error);
      await showError("Error", error.message || "Something went wrong while updating bookFreeTrial.");
      throw error;
    } finally {
      if (updateType !== "leadsbooking") {
        navigate(`/weekly-classes/find-a-class/add-to-waiting-list/list`)
      }

      setLoading(false);
    }
  };

  const ServiceHistoryRequestto = useCallback(async (ID) => {

    const token = localStorage.getItem("adminToken");
    if (!token) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/cancellation/request-to-cancel/service-history/${ID}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        // If the API returns a non-200 response, navigate immediately
        navigate("/weekly-classes/cancellation");
        return;
      }

      const resultRaw = await response.json();
      const result = resultRaw.data || [];
      setServiceHistory(result);
    } catch (error) {
      console.error("Failed to fetch service history:", error);
      navigate("/weekly-classes/cancellation");
    } finally {
      setLoading(false);
    }
  }, []);
  const ServiceHistoryFulltto = useCallback(async (ID) => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/cancellation/full-cancellation/service-history/${ID}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const resultRaw = await response.json();
      const result = resultRaw.data || [];
      setServiceHistory(result);
    } catch (error) {
      console.error("Failed to fetch bookFreeTrials:", error);
    } finally {
      setLoading(false);
    }
  }, []);
  const ServiceHistoryAlltto = useCallback(async (ID) => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/cancellation/all/service-history/${ID}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const resultRaw = await response.json();
      const result = resultRaw.data || [];
      setServiceHistory(result);
    } catch (error) {
      console.error("Failed to fetch bookFreeTrials:", error);
    } finally {
      setLoading(false);
    }
  }, []);
  return (
    <BookFreeTrialContext.Provider
      value={{// Free Trials
        bookFreeTrials,
        createBookFreeTrials,
        setLoading,
        updateBookFreeTrials,
        deleteBookFreeTrial,
        updateBookFreeTrialsFamily,
        fetchBookFreeTrials,
        fetchBookFreeTrialsID,
        fetchBookFreeTrialsByID,
        singleBookFreeTrials,
        singleBookFreeTrialsOnly,
        rebookFreeTrialsubmit,
        cancelFreeTrial,
        sendFreeTrialmail,
        sendCancelFreeTrialmail,
        sendBookMembershipMail,
        noMembershipSubmit,
        // Membership
        bookMembership,
        createBookMembership,
        createBookMembershipByfreeTrial,
        createBookMembershipByWaitingList,
        fetchBookMemberships,
        cancelMembershipSubmit,
        cancelHolidaySubmit,
        transferMembershipSubmit,
        freezerMembershipSubmit,
        reactivateDataSubmit,
        fetchMembershipSales,
        sendActiveBookMembershipMail,

        // Waiting List
        addtoWaitingListSubmit,
        updateWaitingListFamily,
        fetchAddtoWaitingList,
        cancelWaitingListSpot,
        sendWaitingListMail,
        serviceHistoryWaitingList,
        createWaitinglist,
        createHolidayWaitinglist,
        // Service History
        serviceHistory,
        setServiceHistory,
        serviceHistoryFetchById,
        serviceHistoryMembership,

        // Stats
        statsFreeTrial,
        statsMembership,

        // Admin
        bookedByAdmin,

        // Venues
        selectedVenue,
        setSelectedVenue,
        myVenues,
        setMyVenues,

        // Status / Search
        status,
        setStatus,
        searchTerm,
        setSearchTerm,

        // Form
        formData,
        setFormData,
        isEditBookFreeTrial,
        setIsEditBookFreeTrial,

        // Misc
        loading,
        setBookFreeTrials,
        setBookMembership,
        error,

        // Capacity
        fetchCapacitySearch,
        fetchCapacity,
        capacityData,
        setCapacityData,
        searchLoading,

        // Cancellations
        fetchFullCancellations,
        fetchRequestToCancellations,
        fetchAllCancellations,
        sendRequestTomail,
        sendFullTomail,
        sendAllmail,
        ServiceHistoryRequestto,
        updateBookMembershipFamily,
        removeWaiting, setRemoveWaiting,
        fetchBookFreeTrialsLoading,
        fetchBookMembershipsLoading,
        ServiceHistoryFulltto,
        ServiceHistoryAlltto,
        setIsBooked, isBooked,
        fetchMembershipSalesLoading, createBookLeads, createBookBirthday, addToWaitingList, setaddToWaitingList, showCancelTrial, setshowCancelTrial
      }}>
      {children}
    </BookFreeTrialContext.Provider>
  );
};

export const useBookFreeTrial = () => useContext(BookFreeTrialContext);
