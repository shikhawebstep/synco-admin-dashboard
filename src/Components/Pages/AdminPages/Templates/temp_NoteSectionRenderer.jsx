const NoteSectionRenderer = ({ block, update, readOnly }) => {
    const addRow = () => {
        const newRow = {
            id: crypto.randomUUID(),
            boxes: [
                {
                    id: crypto.randomUUID(),
                    type: "infoBox",
                    items: [{ label: "Label", value: "Value" }],
                    style: {
                        topBorderColor: "#10b981", // Green default
                        flexDirection: "row", // Default to columns as requested
                        columns: "auto",
                        backgroundColor: "#ffffff",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
                    }
                }
            ]
        };
        update("rows", [...(block.rows || []), newRow]);
    };

    const updateRow = (rowId, key, value) => {
        const newRows = (block.rows || []).map(row =>
            row.id === rowId ? { ...row, [key]: value } : row
        );
        update("rows", newRows);
    };

    const removeRow = (rowId) => {
        const newRows = block.rows.filter(r => r.id !== rowId);
        update("rows", newRows);
    };

    const addBoxToRow = (rowIndex) => {
        const newBox = {
            id: crypto.randomUUID(),
            type: "infoBox",
            items: [{ label: "Label", value: "Value" }],
            style: {
                topBorderColor: "#3b82f6", // Blue default
                flexDirection: "row",
                columns: "auto",
                backgroundColor: "#ffffff",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
            }
        };

        const newRows = [...(block.rows || [])];
        newRows[rowIndex].boxes.push(newBox);
        update("rows", newRows);
    };

    const updateBoxInRow = (rowIndex, boxId, key, value) => {
        if (key === "duplicateBlock") {
            const row = block.rows[rowIndex];
            const boxIndex = row.boxes.findIndex(b => b.id === boxId);
            if (boxIndex === -1) return;

            const newBox = {
                ...row.boxes[boxIndex],
                id: crypto.randomUUID(),
                items: row.boxes[boxIndex].items.map(i => ({ ...i })),
                style: { ...row.boxes[boxIndex].style }
            };

            const newRows = [...block.rows];
            newRows[rowIndex].boxes.splice(boxIndex + 1, 0, newBox);
            update("rows", newRows);
            return;
        }

        const newRows = [...(block.rows || [])];
        const row = newRows[rowIndex];
        row.boxes = row.boxes.map(b =>
            b.id === boxId ? { ...b, [key]: value } : b
        );
        update("rows", newRows);
    };

    const removeBoxFromRow = (rowIndex, boxId) => {
        const newRows = [...(block.rows || [])];
        newRows[rowIndex].boxes = newRows[rowIndex].boxes.filter(b => b.id !== boxId);
        update("rows", newRows);
    };

    return (
        <div style={getCommonStyles(block)} className="relative p-4 border border-dashed border-gray-100 rounded-xl bg-gray-50/50">

            {/* Heading */}
            <div className="text-center mb-8">
                {readOnly ? (
                    <h2 style={{
                        fontFamily: block.headingStyle?.fontFamily || "'Handlee', cursive", // Handlee matches the 'Make a Note' style
                        fontSize: block.headingStyle?.fontSize ? `${block.headingStyle.fontSize}px` : "32px",
                        color: block.headingStyle?.textColor || "#0ea5e9", // Sky blue
                        margin: 0
                    }}>
                        {block.heading || "Make a Note!"}
                    </h2>
                ) : (
                    <input
                        value={block.heading || "Make a Note!"}
                        onChange={(e) => update("heading", e.target.value)}
                        className="text-center bg-transparent text-3xl font-bold text-sky-500 w-full outline-none font-handlee"
                        style={{ fontFamily: "'Handlee', cursive" }}
                    />
                )}
            </div>

            {/* Rows */}
            <div className="flex flex-col gap-6">
                {(block.rows || []).map((row, rIndex) => (
                    <div key={row.id} className="relative group/row">
                        {!readOnly && (
                            <div className="absolute -left-8 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover/row:opacity-100 transition z-20">
                                <button
                                    onClick={() => addBoxToRow(rIndex)}
                                    className="p-1 rounded bg-blue-100 text-blue-600 hover:bg-blue-200"
                                    title="Add Box to Row"
                                >
                                    <FaPlus size={10} />
                                </button>
                                <button
                                    onClick={() => removeRow(row.id)}
                                    className="p-1 rounded bg-red-100 text-red-600 hover:bg-red-200"
                                    title="Delete Row"
                                >
                                    <FaTrashAlt size={10} />
                                </button>
                            </div>
                        )}

                        <div className="flex flex-wrap gap-6">
                            {row.boxes.map((box) => (
                                <div key={box.id} className="flex-1 min-w-[300px] relative group/box">
                                    {!readOnly && (
                                        <button
                                            onClick={() => removeBoxFromRow(rIndex, box.id)}
                                            className="absolute -top-2 -right-2 z-50 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover/box:opacity-100 transition shadow-sm"
                                        >
                                            ✕
                                        </button>
                                    )}
                                    <InfoBoxRenderer
                                        block={box}
                                        readOnly={readOnly}
                                        update={(k, v) => updateBoxInRow(rIndex, box.id, k, v)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Row Button */}
            {!readOnly && (
                <button
                    onClick={addRow}
                    className="mt-6 w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-400 font-bold uppercase tracking-widest hover:border-blue-400 hover:text-blue-500 transition flex items-center justify-center gap-2"
                >
                    <FaPlus /> Add Note Row
                </button>
            )}

            {/* Font Import for "Make a Note" style */}
            <style>
                {`@import url('https://fonts.googleapis.com/css2?family=Handlee&display=swap');`}
            </style>
        </div>
    );
};
