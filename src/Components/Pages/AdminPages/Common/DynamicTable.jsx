// src/components/DynamicTable.jsx
import React, { useState, useMemo, useEffect } from "react";
import { Check } from "lucide-react";

const DynamicTable = ({
  columns,
  data,
  from,
  selectedIds = [],
  setSelectedStudents,
  onRowClick,
  isFilterApplied,

}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const toggleSelect = (studentId) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  // Flatten the data into entries of { ...parentItemFields, student, studentIndex }
  const flattenedData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return data.flatMap((item) =>
      (item.students || []).map((student, studentIndex) => ({
        parent: item,           // original parent item (keeps original intact)
        ...item,                // spread parent fields (id, bookingId, parents, etc)
        student,                // the student object
        studentIndex,           // index of the student within parent
      }))
    );
  }, [data]);
  const groupedData = useMemo(() => {
    return Object.values(
      flattenedData.reduce((acc, item) => {
        const key = item.bookingId || item.id;
        if (!key) return acc;
        if (!acc[key]) {
          acc[key] = { ...item, students: [] };
        }
        if (item.student) {
          acc[key].students.push(item.student);
        }
        return acc;
      }, {})
    );
  }, [flattenedData]);
  const useGrouped = ["request to cancel", "full cancel", "all cancel"].includes(from);

  const finalData = useGrouped ? groupedData : flattenedData;
  // Calculate pagination
  const totalItems = finalData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedData = finalData.slice(startIndex, startIndex + rowsPerPage);

  // Keep currentPage in range when data or rowsPerPage change
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
    if (currentPage < 1 && totalPages > 0) {
      setCurrentPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPages, currentPage]);

  useEffect(() => {
    if (isFilterApplied) {
      setCurrentPage(1);
    }
  }, [isFilterApplied]);

  // If rowsPerPage or data changes, reset to page 1
  useEffect(() => {
    setCurrentPage(1);
  }, [rowsPerPage, data]);
  // 🟦 GROUP by parent bookingId

  // console.log('from', from)
  return (
    <div className="mt-5 w-full rounded-2xl overflow-hidden border border-[#E2E1E5]">
      <div className="overflow-auto">
        <table className="min-w-full bg-white text-sm border-separate border-spacing-0">
          <thead className="bg-[#F5F5F5]">
            <tr className="font-semibold">
              {columns.map((col, idx) => {
                const header = col.header.toLowerCase();

                const shouldWrap =
                  col.header === "No. Of Students" ||
                  header.includes("date") ||
                  header.includes("cycle") ||
                  header.includes("membership plan");

                const shouldCenter = header.includes("status");

                return (
                  <th
                    key={idx}
                    className={`p-4 text-[#717073] ${shouldWrap ? "" : "whitespace-nowrap"} ${shouldCenter ? "text-center" : "text-left"
                      }`}
                  >
                    {col.header}
                  </th>
                );
              })}

            </tr>
          </thead>

          <tbody>
            {paginatedData?.length > 0 ? (
              paginatedData.map((entry, index) => {
                const { student, studentIndex, parent, ...item } = entry;

                const uniqueId = (() => {
                  const baseId = item.id || item.bookingId || parent?.bookingId || parent?.cancellationId || `row-${startIndex + index}`;
                  return useGrouped ? `${baseId}` : `${baseId}-${studentIndex}`;
                })();

                const isSelected = selectedIds?.includes(uniqueId);
                return (
                  <tr
                    key={uniqueId}
                    onClick={onRowClick ? () => onRowClick(item, from) : undefined}
                    className="border-t font-semibold text-[#282829] border-[#EFEEF2] hover:bg-gray-50"
                  >
                    {columns.map((col, cIdx) => {
                      if (col.selectable) {
                        return (
                          <td key={cIdx} className="p-4 cursor-pointer capitalize whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleSelect(uniqueId);
                                }}
                                className={`lg:w-5 lg:h-5 me-2 flex items-center justify-center rounded-md border-2 ${isSelected
                                  ? "bg-blue-500 border-blue-500 text-white"
                                  : "border-gray-300 text-transparent"
                                  }`}
                              >
                                {isSelected && <Check size={14} />}
                              </button>

                              <span>
                                {col.header === "Parent Name"
                                  ? `${item.parents?.[0]?.parentFirstName || ""} ${item.parents?.[0]?.parentLastName || ""
                                    }`.trim() || "N/A"
                                  : `${student?.studentFirstName || ""} ${student?.studentLastName || ""
                                    }`.trim() || "N/A"}
                              </span>
                            </div>
                          </td>
                        );
                      }

                      if (col.render) {
                        return (
                          <td key={cIdx} className="p-4 whitespace-nowrap capitalize ">
                            {col.render(item, student)}
                          </td>
                        );
                      }

                      return (
                        <td key={cIdx} className="p-4 whitespace-nowrap capitalize">
                          {item[col.key] ?? student?.[col.key] ?? "-"}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={columns.length} className="text-center p-4 text-gray-500">
                  Data not found
                </td>
              </tr>
            )}
          </tbody>

        </table>
      </div>

      {/* Pagination Footer */}
      {totalItems > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
          <div className="flex items-center gap-2 mb-3 sm:mb-0">
            <span>Rows per page:</span>
            <select
              value={rowsPerPage}
              onChange={(e) => setRowsPerPage(Number(e.target.value))}
              className="border rounded-md px-2 py-1"
            >
              {[5, 10, 20, 50].map((num) => (
                <option key={num} value={num}>
                  {num}
                </option>
              ))}
            </select>
            <span className="ml-2">
              {Math.min(startIndex + 1, totalItems)} -{" "}
              {Math.min(startIndex + rowsPerPage, totalItems)} of {totalItems}
            </span>
          </div>

          {/* Pagination buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded-md border ${currentPage === 1
                ? "text-gray-400 border-gray-200"
                : "hover:bg-gray-100 border-gray-300"
                }`}
            >
              Prev
            </button>

            {/* Compact page range logic */}
            {(() => {
              const pageButtons = [];
              const maxVisible = 5;
              let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
              let endPage = startPage + maxVisible - 1;

              if (endPage > totalPages) {
                endPage = totalPages;
                startPage = Math.max(1, endPage - maxVisible + 1);
              }

              // show first + ellipsis if needed
              if (startPage > 1) {
                pageButtons.push(
                  <button
                    key={1}
                    onClick={() => setCurrentPage(1)}
                    className={`px-3 py-1 rounded-md border ${currentPage === 1
                      ? "bg-blue-500 text-white border-blue-500"
                      : "hover:bg-gray-100 border-gray-300"
                      }`}
                  >
                    1
                  </button>
                );
                if (startPage > 2) {
                  pageButtons.push(
                    <span key="start-ellipsis" className="px-2">
                      ...
                    </span>
                  );
                }
              }

              // main page window
              for (let i = startPage; i <= endPage; i++) {
                pageButtons.push(
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i)}
                    className={`px-3 py-1 rounded-md border ${currentPage === i
                      ? "bg-blue-500 text-white border-blue-500"
                      : "hover:bg-gray-100 border-gray-300"
                      }`}
                  >
                    {i}
                  </button>
                );
              }

              // show last + ellipsis if needed
              if (endPage < totalPages) {
                if (endPage < totalPages - 1) {
                  pageButtons.push(
                    <span key="end-ellipsis" className="px-2">
                      ...
                    </span>
                  );
                }
                pageButtons.push(
                  <button
                    key={totalPages}
                    onClick={() => setCurrentPage(totalPages)}
                    className={`px-3 py-1 rounded-md border ${currentPage === totalPages
                      ? "bg-blue-500 text-white border-blue-500"
                      : "hover:bg-gray-100 border-gray-300"
                      }`}
                  >
                    {totalPages}
                  </button>
                );
              }

              return pageButtons;
            })()}

            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded-md border ${currentPage === totalPages
                ? "text-gray-400 border-gray-200"
                : "hover:bg-gray-100 border-gray-300"
                }`}
            >
              Next
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default DynamicTable;