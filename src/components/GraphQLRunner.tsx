export const GraphQLRunner = (props: {query: string}) => {
    return (
        <>
            <label htmlFor="auth_token" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Authorization
                Token</label>

            <input type="text"
                   id="auth_token"
                   className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 mb-4
                                focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600
                                dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                   placeholder=""
                   required/>

            <pre>
                {props.query}
            </pre>
        </>
    );
};