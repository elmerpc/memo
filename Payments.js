// Payments

function getPayments(){  
  // Create an array of the values in the data range.
  var values = getAllSheetValues('Payments')
  return values.map(rowToPayment)
}

function rowToPayment(row, index){
  // Create an object with the values for easier handling
  return {
    position: index+1,
    id: row[0],
    timestamp: row[1],
    payer_id: row[2],        
    amount: row[3],
    date: row[4],
    month: Utilities.formatDate(new Date(row[4]), Session.getScriptTimeZone(), "MMM"),
    status: row[5]
  }
}

function newPaymentCreated(event){    
  //if(event.changeType == 'EDIT' && event.source.getActiveSheet().getName() == 'Payments'){    
    // Get latest payment in Spreadsheet
    var sheet = getMaintenanceSpreadsheet('Payments')
    var lastRow = sheet.getLastRow()
    var paymentRange = sheet.getRange(lastRow,1,1,8)
    //Transform to Object with a -1 in last row cause it's adding it up later
    var newPayment = rowToPayment(paymentRange.getValues().flat(), lastRow-1)
    // Double check it's a new payment or just a manual edit
    if (newPayment.status != 'Conciliado'){
      console.log(newPayment)
      // Match payment with open debts
      processPayment(newPayment)
    }    
    
  //}
}


function setStatus(payment, status){  
  var paymentsSheet = getMaintenanceSpreadsheet('Payments')
  var paymentRange = paymentsSheet.getRange(payment.position,6)
  paymentRange.setValue(status)
}

function processPayment(p){  
  // Get debts by apartment
  var debts = getDebtsByApartment(p.payer_id)
  // Sort debts by late fees first and then debts
  debts.sort(sortDebts)
  // Set initial qty to payment amount
  var quantity = p.amount
  var i = 0
  // While there is money settle debts from oldest to newest
  while(quantity > 0){
    quantity = settleDebt(debts[i],p)
    i++
  }
  setStatus(p,"Conciliado")
}

function processAllPayments(){  
  var payments = getPayments()
  payments.forEach(processPayment)
}

/* Deprecated

function getPaymentsByMonth(month){
  //Adds default date of today
  var month = typeof month !== 'undefined' ? month : Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "MMM")
  var payments = getPayments()  
  return payments.filter(payment => payment.month === month)
}

*/