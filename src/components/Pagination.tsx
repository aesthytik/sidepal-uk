"use client";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  const getPageNumbers = () => {
    const pageNumbers: (number | string)[] = [];
    const maxMiddleButtons = 3; // Show 3 numbers in the middle
    const boundaryPages = 1; // Show 1 page at start and end
    const boundaryRange = 2; // When we're 2 pages away from start/end, don't show dots

    if (totalPages <= 5) {
      // If we have 5 or fewer pages, show all
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always show first boundaryPages
      for (let i = 1; i <= boundaryPages; i++) {
        pageNumbers.push(i);
      }

      // Calculate middle range
      let middleStart = Math.max(
        currentPage - Math.floor(maxMiddleButtons / 2),
        boundaryPages + 1
      );
      let middleEnd = Math.min(
        middleStart + maxMiddleButtons - 1,
        totalPages - boundaryPages
      );

      // Adjust middleStart if we're near the end
      if (middleEnd === totalPages - boundaryPages) {
        middleStart = middleEnd - maxMiddleButtons + 1;
      }

      // Add dots before middle section if needed
      if (middleStart > boundaryPages + boundaryRange) {
        pageNumbers.push("...");
      } else {
        // If we're close to start, just show numbers
        for (let i = boundaryPages + 1; i < middleStart; i++) {
          pageNumbers.push(i);
        }
      }

      // Add middle section
      for (let i = middleStart; i <= middleEnd; i++) {
        pageNumbers.push(i);
      }

      // Add dots after middle section if needed
      if (middleEnd < totalPages - boundaryPages - boundaryRange) {
        pageNumbers.push("...");
      } else {
        // If we're close to end, just show numbers
        for (let i = middleEnd + 1; i < totalPages; i++) {
          pageNumbers.push(i);
        }
      }

      // Always show last boundaryPages
      for (let i = totalPages; i > totalPages - boundaryPages; i--) {
        pageNumbers.push(i);
      }
    }

    return pageNumbers;
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  return (
    <div className="flex flex-wrap justify-center items-center gap-2 mt-8">
      {/* Skip to first */}
      <button
        onClick={() => goToPage(1)}
        disabled={currentPage === 1}
        className="px-3 py-2 rounded-md bg-white border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        «
      </button>

      {/* Previous */}
      <button
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-2 rounded-md bg-white border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        ‹
      </button>

      {/* Page numbers */}
      <div className="flex flex-wrap gap-1">
        {getPageNumbers().map((item, index) =>
          typeof item === "number" ? (
            <button
              key={index}
              onClick={() => goToPage(item)}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                currentPage === item
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {item}
            </button>
          ) : (
            <span key={index} className="px-2 py-2 text-gray-500">
              {item}
            </span>
          )
        )}
      </div>

      {/* Next */}
      <button
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-2 rounded-md bg-white border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        ›
      </button>

      {/* Skip to last */}
      <button
        onClick={() => goToPage(totalPages)}
        disabled={currentPage === totalPages}
        className="px-3 py-2 rounded-md bg-white border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        »
      </button>
    </div>
  );
}
