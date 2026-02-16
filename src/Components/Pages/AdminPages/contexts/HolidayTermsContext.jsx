import { createContext, useContext, useState, useCallback } from "react";
import { useNavigate } from 'react-router-dom';
import { showSuccess, showError } from "../../../../utils/swalHelper";

const HolidayTermsContext = createContext();

export const HolidayTermsProvider = ({ children }) => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const token = localStorage.getItem("adminToken");
  const [termGroup, setTermGroup] = useState([]);
  const [termData, setTermData] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedTermGroup, setSelectedTermGroup] = useState(null);
  const [selectedTerm, setSelectedTerm] = useState(null);

  const [selectedExercise, setSelectedExercise] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [exercises, setExercises] = useState([]);
  const [myGroupData, setMyGroupData] = useState(null);


  // Fetch all termGroup
  const fetchHolidayCampMain = useCallback(async () => {
    if (!token) return;

    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/holiday/camp/list`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const result = await response.json();

      if (!response.ok || result.status === false) {
        await showError("Error", result.message || "Failed to load camp list.");
        return;
      }

      setTermGroup(result.data || []);
    } catch (err) {
      console.error("Failed to fetch termGroup:", err);
      await showError("Network Error", err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchHolidayCampDate = useCallback(async () => {
    if (!token) return;

    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/holiday/campDate/list`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result?.message || "Failed to load holiday camp dates");
      }

      setTermData(result?.data || []);
    } catch (err) {
      console.error("Failed to fetch holiday camp date:", err);

      showError("Failed to Load Data", err?.message || "Something went wrong while fetching camp dates.");
    } finally {
      setLoading(false);
    }
  }, [token]);


  const createHolidayCamp = useCallback(
    async (formdata) => {
      if (!token) throw new Error("Unauthorized");

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/admin/holiday/camp/create`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(formdata),
          }
        );

        // Safe JSON parsing
        const result = await response.json().catch(() => ({}));

        // API error handling
        if (!response.ok || !result?.status) {
          throw new Error(result?.message || "Failed to create holiday camp");
        }

        // Save into state
        setMyGroupData(result?.data || null);

        return result; // ⬅ important for  in parent
      } catch (err) {
        console.error("Failed to create holiday camp:", err);
        throw err; // rethrow so parent can show 
      }
    },
    [token]
  );




  const fetchExercises = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/session-plan-exercise`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      setExercises(result.data || []);
    } catch (err) {
      console.error("Failed to fetch packages:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);


  const createSessionExercise = useCallback(async (data, file) => {
    if (!token) return;

    try {
      const formdata = new FormData();
      formdata.append("title", data.title);
      formdata.append("description", data.description);
      formdata.append("duration", data.duration);
      console.log('formdatahh', formdata)
      if (file) formdata.append("image", file);

      await fetch(`${API_BASE_URL}/api/admin/session-plan-exercise/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // No "Content-Type", browser sets it automatically with boundary
        },
        body: formdata,
      });
      await fetchExercises(); // optional if refreshing UI
    } catch (err) {
      console.error("Failed to create exercise:", err);
    }
  }, [token, fetchExercises]);
  const fetchExerciseById = useCallback(async (id) => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/session-plan-exercise/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      setSelectedExercise(result.data || null);
    } catch (err) {
      console.error("Failed to fetch group:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);
  // Fetch single discount


  const fetchCampGroupId = useCallback(async (id) => {
    if (!token) return;

    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/holiday/camp/listBy/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const result = await response.json();

      if (!response.ok || result.status === false) {
        await showError("Error", result.message || "Failed to load camp group details.");
        return;
      }

      setSelectedTermGroup(result.data || null);
    } catch (err) {
      console.error("Failed to fetch camp group:", err);
      await showError("Network Error", err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [token]);


  // Create discount
  const fetchCampDateId = useCallback(async (id) => {
    if (!token) return;

    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/holiday/campDate/listBy/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const result = await response.json();

      if (!response.ok || result.status === false) {
        await showError("Error", result.message || "Failed to load camp date details.");
        return;
      }

      setSelectedTerm(result.data || null);
    } catch (err) {
      console.error("Failed to fetch camp date:", err);
      await showError("Network Error", err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [token]);


  const updateHolidayCampDate = useCallback(
    async (id, data) => {
      if (!token) throw new Error("Unauthorized");

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/admin/holiday/camp/update/${id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(data),
          }
        );

        // Parse server response safely
        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(result?.message || "Failed to update holiday camp date");
        }

        // Save into state
        setMyGroupData(result?.data || null);
        // Refresh UI data
        await fetchHolidayCampMain();

        return result; // important for  success msg in parent
      } catch (err) {
        console.error("Failed to update holiday camp date:", err);
        throw err; // so the calling function can show  error
      }
    },
    [token, fetchHolidayCampMain]
  );



  // Delete discount
  const deleteCampDate = useCallback(
    async (id) => {
      if (!token) return;

      // Loading popup
setLoading(true)
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/admin/holiday/campDate/delete/${id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const result = await response.json().catch(() => ({})); // safe parse

        if (!response.ok) {
          const errorMessage =
            result?.message ||
            "Something went wrong while deleting. Please try again.";

          throw new Error(errorMessage);
        }

        // Success message
        showSuccess("Holiday Camp Date Deleted!", result?.message || "Holiday camp date removed successfully.");

        await fetchHolidayCampDate();
      } catch (err) {
        console.error("Delete failed:", err);

        showError("Failed to Delete Holiday Camp Date", err.message || "Something went wrong. Please try again.");
      }
      finally{
  setLoading(false)
      }
    },
    [token, fetchHolidayCampDate]
  );



  const deleteSessionlevel = useCallback(async (id, level) => {
    if (!token) return;
    try {
      await fetch(`${API_BASE_URL}/api/admin/holiday/session-plan-group${id}/level/${level}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },

      });
      await fetchHolidayCampMain();
    } catch (err) {
      console.error("Failed to delete discount:", err);
    }
  }, [token, fetchHolidayCampMain]);


  return (
    <HolidayTermsContext.Provider
      value={{
        // termGroup
        termGroup,
        setTermGroup,
        loading,
        createHolidayCamp,
        createSessionExercise,
        selectedTermGroup,
        selectedTerm,
        fetchHolidayCampMain,
        fetchCampGroupId,
        fetchCampDateId,
        updateHolidayCampDate,
        setSelectedTermGroup,
        setSelectedTerm,
        deleteCampDate,

        selectedExercise,
        setSelectedExercise,
        exercises,
        myGroupData,
        setMyGroupData,
        fetchHolidayCampDate,
        termData,
        setExercises,
        fetchExerciseById,
        deleteSessionlevel,
        fetchExercises,
      }}
    >
      {children}
    </HolidayTermsContext.Provider>
  );
};

export const useHolidayTerm = () => useContext(HolidayTermsContext);
