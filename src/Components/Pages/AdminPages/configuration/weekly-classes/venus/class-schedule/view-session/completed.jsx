import { useState, useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import { Check, X } from 'lucide-react';
import { showError, showSuccess, showLoading, ThemeSwal } from '../../../../../../../../utils/swalHelper';
const ViewSessions = ({ item, sessionData }) => {
    const tabs = ['Members', 'Trials', 'Coaches'];
    const [activeTab, setActiveTab] = useState('Members');
    const [page, setPage] = useState(1);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const query = new URLSearchParams(location.search);
    const id = query.get("id");
    const venueId = location.state?.venueId;
    const sessionDate = location.state?.sessionDate;

    const token = localStorage.getItem("adminToken");
    const statusIs = location.state?.statusIs;
    console.log('statusIs', location.state)
    const fetchData = useCallback(async () => {
        if (!token) return;

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/class-schedule/view-class-register/${id}`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const resultRaw = await response.json();
            setData(resultRaw?.data || null);
        } catch (error) {
            console.error("Failed to fetch members:", error);
        } finally {
            setLoading(false);
        }
    }, [API_BASE_URL, id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    console.log('data', data)

    const toggleAttendance = async (idx, isAttended, tabKey, studentId) => {
        try {
            const token = localStorage.getItem("adminToken"); // dynamic token
            if (!token) throw new Error("Token not found");

            // Show loading 
            showLoading("Updating attendance...");

            const myHeaders = new Headers();
            myHeaders.append("Content-Type", "application/json");
            myHeaders.append("Authorization", `Bearer ${token}`);

            const raw = JSON.stringify({
                "attendance": tabKey,
            });

            const requestOptions = {
                method: "PATCH",
                headers: myHeaders,
                body: raw,
                redirect: "follow",
            };

            const response = await fetch(
                `${API_BASE_URL}/api/admin/class-schedule/attendance/${studentId}`,
                requestOptions
            );

            if (!response.ok) {
                throw new Error(`Request failed with status ${response.status}`);
            }

            const result = await response.json();

            // Close loading
            ThemeSwal.close();

            if (result.status) {
                showSuccess("Attendance updated!");
                fetchData();
            } else {
                showError("Failed to update attendance", result.message || "Something went wrong");
            }

            return result;

        } catch (error) {
            ThemeSwal.close();
            showError("Error", error.message || "Something went wrong");
            console.error("Error updating attendance:", error);
        }
    };



    const renderStudents = (tabKey) => {
        const tabKeyLower = tabKey.toLowerCase();
        const section = data?.[tabKeyLower];

        if (!section || !Array.isArray(section) || section.length === 0) {
            return <p className="text-gray-400 text-sm italic">No {tabKey} found.</p>;
        }

        return section.map((group, gIndex) =>
            group?.students?.map((student, idx) => {
                const isNotAttended = student?.attendance == "not attended";

                return (
                    <div
                        key={`${gIndex}-${student.id}`}
                        className="py-3 border-b border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                        <div className="md:flex w-full md:w-8/12 items-center justify-between">
                            {/* Name & Age */}
                            <div className="md:flex md:w-5/12 space-x-2 justify-between items-center">
                                <span className="font-semibold text-[14px]">
                                    {idx + 1}. {student?.studentFirstName || "N/A"} {student?.studentLastName || ""}
                                </span>
                                <span className="font-semibold text-[14px]">
                                    {student?.age || "-"} Years
                                </span>
                            </div>

                            {/* Attendance Status */}
                            <div className="md:flex space-y-2 md:space-y-0 items-center gap-2">
                                {/* ✅ Attended button */}
                                <button
                                    onClick={() => toggleAttendance(idx, true, 'attended', student.id)}
                                    disabled={student?.attendance == "attended"}
                                    className={`px-3 border py-1 text-sm md:w-auto w-full rounded-lg flex items-center gap-1 transition-colors ${student?.attendance == "attended"
                                        ? "text-[#34AE56] cursor-not-allowed"
                                        : "text-gray-400 hover:text-green-700"
                                        }`}
                                >
                                    <Check className="w-4 h-4" /> Attended
                                </button>

                                {/* ❌ not attended button */}
                                <button
                                    onClick={() => toggleAttendance(idx, false, 'not attended', student.id)}
                                    disabled={student?.attendance == "not attended"}
                                    className={`px-3 py-1 border text-sm rounded-lg md:w-auto w-full flex items-center gap-1 transition-colors ${student?.attendance == "not attended"
                                        ? "text-[#FF5C40] cursor-not-allowed"
                                        : "text-gray-400 hover:text-red-700"
                                        }`}
                                >
                                    <X className="w-4 h-4" /> Not Attended
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })
        );

    };

    if (loading) {
        return <div className="p-10 text-center text-gray-500">Loading attendance register...</div>;
    }



    return (
        <div className="md:p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3 w-full md:w-1/2">
                <h2
                    onClick={() => navigate(`/configuration/weekly-classes/venues/class-schedule?id=${venueId}`)}
                    className="text-xl md:text-[28px] font-semibold flex items-center gap-2 md:gap-3 cursor-pointer hover:opacity-80 transition-opacity mb-4 duration-200"
                >
                    <img
                        src="/images/icons/arrow-left.png"
                        alt="Back"
                        className="w-5 h-5 md:w-6 md:h-6"
                    />
                    <span className="truncate">View Class Register</span>
                </h2>
            </div>
            {
                !data ? (
                    <div className="p-10 text-center text-gray-400">No data available.</div>
                ) : (
                    <div className="bg-white rounded-3xl h-[95vh] shadow p-6 flex flex-col md:flex-row gap-6">
                        {/* Left Sidebar */}
                        <div
                            className={`
                            w-full md:w-2/12 py-6 rounded-2xl text-center
                                ${statusIs === "cancelled" ? "bg-[#f8f8f8]" : ""}
                                ${statusIs === "complete" ? "bg-[#f8f8f8]" : ""}
                                ${statusIs !== "cancelled" && statusIs !== "complete" ? "bg-[#f8f8f8]" : ""}
                            `}
                        >
                            <div className="w-18 h-18 bg-yellow-400 rounded-full flex items-center justify-center text-white text-2xl font-semibold mx-auto mb-4">
                                {statusIs === "cancelled" ? (
                                    <img src="/images/icons/cancelBig.png" alt="Cancelled" />
                                ) : statusIs === "complete" ? (
                                    <img src="/images/icons/completeBig.png" alt="Complete" />
                                ) : (
                                    <img src="/images/icons/pendingBig.png" alt="Pending" />
                                )}
                            </div>
                            <p className="text-base border-b border-gray-300 pb-5 font-semibold mb-4 capitalize">{statusIs}</p>
                            <div className="text-sm p-6 text-gray-700 space-y-3 text-left">
                                <p>
                                    <span className="font-semibold">Venue</span>
                                    <br /> {data?.venue?.name || "—"}
                                </p>

                                <p>
                                    <span className="font-semibold">Class</span>
                                    <br /> {data?.classSchedule?.className || "—"}
                                </p>

                                <p>
                                    <span className="font-semibold">Date</span>
                                    <br /> {sessionDate
                                        ? new Date(sessionDate).toLocaleDateString("en-GB", {
                                            weekday: "long",
                                            day: "numeric",
                                            month: "short",
                                            year: "numeric",
                                        })
                                        : "—"}
                                </p>

                                <p>
                                    <span className="font-semibold">Time</span>
                                    <br /> {(data?.classSchedule?.startTime && data?.classSchedule?.endTime)
                                        ? `${data.classSchedule.startTime} – ${data.classSchedule.endTime}`
                                        : "—"}
                                </p>
                            </div>

                        </div>

                        {/* Right Content */}
                        <div className="w-full md:w-10/12 space-y-6">
                            {/* Tabs */}
                            <div className="flex gap-4 border max-w-fit border-gray-300 p-1 rounded-xl flex-wrap">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`px-4 py-1.5 min-w-25 rounded-xl text-sm font-medium transition ${activeTab === tab
                                            ? 'bg-blue-500 text-white'
                                            : 'text-gray-500 hover:text-blue-500'
                                            }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>

                            {/* Student List */}
                            <div className="border-t border-gray-200 py-4">
                                {renderStudents(activeTab)}
                            </div>
                        </div>
                    </div>
                )
            }

        </div>
    );
};

export default ViewSessions;
