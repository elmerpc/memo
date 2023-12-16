function getMaintenanceSpreadsheet(sheetName) {  
  var spreadsheetId = "1UxNdhSee9WuHi91j3k3dpKLgcbXLbJdU6Z9OXWS0A0A"
  var spreadsheet = SpreadsheetApp.openById(spreadsheetId)
  return spreadsheet.getSheetByName(sheetName)
}

function findMissingElements(array1, array2) {
  const set2 = new Set(array2);
  return array1.filter(element => !set2.has(element));
}

function deleteEmptyRows(sheetName) {
  // Get the active sheet.
  var sheet = getMaintenanceSpreadsheet(sheetName)

  // Get the last row that contains data.
  var lastDataRow = sheet.getLastRow();

  // Loop through all the rows and delete the empty ones.
  for (var i = lastDataRow; i >= 1; i--) {
    var range = sheet.getRange(i, 1, 1, sheet.getLastColumn());
    if (range.isBlank()) {
      sheet.deleteRow(i);
    }
  }
}

function getAllSheetValues(sheetName){
  var sheet = getMaintenanceSpreadsheet(sheetName)
  var range = sheet.getDataRange()
  return values = range.getValues()
}

function getMonthFromString(mon){
   return new Date(Date.parse(mon +" 1, 2023")).getMonth()+1
}

function createDateWithMonth(month){
  var currentYear = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "Y")
  return new Date(Date.parse(month +" 1,"+currentYear))
}