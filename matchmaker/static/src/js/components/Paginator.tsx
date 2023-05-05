import React from 'react'

function Paginator({ page, setPage, pageSize, totalJobs }) {

    const totalPages = Math.ceil(totalJobs / pageSize);
    const handlePrevious = () => {
        if (page > 1) {
            setPage(page - 1);
        }
    };

    const handleNext = () => {
        if (page >= totalPages) {
            return;
        }

        setPage(page + 1);
    };

    const handlePageClick = (pageNumber) => {
        setPage(pageNumber);
    };

    const generatePageNumbers = (currentPage, total) => {
        const range = 5; // Number of pages to display
        const delta = Math.floor(range / 2);
        let start = currentPage - delta;
        let end = currentPage + delta;

        // Handle edge cases
        if (start < 1) {
            end += Math.abs(start) + 1;
            start = 1;
        }
        if (end > total) {
            start -= end - total;
            end = total;
        }
        start = Math.max(start, 1);

        // Generate page numbers
        const pages: number[] = [];
        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    };

    const selectedButtonClasses = "z-10 px-3 py-2 leading-tight text-blue-600 border border-blue-300 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 dark:border-gray-700 dark:bg-gray-700 dark:text-white";
    const nonSelectedButtonClasses = "px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white";

    const pageNumbers = generatePageNumbers(page, totalPages);

    return (
        <div className='flex justify-center'>
            <nav aria-label="Page navigation example">
                <ul className="inline-flex -space-x-px">
                    <li>
                        <button
                            onClick={handlePrevious}
                            className="px-3 py-2 ml-0 leading-tight text-gray-500 bg-white border border-gray-300 rounded-l-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                        >
                            Previous
                        </button>
                    </li>
                    {/* Render page numbers here */}
                    {pageNumbers.map((pageNumber) => (
                        <li key={pageNumber}>
                            <button
                                onClick={() => handlePageClick(pageNumber)}
                                className={pageNumber === page ? selectedButtonClasses : nonSelectedButtonClasses}
                            >
                                {pageNumber}
                            </button>

                        </li>
                    ))}
                    <li>
                        <button
                            onClick={handleNext}
                            className="px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 rounded-r-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                        >
                            Next
                        </button>
                    </li>
                </ul>
            </nav>
        </div>
    )
}

export default Paginator
