// Define a mercator projection
const projection = d3.geoMercator()
    .scale(150)  // Adjust the scale to your map size
    .translate([480, 300]);  // Adjust the translate to center your map

// Use the projection in the geoPath generator
const path = d3.geoPath().projection(projection);

// Define zoom behavior
const zoom = d3.zoom()
    .scaleExtent([1, 8])  // Limit zoom-in and zoom-out scale (1x to 8x)
    .on("zoom", zoomed);

// Create the SVG and apply zoom behavior
const svg = d3.select("#map")
    .call(zoom)  // Apply zoom behavior to the SVG
    .append("g");  // Append a group (g) element to hold the map

// Zoom event handler
function zoomed(event) {
    svg.attr("transform", event.transform);  // Apply the zoom and pan transformation to the group
}

// Function to zoom in manually
function zoomIn() {
    d3.select("#map").transition().call(zoom.scaleBy, 1.3);  // Zoom in by 30%
}

// Function to zoom out manually
function zoomOut() {
    d3.select("#map").transition().call(zoom.scaleBy, 1 / 1.3);  // Zoom out by 30%
}

// Attach zoom functionality to buttons
d3.select("#zoom-in").on("click", zoomIn);
d3.select("#zoom-out").on("click", zoomOut);

// Select the tooltip element
const tooltip = d3.select("#tooltip");

// Load and render the map
Promise.all([
    d3.json("updated_custom_geo.json"),  // Load GeoJSON data for the map
    d3.json("reformatted_chlorophyll_data_multiple_points.json")  // Load chlorophyll data
]).then(([geoData, chlorophyllData]) => {
    // Create a lookup table for country data by country name and year
    const dataByCountryYear = {};
    chlorophyllData.forEach(d => {
        const normalizedCountry = normalizeCountryName(d.Country);  // Normalize chlorophyll country name
        if (!dataByCountryYear[normalizedCountry]) {
            dataByCountryYear[normalizedCountry] = {};
        }
        dataByCountryYear[normalizedCountry][d.Year] = d;
    });

    // Get the list of unique years and find the latest year
    let uniqueYears = [...new Set(chlorophyllData.map(d => d.Year))];  // Extract unique years
    uniqueYears.sort((a, b) => b - a);  // Sort years from highest to lowest
    const latestYear = uniqueYears[0];  // Find the latest year

    // Prepare the color scale for Chlorophyll
    const chlorophyllScale = d3.scaleSequential(d3.interpolateViridis)
        .domain(d3.extent(chlorophyllData, d => d.Chlorophyll));

    // Draw the map and add hover events for tooltips
    svg.selectAll("path")
        .data(geoData.features)
        .enter().append("path")
        .attr("d", path)  // Use the path generator with the projection
        .attr("fill", d => {
            const countryName = normalizeCountryName(d.properties.name);
            const countryData = dataByCountryYear[countryName] && dataByCountryYear[countryName][latestYear];
            return countryData ? chlorophyllScale(countryData.Chlorophyll) : "#ccc";  // Default to grey if no data
        })
        .attr("stroke", "#333")
        .attr("class", d => `country-${normalizeCountryName(d.properties.name)}`)  // Assign class based on country name
        .on("mouseover", function (event, d) {
            const countryName = normalizeCountryName(d.properties.name);
            const countryData = dataByCountryYear[countryName] && dataByCountryYear[countryName][latestYear];
            tooltip.transition().duration(200).style("opacity", 1);

            // Check if data exists for the hovered country
            if (countryData) {
                tooltip.html(`
                    <strong>${countryData.Country}</strong><br>
                    Chlorophyll: ${countryData.Chlorophyll}<br>
                    Population: ${countryData.Population_Size}<br>
                    GDP: ${countryData.GDP}
                `)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px");
            } else {
                tooltip.html(`
                    <strong>${countryName}</strong><br>
                    No data available
                `)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px");
            }
        })
        .on("mouseout", function () {
            tooltip.transition().duration(500).style("opacity", 0);
        });

    // Function to update map for different years
    function updateMap(year) {
        svg.selectAll("path")
            .attr("fill", d => {
                const countryName = normalizeCountryName(d.properties.name);
                const countryData = dataByCountryYear[countryName] && dataByCountryYear[countryName][year];
                return countryData ? chlorophyllScale(countryData.Chlorophyll) : "#ccc";  // Default to grey if no data
            });
    }

    // Populate the year dropdown and add event listener
    const yearDropdown = d3.select("#yearDropdown")
        .on("change", function () {
            const selectedYear = +this.value;
            updateMap(selectedYear);  // Update the map when a new year is selected
        });

    // Populate dropdown with the available years
    yearDropdown.selectAll("option")
        .data(uniqueYears)
        .enter()
        .append("option")
        .attr("value", d => d)
        .text(d => d);

    // Set the dropdown to the latest year by default
    yearDropdown.property("value", latestYear);

    // Initialize the map with the latest year
    updateMap(latestYear);

    // Add dropdown for country selection
    const countryDropdown = d3.select("#countryDropdown")
        .on("change", function () {
            const selectedCountry = this.value;
            highlightCountry(selectedCountry);  // Highlight the selected country when picked
        });

    // Populate dropdown with the available countries
    let uniqueCountries = [...new Set(chlorophyllData.map(d => normalizeCountryName(d.Country)))].sort();  // Normalize and sort country names
    countryDropdown.selectAll("option")
        .data(uniqueCountries)
        .enter()
        .append("option")
        .attr("value", d => d)
        .text(d => d);

    // Add an empty default option for country selection
    countryDropdown
        .append("option")
        .attr("value", "")
        .text("Select a Country")
        .attr("selected", "selected");

    // Function to highlight selected country with bold red stroke
    function highlightCountry(country) {
        const normalizedCountry = normalizeCountryName(country);

        // Reset all country strokes to default
        svg.selectAll("path")
            .attr("stroke", "#333")  // Default stroke color
            .attr("stroke-width", 1);  // Default stroke width

        // Highlight the selected country with red stroke and bold width
        const countryElement = svg.select(`.country-${normalizedCountry}`);
        if (!countryElement.empty()) {
            countryElement
                .attr("stroke", "#ff0000")  // Red highlight color
                .attr("stroke-width", 4);  // Thicker stroke for highlighting
        } else {
            console.error(`Country not found: ${country}`);  // Log if the country is not found
        }
    }
});

// Utility function to normalize country names and handle specific mismatches
const countryNameMapping = {
    "united states of america": "united states",
    "russian federation": "russia",
    "south korea": "korea, republic of",
    "north korea": "korea, democratic people's republic of",
    "venezuela": "venezuela (bolivarian republic of)",
    // Add more mappings as needed
};

function normalizeCountryName(name) {
    const normalized = name ? name.toLowerCase().trim() : "";
    return countryNameMapping[normalized] || normalized;
}
