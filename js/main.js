var map;
var infoWindow;

function initMap() {
  // Constructor creates a new map.
  map = new google.maps.Map(document.getElementById("map"), {
    center: {lat: 39.9612, lng: -82.9988},
    zoom: 11
  });

  ko.applyBindings(new viewModel(model));

}

function mapError() {
  alert("Google Maps is not loading property");
}

var model = {
  dropdownItems: ["All", "Apparel", "Insurance", "Pharmaceuticals", "Restaurants", "Retail", "Utilities"],

  locations: [
      {title: "Abercrombie and Fitch", coordinates: {lat: 40.090839, lng: -82.77778}, industry: "Apparel"},
      {title: "Express Inc.", coordinates: {lat: 40.0533532, lng: -82.8995438}, industry: "Apparel"},
      {title: "American Electric Power", coordinates: {lat: 39.96525279999999, lng: -83.00532520000002}, industry: "Utilities"},
      {title: "Bath and Body Works", coordinates: {lat: 40.0815334, lng: -82.81087459999998}, industry: "Retail"},
      {title: "Big Lots", coordinates: {lat: 39.9591964, lng: -83.10934700000001}, industry: "Retail"},
      {title: "Cardinal Health", coordinates: {lat: 40.1091848, lng: -83.1207465}, industry: "Pharmaceuticals"},
      {title: "Victoria's Secret", coordinates: {lat: 40.0543384, lng: -82.8968815}, industry: "Apparel"},
      {title: "Bob Evans Restaurants", coordinates: {lat: 40.0811946, lng: -82.76694909999998}, industry: "Restaurants"},
      {title: "Wendy's", coordinates: {lat: 40.1010289, lng: -83.10316599999999}, industry: "Restaurants"},
      {title: "Nationwide Mutual Insurance", coordinates: {lat: 39.9680291, lng: -83.00306799999998}, industry: "Insurance"}
    ],

  markers: []
}

var viewModel = function(model) {
  var self = this;
  self.dropdownItems  = ko.observableArray(model.dropdownItems);
  self.dropdownItem = ko.observable("");
  self.locations = ko.observableArray(model.locations);
  self.markersArray  = ko.observableArray(model.markers);
  var wrapper = $(".wrapper");

  window.onload = function() {
    self.locations().forEach(function (location) {
      // Creates a new marker for each location industry.
      var marker = new google.maps.Marker({
        map: map,
        icon: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
        animation: google.maps.Animation.DROP,
        position: new google.maps.LatLng(location.coordinates.lat, location.coordinates.lng),
        title: location.title,
      });
      // Adds the new marker to the locations observable array.
      self.markersArray.push({marker: marker ,industry: location.industry});
      infoWindow = new google.maps.InfoWindow();
      marker.addListener("click", function() {
        map.panTo(marker.position);
        self.markersArray().forEach(function (data) {
          data.marker.setIcon("http://maps.google.com/mapfiles/ms/icons/red-dot.png");
        });
        self.populateInfoWindow(this, infoWindow);
        self.nytAPI(this.title, infoWindow);
      });
    });
  };

  self.activateLocation = function(data) {
    // When a list item is clicked the corresponding marker infoWindow displays.
    var companyTitle = data.title;
    self.markersArray().forEach(function(marker) {
      if (companyTitle == marker.marker.title) {
        google.maps.event.trigger(marker.marker, 'click');
      };
    });
  };

  self.removeMarkers = function() {
    // Removes all markers and infoWindows and resets the marker icon.
    if (infoWindow) {
        infoWindow.close();
    };
    self.markersArray().forEach(function(data) {
      data.marker.setVisible(false)
      data.marker.setIcon("http://maps.google.com/mapfiles/ms/icons/red-dot.png");
    });
  };

  self.setMarkers = function(dropdownItem) {
    // Shows the markers for the industry selected.
    if (dropdownItem == "All") {
      self.markersArray().forEach(function(data) {
        data.marker.animation = google.maps.Animation.DROP;
        data.marker.setVisible(true);
      });
    } else {
        self.markersArray().forEach(function(data) {
          if (data.industry == dropdownItem) {
            data.marker.animation = google.maps.Animation.DROP;
            data.marker.setVisible(true);
          };
        });
      };
    };

  self.populateInfoWindow = function(marker, infoWindow) {
    marker.setIcon("http://maps.google.com/mapfiles/ms/icons/yellow-dot.png");
    // Check to make sure the infowindow is not already opened on this marker.
    if (infoWindow.marker != marker) {
      infoWindow.marker = marker;
      infoWindow.setContent("<div><h5>" + marker.title + " in the news!</h5></div><ul class='infoWindow'><ul>");
      infoWindow.open(map, marker);
      // Make sure the marker property is cleared if the infoWindow is closed.
      infoWindow.addListener("closeclick", function() {
        marker.setIcon("http://maps.google.com/mapfiles/ms/icons/red-dot.png");
        infoWindow.marker = null;
      });
    };
  };

  self.nytAPI = function(q, infoWindow) {
    // Gets 3 New York Times headlins and links and puts them into the corresponding infoWindow.
    var content = "<div><h5>" + q + " in the news!</h5></div><ul class='infoWindow'><ul>";
    var url = "https://api.nytimes.com/svc/search/v2/articlesearch.json";
    url += '?' + $.param({
      'q': q,
      'api-key': "89aa8212bc144528ad092b4d730b7ebc"
    });
    $.ajax({
      url: url,
      method: 'GET',
    }).done(function(data) {
      var articles = data.response.docs;
        for (i = 0; i < 3; i++) {
          var article = articles[i];
          var nytHeadline = article.headline.main;
          var nytURL = article.web_url;
          content += "<li><a href='" + nytURL + "'>" + nytHeadline + "</a></li>";
        };
        infoWindow.setContent(content);
      }).fail(function() {
        infoWindow.setContent("Could not display New York Times articles.");
        })
  };

  self.menuToggle = function() {
    // Toggles the visibility of the sidebar.
    wrapper.toggleClass("visible");
  };

  self.filterdMarkers = ko.computed(function() {
    // Filters the menu options when a dropdown item is selected
    var dropdownItem = self.dropdownItem();
    if (!dropdownItem || dropdownItem == "All") {
      self.removeMarkers();
      self.setMarkers(dropdownItem);
      return self.locations();
    } else {
      return ko.utils.arrayFilter(self.locations(), function(location) {
        self.removeMarkers();
        self.setMarkers(dropdownItem);
        return location.industry == dropdownItem;
      });
    }
  });
}
