// Interests 

function calculateLateFees(){
  var apartments = [101,102,103,104,201,202,203,204,301,302,303,304]  
  var currentYear = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "Y")
  for (var i = 0; i < apartments.length; i++){
    var currentDebts = getDebtsByApartment(apartments[i])
    var lateFee = 0
    
    currentDebts.forEach(function(debt){      
      if(monthBeforeCurrentMonth(debt.date)){
        // Late fee should add previous fees if there is no payment        
        lateFee = lateFee + (debt.amount * .025)
        // Create new Debt type Fee
        newDebt(apartments[i], lateFee, debt.date ,"Recargo")
      }
    })
  }

}


function monthBeforeCurrentMonth(debtDate) {
  // Get the current month in MMM format.
  var currentMonth = new Date().getMonth()
  // Get month in number
  var debtMonth = new Date(debtDate).getMonth()
  
  // Return `true` if the month is before the current month, and `false` otherwise  
  return debtMonth < currentMonth
}

