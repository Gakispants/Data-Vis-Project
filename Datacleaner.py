import pandas as pd

# Load the CSV file
csv_file_path = '/mnt/data/life-expectancy-vs-gdp-per-capita.csv'
data = pd.read_csv(csv_file_path)

# Convert the CSV data to JSON format
json_file_path = '/mnt/data/life_expectancy_vs_gdp.json'
data.to_json(json_file_path, orient='records', lines=True)

json_file_path