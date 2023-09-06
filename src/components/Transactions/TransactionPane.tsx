import { useState } from "react"
import { InputCheckbox } from "../InputCheckbox"
import { TransactionPaneComponent } from "./types"

//Bug 7 Solution Step 1:
import { useCustomFetch } from "src/hooks/useCustomFetch"

export const TransactionPane: TransactionPaneComponent = ({
  transaction,
  loading,
  setTransactionApproval: consumerSetTransactionApproval,
}) => {
  //Bug 7 Solution Step 2:
  const { clearCache } = useCustomFetch()
  const [approved, setApproved] = useState(transaction.approved)

  return (
    <div className="RampPane">
      <div className="RampPane--content">
        <p className="RampText">{transaction.merchant} </p>
        <b>{moneyFormatter.format(transaction.amount)}</b>
        <p className="RampText--hushed RampText--s">
          {transaction.employee.firstName} {transaction.employee.lastName} - {transaction.date}
        </p>
      </div>
      <InputCheckbox
        id={transaction.id}
        checked={approved}
        disabled={loading}
        onChange={async (newValue) => {
          // This part initiates a function call to consumerSetTransactionApproval,
          // which sets the approval status of a transaction based on the new value.
          // It includes the transaction ID and the new value for approval.

          await consumerSetTransactionApproval({
            transactionId: transaction.id,
            newValue,
          })

          // Bug 7 Solution Step 3:
          // Bug 7: clear cache to have updated checked value
          // Following the transaction approval change, this step clears the cache
          // to ensure that any cached data, especially the checked value, is updated.
          // This helps to reflect the most recent approval status accurately.

          await clearCache()
          setApproved(!approved)

          // Finally, this line sets the state variable 'setApproved' to the 'newValue.'
          // It updates the component's local state to reflect the newly approved status.
        }}
      />
    </div>
  )
}

const moneyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
})
