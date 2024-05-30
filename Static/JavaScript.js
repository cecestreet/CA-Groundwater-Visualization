var data = [];  // This needs to be populated with actual data

// Initializing Leaflet Map using the JS open source Leaflet.js library
// 
var map = L.map('leaflet-map').setView([37.5, -119], 6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
}).addTo(map);

// Function to update maps with filtered data
function updateMaps(selectedYear) {
    //Logging the chosen year to the console
    console.log('Selected Year:', selectedYear);

    // If there is not data, or if data length is 0, fetch the data from the CSV file on the Flask server
    if (data.length === 0) {
        fetch('/data')
        //After recieving the data, the data response is converted to text
            .then(response => response.text())
        //D3 is used to parse this text response, our CSV, into a JavaScript object with csvParse function
            .then(csvText => {
                data = d3.csvParse(csvText);
        //FilterandRender function called with our selectedYear argument to filter the data we now have to be used in
        //Rendering the html.
                filterAndRender(selectedYear);
            })
            //Catch is a method a part of the 'fetch' promise(asynchronous) chain, is promise is not being fufilled we execute the callback function
            //Logging the specific error that occured to the console
            .catch(error => console.error('Error fetching data:', error));
    } else {
        //If data is already present, render as selected
        filterAndRender(selectedYear);
    }
}

//We want the selectedYear parameter we defined to filter the data, we want to portion the data we show on the map
//so that the measurment date for a batch of data matches the selectedYear
//We want to filter and Render the map with the filtered batch of data we are focused on
function filterAndRender(selectedYear) {
    var filteredData = data.filter(d => d['Measurement Date'].startsWith(selectedYear));
    console.log('Filtered Data:', filteredData);

    // Update Plotly map
    var layout = {
        title: {
            text: 'California Groundwater Map',
            x: 0.5, //Secure the title to the center
            xanchor: 'center' // Secure the center of the title to the center
        },
        geo: {
            scope: 'usa',
            projection: {
                type: 'albers usa'
            },
            center: {
                lat: 37.5,
                lon: -119
            },
            showland: true,
            landcolor: "rgb(139, 69, 19)",
            // Set the bounds to focus on California
            lataxis: { range: [32, 42] }, // Latitude range for California
            lonaxis: { range: [-125, -114] } // Longitude range for California
        },
        margin: {
            l: 50,
            r: 50,
            t: 90,
            b: 0
        },
        height: 500,
        width: '100%' //Setting width to 100% means the map will be as wide as the html container for this element allows
    };

    //Defining our data layers for our plotly map here
    var data_layers = [
        {
            //We want a scatterplot on a geographical map
            type: 'scattergeo',
            //We want the data points shown as individual markers
            mode: 'markers',
            //The map method is used on our filtered data to extract the Longitude from each object present in our filteredData(specific to the year selected from the dropdown)
            //It is converted to a floating point number with parseFloat to avoid errors
            lon: filteredData.map(d => parseFloat(d.Longitude)),
            lat: filteredData.map(d => parseFloat(d.Latitude)),
            //Our labels for our markers upon hovering will read the following
            //Here we use map again on our filtered data to get the text for each data point. ${} syntax allows embedding 
            text: filteredData.map(d => `Site Code: ${d['Site Code']}, Measurement Date: ${d['Measurement Date']}`),
            marker: {
                size: 10,
                //The array created gere from using map on our filtered data for groundwater elevation will determine the colors/color distribution of the markers
                color: filteredData.map(d => parseFloat(d['Groundwater Elevation'])),
                colorscale: 'Armyrose',
                colorbar: {
                    title: 'Groundwater Elevation'
                }
            }
        }
    ];

    //Call and render the plot with the necessary parameters
    Plotly.newPlot('plotly-map', data_layers, layout);


    //Creating a layer group for the markers
    var markers = L.layerGroup();
    //initializing an empty ephemeral array to store data for the Leaflet Map
    var leafData = [];
    filteredData.forEach(d => {
        // Create markers
        var markerOptions = {
            radius: 8,
            //the getColor function returns a color value based on the quality readings
            fillColor: getColor(d.Quality),
            //the border of the circle/marker here is set to black
            color: "#000",
            //Weight sets the thickness of the border
            weight: 0.5,
            opacity: 1,
            //Opacity of the marker, 0 transparent, 1 opaque.
            fillOpacity: 1,
        };
        //Declaring a variable to hold our marker object
        //Creating a circle marker with Leafley, using the latitude, longitude, and markerOptions we previously defined
        //We bind our chosen text and explicit object references to the markers
        //Additionally we make all of the markers from an instance of filtered data into a map layer group, one by one
        //adding the marker to the markers layer
        var marker = L.circleMarker([parseFloat(d.Latitude), parseFloat(d.Longitude)], markerOptions)
            .bindPopup(`Site Code: ${d['Site Code']}<br>Measurement Date: ${d['Measurement Date']}<br>Quality: ${d['Quality']}`);
        markers.addLayer(marker);

        // Add data for Leaflet Map
        // If the quality measurements match Good, Questionable, or Provisional, then the data will be 
        //pushed through to leafData with the Lat and Lon for each object(data point)
        if (d.Quality === 'Good' || d.Quality === 'Questionable' || d.Quality === 'Provisional') {
            leafData.push([parseFloat(d.Latitude), parseFloat(d.Longitude)]);
        }
    });

    //We add the markers layer to the Leaflet map object
    markers.addTo(map);
}

// Define the legend control
var legend = L.control({position: 'bottomright'});
//--------------------------------------------
// Function to generate the HTML content of the legend
//We assign a function to the On Add property of our legend instance/variable of control, which we definded above
//Upon adding the legend to the map we call the function, which creates the necessary div HTML elements
//CSS is used in the creation of this legend
legend.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'legend');
    div.style.backgroundColor = 'white'; 
    div.innerHTML += '<h4>Groundwater Sample Quality</h4>';
    div.innerHTML += '<p><span style="color: green;">Good</span></p>';
    div.innerHTML += '<p><span style="color: red;">Questionable</span></p>';
    div.innerHTML += '<p><span style="color: grey;">Provisional</span></p>';
    return div;
};

// Add the legend to the map
legend.addTo(map);

//Calling our getColor function to run based on Quality
function getColor(quality) {
    //The color of our markers will switch based on Quality
    switch (quality) {
        case 'Good':
            return 'green';
        case 'Questionable':
            return 'red';
        case 'Provisional':
            return 'grey';
        case 'Missing':
            return 'transparent';
    }
}


// Initial map update with the first year in the dropdown
//We add an event listener to the document object, which is a part of the HTML Document Object Model
//Once DOMContentLoaded occurs, it means the HTML content had been loaded by the browser
//function is a callback function defined in line, which will execute when DOMContentLoaded occurs
document.addEventListener('DOMContentLoaded', function () {
    //We declare our variable initialYear, which is the value contained in the HTML element with ID 'year-dropdown', using the getElementById method
    var selectedYear = document.getElementById('year-dropdown').value;
    //We then call our updateMaps function and run it with our selectedYear value selected from the drop down
    updateMaps(selectedYear);
});
