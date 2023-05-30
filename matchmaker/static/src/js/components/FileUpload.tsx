import React, { ChangeEvent, ChangeEventHandler, useState } from 'react'



type FileUploadProps = {
    file: File | null;
    // onFileChange: (files: FileList) => void;
    onFileChange: ChangeEventHandler<HTMLInputElement & { files: FileList }>;
    errorMsg: string;
};


const FileUpload: React.FC<FileUploadProps> = ({
    file,
    onFileChange,
    errorMsg,
}) => {
    const [dragging, setDragging] = useState(false);

    const handleDragOver = (event) => {
        event.preventDefault();
        event.stopPropagation();
        setDragging(true);
    };

    const handleDragLeave = (event) => {
        event.preventDefault();
        event.stopPropagation();
        setDragging(false);
    };

    const handleDrop = (event) => {
        event.preventDefault();
        event.stopPropagation();
        setDragging(false);

        if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
            onFileChange(event.dataTransfer.files);
        }
    };

    return (
        <label
            htmlFor="dropzone-file"
            className="flex flex-col aspect-square items-center justify-center h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600 p-5"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <div className="flex flex-col items-center justify-center">

                <svg aria-hidden="true" className="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                    {dragging ? "Drop file here" : <span className="font-semibold">Click to upload or drag and drop</span>}

                </p>
                {file && <p className="text-xs text-gray-500 dark:text-gray-400">Selected file: {file.name}</p>}
                {errorMsg && <p className="text-xs text-red-500">{errorMsg}</p>}
                <p className="text-xs text-gray-500 dark:text-gray-400">PDF (MAX. 2MB)</p>
            </div>
            <input
                id="dropzone-file"
                type="file"
                onChange={onFileChange}
                className="hidden"
            />
        </label>
    )
}

export default FileUpload