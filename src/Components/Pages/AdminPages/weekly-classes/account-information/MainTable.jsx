import React, { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import Loader from '../../contexts/Loader';

const MainTable = () => {
    const navigate = useNavigate();
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const tabs = ["membership", "birthdayParty", "oneToOne", "trials", "holidayCamps"];

    const [members, setMembers] = useState({
        birthdayParty: [],
        membership: [],
        oneToOne: [],
        trials: [],
        holidayCamps: [],

    });

    const [activeTab, setActiveTab] = useState("membership");

    const [loading, setLoading] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10); // 👈 change this to 20, 50 etc. if needed

    const fetchMembers = useCallback(async () => {
        const token = localStorage.getItem("adminToken");
        if (!token) return;

        setLoading(true);
        try {
            const response = await fetch(
                `${API_BASE_URL}/api/admin/account-information`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            const result = await response.json();
            const info = result?.data?.accountInformation || {};

            setMembers({
                birthdayParty: info?.birthdayParty ?? [],
                membership: info?.membership ?? [],
                oneToOne: info?.oneToOne ?? [],
                trials: info?.trials ?? [],
                holidayCamps: info?.holidayCamps ?? [],


            });
        } catch (err) {
            console.error("Failed to fetch members", err);
        } finally {
            setLoading(false);
        }
    }, [API_BASE_URL]);


    const [selectedUserIds, setSelectedUserIds] = useState([]);
    const toggleCheckbox = (userId) => {
        setSelectedUserIds((prev) =>
            prev.includes(userId)
                ? prev.filter((id) => id !== userId)
                : [...prev, userId]
        );
    };
    const activeMembers = members?.[activeTab] ?? [];
    const isAllSelected =
        activeMembers.length > 0 &&
        selectedUserIds.length === activeMembers.length;

    const toggleSelectAll = () => {
        if (isAllSelected) setSelectedUserIds([]);
        else setSelectedUserIds(activeMembers.map((user) => user.id));
    };



    const statusColors = {
        active: "bg-green-500 text-white",
        cancelled: "bg-red-500 text-white",
        request_to_cancel: "bg-red-500 text-white",
        pending: "bg-yellow-500 text-white",
        frozen: "bg-blue-500 text-white",
    };

    useEffect(() => {
        fetchMembers();
    }, [fetchMembers]);

    const safe = (val) => {
        if (
            val === null ||
            val === undefined ||
            val === '' ||
            val === 'null' ||
            val === 'undefined'
        ) {
            return '';
        }
        const formatted = String(val).replace(/_/g, ' ').trim();
        return formatted;
    };

    if (loading) return <Loader />;

    // Pagination logic
    const totalPages = Math.ceil(activeMembers.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;

    const currentMembers = activeMembers.slice(
        indexOfFirstItem,
        indexOfLastItem
    );

    console.log('activeMembers', activeMembers);
    console.log('currentMembers', currentMembers);

    const goToPage = (page) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
    };

    return (
        <>
            <div className="flex justify-start mb-6 space-x-3 w-fit bg-[#F9F9FB] p-3 rounded-xl">
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        className={`px-4 py-2 rounded-lg text-[18px] transition ${activeTab === tab
                            ? "bg-[#237FEA] text-white"
                            : "text-[#282829] border border-gray-200 hover:bg-gray-200"
                            }`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {
                            tab === "trials"
                                ? "Weekly Class Trial"
                                : tab === "birthdayParty"
                                    ? "Birthday Party"
                                    : tab === "holidayCamps"
                                        ? "Holiday Camps"
                                        : tab === "membership"
                                            ? "Weekly Class Membership"
                                            : "One To One"
                        }
                    </button>
                ))}
            </div>
            <div className="transition-all duration-300 w-full">
                {activeMembers.length > 0 ? (
                    <>
                        <div className="overflow-auto rounded-2xl bg-white shadow-sm">
                            <table className="min-w-full text-sm ss">
                                <thead className="bg-[#F5F5F5] text-left border border-[#EFEEF2]">
                                    <tr className="font-semibold text-[#717073]">
                                        <th className="p-4">
                                            <div className="flex gap-2 items-center">
                                                <button
                                                    onClick={toggleSelectAll}
                                                    className="min-w-5 min-h-5  flex items-center justify-center rounded-md border-2 border-gray-500"
                                                >
                                                    {isAllSelected && <Check size={16} strokeWidth={3} className="text-gray-500" />}
                                                </button>
                                                Name
                                            </div>
                                        </th>
                                        <th className="p-4">Age</th>
                                        <th className="p-4">Venue</th>
                                        <th className="p-4">Date of Booking</th>
                                        <th className="p-4">Who Booked</th>
                                        <th className="p-4">Membership Plan</th>
                                        <th className="p-4">Life Cycle of Membership</th>
                                        <th className="p-4">Status</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {currentMembers.map((main) => {
                                        const user = main?.booking || main;
                                        const isChecked = selectedUserIds.includes(main.id);
                                        return (
                                            <tr key={main.id} onClick={() => navigate(`/weekly-classes/account-information?id=${main.id}&serviceType=${activeTab}`)} className="border-t font-semibold text-[#282829] border-[#EFEEF2] hover:bg-gray-50">
                                                <td className="p-4 cursor-pointer">
                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();        // ⛔ prevent row click
                                                                toggleCheckbox(main?.id);
                                                            }}
                                                            className={`min-w-5 min-h-5 flex items-center justify-center rounded-md border-2 ${isChecked ? 'border-gray-500' : 'border-gray-300'
                                                                }`}
                                                        >
                                                            {isChecked && (
                                                                <Check size={16} strokeWidth={3} className="text-gray-500" />
                                                            )}
                                                        </button>

                                                        <img
                                                            src={
                                                                main?.profile && main.profile.trim() !== ""
                                                                    ? main.profile
                                                                    : "/members/dummymain.png"
                                                            }
                                                            alt={main?.firstName || "User"}

                                                            className="w-10 h-10 rounded-full object-contain"
                                                            onError={(e) => {
                                                                e.currentTarget.onerror = null;
                                                                e.currentTarget.src = "/members/dummyuser.png";
                                                            }}
                                                        />


                                                        <span >
                                                            {`${safe(user?.students?.[0]?.studentFirstName)} ${safe(user?.students?.[0]?.studentLastName)}`}
                                                        </span>
                                                    </div>
                                                </td>

                                                <td className="p-4 whitespace-nowrap">
                                                    {safe(user?.students?.[0]?.age)}
                                                </td>
                                                <td className="p-4 ">
                                                    <div className='w-[200px]'>

                                                        {safe(user?.venue?.name || user?.address || 'N/A')}
                                                    </div>
                                                </td>
                                                <td className="p-4 whitespace-nowrap">
                                                    {user?.createdAt || user.date ? new Date(user.createdAt || user.date).toLocaleDateString() : 'N/A'}
                                                </td>
                                                <td className="p-4 whitespace-nowrap">
                                                    {(() => {
                                                        const source = main?.source?.trim();

                                                        // Admin name (booked by admin)
                                                        const adminName = user?.bookedByAdmin?.firstName
                                                            ? `${safe(user.bookedByAdmin.firstName)}${user.bookedByAdmin.lastName &&
                                                                user.bookedByAdmin.lastName !== "null"
                                                                ? ` ${safe(user.bookedByAdmin.lastName)}`
                                                                : ""
                                                            }`
                                                            : "";

                                                        // Creator name (fallback)
                                                        const creatorName = main?.creator?.firstName
                                                            ? `${safe(main.creator.firstName)}${main.creator.lastName &&
                                                                main.creator.lastName !== "null"
                                                                ? ` ${safe(main.creator.lastName)}`
                                                                : ""
                                                            }`
                                                            : "";

                                                        const name = adminName || creatorName;

                                                        if (source && name) {
                                                            return `${source} (${name})`;
                                                        }

                                                        if (source) {
                                                            return source;
                                                        }

                                                        return name || "-";
                                                    })()}
                                                </td>

                                                <td className="p-4 whitespace-nowrap">{safe(user?.paymentPlan?.title)}</td>
                                                <td className="p-4 whitespace-nowrap">
                                                    {user?.paymentPlan?.duration && user?.paymentPlan?.interval
                                                        ? `${user.paymentPlan?.duration} ${user.paymentPlan?.interval}${user.paymentPlan?.duration > 1 ? 's' : ''}`
                                                        : ''}
                                                </td>
                                                <td className="p-4 whitespace-nowrap">
                                                    <span className={`px-3 py-1 rounded-md capitalize font-semibold ${statusColors[main?.status] || 'bg-gray-100 text-gray-800'}`}>
                                                        {safe(main?.status)}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Controls */}
                        <div className="flex items-center justify-between mt-4 px-2">
                            <p className="text-sm text-gray-600">
                                Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, activeMembers.length)} of {activeMembers.length}
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => goToPage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className={`flex items-center gap-1 px-3 py-1 rounded-md border ${currentPage === 1 ? 'text-gray-400 border-gray-200 cursor-not-allowed' : 'hover:bg-gray-100 border-gray-300'}`}
                                >
                                    <ChevronLeft size={16} /> Prev
                                </button>
                                <span className="text-sm font-medium text-gray-700">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    onClick={() => goToPage(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className={`flex items-center gap-1 px-3 py-1 rounded-md border ${currentPage === totalPages ? 'text-gray-400 border-gray-200 cursor-not-allowed' : 'hover:bg-gray-100 border-gray-300'}`}
                                >
                                    Next <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <p className="text-center p-4 rounded-md bg-white">No Data Found</p>
                )}
            </div>
        </>
    );
};

export default MainTable;
