import { useState, useEffect, useMemo, useCallback } from "react";
import Select from "react-select";
import {
    Download,
    EllipsisVertical,
} from "lucide-react";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    Area,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
} from "recharts";
import * as XLSX from "xlsx";
import { showError } from "../../../../../utils/swalHelper";


const dashboardData = {

    coachesDemographics: {
        revenue: [
            { label: "Acton", value: 2348, percent: 10 },
            { label: "Acton", value: 1800, percent: 10 },
            { label: "Acton", value: 1650, percent: 10 },
            { label: "Acton", value: 1500, percent: 10 },
            { label: "Acton", value: 1300, percent: 10 },
            { label: "Acton", value: 1200, percent: 10 },
            { label: "Acton", value: 1100, percent: 10 },
            { label: "Acton", value: 900, percent: 10 },
            { label: "Acton", value: 700, percent: 10 },
            { label: "Acton", value: 400, percent: 10 },
        ],
        growth: [
            { label: "Acton", value: 1300, percent: 10 },
            { label: "Acton", value: 1200, percent: 10 },
            { label: "Acton", value: 1100, percent: 10 },
            { label: "Acton", value: 900, percent: 10 },
            { label: "Acton", value: 700, percent: 10 },
            { label: "Acton", value: 400, percent: 10 },
        ],
    },

    qualifications: [
        { label: "FA Qualification(s)", value: 3, img: '/reportsIcons/fa.png' },
        { label: "DBS Certificate", value: 2, img: '/reportsIcons/dbs.png' },
        { label: "4-5 years of coaching experience", value: 4, img: '/reportsIcons/coaching.png' },
        { label: "Management Experience", value: 3, img: '/reportsIcons/manage.png' },
    ],

    onboardingResults: [
        { label: "Average Interview Grade", value: "82%" },
        { label: "Average Practical Assessment Grade", value: "67%" },
        { label: "Average Coach Education Pass Mark", value: "79%" },
    ],

    topAgents: [
        { label: "Jessica Smith", value: 50 },
        { label: "Aiden Jones", value: 30 },
        { label: "Priya Kumar", value: 20 },
        { label: "Liam Brown", value: 10 },
        { label: "Mia White", value: 5 },
    ],

    sourceOfLeads: [
        { label: "Indeed", value: 45 },
        { label: "Google", value: 30 },
        { label: "Instagram", value: 20 },
        { label: "Referral", value: 10 },
        { label: "LinkedIn", value: 5 },
        { label: "Other", value: 3 },
    ],

    highDemandVenues: [
        { label: "Acton", value: 2346 },
        { label: "Kings Cross", value: 2100 },
        { label: "Chelsea", value: 1900 },
        { label: "Greenwich", value: 1850 },
        { label: "Hackney", value: 1800 },
        { label: "Brixton", value: 1700 },
    ],
};

const dateOptions = [
    { value: "thisMonth", label: "This Month" },
    { value: "lastMonth", label: "Last Month" },
    { value: "last6Months", label: "last 6 Months" },
    { value: "last3Months", label: "last 3 Months" },
];

const customSelectStyles = {
    control: (provided, state) => ({
        ...provided,
        border: "1px solid #E2E1E5",
        borderRadius: "0.5rem",
        boxShadow: state.isFocused ? "0 0 0 1px #237FEA" : "none",
        minHeight: "40px",
    }),
    option: (provided, state) => ({
        ...provided,
        backgroundColor: state.isSelected ? "#237FEA" : state.isFocused ? "#F3F4F6" : "white",
        color: state.isSelected ? "white" : "#111827",
        cursor: "pointer",
    }),
    menu: (provided) => ({
        ...provided,
        borderRadius: "0.5rem",
        overflow: "hidden",
        zIndex: 50,
    }),
};




export default function HolidayReports() {
    const [activeTab, setActiveTab] = useState("revenue");
    const [activeTabEnrolled, setActiveTabEnrolled] = useState("total");
    const [summary, setSummary] = useState({});
    const [monthlyStudents, setMonthlyStudents] = useState([]);
    const [marketPerformance, setMarketPerformance] = useState([]);
    const [topAgents, setTopAgents] = useState([]);
    const [campsRegistration, setCampsRegistration] = useState({});
    const [registerationPerCamp, setRegisterationPerCamp] = useState([]);

    const [enrolledStudents, setEnrolledStudents] = useState({});
    const [loading, setLoading] = useState(false);
    const [filterType, setFilterType] = useState("thisMonth"); // default "This Month"

    const token = localStorage.getItem("adminToken");
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    const fetchReports = useCallback(async () => {
        if (!token) return;
        setLoading(true);

        try {
            const url = `${API_BASE_URL}/api/admin/holiday/booking/reports`;

            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(`HTTP ${response.status}: ${text}`);
            }

            const result = await response.json();
            if (!response.status) {
                showError("Fetch Failed", result.message || "Failed to fetch report data.");
               
                return;
            }

            setSummary(result.data.summary || {});
            setMonthlyStudents(result.data.monthlyStudents || {});
            setMarketPerformance(result.data.marketChannelPerformance || []);
            setTopAgents(result.data.topAgents || []);
            setRegisterationPerCamp(result.data.registration_perCamp_growth_and_venue || {});
            setCampsRegistration(result.data.campsRegistration || {});
            setEnrolledStudents(result.data.enrolledStudents || {});
        } catch (error) {
           showError("Fetch Failed", error.message);
           
        } finally {
            setLoading(false);
        }
    }, [API_BASE_URL, token]);



    useEffect(() => {
        fetchReports();
    }, [fetchReports]);
    const handleFilterChange = (selected) => {
        if (!selected) {
            setFilterType(null);

            // optional: fetch default / all data
            fetchReportsByFilter(null);
            return;
        }

        setFilterType(selected.value);
        fetchReportsByFilter(selected.value);
    };


    const fetchReportsByFilter = useCallback(async (filter = filterType) => {
        if (!token) return;
        setLoading(true);

        try {
            let url = `${API_BASE_URL}/api/admin/holiday/booking/reports`;
            if (filter) {
                url += `?filterType=${encodeURIComponent(filter)}`;
            }

            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(`HTTP ${response.status}: ${text}`);
            }

            const result = await response.json();

            if (!result.status) {
                
                showError("Fetch Failed", result.message || "Failed to fetch report data.");
              
                return;
            }

            setSummary(result.data.summary || {});
            setMonthlyStudents(result.data.monthlyStudents || []);
            setMarketPerformance(result.data.marketChannelPerformance || []);
            setTopAgents(result.data.topAgents || []);
            setRegisterationPerCamp(result.data.registeration_perCamp_growth_and_venue || {});
            setCampsRegistration(result.data.campsRegistration || {});
            setEnrolledStudents(result.data.enrolledStudents || {});
        } catch (error) {
            showError("Fetch Failed", error.message || "An error occurred while fetching report data.");
           
        } finally {
            setLoading(false);
        }
    }, [API_BASE_URL, token]);
    // ============================
    // 📌 Dynamic Stats
    // ============================
    const stats = useMemo(() => {
        return [
            {
                icon: "/reportsIcons/pound.png",
                iconStyle: "text-[#3DAFDB] bg-[#FEF6FB]",
                title: "Total Revenue",
                value: `£${summary?.totalRevenue?.thisYear ?? 0}`,
                diff: `${summary?.totalRevenue?.average ?? 0}%`,
                sub: "vs. prev period",
                subvalue: `£${summary?.totalRevenue?.lastYear ?? 0}`
            },
            {
                icon: "/reportsIcons/pound2.png",
                iconStyle: "text-[#E769BD] bg-[#FEF8F4]",
                title: "Average Revenue Per Camp",
                value: `£${summary?.averageRevenuePerCamp?.thisYear ?? 0}`,
                diff: `${summary?.averageRevenuePerCamp?.average ?? 0}%`,
                sub: "vs. prev period",
                subvalue: `£${summary?.averageRevenuePerCamp?.lastYear ?? 0}`
            },
            {
                icon: "/reportsIcons/chart2.png",
                iconStyle: "text-[#F38B4D] bg-[#F6F6FE]",
                title: "Revenue Growth",
                value: `${summary?.revenueGrowth?.thisYear ?? 0}%`,
                diff: `${summary?.revenueGrowth?.average ?? 0}%`,
                sub: "vs. prev period",
                subvalue: `${summary?.revenueGrowth?.lastYear ?? 0}%`
            },
            {
                icon: "/reportsIcons/content.png",
                iconStyle: "text-[#FF5353] bg-[#F6F6FE]",
                title: "Average Age of Child",
                value: `${summary?.averageAgeOfChild?.thisYear ?? 0}`,
                diff: ``,
                sub: "vs. prev period",
                subvalue: `${summary?.averageAgeOfChild?.lastYear ?? 0}`
            },
        ];
    }, [summary]);

    // ============================
    // 📌 Dynamic Chart Data
    // ============================
    console.log('monthlyStudents:', monthlyStudents);
    const chartData = useMemo(() => {
        if (!monthlyStudents) return [];

        return monthlyStudents?.thisYear?.map((m, index) => ({
            month: m.month,
            current: m.students,
            previous: monthlyStudents?.lastYear[index]?.students || 0,
        }));
    }, [monthlyStudents]);


    // ============================
    // 📌 Dynamic Enrollment by Age
    // ============================
    const enrolledByAge = useMemo(() => {
        if (!enrolledStudents.byAge) return [];
        return Object.entries(enrolledStudents.byAge).map(([label, obj]) => ({
            label,
            value: obj.total,
            percent: obj.percentage
        }));
    }, [enrolledStudents]);

    // ============================
    // 📌 Dynamic Enrollment by Gender
    // ============================
    const enrolledByGender = useMemo(() => {
        if (!enrolledStudents.byGender) return [];
        return Object.entries(enrolledStudents.byGender).map(([label, obj]) => ({
            label,
            value: obj.total,
            percent: obj.percentage
        }));
    }, [enrolledStudents]);

    const handleExportExcel = () => {
        const exportData = {
            stats: [
                {
                    title: "Total Revenue",
                    total: summary?.totalRevenue?.thisYear ?? 0,
                    percentage: summary?.totalRevenue?.average ?? 0,
                    lastMonth: summary?.totalRevenue?.lastYear ?? 0,
                },
                {
                    title: "Average Revenue Per Camp",
                    total: summary?.averageRevenuePerCamp?.thisYear ?? 0,
                    percentage: summary?.averageRevenuePerCamp?.average ?? 0,
                    lastMonth: summary?.averageRevenuePerCamp?.lastYear ?? 0,
                },
                {
                    title: "Revenue Growth",
                    total: summary?.revenueGrowth?.thisYear ?? 0,
                    percentage: summary?.revenueGrowth?.average ?? 0,
                    lastMonth: summary?.revenueGrowth?.lastYear ?? 0,
                },
                {
                    title: "Average Age of Child",
                    total: summary?.averageAgeOfChild?.thisYear ?? 0,
                    percentage: summary?.averageAgeOfChild?.average ?? 0,
                    lastMonth: summary?.averageAgeOfChild?.lastYear ?? 0,
                },
            ],

            chartData,

            registrationPerCamp: registerationPerCamp ?? {},

            enrolledStudents: {
                total: enrolledStudents?.total ?? 0,
                byAge: enrolledByAge ?? [],
                byGender: enrolledByGender ?? [],
            },

            marketingPerformance: marketPerformance ?? [],

            topAgents: topAgents ?? [],

            campsRegistration: campsRegistration ?? {},

            earlyBirdOffer: {
                numberOfRegistration: "85%",
                percentage: "12%",
                revenueImpact: "£12,569",
            },
        };

        // Create a new workbook
        const wb = XLSX.utils.book_new();

        // Sheet 1: Stats
        const statsSheet = XLSX.utils.json_to_sheet(exportData.stats);
        XLSX.utils.book_append_sheet(wb, statsSheet, "Stats");

        // Sheet 2: Chart Data
        const chartSheet = XLSX.utils.json_to_sheet(exportData.chartData);
        XLSX.utils.book_append_sheet(wb, chartSheet, "Chart Data");

        // Sheet 3: Registration Per Camp
        const regSheet = XLSX.utils.json_to_sheet(exportData.registrationPerCamp.revenue || []);
        XLSX.utils.book_append_sheet(wb, regSheet, "Reg Per Camp");

        // Sheet 4: Enrolled Students
        const enrolledSheet = XLSX.utils.json_to_sheet([
            { total: exportData.enrolledStudents.total },
            ...exportData.enrolledStudents.byAge.map(a => ({ type: "Age", ...a })),
            ...exportData.enrolledStudents.byGender.map(g => ({ type: "Gender", ...g }))
        ]);
        XLSX.utils.book_append_sheet(wb, enrolledSheet, "Enrolled");

        // Sheet 5: Marketing Performance
        const marketSheet = XLSX.utils.json_to_sheet(exportData.marketingPerformance);
        XLSX.utils.book_append_sheet(wb, marketSheet, "Marketing");

        // Sheet 6: Top Agents
        const agentsSheet = XLSX.utils.json_to_sheet(
            exportData.topAgents.map(a => ({
                firstName: a?.creator?.firstName,
                lastName: a?.creator?.lastName,
                leadCount: a?.leadCount
            }))
        );
        XLSX.utils.book_append_sheet(wb, agentsSheet, "Top Agents");

        // Sheet 7: Camps Registration
        const campsSheet = XLSX.utils.json_to_sheet([exportData.campsRegistration]);
        XLSX.utils.book_append_sheet(wb, campsSheet, "Camps Reg");

        // Sheet 8: Early Bird
        const earlySheet = XLSX.utils.json_to_sheet([exportData.earlyBirdOffer]);
        XLSX.utils.book_append_sheet(wb, earlySheet, "Early Bird");

        // Export the Excel file
        XLSX.writeFile(wb, "holiday-camps-summary.xlsx");
    };
    const ProgressBar = ({ percent }) => (
        <div className="w-full bg-gray-100 h-2 rounded-full relative">
            <div
                style={{ width: `${percent}%` }}
                className="h-2 rounded-full bg-[#237FEA] relative group cursor-pointer"
            >
                {/* Tooltip */}
                <div
                    className="absolute -top-8 right-0 translate-x-1/2
                   bg-black text-white text-xs px-2 py-1 rounded
                   opacity-0 group-hover:opacity-100 transition
                   pointer-events-none whitespace-nowrap"
                >
                    {percent}%
                </div>
            </div>
        </div>
    );
    return (
        <div className="min-h-screen bg-gray-50 p-6 pt-0">
            {/* Header */}
            <div className="flex flex-wrap justify-between items-center mb-6">
                <h1 className="text-3xl font-semibold text-gray-800">Holiday Camps</h1>
                <div className="flex flex-wrap gap-3 items-center">

                    <Select
                        components={{ IndicatorSeparator: () => null }}
                        placeholder="Date Range"
                        options={dateOptions}
                        isClearable
                        value={dateOptions.find(opt => opt.value === filterType) || null}
                        onChange={handleFilterChange}
                        styles={customSelectStyles}
                        className="md:w-50"
                    />

                    <button onClick={handleExportExcel}
                        className="flex items-center gap-2 bg-[#237FEA] text-white text-sm px-4 py-2 rounded-xl hover:bg-blue-700 transition">
                        <Download size={16} /> Export data
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 lg:grid-cols-4 gap-4 mb-8">
                {stats.map((s, i) => (


                    <div
                        key={i}
                        className="bg-white rounded-4xl p-3 flex items-center gap-4 hover:shadow-md transition-all duration-200"
                    >
                        <div>
                            <div
                                className={`p-2 h-[50px] w-[50px] p-2 rounded-full flex items-center justify-center ${s.iconStyle}`}
                            >
                                <div className={s.iconStyle}><img className="p-1" src={s.icon} alt="" /></div>
                            </div>
                        </div>
                        <div>
                            <span className="font-semibold text-[#717073] text-sm">{s.title}</span>

                            <h3 className="text-[20px] font-semibold text-gray-900">{s.value} <small className="text-green-500 font-normal text-xs">{s.diff}</small></h3>
                            <p className="text-4 font-semibold text-[#717073]">
                                {s.sub} <span className="text-green-500">{s.subvalue}</span>
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="md:flex  gap-6">

                <div className="lg:col-span-2 md:w-9/12 space-y-6">

                    <div className="grid  gap-6">
                        <div className="lg:col-span-2">
                            <div className="bg-white p-5 rounded-2xl">
                                <div className="flex justify-between items-center mb-3">
                                    <h2 className="text-[22px] font-semibold text-gray-800 ms-5">Total Students</h2>
                                    <EllipsisVertical className="text-gray-400" />
                                </div>

                                <div className="h-[320px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                                            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f3f4f6" />
                                            <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={false} tickLine={false} />
                                            <Tooltip
                                                cursor={false}
                                                contentStyle={{
                                                    backgroundColor: "rgba(255,255,255,0.9)",
                                                    border: "1px solid #E5E7EB",
                                                    borderRadius: 8,
                                                    fontSize: 12,
                                                }}
                                            />
                                            <defs>
                                                <linearGradient id="colorLeads" x1="0" x2="0" y1="0" y2="1">
                                                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                                                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.02} />
                                                </linearGradient>
                                                <linearGradient id="colorHires" x1="0" x2="0" y1="0" y2="1">
                                                    <stop offset="5%" stopColor="#EC4899" stopOpacity={0.2} />
                                                    <stop offset="95%" stopColor="#EC4899" stopOpacity={0.02} />
                                                </linearGradient>
                                            </defs>

                                            <Area type="monotone" dataKey="current" stroke="none" fill="url(#colorLeads)" />
                                            <Area type="monotone" dataKey="previous" stroke="none" fill="url(#colorHires)" />

                                            <Line type="monotone" dataKey="current" stroke="#3B82F6" strokeWidth={2.5} dot={false} />
                                            <Line type="monotone" dataKey="previous" stroke="#EC4899" strokeWidth={2.5} dot={false} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>


                    </div>


                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-5 rounded-2xl">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-[22px] font-semibold text-gray-800">Registration per camp</h3>
                                <EllipsisVertical className="text-gray-400" />
                            </div>

                            <div className="mb-3">
                                <div className="grid md:grid-cols-2 items-center gap-3 mb-3 border border-[#E2E1E5] p-1 w-full rounded-2xl">
                                    <button
                                        onClick={() => setActiveTab("revenue")}
                                        className={`px-3 py-2 rounded-xl text-sm ${activeTab === "revenue" ? "bg-[#237FEA] text-white" : "text-gray-600"
                                            }`}
                                    >
                                        Revenue
                                    </button>

                                    <button
                                        onClick={() => setActiveTab("growth")}
                                        className={`px-3 py-2 rounded-xl text-sm ${activeTab === "growth" ? "bg-[#237FEA] text-white" : "text-gray-600"
                                            }`}
                                    >
                                        Growth
                                    </button>
                                </div>

                                {/* Map over new data */}
                                {registerationPerCamp[activeTab]?.slice(0, 6).map((d, i) => (
                                    <div key={d.holidayCampId || i} className="mb-3 flex items-center gap-2">
                                        <div className="flex justify-between mb-1">
                                            <p className="text-sm text-gray-700">{d.venueName}</p>
                                        </div>

                                        <div className="w-full bg-gray-100 h-2 rounded-full">

                                            <ProgressBar percent={d.growthPercent || d.revenueAverage} />
                                        </div>
                                        <p className="text-sm text-gray-500">{d.growthPercent || d.revenueAverage}%</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-2xl">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-[22px] font-semibold text-gray-800">Enrolled Students</h3>
                                <EllipsisVertical className="text-gray-400" />
                            </div>

                            <div className="mb-3">
                                <div className="grid md:grid-cols-3 items-center gap-3 mb-3 border border-[#E2E1E5] p-1 w-full rounded-2xl">
                                    <button onClick={() => setActiveTabEnrolled("total")} className={`px-3 py-2 rounded-xl text-sm ${activeTabEnrolled === "total" ? "bg-[#237FEA] text-white" : "text-gray-600"}`}>
                                        Total
                                    </button>
                                    <button onClick={() => setActiveTabEnrolled("byAge")} className={`px-3 py-2 rounded-xl text-sm ${activeTabEnrolled === "byAge" ? "bg-[#237FEA] text-white" : "text-gray-600"}`}>
                                        By age
                                    </button>
                                    <button onClick={() => setActiveTabEnrolled("byGender")} className={`px-3 py-2 rounded-xl text-sm ${activeTabEnrolled === "byGender" ? "bg-[#237FEA] text-white" : "text-gray-600"}`}>
                                        By gender
                                    </button>
                                </div>

                                {/* TOTAL */}
                                {activeTabEnrolled === "total" && (
                                    <p className="text-lg font-semibold text-gray-700">
                                        Total Students: {enrolledStudents?.total ?? 0}
                                    </p>
                                )}

                                {/* AGE */}
                                {activeTabEnrolled === "byAge" &&
                                    enrolledByAge.map((d, i) => (
                                        <div key={i} className="mb-3 flex items-center gap-2">
                                            <p className="text-sm text-gray-700 whitespace-nowrap">{d.label}</p>
                                            <ProgressBar percent={d.percent} />
                                            <p className="text-sm text-gray-500">{d.percent}%</p>
                                        </div>
                                    ))}

                                {/* GENDER */}
                                {activeTabEnrolled === "byGender" &&
                                    enrolledByGender.map((d, i) => (
                                        <div key={i} className="mb-3 flex items-center gap-2">
                                            <p className="text-sm text-gray-700">{d.label}</p>
                                            <div className="w-full bg-gray-100 h-2 rounded-full">
                                                <ProgressBar percent={d.percent} />
                                            </div>
                                            <p className="text-sm text-gray-500">{d.percent}%</p>
                                        </div>
                                    ))}
                            </div>
                        </div>




                    </div>
                    <div className="grid md:grid-cols-2 gap-3">
                        <div className="bg-white p-5 rounded-2xl">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-[22px] font-semibold text-gray-800">Marketing Channel Performance</h3>
                                <EllipsisVertical className="text-gray-400" />
                            </div>
                            <div className="space-y-3">
                                {marketPerformance?.map((s, i) => (
                                    <div key={i}>
                                        <p className="text-sm text-gray-700">{s.name}</p>
                                        <div className="flex items-center gap-3">
                                            <div className="w-full bg-gray-100 h-2 rounded-full">
                                                <ProgressBar percent={s.percentage} />
                                            </div>
                                            <p className="text-sm text-gray-500">{s.percentage}%</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-2xl">
                            <h3 className="text-[22px] font-semibold text-gray-800 mb-3">Top agents </h3>
                            <div className="space-y-3">
                                {topAgents.map((item, i) => (
                                    <div key={i} className="mb-4">
                                        <div className="flex gap-5 justify-between">
                                            <div className="w-10 h-10">
                                                <img src={item.creator?.profile || "/members/dummyuser.png"} alt="" />
                                            </div>
                                            <div className="w-full">
                                                <p className="text-sm text-[#344054] font-semibold">
                                                    {item.creator?.firstName} {item.creator?.lastName}
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-full bg-gray-100 h-2 rounded-full">
                                                        <ProgressBar percent={item.leadCount} />
                                                    </div>
                                                    <span className="text-xs text-[#344054] font-semibold">{item.leadCount}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>



                </div>

                <div className="space-y-6 md:grid md:w-3/12 lg:block md:grid-cols-2 gap-3 ">


                    <div className="bg-white p-3 rounded-2xl">
                        <div className="flex justify-between items-center mb-3 px-4">
                            <h3 className="text-[24px] font-semibold text-gray-800 pb-3">Camps Registration</h3>
                            <EllipsisVertical className="text-gray-400" />
                        </div>

                        <div className="space-y-4">
                            <div className="flex gap-4 items-center border-b border-[#E2E1E5] pb-4">
                                <img src="/reportsIcons/Icon-with-shape.png" className="w-12" alt="" />
                                <div>
                                    <p className="text-[16px] text-[#717073] font-semibold">Percentage of camp capacity filled</p>
                                    <h4 className="text-[22px] font-semibold my-1">
                                        {campsRegistration?.percentFilled ?? "0%"}
                                    </h4>
                                </div>
                            </div>

                            <div className="flex gap-4 items-center pb-4">
                                <img src="/reportsIcons/capacity1.png" className="w-12" alt="" />
                                <div>
                                    <p className="text-[16px] text-[#717073] font-semibold">Untapped business</p>
                                    <h4 className="text-[22px] font-semibold my-1">
                                        £{campsRegistration?.untappedBusiness ?? 0}
                                    </h4>
                                </div>
                            </div>

                        </div>
                    </div>
                    <div className="bg-white p-3 rounded-2xl">
                        <div className="flex justify-between items-center mb-3 px-4">
                            <h3 className="text-[24px] font-semibold text-gray-800 pb-3">Early Bird Offer</h3>
                            <EllipsisVertical className="text-gray-400" />
                        </div>

                        <div className="space-y-4 px-4">
                            <div className="flex gap-4 items-center border-b border-[#E2E1E5] pb-4">

                                <img src="/reportsIcons/logout.png" className="w-12" alt="" />
                                <div>
                                    <p className="text-[16px] text-[#717073] font-semibold ">Number of registration</p>
                                    <div className="">
                                        <h4 className="text-[22px] font-semibold my-1">85%</h4>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 items-center border-b border-[#E2E1E5] pb-4">
                                <img src="/reportsIcons/percentage.png" className="w-12" alt="" />
                                <div>
                                    <p className="text-[16px] text-[#717073] font-semibold ">Percentage</p>
                                    <div className="">
                                        <h4 className="text-[22px] font-semibold my-1">12%</h4>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-4 items-center pb-4">
                                <img src="/reportsIcons/poundIcon.png" className="w-12" alt="" />

                                <div>
                                    <p className="text-[16px] text-[#717073] font-semibold ">Revenue Impact</p>
                                    <div className="">
                                        <h4 className="text-[22px] font-semibold my-1">£12.569</h4>
                                    </div>
                                </div>
                            </div>


                        </div>
                    </div>





                </div>
            </div>
        </div>
    );
}
