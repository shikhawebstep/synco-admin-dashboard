// List.js
import React, { useEffect, useState } from 'react';
import Loader from '../../../contexts/Loader';
import { useNavigate } from 'react-router-dom';
import { usePermission } from '../../../Common/permission';
import { useHolidayTerm } from '../../../contexts/HolidayTermsContext';
import { showError, showSuccess, showConfirm } from "../../../../../../utils/swalHelper";

const HolidayTermList = () => {
  const navigate = useNavigate();
  const { fetchHolidayCampDate, termData, loading, deleteCampDate } = useHolidayTerm();

  useEffect(() => {
    fetchHolidayCampDate();
  }, [fetchHolidayCampDate]);

  // INDIVIDUAL SESSION TOGGLE STATE
  const [openSessions, setOpenSessions] = useState({});

  const toggleSession = (id) => {
    setOpenSessions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleDelete = (id) => {
    if (!id) return;

    showConfirm(
      "Are you sure?",
      "This action will delete the Term Group.",
      () => {
        deleteCampDate(id);
      }
    );
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);

    return date.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const handleEdit = (id) => {
    navigate(`/configuration/holiday-camp/terms/create?id=${id}`);
  };

  const { checkPermission } = usePermission();

  const canEdit =
    checkPermission({ module: 'term-group', action: 'update' }) &&
    checkPermission({ module: 'term', action: 'update' }) &&
    checkPermission({ module: 'session-plan-group', action: 'view-listing' });

  const canDelete =
    checkPermission({ module: 'term-group', action: 'delete' }) &&
    checkPermission({ module: 'term', action: 'delete' });

  const canCreate =
    checkPermission({ module: 'term-group', action: 'create' }) &&
    checkPermission({ module: 'term', action: 'create' }) &&
    checkPermission({ module: 'session-plan-group', action: 'view-listing' });

  if (loading) return <Loader />;

  if (!termData.length && !termData.length) {
    return (
      <>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 w-full">
          <h2 className="text-[22px] md:text-[28px] font-semibold">
            Holiday Camp Dates & Session Plan Mapping
          </h2>

          {canCreate && (
            <button
              onClick={() => navigate('/configuration/holiday-camp/terms/create')}
              className="bg-[#237FEA] flex items-center gap-2 text-white px-4 py-2 md:py-[10px] rounded-xl hover:bg-blue-700 text-[15px] font-semibold"
            >
              <img src="/members/add.png" className="w-4 md:w-5" alt="Add" />
              Add Holiday Camp Dates
            </button>
          )}
        </div>

        <div className="text-center p-4 border-dotted text-red-500 rounded-md text-sm md:text-base">
          No Term Groups or Term Data Available
        </div>
      </>
    );
  }

  if (!loading && !termData.length) {
    return (
      <>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 w-full">
          <h2 className="text-[22px] md:text-[28px] font-semibold">
            Holiday Camp Dates & Session Plan Mapping
          </h2>

          {canCreate && (
            <button
              onClick={() => navigate('/configuration/holiday-camp/terms/create')}
              className="bg-[#237FEA] flex items-center gap-2 text-white px-4 py-2 md:py-[10px] rounded-xl hover:bg-blue-700 text-[15px] font-semibold"
            >
              <img src="/members/add.png" className="w-4 md:w-5" alt="Add" />
              Add Holiday Camp Dates
            </button>
          )}
        </div>

        <div className="text-center p-4 border-dotted text-red-500 rounded-md text-sm md:text-base">
          No Term Groups Available
        </div>
      </>
    );
  }

  return (
    <div className="pt-1 bg-gray-50 min-h-screen md:px-4 md:px-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 w-full">
        <h2 className="text-[22px] md:text-[28px] font-semibold">
          Holiday Camp Dates & Session Plan Mapping
        </h2>

        {canCreate && (
          <button
            onClick={() => navigate('/configuration/holiday-camp/terms/create')}
            className="bg-[#237FEA] flex items-center gap-2 text-white px-4 py-2 md:py-[10px] rounded-xl hover:bg-blue-700 text-[15px] font-semibold"
          >
            <img src="/members/add.png" className="w-4 md:w-5" alt="Add" />
            Add Holiday Camp Dates
          </button>
        )}
      </div>

      {/* Term Cards */}
      <div className="transition-all duration-300 h-full w-full">
        {termData.map((item, indx) => (
          <div key={item.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow hover:shadow-md transition mb-4">

            <div className="flex flex-col md:flex-row justify-between p-4 gap-4 text-sm">

              {/* Camp Name */}
              <div className="flex-shrink-0 w-full md:w-3/12">
                <h5 className="font-bold text-[18px]">Camp Name</h5>
                <p className="font-semibold line-clamp-2 text-[16px]">{item?.holidayCamp?.name}</p>
              </div>

              {/* Term Summary */}
              <div className="grid md:w-7/12 md:grid-cols-3">

                <div className="flex items-center gap-3">
                  <img src="/images/icons/spring.png" className="w-8 mt-1" alt="" />
                  <div>
                    <p className="text-[#717073] font-semibold text-[16px] mb-1">Start Date</p>
                    <p className="text-[16px] text-gray-600">{formatDate(item.startDate)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <img src="/images/icons/autumn.png" className="w-8 mt-1" alt="" />
                  <div>
                    <p className="text-[#717073] font-semibold text-[16px] mb-1">End Date</p>
                    <p className="text-[16px] text-gray-600">{formatDate(item.endDate)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <img src="/images/icons/summer.png" className="w-8 mt-1" alt="" />
                  <div>
                    <p className="text-[#717073] font-semibold text-[16px] mb-1">No. of Days</p>
                    <p className="text-[16px] text-gray-600">{item.totalDays}</p>
                  </div>
                </div>

                {/* Sessions */}
                <div className="mt-3 col-span-2 overflow-x-auto scrollbar-hide">
                  {item.sessionsMap.map((session, i) => (
                    <div key={i} className="flex flex-col gap-2">
                      <div
                        className={`transition-all duration-500 overflow-hidden ${openSessions[item.id] ? 'max-h-[1000px]' : 'max-h-0'
                          }`}
                      >
                        <ul className="space-y-1 text-xs mt-1">
                          <li>
                            <div className="grid grid-cols-2 items-start">
                              <span className="font-semibold text-[16px]">
                                {`Session ${i + 1}: ${session?.sessionPlan?.groupName || 'No Session Found'}`}
                              </span>
                              <span className="text-[#717073] text-[16px] pl-10">
                                {formatDate(session.sessionDate)}
                              </span>
                            </div>
                          </li>
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 md:w-1/12 ml-auto">
                {canEdit && (
                  <button onClick={() => handleEdit(item.id)} className="text-gray-500 hover:text-blue-500">
                    <img className="w-5 h-5" src="/images/icons/edit.png" alt="Edit" />
                  </button>
                )}

                {canDelete && (
                  <button onClick={() => handleDelete(item.id)} className="text-gray-500 hover:text-red-500">
                    <img className="w-5 h-5" src="/images/icons/deleteIcon.png" alt="Delete" />
                  </button>
                )}
              </div>
            </div>

            {/* Toggle Sessions */}
            <div
              className="bg-gray-100 px-4 py-2 cursor-pointer"
              onClick={() => toggleSession(item.id)}
            >
              <div className="text-center text-[#237FEA] flex justify-center items-center gap-2">
                {openSessions[item.id] ? 'Hide all session dates' : 'Show all session dates'}
                <img
                  className={`w-4 transition-transform ${openSessions[item.id] ? 'rotate-180' : ''}`}
                  src="/images/icons/bluearrowup.png"
                  alt="Toggle"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HolidayTermList;
