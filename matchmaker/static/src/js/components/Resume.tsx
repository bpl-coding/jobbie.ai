
import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
    useResumeViewsResumePdfToTextMutation,
    useResumeViewsResumeTextToJsonMutation,
    useResumeViewsGetResumeTextToJsonResultQuery,
    useResumeViewsGetJobsQuery,
    useResumeViewsCreateResumeMutation,
    useResumeViewsGetResumeQuery,
    useResumeViewsGetTagsQuery,
} from "../store/resumeApi";

import FileUpload from "../components/FileUpload";
import JsonResume from "../components/JsonResume";

const Resume = ({resumeJson, setResumeJson}) => {    
    // Initialize the state variables using the values from the URL search parameters
    const [file, setFile] = useState(null);
    const [errorMsg, setErrorMsg] = useState("");
    const [pdfToTextResponse, setpdfToTextResponse] = useState<string>("");
    const [resumeText, setresumeText] = useState("");
    const [parseId, setParseId] = useState("");

    useEffect(() => {
        // console.log(getResumeIsFetching);
        // console.log(getResumeIsLoading);
        if (pdfToTextResponse?.length > 20 && resumeText === "") {
            console.log(resumeText);
            setresumeText(pdfToTextResponse);
        }
    }, [pdfToTextResponse, resumeText]);

    const [
        resumePdfToText,
        {
            isLoading: pdfToTextIsLoading,
            isError: pdfToTextIsError,
            error: pdfToTextError,
            isSuccess: pdfToTextIsSuccess,
            data: pdfToTextData,
        },
    ] = useResumeViewsResumePdfToTextMutation();

    const [
        resumeTextToJSON,
        {
            isLoading: textToJsonIsLoading,
            isError: textToJsonIsError,
            isSuccess: textToJsonIsSuccess,
            data: textToJsonData,
        },
    ] = useResumeViewsResumeTextToJsonMutation();

    const
        {
            data: jsonData, // The data returned by the query
            error: jsonError, // Any error that occurred while fetching the data
            isLoading: getJsonIsLoading, // Whether the query is currently loading
            isFetching: getJsonIsFetching, // Whether the query is currently fetching in the background
            refetch: refetchJsonQuery
        } = useResumeViewsGetResumeTextToJsonResultQuery(
            { task_id: parseId }, // Pass the resumeUUID as a parameter to the query
        );

    const [
        createResume,
        {
            isLoading: createResumeIsLoading,
            isError: createResumeIsError,
            error: createResumeError,
            isSuccess: createResumeIsSuccess,
            data: createResumeData,
        },
    ] = useResumeViewsCreateResumeMutation();


    const handleFileChange = async (event) => {

        let selectedFile = null;
        if (event.target) {
            selectedFile = event.target.files[0];
        } else {
            selectedFile = event[0];
        }

        const maxSize = 2 * 1024 * 1024; // 2MB

        if (selectedFile && selectedFile['size'] > maxSize) {
            setErrorMsg("File size must be under 2MB");
            setFile(null);
        } else if (selectedFile && selectedFile['type'] !== "application/pdf") {
            setErrorMsg("File must be a PDF");
            setFile(null);
        } else {
            setErrorMsg(""); // Clear the error message if the file is within the allowed size
            setFile(selectedFile);

            if (selectedFile) {
                // Automatically upload the file if it's within the allowed size
                await handleFileUpload(selectedFile);
            }
        }
    };

    const handleFileUpload = async (file) => {
        try {
            const formData = new FormData();
            formData.append("file", file);
            const response = await resumePdfToText({ body: formData });
            setpdfToTextResponse(response['data'].text);

        } catch (error) {
            // Handle error, e.g., show an error message
        } finally {
        }
    };

    return (
        <div>
            {resumeText === "" ? (
                <FileUpload
                    file={file}
                    onFileChange={handleFileChange}
                    errorMsg={errorMsg}
                />
            ) : (
                <JsonResume
                    resumeText={resumeText}
                    resumeJson={resumeJson}
                    setResumeJson={setResumeJson}
                    style={
                        {
                            "margin-left": "auto",
                            "margin-right": "auto",
                            "max-width": "8.5in",
                            "padding": "0.75in 0.75in"
                        }
                    }
                ></JsonResume>
            )};
        </div>
    );
};

export default Resume;