import { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import { InputSelect } from "./components/InputSelect"
import { Instructions } from "./components/Instructions"
import { Transactions } from "./components/Transactions"
import { useEmployees } from "./hooks/useEmployees"
import { usePaginatedTransactions } from "./hooks/usePaginatedTransactions"
import { useTransactionsByEmployee } from "./hooks/useTransactionsByEmployee"
import { EMPTY_EMPLOYEE } from "./utils/constants"
import { Employee } from "./utils/types"

export function App() {
  const { data: employees, ...employeeUtils } = useEmployees()
  const { data: paginatedTransactions, ...paginatedTransactionsUtils } = usePaginatedTransactions()
  const { data: transactionsByEmployee, ...transactionsByEmployeeUtils } = useTransactionsByEmployee()
  const [isEmployeeTranscationsVisible, setIsEmployeeTranscationsVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const transactions = useMemo(
    () => paginatedTransactions?.data ?? transactionsByEmployee ?? null,
    [paginatedTransactions, transactionsByEmployee]
  )

  const [runningTranscations, setRunningTranscations] = useState(transactions)

  const loadAllTransactions = useCallback(async () => {
    setIsLoading(true)
    transactionsByEmployeeUtils.invalidateData()

    await employeeUtils.fetchAll()
    await paginatedTransactionsUtils.fetchAll()

    /*
    Bug 4 Solution:
    This code merges two arrays, previousTranscation and paginatedTransactions?.data, into 
    the setRunningTranscations state variable. It uses the spread operator (...) and the logical OR (||)
    to ensure that empty arrays are used as fallbacks if either of the source arrays is missing or empty.
    */
    setRunningTranscations((previousTranscation) => [
      ...(previousTranscation || []),
      ...(paginatedTransactions?.data || [])
    ]);

    setIsEmployeeTranscationsVisible(false);
    setIsLoading(false)
  }, [employeeUtils, paginatedTransactionsUtils, transactionsByEmployeeUtils])

  const loadTransactionsByEmployee = useCallback(
    async (employeeId: string) => {
    ///Bug 6 Solution:
    // First, setIsEmployeeTranscationsVisible(true) is called.
    // This line sets a state variable called isEmployeeTranscationsVisible to true.
    // It indicates that transactions associated with a specific employee are now visible or being displayed.
    // Next, paginatedTransactionsUtils.invalidateData() is invoked.
    // This function is responsible for invalidating or clearing any previously loaded paginated transactions.
    // It ensures that when we load transactions for a specific employee, we start with a clean slate.
    // Finally, we await transactionsByEmployeeUtils.fetchById(employeeId).
    // This line initiates an asynchronous request to fetch transactions associated with the specified employeeId.
    // This data is then used to display the relevant transactions for that employee.

      setIsEmployeeTranscationsVisible(true);
      paginatedTransactionsUtils.invalidateData()
      await transactionsByEmployeeUtils.fetchById(employeeId)
    },
    [paginatedTransactionsUtils, transactionsByEmployeeUtils]
  )

  useEffect(() => {
    if (employees === null && !employeeUtils.loading) {
      loadAllTransactions()
    }
    setRunningTranscations(transactions)
  }, [employeeUtils.loading, employees, loadAllTransactions])

  return (
    <Fragment>
      <main className="MainContainer">
        <Instructions />

        <hr className="RampBreak--l" />

        <InputSelect<Employee>
          // Bug 5: Part A and B Solution:
          // There were two issues identified in Bug 5 that required resolution.

          // Part A Solution:
          // Initially, the isLoading prop for the Employee Input Select component was tied to the isLoading variable,
          // which was only changed when both employees and paginatedTransactions were loaded.
          // However, this led to a problem where the loading state was not accurately reflected when only employees were being loaded.
          // To address this, I modified the code to use employeeUtils.loading instead.
          // employeeUtils.loading is updated when the request for employees is successful, ensuring that the loading state for the Employee Input Select component
          // is correctly updated regardless of whether paginatedTransactions are also loaded or not.

          // Part B Solution:
          // Another aspect of Bug 5 was that when we clicked "View More" and then attempted to select an employee from the dropdown containing all employees,
          // it would still show "Loading..." even though the employees had already been loaded.
          // This issue was also resolved by using employeeUtils.loading as described above.
          // Now, when we click on the select input with all the employees, it no longer displays "Loading..."
          // because it accurately reflects the state of the employees' loading process, which had already been completed.
          isLoading={employeeUtils.loading}
          defaultValue={EMPTY_EMPLOYEE}
          items={employees === null ? [] : [EMPTY_EMPLOYEE, ...employees]}
          label="Filter by employee"
          loadingLabel="Loading employees"
          parseItem={(item) => ({
            value: item.id,
            label: `${item.firstName} ${item.lastName}`,
          })}
          onChange={async (newValue) => {
            /*
            Bug 3 Solution:
            I added the || (logical OR) statement in the if condition to execute the code block if either 
            of the following conditions is true: newValue is null. newValue.id is equal to EMPTY_EMPLOYEE.id. 
            This change allows for more flexibility in responding to different scenarios.
            */
            if (newValue === null || newValue.id === EMPTY_EMPLOYEE.id) {
              await loadAllTransactions()
              return
            }

            await loadTransactionsByEmployee(newValue.id)
          }}
        />

        <div className="RampBreak--l" />

        <div className="RampGrid">
        {/* Bug 5 Extension:
          In the context of addressing Bug 5, it's important to understand the significance of replacing the transactions prop for this component.
          Previously, the transactions prop in this component was being replaced each time, which meant that the component received a new set of 
          transactions whenever the "View More" button was clicked. This behavior caused a problem as it resulted in the loss of previously loaded transactions.
          To address this issue and enhance the functionality of the component, we made a crucial change. Now, instead of replacing the transactions prop, we are 
          accumulating transactions. This means that each time the "View More" button is clicked, we keep all the transactions that have been loaded up to that point.
          This modification ensures that we maintain a comprehensive and continuous record of all transactions, preventing data loss and providing a more accurate 
          representation of the transaction history. It's a vital extension to Bug 5's resolution, enhancing the robustness and reliability of the component's behavior. 
        */}
          <Transactions transactions={runningTranscations} />

          {transactions !== null && 
           /*Bug 6a Solution:
           !isEmployeeTranscationsVisible as a solution for addressing a specific bug labeled as "Bug 6a." It indicates that 
           this part of the code helps resolve an issue related to employee transaction visibility.
           */
           !isEmployeeTranscationsVisible &&
           /*Bug 6b Solution:
           paginatedTransactions?.nextPage != null as a solution for addressing another bug labeled as "Bug 6b." It suggests 
           that this part of the code addresses an issue related to paginated transactions and the availability of more pages of data.
           */
            paginatedTransactions?.nextPage != null && (
            <button
              className="RampButton"
              disabled={paginatedTransactionsUtils.loading}
              onClick={async () => {
                await loadAllTransactions()
              }}
            >
              View More
            </button>
          )}
        </div>
      </main>
    </Fragment>
  )
}
