// Debts

function createYearlyDebts(inflation=1.05){
  var sheet = getMaintenanceSpreadsheet("Debts") 
  var row = sheet.getLastRow() + 1     
  var currentYear = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "Y")
  // Create a new row at the end of the sheet.
  apartments = [101,102,103,104,201,202,203,204,301,302,303,304] // TODO: Read from Tenants sheet  
  for(var i = 0; i < 12; i++){
    for (var j = 0; j < apartments.length; j++){      
      var tmpDate = new Date(currentYear, i, 2)
      newDebt(apartments[j], 2000*inflation, tmpDate,"Deuda",row)
      row++
    }    
  }
}

function newDebt(apartment, qty, date, type, row){  
  var sheet = getMaintenanceSpreadsheet("Debts") 
  // Default value of row
  var row = typeof row !== 'undefined' ? row : sheet.getLastRow() + 1
  var debtDate = Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyyMMdd")
  // Type[0] takes the first letter of the free form type
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


function sortDebts(a,b) {
  if (a.type !== b.type) {
    return a.type > b.type ? -1 : 1;
  }

  // Compare the date attribute if the type attributes are the same.
  return a.date - b.date;
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

