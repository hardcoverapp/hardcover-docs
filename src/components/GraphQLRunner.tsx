export const GraphQLRunner = (props: { query: string }) => {
    return (
        <>
            <label htmlFor="auth_token" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                Authorization Token
            </label>

            <input type="text"
                   id="auth_token"
                   className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 mb-4
                                focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600
                                dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                   placeholder=""
                   title="This is your authorization token. You can find this in your account settings."
                   required/>

            <label htmlFor="justMe" className="mb-2 text-sm font-medium text-gray-900 dark:text-white">
                Limit to my account
            </label>
            <input type="checkbox" id="justMe" className="mx-4" title="This will filter the results to just your account where possible" />

            <label htmlFor="resultsLength" className="inline-block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                Results Length
            </label>

            <select id="resultsLength" className="mx-4" title="Limit the results to the selected number of rows">
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="25">25</option>
            </select>

            <button className="px-4 py-2 rounded" title="Run the query displayed below" disabled>
                Run Query
            </button>

            <div className="my-4 w-full bg-accent-200 text-gray-900 p-3 rounded-lg">
                This will run against your account.<br />
                You are responsible for the content of any queries ran on your account.
            </div>

            <div className="">
                <h2 className="text-lg my-4 font-semibold text-gray-900 dark:text-white">Query</h2>

                <pre className="bg-slate-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5
                                dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white">
                    {props.query}
                </pre>

                <h2 className="text-lg my-4 font-semibold text-gray-900 dark:text-white">Results</h2>

                <pre className="bg-slate-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5
                                dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white">
                    {props.query}
                </pre>
            </div>
        </>
    );
};