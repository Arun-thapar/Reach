$("#searchPostcode").click(function(){crimeData.searchByPostcode()});
$(document).on("click",".crime-heading", function(){
    let itemIndex = $(this).attr("alt");
    $('#' +  itemIndex).collapse('toggle');
    //change icon
    $(".crime-heading-icon").each(function(){
        if ($(this).attr("alt") === itemIndex){
            if ($(this).hasClass("fa-angle-double-down")){
                $(this).removeAttr("class").attr("class", "fas fa-angle-double-up crime-heading-icon");
                $(this).removeAttr("title").attr("title", "hide data");
            }
            else{
                $(this).removeAttr("class").attr("class", "fas fa-angle-double-down crime-heading-icon");
                $(this).removeAttr("title").attr("title", "show data");
            }
        }
    });
});

$(function () {
    $("#userPostcode").val('');
    crimeData.getPoliceCatData();

});
class localCrimeData{
  constructor(category, lat, lng, locationName, date, id){
    this.category = category;
    this.lat = lat;
    this.lng = lng;
    this.locationName = locationName;
    this.date = date;
    this.id = id;
  }
}
const api = 'https://data.police.uk/api/';
const currentDate = new Date();
const currentMonth = parseInt(currentDate.getMonth()) + 1;
const currentYear =currentDate.getFullYear();
const htmlSpliter = '<div><hr/></div>';
let crimeCats = [];


crimeData = (function(){
    return {
                getPoliceCatData : async function(){
                    //get crime categories
                    const response = await fetch(api + 'crime-categories');
                    const data = await response.json();
                    data.forEach(x => {
                    //insert crime cats into an array
                    crimeCats.push({url:x.url, name:x.name});
                    });
            },

            searchByPostcode : function(){

                    let postcode = $('#userPostcode').val();
                    let bValidatedPostcode = false;
                    $('.invalid-postcode').empty().hide();
                    if (postcode != ''){
               
                        //validate postcode 
                        if (isValidPostcode(postcode)){
                            bValidatedPostcode = true;
                            //convert postcode to lat lng coords
                            crimeData.convertPostcodeToLatLng(postcode);
                        }    
                    }

                    if (!bValidatedPostcode){
                        //display error message
                        $('.invalid-postcode').empty().text('Your postcode is not valid.').show();
                        $('#table').empty();
                        $('.crimedata-wrapper').hide();
                    }
        },
        convertPostcodeToLatLng : async function(postcode){
            $('.invalid-postcode').hide();
            //get lat lng coords of postcode location
            const response = await fetch('https://api.postcodes.io/postcodes/' + postcode);
            const data = await response.json();
            if(data.status === 200){
                $('#loadingData').show();
                crimeData.getLocalCrimeData(data.result.latitude, data.result.longitude)
            }
            else{
                //error message 
                $('.invalid-postcode').empty().text('There was an issue with getting data for your postcode.').show();
                $('#loadingData').hide();
            }
            
        },
        getLocalCrimeData : async function(lat, lng){

            $('.no-crime-data').hide();
            let localCrime = [];
            //get crime data by location of postcode lat lng coords
            let response = await fetch(api + 'crimes-street/all-crime?&lat=' + lat + '&lng=' + lng)
            let data = await response.json();
            $('.crimedata-wrapper').show();
            if (data != null && data.length > 0){
                        
                       data.forEach(y => {
                            //store crime data into an array
                             localCrime.push(new localCrimeData(y.category, y.location.latitude, y.location.longitude, y.location.street.name, y.month, y.id));
                       });        

                       if (localCrime.length > 0){
                        crimeData.displayLocalCrimeData(localCrime);
                       }
                       $('#loadingData').hide();
            }
            else{
                //no data display defult message.
                $('.no-crime-data').show();
                $('#table').empty();
                $('#loadingData').hide();
            }

      },
      
      displayLocalCrimeData : function(arrCrimeData){
        let bStyle = false;
        let htmlContent = '';
        let bGotSubHeading = false;
        let iCount = 0;
        $('#table').empty();
         crimeCats.forEach(x => {
              
                arrCrimeData.filter(y => y.category == x.url).forEach( z =>  { 
                      if (!bGotSubHeading){
                        htmlContent += crimeData.crimeSubHeadingTemplate(x.name, iCount);
                        bGotSubHeading = true;
                      }
                      bStyle = (bStyle === true ? false : true);
                 htmlContent += crimeData.crimeItemTemplate(z, bStyle);
                 iCount++;
                });
                htmlContent += '</div>'
                bGotSubHeading = false;
         });



        if (htmlContent != ''){
          $('#table').append(htmlContent).show();
        }

      },
      crimeItemTemplate : function(crime, rowStyle){

        let styleStr = (rowStyle ? 'alt' : 'og');

        return `<div class=\'row ` + styleStr + `\'><div class=\'col-8\'>${crime.locationName} <span class=\'crime-id'\>(${crime.id})</span></div>
                        <div class=\'col-4\'>${crime.date }</div></div>`;


      },
      crimeSubHeadingTemplate : function(title, index){

        return (index !== 0 ? htmlSpliter : '') + `<div class=\'row crime-heading\' alt=\'`+ index + `\'><div class=\'col\'><i class=\'fas fa-angle-double-up crime-heading-icon\' alt=\'`+ index + `\' title=\'hide data\'></i>Offence : ${title}</div>
                    </div><div id=\'`+ index + `\' class=\'collapse show\'><div class=\'row\'><div class=\'col-8 subheading-title\'>Location</div>
                        <div class=\'col-4 subheading-title\'>Date</div></div>`;
      }      
    }
})();


function isValidPostcode(p) {
    var postcodeRegEx = /^[A-Za-z]{1,2}[0-9]{1,2}[A-Za-z]{0,1} ?[0-9][A-Za-z]{2}$/i;
    return postcodeRegEx.test(p);
}
