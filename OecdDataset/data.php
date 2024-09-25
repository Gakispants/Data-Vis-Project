<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Load and filter the CSV data
if (isset($_GET['countries']) && isset($_GET['sex'])) {
    $countries = explode(',', $_GET['countries']);
    $sex = $_GET['sex'];
    
    $file = fopen('cleaned_life_expectancy_data.csv', 'r');
    $data = [];
    
    // Skip the header row
    fgetcsv($file);

    // Read CSV and filter
    while (($row = fgetcsv($file, 1000, ",")) !== FALSE) {
        if (in_array($row[0], $countries) && $row[1] == $sex) {
            $data[] = ['Country' => $row[0], 'Year' => $row[2], 'Value' => $row[3]];
        }
    }
    fclose($file);
    
    // Return filtered data as JSON
    echo json_encode($data);
} else if (isset($_GET['getCountries'])) {
    // Get the list of unique countries from the CSV
    $file = fopen('cleaned_life_expectancy_data.csv', 'r');
    $countries = [];

    // Skip the header row
    fgetcsv($file);

    // Read CSV and collect unique country names
    while (($row = fgetcsv($file, 1000, ",")) !== FALSE) {
        if (!in_array($row[0], $countries)) {
            $countries[] = $row[0];
        }
    }
    fclose($file);

    // Return the list of countries as JSON
    echo json_encode($countries);
}
?>
