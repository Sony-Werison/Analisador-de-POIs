# **App Name**: Geo Insights

## Core Features:

- File Upload and Parsing: Allows users to upload .xlsx or .csv files containing POI data. Parses the file and displays column headers for mapping.
- Column Mapping: Enables users to map columns from the uploaded file to latitude, longitude, state, and city fields.
- Data Validation: Validates the geographic data, checking for invalid coordinates, exact duplicates and points in close proximity.
- Geographic Consistency Check: Using reverse geocoding as a tool, checks whether the state and city information in the file matches the coordinates.
- Map Visualization: Visualizes the POI data on an interactive map using Leaflet.js, with options to cluster markers.
- Data Export: Allows users to download a report with validation results, problematic coordinates, and full data in .xlsx format.
- Geocoding: Allows users to upload files containing addresses and converts these addresses into geographic coordinates (latitude and longitude), appending the new coordinates as columns in a downloadable file.

## Style Guidelines:

- Primary color: Strong blue (#3B82F6) to convey trust and accuracy.
- Background color: Light gray (#F9FAFB) for a clean and modern look.
- Accent color: Muted purple (#8B5CF6) as a secondary brand color to provide a modern touch without clashing with the blue.
- Body and headline font: 'Inter' (sans-serif) for a clear, modern, and readable interface.
- Simple, geometric icons from a library like FontAwesome or Material Icons.
- Use a responsive, grid-based layout to adapt to different screen sizes.
- Subtle transitions and animations (e.g., fading, sliding) to enhance user experience.