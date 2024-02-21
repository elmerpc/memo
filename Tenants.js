function getTenants(){
  // Create an array of the values in the data range.
  var values = getAllSheetValues('Tenants')
  
  // Create an object with the values to handle it easier
  return values.map(function(row) {
      return {        
        name: row[0] +" "+ row[1],
        email: row[2],
        apartment: row[3]        
        }
    })
}

function getTenantEmail(apartmentNumber){
  var tenants = getTenants()  
  return tenants.filter(tenant => tenant.apartment == apartmentNumber)[0].email
}

