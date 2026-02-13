import { createContext, useContext, useState, useCallback } from "react";
import { showSuccess, showError } from '../../../../utils/swalHelper';
import { useNavigate } from 'react-router-dom';

const PaymentPlanContext = createContext();

export const PaymentPlanContextProvider = ({ children }) => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const token = localStorage.getItem("adminToken");

  const [packages, setPackages] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch all packages
  const fetchPackages = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/payment-plan`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      setPackages(result.data || []);
    } catch (err) {
      console.error("Failed to fetch packages:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Fetch single package
  const fetchPackageById = useCallback(async (id) => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/payment-plan/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      setSelectedPackage(result.data || null);
    } catch (err) {
      console.error("Failed to fetch package:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Create package
  const createPackage = useCallback(async (data) => {
    if (!token) return;
    try {
      await fetch(`${API_BASE_URL}/api/admin/payment-plan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      await fetchPackages();
    } catch (err) {
      console.error("Failed to create package:", err);
    }
  }, [token, fetchPackages]);

  // Update package
  const updatePackage = useCallback(async (id, data) => {
    if (!token) return;
    try {
      await fetch(`${API_BASE_URL}/api/admin/payment-plan/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      await fetchPackages();
    } catch (err) {
      console.error("Failed to update package:", err);
    }
  }, [token, fetchPackages]);

  // Delete package
  const deletePackage = useCallback(async (id) => {
    if (!token) return;
    try {
      await fetch(`${API_BASE_URL}/api/admin/payment-plan/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchPackages();
    } catch (err) {
      console.error("Failed to delete package:", err);
    }
  }, [token, fetchPackages]);

  // === GROUPS ===

  // Fetch all groups
  const fetchGroups = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/payment-group`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      setGroups(result.data || []);
    } catch (err) {
      console.error("Failed to fetch groups:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Fetch group by ID
  const fetchGroupById = useCallback(async (id) => {
    if (!token) return null;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/payment-group/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      const group = result.data || null;
      setSelectedGroup(group);
      return group; // ✅ RETURN the group data
    } catch (err) {
      console.error("Failed to fetch group:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [token]);


  // Create group
  const createGroup = useCallback(async (data) => {
    if (!token) return;

    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Authorization", `Bearer ${token}`);

    const raw = JSON.stringify({
      name: data.name,
      description: data.description,
      plans: data.plans,
    });

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow",
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/payment-group`, requestOptions);

      if (response.ok) {
        const result = await response.json();
        console.log(result);

        await fetchGroups();

        showSuccess(result.message);
        navigate('/configuration/weekly-classes/subscription-planManager');

      } else {
        const errorText = await response.text();
        console.error("Server Error:", errorText);

        showError('Failed!', 'Could not create the payment group. Please check your input.');
      }

    } catch (error) {
      console.error("Failed to create group:", error);

      showError('Oops!', 'Something went wrong while creating the group.');
    }
  }, [token, fetchGroups, navigate]);

  const updateGroup = useCallback(async (id, data) => {
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/payment-group/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();

        showSuccess(result.message || 'Group updated successfully!');

        navigate('/configuration/weekly-classes/subscription-planManager');
      } else {
        const errorData = await response.json(); // ✅ Parse JSON error body

        console.error("Server Error:", errorData);

        showError('Failed!', errorData.message || 'Could not update the group. Please try again.');
      }

    } catch (err) {
      console.error("Failed to update package:", err);

      showError('Oops!', 'Something went wrong while updating the group.');
    }
  }, [token, navigate]);

  // Assign plans to group
  const assignPlansToGroup = useCallback(async (groupId, planIds) => {
    if (!token) return;
    try {
      await fetch(`${API_BASE_URL}/api/admin/payment-group/${groupId}/assign-plans`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ planIds: planIds.join(",") }),
      });
    } catch (err) {
      console.error("Failed to assign plans to group:", err);
    }
  }, [token]);

  // Delete group
  const deleteGroup = useCallback(async (id) => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/payment-group/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchGroups();
      showSuccess("Group deleted successfully!" || response.message);
    } catch (err) {
      console.error("Failed to delete group:", err);
      showError("Failed to delete group!" || err.message);
    } finally {
      setLoading(false);
    }
  }, [token, fetchGroups]);

  return (
    <PaymentPlanContext.Provider
      value={{
        // Packages
        packages,
        setPackages,
        loading,
        setLoading,
        selectedPackage,
        fetchPackages,
        fetchPackageById,
        createPackage,
        updatePackage,
        deletePackage,

        // Groups
        groups,
        selectedGroup,
        fetchGroups,
        fetchGroupById,
        createGroup,
        updateGroup,
        deleteGroup,
        assignPlansToGroup,
      }}
    >
      {children}
    </PaymentPlanContext.Provider>
  );
};

export const usePayments = () => useContext(PaymentPlanContext);
