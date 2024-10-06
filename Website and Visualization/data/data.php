<?php
// File path to the CSV file
$csvFile = 'cleaned_life_expectancy_vs_gdp.csv';

// Function to read the CSV file and convert it to an associative array
function csvToAssocArray($filename) {
    $rows = array();
    if (($handle = fopen($filename, "r")) !== FALSE) {
        $header = fgetcsv($handle, 1000, ",");
        while (($data = fgetcsv($handle, 1000, ",")) !== FALSE) {
            $rows[] = array_combine($header, $data);
        }
        fclose($handle);
    }
    return $rows;
}

// Load the dataset
$data = csvToAssocArray($csvFile);

// Clean the data and cast types appropriately
$cleaned_data = array_map(function($row) {
    return array(
        'Country' => $row['Country'],
        'Year' => (int) $row['Year'],
        'GDPPerCapita' => (float) $row['GDP_per_capita'],
        'LifeExpectancy' => (float) $row['Life_expectancy'],
        'Population' => (int) $row['Population'],
        'Continent' => isset($row['Continent']) ? $row['Continent'] : ''
    );
}, $data);

// Return the cleaned data as JSON
header('Content-Type: application/json');
echo json_encode($cleaned_data, JSON_PRETTY_PRINT);
?>
