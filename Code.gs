// Debts

function createYearlyDebts(){
  var sheet = getMaintenanceSpreadsheet("Debts") 
  var row = sheet.getLastRow() + 1     
  var currentYear = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "Y")
  // Create a new row at the end of the sheet.
  apartments = [101,102,103,104,201,202,203,204,301,302,303,304] // TODO: Read from Tenants sheet  
  for(var i = 0; i < 12; i++){
    for (var j = 0; j < apartments.length; j++){      
      var tmpDate = new Date(currentYear, i, 2)
      newDebt(apartments[j], 2000, tmpDate,"Deuda",row)
      row++
    }    
  }
}

function newDebt(apartment, qty, date, type, row){  
  var sheet = getMaintenanceSpreadsheet("Debts") 
  // Default value of row
  var row = typeof row !== 'undefined' ? row : sheet.getLastRow() + 1
  var debtDate = Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyyMMdd")  
  var debtID = type[0] + apartment +"-"+ debtDate +"-"+ row
  // Writes debt to Sheet
  sheet.getRange(row,1,1,7).setValues([[debtID,apartment,qty,date,new Date(),"Pendiente",type]])
}

function getDebts(){  
  // Create an array of the values in the data range.
  var values = getAllSheetValues('Debts')    
  // Create an object with the values to handle it easier
  return values.map(function(row,index) {
      return {
        position: index + 1, // Index in Spreadsheet starts in 1
        id: row[0],
        apartment: row[1],
        amount: row[2],
        date: row[3],
        updateDate: row[4],
        status: row[5],
        type: row[6]
        }
    })
}

function getDebtsByApartment(apartmentNumber){  
  var allDebts = getDebts()  
  return allDebts.filter(debt => debt.apartment == apartmentNumber && (debt.status == 'Pendiente' || debt.status == 'Parcial'))
}

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
        email: row[2],
        apartment: row[4],
        amount: row[5],
        month: Utilities.formatDate(new Date(row[6]), Session.getScriptTimeZone(), "MMM"),
        status: row[7]
    }
}

function getPaymentsByMonth(month){
  //Adds default date of today
  var month = typeof month !== 'undefined' ? month : Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "MMM")
  var payments = getPayments()  
  return payments.filter(payment => payment.month === month)
}

function newPaymentCreated(event){    
  if(event.changeType == 'EDIT' && event.source.getActiveSheet().getName() == 'Payments'){    
    // Get latest payment in Spreadsheet
    var sheet = getMaintenanceSpreadsheet('Payments')
    var lastRow = sheet.getLastRow()
    var paymentRange = sheet.getRange(lastRow,1,1,8)
    //Transform to Object with a -1 in last row cause it's adding it up later
    var newPayment = rowToPayment(paymentRange.getValues().flat(), lastRow-1)
    // Double check it's a new payment or just a manual edit
    if (newPayment.status != 'Conciliado'){
      console.log(newPayment)
      // Add missing info to the payment record
      enrichPayment(newPayment)
      // Match payment with open debts
      processPayment(newPayment)
    }    
    
  }
}

function sortDebts(a,b) {
  if (a.type !== b.type) {
    return a.type > b.type ? -1 : 1;
  }

  // Compare the date attribute if the type attributes are the same.
  return a.date - b.date;
}

function processPayment(p){  
  // Get debts by apartment
  var debts = getDebtsByApartment(p.apartment)
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

function enrichPayment(payment){
  var paymentsSheet = getMaintenanceSpreadsheet('Payments')
  // Adds ID and email to new record
  var today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd")
  var paymentRange = paymentsSheet.getRange(payment.position,1,1,3)
  payment.id = "P"+payment.apartment+"-"+today+"-"+payment.position
  payment.email = getTenantEmail(payment.apartment)
  setStatus(payment, "Nuevo")
  paymentRange.setValues([[payment.id,payment.timestamp,payment.email]])
}

function setStatus(payment, status){  
  var paymentsSheet = getMaintenanceSpreadsheet('Payments')
  var paymentRange = paymentsSheet.getRange(payment.position,8)
  paymentRange.setValue(status)
}

function settleDebt(debt, payment){
  var paidAmount = payment.amount
  if (paidAmount <= 0) { return 0 } // Guard clause
  
  var sheet = getMaintenanceSpreadsheet("Debts")
  //console.log("Pago registrado: ", payment)
  //console.log("Deuda a saldar: ", debt)
  var debtRange = sheet.getRange(debt.position,1,1,6)
  
  // If amount is enough, settle debt
  if(paidAmount >= debt.amount){
    // Set new amount for payment
    createConciliation(payment,debt,debt.amount)
    payment.amount = paidAmount - debt.amount
    debt.amount = 0
    debt.status = 'Pagada'    
  } // If amount is insufficient settle a part and update debt amount
  else{
    createConciliation(payment,debt,payment.amount)
    payment.amount = 0
    debt.amount = debt.amount - paidAmount
    debt.status = 'Parcial'
  }
  // Write new values to Spreadsheet  
  debtRange.setValues([[debt.id,debt.apartment, debt.amount, debt.date, new Date(), debt.status]])

  return payment.amount
}

function createConciliation(payment, debt,quantity){
  var sheet = getMaintenanceSpreadsheet("Settling")
  var lastRow = sheet.getLastRow() + 1
  var today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "YYYYMMDD")
  
  sheet.getRange(lastRow,1,1,5).setValues([["S"+today+lastRow,payment.id,debt.id,quantity,new Date()]]) 
}

