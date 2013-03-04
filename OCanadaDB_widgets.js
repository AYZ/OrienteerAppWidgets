//
// OCanadaDB_widgets.js
//

//
// various code to display some widgets from the Orienteering Canada database, including:
//	Club Map (map of all clubs in the database, including provincial associations)
//	Calendar of events
//



// Fix CORS for IE8/9

//BUGBUG - this code is copied in several of my files - is there some kind of "Include" mechanism??

;		// semicolon is a little safety net, to protect against a missing ending semicolon at the end of previously-included library

(function( jQuery ) {
  // Create the request object
  // (This is still attached to ajaxSettings for backward compatibility)
  jQuery.ajaxSettings.xdr = function() {
    return (window.XDomainRequest ? new window.XDomainRequest() : null);
  };

  // Determine support properties
  (function( xdr ) {
    jQuery.extend( jQuery.support, { iecors: !!xdr });
  })( jQuery.ajaxSettings.xdr() );

  // Create transport if the browser can provide an xdr
  if ( jQuery.support.iecors ) {

    jQuery.ajaxTransport(function( s ) {
      var callback;

      return {
        send: function( headers, complete ) {
          var xdr = s.xdr();

          xdr.onload = function() {
            var headers = { 'Content-Type': xdr.contentType };
            complete(200, 'OK', { text: xdr.responseText }, headers);
          };
          
          xdr.onprogress = function() {};
          
          // Apply custom fields if provided
		  if ( s.xhrFields ) {
            xhr.onerror = s.xhrFields.error;
            xhr.ontimeout = s.xhrFields.timeout;
		  }

          xdr.open( s.type, s.url );

          // XDR has no method for setting headers O_o

          xdr.send( ( s.hasContent && s.data ) || null );
        },

        abort: function() {
          xdr.abort();
        }
      };
    });
  }
})( jQuery );




//
// OCanadaDB_widgets JQuery plugin
// 

$(document).ready(function() 
{
	$.OCanadaDB_widgets.init();	
});


(function( $ ) {
	
	$.OCanadaDB_widgets = {};				// define the "base". Methods & functions called from outside as: $.OCanadaDB_widgets.functionName(args);
	

	function assert (exp, msg)
	{
		if (!exp)
	    {
	        if (msg) { alert (msg); }
	        else     { alert ("Un-named assertion"); }
	    }
	};
	
	
	$.OCanadaDB_widgets.init = function() 
	{ 
		// now the DOM is created (since we're in the ready() function, we can now attach event handlers to DOM objects which finally exist)
		
//		$('#wjrCal_btnOptionsShow').on('click', function(eventObj)
//		{
//			SetView ('#wjrCalOptions');
//		});
		
		$("#wjrCal_btnDeselectAllClubs").click(function(){
			$("#wjrCal_ClubTree").dynatree("getRoot").visit(function(node){
				node.select(false);
			});
			return false;
		});
		
		$("#wjrCal_btnSelectAllClubs").click(function(){
			$("#wjrCal_ClubTree").dynatree("getRoot").visit(function(node){
				node.select(true);
			});
			return false;
		});
	
		
		$('#wjrCalViewButtonset').on('click', function(eventObj)
		{
			var nextViewId = $("#wjrCalViewButtonset :radio:checked").val();
			SetView (nextViewId);
		});	
		

		$('#wjrCal_btnSliderToday').on('click', function(eventObj)
		{
			var today = new Date();
			today.setHours(0,0,0,0);			// set it to the very start of the day
			var startDate = today.getTime();
			$('#wjrCal_sliderMapDateRange').slider('value', startDate);		// bugbug - no "refresh() method??? ".refresh();
		});	

	}; 
	

	// functions to give feedback about the server requests...
	// whenever an Ajax request is active a spinner will be displayed...
		
	var nAjaxSessionsActive = 0;
	function AjaxStart ()
	{
		nAjaxSessionsActive++;
		$("#wjrCal_spinner").show();
	}
		
	function AjaxComplete ()
	{
		assert (nAjaxSessionsActive > 0, "completing more Ajax sessions than were started");
		
		nAjaxSessionsActive--;
		if (nAjaxSessionsActive == 0)
			$("#wjrCal_spinner").hide();
	}
		
		
	// 
	// Define a custom jQuery function that can be called to initialize the Calendar view...
	//
				
	jQuery.OCanadaDB_widgets.initCalendar = function (clubName)
	{
		
		//
		// Figure out which club to show the calendar for...
		// ... is it passed to this function?
		// ... if not, is it specified on URL?
		// ... if neither, then use Orienteering Canada
		//
								
		defaultClubName = clubName;
		if (defaultClubName === undefined)
		{
			ReadUrlVars();
			defaultClubName = UrlVars["club"];
		}

			
		// ThemeRoller & UI element initialization ...
//		$("#wjrCal_tabs").tabs();
		
//		$("#wjrCal_btnOptionsShow"		).button({ icons: {primary:'ui-icon-gear',secondary:null }});
//		$("#wjrCal_btnOptionsDone"		).button();
		$("#wjrCal_btnSliderToday"		).button();
		
		$("#wjrCal_btnSelectAllClubs"	).button();
		$("#wjrCal_btnDeselectAllClubs"	).button();
		$("#wjrCalViewButtonset"        ).buttonset ();
		$("#wjrCalViewBtn_wjrCalOptions").button({ icons: {primary:'ui-icon-gear',secondary:null }});
/*		$('#wjrCalViewButtonset').buttonset().change(function() 
										  {
										    // Remove icons from all buttons
										    $('#wjrCalViewButtonset input').button("option", "icons", {primary: ""});
										    // Add icon to the selected button        
										    $('input:checked', this).button("option", "icons", {primary: "ui-icon-check"}).button("refresh");
										   });
*/

		var sSelector = "#wjrCalViewBtn_" + sInitialView.slice(1);
		$(sSelector).attr("checked", true).button("refresh");

//$(sSelector).button("option", "icons", {primary: "ui-icon-check"}).button("refresh");

		$("#wjrCal_startDate"			).datepicker({
									        onSelect: function(){
									            firstDateToDisplay = $("#wjrCal_startDate").datepicker('getDate');
						            			UpdateListView();
									        }});
	//		$("#wjrCal_mapStartDate"		).datepicker({
	//									        onSelect: function(){
	//									            firstDateToDisplay = $("#wjrCal_mapStartDate").datepicker('getDate');
	//						            			UpdateMapView();
	//									        }});
		$('#wjrCal_startDate'   		).datepicker("setDate", firstDateToDisplay );
	//		$('#wjrCal_mapStartDate').datepicker("setDate", firstDateToDisplay );
	
		
		function sliderChange (event, ui)
		{
			var startDate = new Date (ui.value);
			SetMapViewDates    (startDate);

			UpdateMapSliderText();
			UpdateMapView      ();
		}
		
		function spinnerNDaysSpin (event, ui)
		{
			var nDays = ui.value;
			var spinNDays = $("wjrCal_spinNDays");
			var spinValue  = spinNDays.spinner("value");
//			var spinValue2 = spinNDays.value();
//			var spinValue3 = spinNDays.spinner().value();
			if (nDays === undefined) return;				// might be during init, for example
			
			spinnerNDaysChange(nDays);
		}

		function spinnerNDaysChange (nDays)
		{		
			assert (nDays >= 1, "Invalid nDays for spinner");	
			nDaysToDisplayOnMap = nDays;
			SetMapViewDates    (firstDateToDisplay);		// keep existing start date, and change the period

			UpdateMapSliderText();
			UpdateMapView      ();
		};
		
		$('#wjrCal_sliderMapDateRange'	).slider({
											range	: false,		// actually, "range" doesn't work so good ;-()'
											min		: 0,			// some defaults
											max		: 500,
											slide	: sliderChange,
											change	: sliderChange
										});


		$('#wjrCal_spinNDays').keyup(function() {
			var nDays = $("#wjrCal_spinNDays").val();
			spinnerNDaysChange(parseInt(nDays));
		});
		
	    var spinNDays = $( "#wjrCal_spinNDays" ).spinner({
	    									min		: 1,
//	    									change	: spinnerNDaysSpin,
	    									spin	: spinnerNDaysSpin
	    								});
	    spinNDays.spinner( "value", nDaysToDisplayOnMap);
	    
		// initialize the calendar
		$('#calendar').fullCalendar({
			timeFormat	: 'h:mmtt',
			header		: {	//left   : 'month,agendaWeek,agendaDay',
							//center : 'title',
							//right  : 'today prev,next'
						  },
			theme		: true,
			eventRender	: function(thisEvent, element) 
							{
        						//element.qtip({	content: event.description });
					            var clubName    = clublist[thisEvent.clubId].acronym;
        						var sText		= '(' + clubName + ') ' + thisEvent.title;
	  
        						element.text(sText);
							},
								
			eventClick: function(calEvent, jsEvent, view) 
							{
								// BUGBUG - target is to have popup like on the map. Need the nice little popup bubble at this place, with event URL, date, time, title, org club, etc
								// perhaps use the gtip utility library??

								// In the meantime, if the event has a link, open it in a new tab/window...
						        if (calEvent.url) {
						            window.open(calEvent.url);
						            return false;
						        }
						    }
		});
	
		MakeMapIcons ();			// make the icons for the various event classifications, and for the various club types	
	
	
		// Now load the list of clubs... and load the club list tree
		//  when that is loaded, then load the events for the default club(s) into the calendar
		// 
		var clubListURL = "http://whyjustrun.ca/iof/3.0/organization_list.xml";
			
		$.ajax({
		        type:     		"GET",
		        url:			clubListURL,
		        dataType: 		"xml",
				cache:      	false,
		        data: 		{
				            },
		        beforeSend: function() {
				                	AjaxStart();		// turn on spinner
			                    },
		        complete:   function(jqXHR, textStatus) {
				        			AjaxComplete();		// turn off spinner
			                    },
		        error:      function(jqXHR, textStatus, errorThrown) {
		                        alert (textStatus + " : Failed to read clublist. " + errorThrown);
		                    },
		        success: 	function(xmlClubs)
		        			{
								ParseXmlData_Organizations(xmlClubs, clublist);

								var clubId  = FindClubByName (defaultClubName);		// now we have the club list, find the default club's ID
								if (clubId === undefined) clubId = nId_OCanada;		// 
	   							SelectClub        (clubId);							

		        				LoadClubsIntoTree ();
								MakeClubMapLayer  ();

	   							SetView			  (sInitialView);
		        			}
	      });
	};
	
		
	jQuery.OCanadaDB_widgets.initClubMap = function ()
	{
	
	//		MakeMapIcons ();			// make the icons for the various event classifications, and for the various club types	
	
		// Now load the list of clubs... and load the club list tree
		//  when that is loaded, then load the events for the default club into the calendar
		// 
		var clubListURL = "http://whyjustrun.ca/iof/3.0/organization_list.xml";
			
		$.ajax({
		        type:     		"GET",
		        url:			clubListURL,
		        dataType: 		"xml",
				cache:      	false,
		        data: 		{
				            },
		        beforeSend: function() {
				            	AjaxStart();
		                    },
		        complete:   function(jqXHR, textStatus) {
				        		AjaxComplete();
		                    },
		        error:      function(jqXHR, textStatus, errorThrown) {
		                        alert (textStatus + " : Failed to read club list. " + errorThrown);
		                    },
		        success: 	function(xmlClubs)
		        			{
								ParseXmlData_Organizations(xmlClubs, clublist);
								MakeClubMapLayer  ();
								InitClubMapView	  ();
		        			}
	      });
		
	};

		
		// ReadUrlVars()
		// Read a page's URL variables and return them as an associative array.
		//
		// The function returns an array/object with your URL parameters and their values.
		// For example, consider we have the following URL
		// http://www.example.com/?me=myValue&name2=SomeOtherValue
		// then Calling ReadUrlVars() function would return you the following array:
		// {    "me"    : "myValue",
		//      "name2" : "SomeOtherValue"}
		//
		//  var first  = UrlVars["me"];     // Get a value of first paramaeter
		//  var second = UrlVars["name2"];  .. Get value of second parameter
		
		var UrlVars = [];
		
		function ReadUrlVars()
		{
		    var hash;
		    // BUGBUG - how to grab the URL vars? 
		    // 1st tried via window object, but FF handles it differently than other browsers
		    // 2nd tried via document object
//			var topWindow = window.frameElement ? window.frameElement.contentWindow : window;		// distinguish when running in iFrame (bit hacky I'd say)
//			var vars      = topWindow.location.search; 
			var vars	  = document.defaultView.location.search;
		    var hashes    = vars.slice(1).split('&');
		    for(var i = 0; i < hashes.length; i++)
		    {
		        hash = hashes[i].split('=');
		        UrlVars.push(hash[0]);
		        UrlVars[hash[0]] = hash[1];
		    }
		};
	
	
		var 	clublist = {};			// all clubs - associative array, with club's ID as the key
		var		selectedClubs = [];		// those selected clubs currently displayed in the calendar
		var		clublistHTML = "";		// a hierarchical <ul><li>< /li>...< /ul> version of the club list - for selection of clubs to display in the calendar
		
		var 	clubEvents = [];		// cache to store club eventLists
										// Note: We will retrieve the events only once. So it is possible that a club's calendar will be updated
										//       but not reflected until the app is reloaded.	
		
		var 	eventList = [];         // ALL the events for all the selected clubs, for the data range - for List View (not for Calendar view - FullCalendar access WJR directly)
		var		map;					// the map to be displayed in the map view page
		var		eventsLayerGroup = [];	// one layer for each event classification
		var		clubLayerGroup;			// layer for the clubs
	
		var		EC_undefined = 0;		// event classification has not been specified
		var		EC_int		 = 1;		// international event
		var		EC_nat		 = 2;		// national
		var		EC_reg		 = 3;		// regional
		var		EC_loc		 = 4;		// local
		var		EC_club 	 = 5;		// club
		
		var		eventDisplayProps = [
					{id: EC_undefined, iconName: 'orange',	  textColor: 'black',		bgColor: 'LightGrey'}, 
					{id: EC_int,	   iconName: 'red',		  textColor: 'DarkRed',		bgColor: 'LightGrey'}, 
					{id: EC_nat,	   iconName: 'red',		  textColor: 'DarkRed',		bgColor: 'LightGrey'}, 
					{id: EC_reg,	   iconName: 'red',		  textColor: 'blue',		bgColor: 'LightGrey'}, 
					{id: EC_loc,	   iconName: 'orange',	  textColor: 'black',		bgColor: 'LightGrey'}, 
					{id: EC_club,	   iconName: 'orange',    textColor: 'black',		bgColor: 'LightGrey'}];
	
	
		// GVOC - 1
		// FWOC - 3
		// COF  - 76
		// OABC - 41
		var nId_OCanada  = 76;
		var	defaultClubName;							// this can be set either by: a) pass as argument to initCalendar, or b) specific in URL as http://xxxx?club=GVOC
		var sInitialView = '#wjrCal';					// default screen to display - Calendar view
														// BUGBUG - default screen must be wjrCal until bug is fixed in FullCalendar (2012/6/16)
		var bInitialMapDisplay  = true;					// Map view - waiting for the first time user has a look at it 
		var firstDateToDisplay  = new Date();			// First date to display in calendar - today (List view, at least)
		var lastDateToDisplay = new Date();				// And the Last date to display in the map
		firstDateToDisplay.setHours(0,0,0,0);			// set it to the very start of the date
		lastDateToDisplay.setHours(23,59,59,0);			// set it to the very end of the day
		var	nDaysToDisplayOnMap = 7;					// on the map, default to showing all events for one week.
		var bCalColorsByEventClass = true;				// on the calendar, color events according to event classification or by the "series" that the event belongs to (a club-specific thing)
		
		function MakeMapIcons()
		{
			// make the various icons for displaying on the map
			// 
			var sIconBaseURL = 'http://www.google.com/mapfiles/ms/micons/';
//			var sIconBaseURL = './images/';
			var EventIcon    = L.Icon.extend(
				{
					options: {
					    iconUrl		: sIconBaseURL + 'yellow.png',
					    shadowUrl	: sIconBaseURL + 'msmarker.shadow.png',
					    iconSize	: new L.Point(32, 32),
					    shadowSize	: new L.Point(59, 32),
					    iconAnchor	: new L.Point(16, 32),
					    popupAnchor	: new L.Point( 4,-30)
					}
				});
				
			var i;
			for (i=0; i<6; i++)
			{
				eventDisplayProps[i].icon = new EventIcon({iconUrl: sIconBaseURL + eventDisplayProps[i].iconName + '.png'});
			}
		};
			
		function newEvent ( id, clubId, title, startDateUTC, endDateUTC, 
						    classificationId, classificationName,
	       					allDay, lat, lng, description, url, seriesTextColor, seriesBgColor)
		{
		    var dateStart = new Date (startDateUTC*1000);		//convert seconds to milliseconds for Date() function
		    var dateEnd   = new Date (  endDateUTC*1000);
		    
		    this.id					= id;
		    this.clubId				= clubId;
		    this.title      		= title;
		    this.start      		= dateStart;
		    this.end				= dateEnd;
			this.classificationId   = classificationId;
	//		this.classificationName = classificationName;
		    this.allDay				= allDay;
		    this.lat				= lat;
		    this.lng				= lng;
		    this.description		= description;
		    this.url        		= url;
		    this.seriesTextColor	= seriesTextColor;
		    this.seriesBgColor		= seriesBgColor;
		};
	
		function IsAncestorOf (oldId, youngId)
		{
			if (youngId == oldId) return false;		// can't be an ancestor of yourself
			if (youngId == 0    ) return false;		// not sure what that would mean
			if (oldId   == 0    ) return false;		// nor that
			
			// find young club
			if (! youngClub in clublist) return false;	// no club has this youngster's id, so 'false'
	
			var youngClub = clublist[youngId];			// get the club
			
			if (youngClub.parentId == oldId) return true;		// ancestor is the one we're looking for!!
			if (youngClub.parentId == 0    ) return false;		// run out of tree - no ancestoral link
			return (IsAncestorOf (oldId, youngClub.parentId));	// otherwise, recurse up one level of the tree
		};
		
		function FindClubByName (name)
		{
			var	clubId;		// "undefined" is return value if no match is found
			
			if (name === undefined) return undefined;
			
			// (all comparisons are case-insensitive)
			
			var lowerName = name.toLowerCase();
			$.each (clublist, function(thisClubId, thisClub)
				{
					if ((thisClub.acronym.toLowerCase() == lowerName) ||
						(thisClub.name.toLowerCase()    == lowerName))
					{
						clubId = thisClubId;
						return false;			// breaks out of the "each" construct
					}
				});
						
			return clubId;
		}
		
		function MakeClubListHTML (parentId)
		{
			assert (selectedClubs.length > 0, "selectedClubs should be set prior to MakelubListHTML");
			 	
			var nIncludedClubs   = 0;
			for (var thisClubId in clublist)
			{
				var bIncludeThisClub = false;
				
				var thisClubsParent = clublist[thisClubId].parentId;
				
				if (parentId == 0) 		// BUGBUG - special case - to avoid including all those non-Canadian clubs which currently (Dec 2012) have "0" as parent club...
				{
					if (thisClubId == nId_OCanada) bIncludeThisClub = true;
				}
				else
				{
					if (parentId == thisClubsParent) bIncludeThisClub = true;
				}
	
				if (bIncludeThisClub)
				{
					if (nIncludedClubs == 0)
						clublistHTML += "<ul>";
	
					nIncludedClubs++;

					var sClubId        = " id=\"clubID_" + thisClubId + "\"";
					var sClassSelected = (selectedClubs.indexOf(thisClubId) < 0) ? "" : " class=\"selected\"";
					
					clublistHTML += "<li" + sClubId + sClassSelected + ">"
								    + "<a href=\"#\" class=\"wjrCal_MenuOrgLink\">"  + clublist[thisClubId].name + "<\/a>";
// this code shows acronym - but that is too confusing, I think (AYZ)
//					clublistHTML += "<li id=\"clubID_" + thisClubId + "\" title=\"" + clublist[thisClubId].name + "\">"
//								    + "<a href=\"#\" class=\"wjrCal_MenuOrgLink\">"  + clublist[thisClubId].acronym + "<\/a>";
	
					MakeClubListHTML (thisClubId);
					clublistHTML += "<\/li>";
				}
			}
			if (nIncludedClubs > 0) clublistHTML += "<\/ul>";
		};
	
	
		function LoadClubsIntoTree ()
		{
			// Initialize the club list menu...
			MakeClubListHTML(0);
	
			// Override the dynaTree node attribute defaults - modify the structure before initializing dynatree:
			$.ui.dynatree.nodedatadefaults["icon"] = false; // Turn off icons by default
			
			// Load the "ul" of the clubs - this is what dynaTree uses to load itself
			$("#wjrCal_ClubTree").html(clublistHTML);

			$("#wjrCal_ClubTree").dynatree({
			      checkbox		: true,
			      selectMode	: 3,
			      onSelect		: function(select, node)
							      {
							        // Get a list of all selected nodes...
							        var selNodes  = node.tree.getSelectedNodes();
							        selectedClubs = $.map(selNodes, function(node){
							        	var clubIdString = node.data.key;
							        	var clubId       = clubIdString.substring(7);	// take off the leading "ClubID_", leaving just clubId
							        	return clubId;
							        });
									EventList_ChangedSelectedClubs();
							      },
			      onDblClick	: function(node, event) 
							      {
							        node.toggleSelect();
							      },
				  onKeydown		: function(node, event) 
							      {
							        if( event.which == 32 ) {
							          node.toggleSelect();
							          return false;
							        }
							      }
        	    });
        	    
	       	$("#wjrCal_ClubTree").dynatree("getRoot").visit(function(node)
       	   	{
  				node.expand(true);
			});
		};	
	
		function MakeClubMapLayer ()
		{
			clubLayerGroup = new L.LayerGroup();
	//		clubLayerGroup.clearLayers();
			
		    for (thisClubId in clublist)
	        {
	        	if (!IsAncestorOf (nId_OCanada, thisClubId)) continue;		// Only show Canadian clubs
	            var thisClub	= clublist[thisClubId];
				var sPopupText	= thisClub.acronym + '<br/>' + '<a href=\"' + thisClub.url + '\" target=\"_blank\">' + thisClub.name + '</a>';
				var marker		= new L.CircleMarker(new L.LatLng(thisClub.lat,thisClub.lng),
														{	radius: 5,
													        fillColor: "#ff7800",
													        color: "#000",
													        weight: 1,
													        opacity: 1,
													        fillOpacity: 0.8,
													        title: "test"})
													 .bindPopup(sPopupText);
				clubLayerGroup.addLayer(marker);
			}
		};
	
		function ParseXmlData_Organizations(xmlClubs, clublist)
		{	
		    var OrganisationList = $(xmlClubs.documentElement);   // Get the one and only OrganisationList record
		
		    var clubs = OrganisationList.find('Organisation');
		 
		    clubs.each(function()
		        {
		            var thisClub = $(this);
		
		            var Name         = "";
		            var ShortName    = "";
		            var OrgType      = "";
		            var OrgURL       = "";
		            var ClubId		 = 0;
		            var ParentId     = 0;
		            var Lat          = 0;
		            var Lng          = 0;
		            ClubId			 = thisClub.children('Id'		   ).text();
		            ParentId		 = thisClub.children('ParentOrganisation').attr('idref');
		            if (typeof ParentId === "undefined") ParentId = 0;
		            Name             = thisClub.children('Name'        ).text();
		            ShortName        = thisClub.children('ShortName'   ).text();
		            OrgType          = thisClub.children('Type'        ).text();
		            OrgURL           = thisClub.children('Contact'     ).text();		// BUGBUG - how to check that  type="WebAddress" ?? (can do thisClub.children('Contact').attr('Type') which will return "WebAddress")
					Lat				 = thisClub.children('Position'    ).attr('lat');
					Lng				 = thisClub.children('Position'    ).attr('lng');
		
					clublist[ClubId] = 
						{
						              id:					ClubId,
						              parentId:				ParentId,
						              name:				    Name,
						              acronym:				ShortName,
						              url:					OrgURL,
						              type:					OrgType,
									  lat:					Lat,
									  lng:					Lng
		//				              parent:				$(this).attr('parent'),
		//				              country:				$(this).attr('country'),
		//				              logo_club:			$(this).attr('logo_club'),
		//				              logo_club_thumbnail:	$(this).attr('logo_club_thumbnail'),
					   };
		        });
		};
		
		var pendingClubRequests = new Array();		// here we keep track of pending requests, so we don't re-issue requests for the same club data
	
		function xmlGet_ClubEventList (clubEventListURL, clubId)
		{
			
			var n = pendingClubRequests.indexOf(clubId);		// check if there's already an active request for this club's events...
			if (n>=0) return;
			
			$.ajax({
			        type:     		"GET",
			        url:			clubEventListURL,
			        dataType: 		"json",
					cache:      	false,
			        data: 		{
					            },
			        beforeSend: function() {
				                	AjaxStart();
				                	pendingClubRequests.push(clubId);
			                    },
			        complete:   function(jqXHR, textStatus) {
				        			AjaxComplete();
				        			var n = pendingClubRequests.indexOf(clubId);
				        			if (n>=0) pendingClubRequests.splice(n,1);		// remove clubId from the list of pending requests
			                    },
			        error:      function(jqXHR, textStatus, errorThrown) {
			                        alert (textStatus + " : Failed to read club events (clubId: " + clubId + ") " + errorThrown);
			                    },
			        success: 	function(jsonClubEventList)
			        			{
			        				ParseJsonData_EventList(clubId, jsonClubEventList, eventList);
			        			}
		      });
		};
	
		function ParseJsonData_EventList(clubId, jsonClubEventList, eventList)
		{
			// add the new data into the cache of club Event Lists...

			var clubEventList = [];
			var i;
			for (i=0; i < jsonClubEventList.length; i++)
			{
				var jsonEvent = jsonClubEventList[i];
	
	            var id					= jsonEvent.id;
	            var clubId				= clubId;
	            var title				= jsonEvent.title;
				var start				= jsonEvent.start;
				var end					= jsonEvent.end; 
				var classificationId	= ("event_classification" in jsonEvent) ? jsonEvent.event_classification.id   : EC_undefined;
				var classificationName	= ("event_classification" in jsonEvent) ? jsonEvent.event_classification.name : "";
				var allDay				= jsonEvent.allDay;
				var lat					= jsonEvent.lat;
				var lng					= jsonEvent.lng;
				var description			= jsonEvent.description;
		        var url					= jsonEvent.url;
		        var seriesTextColor		= jsonEvent.textColor;		// color-coding info for a club's series that this event belongs to
		        var seriesBgColor		= jsonEvent.color;			// ditto.
	//	        var textColor			= jsonEvent.textColor;		// these will get set at various times
	//	        var color				= jsonEvent.color;
	
				// some checking on data...
				if (!lat) lat = clublist[clubId].lat;				// if the event's lat/long isn't defined, use the club's as a default
				if (!lng) lng = clublist[clubId].lng;
				
				// store the new event into the completelist of events
		        clubEventList[clubEventList.length] =
		        	new newEvent (id, clubId, title, start, end, 
		        					classificationId, classificationName,
		        					allDay, lat, lng, description, url, seriesTextColor, seriesBgColor);
		    }
		    
		    // add to the cache...
		    clubEvents[clubId] = clubEventList;
		    
		    // now update the combined event list, for the sake of the views...
		    EventList_RefreshFromCache();

		};
		
		function EventList_ChangedSelectedClubs()
		{
			// Call this function whenever there is a change to the "selected clubs"
			
			// BUGBUG - eventuallyy want to specify all arguments in whyjustrun/club URL (club (& all children), minimum level)
			//			For now, alternative might be to get ALL events for ALL clubs, and once they are downloaded use the removeEvents(filterFn) function
			//			But while I'm waiting, lets try to keep track of which event sources are being used (oh, this is so prone to failure!!)
	
			
			var i;	
			
			//
			// first, for any clubs that we haven't already loaded into the cache issue an ajax request to the WJR database...
			//
			
			for (i=0; i<selectedClubs.length; i++)
			{
				var clubId = selectedClubs[i];				
				if (clubEvents[clubId]) continue;		// already have this club's event list in the cache
				
				// not in the cache, need to load the club's events from the WJR database...
				var sClubEventListURL  = 'http://www.whyjustrun.ca/club/' + clubId + '/events.json'; 
				
				xmlGet_ClubEventList (sClubEventListURL, clubId);
			}
			
			// now, update the event list with whatever info is currently in the cache. 
			// We'll continue to update the event list as the ajax requests complete successfully
			
			EventList_RefreshFromCache();
		};
			
		function EventList_RefreshFromCache()
		{
			// Reset fullcalendar's' event list since we're about to reset it...
			$('#calendar').fullCalendar ('removeEvents');
			
			
			eventList.length = 0;		// clear out the old event list

			for (i=0; i<selectedClubs.length; i++)
			{
				var clubId 		  = selectedClubs[i];	
				var clubEventList = clubEvents[clubId];			
				if (!clubEventList) continue;		// club's event list isn't in the cache yet (probably being downloaded right now, asynchronously)
				
				$.merge (eventList, clubEventList);		// add the club's events into the combined list of events
			}
			
			// set the colors of each event ()...
			SetEventListColors();
	
			//
			// Keep the event list sorted by date...
			//
			eventList.sort(function(x, y)
					{
	    				var rv = ((x.start > y.start) ? -1 : ((x.start < y.start) ? 1 : 0));
	    				return rv;
					});
							
			// finally, update the data in the views...
			$('#calendar').fullCalendar ('addEventSource', eventList);
			UpdateListView();
		}
		
		function SetEventListColors ()
		{
			// Ideally this would be called in the RenderEvent FullCalendar callback.
			// But that has a bug, so this method must be called at various other times as a workaround
			// BUGBUG - AYZ - July 2, 2012 - posted bug to http://stackoverflow.com/questions/7918301/fullcalendar-doesnt-render-color-when-using-eventrender/11304046#11304046
			var i;
	        for (i=0; i<eventList.length; i++)
	        {
	            SetEventColors (eventList[i]);
	       	}
		};
	
		function SetEventColors (thisEvent)
		{
			var eventClass	= thisEvent.classificationId;
	   		assert ((eventClass>=0) && (eventClass<=5), "Unexpected event classification - Id: " + eventClass);
	
	   		var textColor	= thisEvent.seriesTextColor;
	   		var bgColor		= thisEvent.seriesBgColor;
	   		bCalColorsByEventClass = (selectedClubs.length > 1);
	   		if (bCalColorsByEventClass)
	   		{
	  			textColor	= eventDisplayProps[eventClass].textColor;
	  			bgColor		= eventDisplayProps[eventClass].bgColor;
	   		}
	
	   		thisEvent.textColor = textColor;
	   		thisEvent.color	    = bgColor;
		};
		
		
		function UpdateListView()
		{
			var data;
			data  = '<table id="wjrCal_EventList">';
			data += '<thead><tr><th>(Date)</th><th>Date</th><th>Event</th><th>Club</th></tr></thead>';
			data += '<tbody>'
	
	        for (i=0; i<eventList.length; i++)
	        {
	            var thisEvent = eventList[i];
	            if (thisEvent.start < firstDateToDisplay) continue;
	            
	            var sDate       = thisEvent.start.myO_FormatDate ("y MMM dd, E");		// date to display
	            var sHiddenDate = thisEvent.start;										// hidden date, to sort on
	            var clubName    = clublist[thisEvent.clubId].acronym;
	           
				data += '<tr>';
				data += '<td>' + sHiddenDate + '</td>';
				data += '<td>' + sDate + '</td>';
				data += '<td>' + '<a href="' + thisEvent.url + '" target="_blank">' + thisEvent.title + '</a></td>';
				data += '<td>' + clubName + '</td>';
				data += '</tr>';
	        }
	        data += '</tbody></table>';
	
	        $("#wjrCalList_EventList").html(data);
	   		$("#wjrCal_EventList"    ).dataTable ({		// Initialize datatables.net plugin
											"bJQueryUI"		: false,	// I really don't like the way the table styles ;-(
											"aoColumns" : [				// this must match EXACTLY the number of columns in Table
												{"bVisible"	: false },		// hidden date
												{"iDataSort": 0     },		// date (use hidden date to sort)
												null,						// event name
												null						// organizing club
											],
											"iDisplayLength" : 25			// display 20 rows at a time
										});
		};
	
	
		function SetMapViewDates (startDate)
		{
			firstDateToDisplay = startDate;
			firstDateToDisplay.setHours( 0, 0, 0,0);			// set it to the very start of the date

			var   endDate = new Date (firstDateToDisplay);
			endDate.setHours(23,59,59,0);						// set it to the very end of the day	
			endDate.setDate (endDate.getDate() + nDaysToDisplayOnMap - 1);

			lastDateToDisplay =   endDate;
		};
	
		function UpdateMapSliderText()
		{
			var sText = firstDateToDisplay.myO_FormatDate ("y MMM dd, E");
			if (lastDateToDisplay.getDate() != firstDateToDisplay.getDate())
				sText += " - " + lastDateToDisplay.myO_FormatDate ("y MMM dd, E");
			$( "#wjrCal_sliderMapDateRangeText" ).text(sText);
			
			// now disable the 'today' button if we're already starting that day...
			var today = new Date();
			today.setHours(0,0,0,0);
			var sDisable = (today.getDate() == firstDateToDisplay.getDate()) ? 'disable' : 'enable';
			$("#wjrCal_btnSliderToday").button(sDisable);

		};
		
		function UpdateMapView()
		{
			if (eventList.length <= 0) {
				assert(true, "Map can't display empty Event List");
				return;
			}
	
			var i;		
			for (i=0; i<6; i++) eventsLayerGroup[i].clearLayers();
				
	        for (i=0; i<eventList.length; i++)
	        {
	            var thisEvent = eventList[i];
	            if (thisEvent.start < firstDateToDisplay) continue;
	            if (thisEvent.start > lastDateToDisplay ) continue;
	            
	            var club		= clublist[thisEvent.clubId];
	            var sClubName	= club.acronym;
	            var lat			= thisEvent.lat;	if (lat == 0) lat = club.lat;
	            var lng			= thisEvent.lng;	if (lng == 0) lng = club.lng;
	            var sDate       = thisEvent.start.myO_FormatDate ("y MMM dd, E h:m");		// date to display
	            var sDesc		= thisEvent.description;
				var sUrl		= thisEvent.url;
				var sTitle		= thisEvent.title;
				var eventClass	= thisEvent.classificationId;
				var sPopupText	= '<a href="' + thisEvent.url + '\" target=\"_blank\">' + thisEvent.title + '</a><br/>';
				sPopupText	   += sDate + '<br/>';
				sPopupText	   += sClubName + '<br/>';
				//sPopupText	   += sDesc;		BugBug - this is WAY too LONG!!			
	
				var loc     = new L.LatLng (lat, lng);
				var marker  = new L.Marker (loc, {icon: eventDisplayProps[eventClass].icon});
				marker.bindPopup (sPopupText);
				eventsLayerGroup[eventClass].addLayer (marker);
		    }	    
		};
		
	
		function SelectClub (nClub)
		{
			// figure out which clubs to include in the updated event list...
			selectedClubs.length = 0;
			for (var thisClubId in clublist)
			{
				if ((nClub == thisClubId) ||
					(IsAncestorOf (nClub, thisClubId)))
				{
					selectedClubs[selectedClubs.length] = thisClubId;
				}
			}
			
/*
	It is really tricky to initialize the tree.
	Tried this briefly, but didn't see the checkboxes were ticked ;-*
			// Now, set the selection in the club tree...
			var i;
			var clubTree = $("#wjrCal_ClubTree").dynatree("getTree");
			for (i=0; i<selectedClubs.length; i++)
			{
				var clubId = selectedClubs[i];
				clubTree.selectKey(thisClubId, true);
			}
*/
			
			// Finally, load the events for the selected club(s)...
			EventList_ChangedSelectedClubs();
		};
		
	
		// 
		// Control which View is seen - Options, Calendar, List, Map...
		//
		function SetView (viewId)
		{
			//
			// run any code needed to shut down existing view...
			//
			if (viewId == '#wjrCal')
			{
				// set the colors appropriately for the selected club(s), then rerender the calendar...
				SetEventListColors();
			}
			
/*			if (viewId == '#wjrCalOptions')
			{
				$('#wjrCal_btnOptionsShow').hide();
			}
			else
			{
				$('#wjrCal_btnOptionsShow').show();				
			}
*/			
			//
			// switch the view
			//
			$('#wjrCal'       ).hide();
			$('#wjrCalList'   ).hide();
			$('#wjrCalMap'    ).hide();
			$('#wjrCalOptions').hide();
			$(viewId          ).show();	
			
			// 
			// run any code the new view needs...
			//
			if (viewId == '#wjrCal')
			{
	        	$('#calendar').fullCalendar ('rerenderEvents');
			}
			
			if (viewId == '#wjrCalMap')
			{
				if (bInitialMapDisplay)
				{
					var i;
					
					map = new L.Map('map');
					for (i=0;i<6;i++) eventsLayerGroup[i] = new L.LayerGroup();
	
						
					var cloudmade = new L.TileLayer('http://{s}.tile.cloudmade.com/f294d5609fec48708f51934f46243976/997/256/{z}/{x}/{y}.png', {
									    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>',
									    maxZoom: 18
										});
//					var canada	  = new L.LatLng(60.0, -94.0); // geographical point (longitude and latitude) - good for 1100 X ?? px
					var canada	  = new L.LatLng(20.0, -94.0); // geographical point (longitude and latitude) - good for 1100 X ?? px
					
					map.setView  (canada, 3)
					   .addLayer (cloudmade)
				       .addLayer (clubLayerGroup);
	
					for (i=0;i<6;i++) map.addLayer (eventsLayerGroup[i]);
					var MapOverlays = {
					    "International"	: eventsLayerGroup[EC_int],
					    "National"		: eventsLayerGroup[EC_nat],
					    "Regional"		: eventsLayerGroup[EC_reg],
					    "Local"			: eventsLayerGroup[EC_loc],
					    "Club"			: eventsLayerGroup[EC_club],
					    "Unknown"		: eventsLayerGroup[EC_undefined]
					};
					var layersControl = new L.Control.Layers(null, MapOverlays);
					map.addControl(layersControl);
				}
	
				bInitialMapDisplay = false;
				
				// set up the date slider (expects EventList to be sorted by date)...
				// we're using milliseconds since 1970, which works well with JavaScript date object
				var nMax		= eventList[0].start.getTime();
				var nMin   		= eventList[eventList.length-1].start.getTime();
				var nRangeMin	= firstDateToDisplay.getTime();
				$( "#wjrCal_sliderMapDateRange").slider( "option", "min",    nMin );
				$( "#wjrCal_sliderMapDateRange").slider( "option", "max",    nMax );
				$( "#wjrCal_sliderMapDateRange").slider( "value",  nRangeMin);
	
				SetMapViewDates		(firstDateToDisplay);
				UpdateMapSliderText ();
				UpdateMapView       ();
			}
		};
		
	
	
		var bInitialClubMapDisplay = true;
		
		function InitClubMapView ()
		{
			if (bInitialClubMapDisplay)
			{
				var i;
					
				map = new L.Map('ClubMap');
				//for (i=0;i<3;i++) clubsLayerGroup[i] = new L.LayerGroup();
	
						
				var cloudmade = new L.TileLayer('http://{s}.tile.cloudmade.com/f294d5609fec48708f51934f46243976/997/256/{z}/{x}/{y}.png', {
								    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>',
								    maxZoom: 18
									});
									
				var canada	  = new L.LatLng(60.0, -94.0); // geographical point (longitude and latitude)
					
				map.setView  (canada, 4)
				   .addLayer (cloudmade)
			       .addLayer (clubLayerGroup);
	
				bInitialMapDisplay = false;
			}
				
		};


})(jQuery);			// end of the plugin


