import React from "react";

export const StatusMessages = (props: {
    queryStatus: 'running' | 'success' | 'error' | 'idle',
    queryError?: string
}) => {

    const {queryStatus, queryError} = props;

    return (
        <>
            {(queryStatus == "idle" || !queryStatus) && (
                <div className="my-4 w-full rounded-lg p-3 text-gray-900 bg-accent-200">
                    This will run against your account.<br/>
                    You are responsible for the content of any queries ran on your account.
                </div>)}

            {queryStatus == "running" && (<div className="my-4 w-full rounded-lg p-3 text-gray-900 bg-accent-200">
                Loading...
            </div>)}

            {queryStatus == "error" && (
                <div className="my-4 w-full rounded-lg border border-red-400 bg-red-100 p-3 text-red-700">
                    <strong>Error: </strong> {queryError}
                </div>)}

            {queryStatus == "success" && (<div
                className="my-4 w-full rounded-lg border border-green-400 bg-green-100 p-3 text-green-700">
                Success!
            </div>)}
        </>
    );
};
