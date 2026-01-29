import React from "react";
import { HashLoader } from "react-spinners";

const ProgressBar = ({ uploadProgress }) => {
  return (
    <div className="w-full max-w-lg mx-auto p-6 rounded-2xl bg-white shadow-xl">

      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-semibold text-[#000]">
          Uploading 
        </span>

        <span className="px-3 py-1 text-xs font-bold rounded-full 
                         text-[#000]">
          {uploadProgress}%
        </span>
      </div>

      {/* Progress Track */}
      <div className="relative w-full h-4 bg-[#E6F0FA] rounded-full overflow-hidden">

        {/* Progress Bar */}
        <div
          className="h-full rounded-full 
                     bg-gradient-to-r 
                     from-[#FFE11A] via-[#0066CC] to-[#00A0E3]
                     transition-all duration-500 ease-out
                     shadow-[0_0_14px_rgba(0,102,204,0.7)]"
          style={{ width: `${uploadProgress}%` }}
        />

        {/* Moving Glow */}
        <div
          className="absolute top-0 h-full w-24 
                     bg-white/40 blur-xl"
          style={{ left: `${uploadProgress - 10}%` }}
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3">
        <p className="text-xs text-[#003A8F]">
          {uploadProgress < 100
            ? `${100 - uploadProgress}% remaining`
            : "Finalizing upload..."}
        </p>

        {uploadProgress < 100 && (
          <HashLoader size={18} color="#0066CC" />
        )}
      </div>
    </div>
  );
};

export default ProgressBar;
