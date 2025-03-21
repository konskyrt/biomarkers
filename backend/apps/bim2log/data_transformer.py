import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
import logging

def perform_floor_assignment(df, timeline_building_name):
    """
    Assign floors to objects in the DataFrame using a hybrid approach.
    """
    logger = logging.getLogger(__name__)
    logger.debug("Starting floor assignment...")
    
    # Check if the DataFrame is empty
    if df.empty:
        logger.error("Input DataFrame is empty")
        return df, {'Building': timeline_building_name, 'floors': []}, pd.Series(), {timeline_building_name: []}
    
    # Create a safe copy and add Z_coord
    df_copy = df.copy()
    
    # Check for required columns
    required_columns = ['sv/Centroid/Z']
    for column in required_columns:
        if column not in df_copy.columns:
            logger.error(f"Required column '{column}' not found in DataFrame. Available columns: {df_copy.columns.tolist()}")
            return df_copy, {'Building': timeline_building_name, 'floors': []}, pd.Series(), {timeline_building_name: []}

    # Add Z_coord safely
    df_copy['Z_coord'] = df_copy['sv/Centroid/Z']
    
    # Log before dropping NA values
    z_coord_null_count = df_copy['Z_coord'].isna().sum()
    logger.debug(f"Found {z_coord_null_count} null values in Z_coord column")
    
    # Drop rows with missing Z coordinates
    df_copy.dropna(subset=['Z_coord'], inplace=True)
    
    # Check if DataFrame is now empty
    if df_copy.empty:
        logger.error("DataFrame is empty after dropping rows with missing Z coordinates")
        return df_copy, {'Building': timeline_building_name, 'floors': []}, pd.Series(), {timeline_building_name: []}
    
    # Check for elevation columns
    elevation_columns = ['Bottom Elevation (m)', 'Top Elevation (m)']
    missing_columns = [col for col in elevation_columns if col not in df_copy.columns]
    
    if missing_columns:
        logger.warning(f"Missing elevation columns: {missing_columns}. Creating default values.")
        for col in missing_columns:
            if col == 'Bottom Elevation (m)':
                df_copy[col] = df_copy['Z_coord'] - 0.5  # Default bottom 0.5m below centroid
            elif col == 'Top Elevation (m)':
                df_copy[col] = df_copy['Z_coord'] + 0.5  # Default top 0.5m above centroid
    
    # Check if 'floor' column exists and has valid data
    if 'floor' in df_copy.columns and not df_copy['floor'].isna().all():
        logger.debug("Using existing floor column data")
        
        try:
            # Create floor ranges safely
            floor_ranges = df_copy.groupby('floor').agg(
                min_bottom=('Bottom Elevation (m)', 'min'),
                max_top=('Top Elevation (m)', 'max')
            ).reset_index()
            
            logger.debug(f"Floor ranges created with {len(floor_ranges)} floors")
            
            # Create floor height ranges
            floor_height_ranges = {
                row['floor']: (row['min_bottom'], row['max_top'])
                for _, row in floor_ranges.iterrows()
            }
            
            # Define floor assignment function with added safety
            def assign_floor(row):
                z_coord = row['Z_coord']
                if pd.isna(z_coord):
                    return 'Unknown'
                    
                floor = row.get('floor')
                if pd.isna(floor) or floor not in floor_height_ranges:
                    # Try to find matching floor
                    for f, (min_b, max_t) in floor_height_ranges.items():
                        if min_b <= z_coord <= max_t:
                            return f
                    return 'Unknown'
                else:
                    min_b, max_t = floor_height_ranges[floor]
                    if min_b <= z_coord <= max_t:
                        return floor
                    else:
                        # Check other floors
                        for f, (min_b, max_t) in floor_height_ranges.items():
                            if min_b <= z_coord <= max_t:
                                return f
                        return 'Unknown'
            
            # Apply floor assignment with progress logging
            logger.debug("Assigning floors based on height ranges...")
            df_copy['Assignedfloor'] = df_copy.apply(assign_floor, axis=1)
            unknown_count = (df_copy['Assignedfloor'] == 'Unknown').sum()
            logger.debug(f"Floor assignment complete. {unknown_count} items marked as 'Unknown'")
            
            # Rename to consistent name
            df_copy.rename(columns={'Assignedfloor': 'FloorName'}, inplace=True)
            
            # Create floor heights table safely
            floor_heights_table = floor_ranges.rename(columns={
                'floor': 'floorName',
                'min_bottom': 'MinHeight (m)',
                'max_top': 'MaxHeight (m)'
            })
            print("Floor Heights Table:")
            print(floor_heights_table.to_string(index=False))
            
        except Exception as e:
            logger.error(f"Error during floor assignment using floor column: {str(e)}")
            logger.debug("Falling back to clustering method")
            # Fall back to clustering approach
            return _perform_clustering_assignment(df_copy, timeline_building_name)
    else:
        logger.debug("Floor data missing or unreliable. Using clustering for floor assignment.")
        return _perform_clustering_assignment(df_copy, timeline_building_name)
    
    # Add building name
    df_copy['Building'] = timeline_building_name
    
    try:
        # Sort floors safely
        if 'MinHeight (m)' in floor_heights_table.columns and not floor_heights_table.empty:
            floor_heights_table = floor_heights_table.sort_values(by='MinHeight (m)')
            sorted_floors = floor_heights_table['floorName'].tolist()
        else:
            logger.warning("Cannot sort floors, using unsorted floor list")
            sorted_floors = df_copy['FloorName'].dropna().unique().tolist()
    except Exception as e:
        logger.error(f"Error sorting floors: {str(e)}")
        sorted_floors = df_copy['FloorName'].dropna().unique().tolist()
    
    # Create metadata and return values
    metadata = {
        'Building': timeline_building_name,
        'floors': sorted_floors
    }
    
    building_floors = {timeline_building_name: sorted_floors}
    logger.debug(f"Floor assignment complete. Found {len(sorted_floors)} floors.")
    
    return df_copy, metadata, df_copy['FloorName'], building_floors

def _perform_clustering_assignment(df_copy, timeline_building_name):
    """Helper function to perform clustering-based floor assignment"""
    logger = logging.getLogger(__name__)
    
    try:
        # Use a default number of floors or try to estimate it
        num_floors = min(5, max(2, len(df_copy) // 100))
        logger.debug(f"Using K-means clustering with {num_floors} clusters")
        
        # Reshape data for K-means
        z_values = df_copy[['Z_coord']].values
        
        # K-means clustering to identify floors
        kmeans = KMeans(n_clusters=num_floors, random_state=0, n_init=10)
        df_copy['floorCluster'] = kmeans.fit_predict(z_values)
        
        # Get floor mapping based on height
        cluster_centers = kmeans.cluster_centers_.flatten()
        sorted_clusters = np.argsort(cluster_centers)
        floor_mapping = {cluster: f'Floor_{i+1}' for i, cluster in enumerate(sorted_clusters)}
        
        # Map cluster to floor names
        df_copy['Assignedfloor'] = df_copy['floorCluster'].map(floor_mapping)
        df_copy.rename(columns={'Assignedfloor': 'FloorName'}, inplace=True)
        
        # Create floor heights table
        if 'Bottom Elevation (m)' in df_copy.columns and 'Top Elevation (m)' in df_copy.columns:
            floor_ranges = df_copy.groupby('FloorName').agg(
                min_bottom=('Bottom Elevation (m)', 'min'),
                max_top=('Top Elevation (m)', 'max')
            ).reset_index()
            
            floor_heights_table = floor_ranges.rename(columns={
                'FloorName': 'floorName',
                'min_bottom': 'MinHeight (m)',
                'max_top': 'MaxHeight (m)'
            })
            print("Floor Heights Table (from clustering):")
            print(floor_heights_table.to_string(index=False))
        else:
            logger.warning("Cannot create floor heights table: missing elevation columns")
            floor_heights_table = pd.DataFrame({
                'floorName': df_copy['FloorName'].unique(),
                'MinHeight (m)': np.nan,
                'MaxHeight (m)': np.nan
            })
        
        # Add building and sort floors
        df_copy['Building'] = timeline_building_name
        sorted_floors = df_copy['FloorName'].dropna().unique().tolist()
        
        # Create metadata
        metadata = {'Building': timeline_building_name, 'floors': sorted_floors}
        building_floors = {timeline_building_name: sorted_floors}
        
        return df_copy, metadata, df_copy['FloorName'], building_floors
        
    except Exception as e:
        logger.error(f"Error in clustering assignment: {str(e)}")
        # Create a minimal valid return in case of error
        df_copy['FloorName'] = 'Default'
        df_copy['Building'] = timeline_building_name
        return df_copy, {'Building': timeline_building_name, 'floors': ['Default']}, df_copy['FloorName'], {timeline_building_name: ['Default']}