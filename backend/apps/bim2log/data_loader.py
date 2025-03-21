import pandas as pd
from concurrent.futures import ThreadPoolExecutor
import os

# Required columns to filter the data
required_columns = [
    'sv/Centroid/X',
    'sv/Centroid/Y',
    'sv/Centroid/Z',
    'sv/Centroid/W',
    'Building',
    'Floor',
    'sourceUri',
    'ifc/Type',
    'objectId',
    'parentObjectId',
    'name',
    'workspaceId',
    'sv/ConvexHullVolume',
    'Top Elevation (m)',
    'Bottom Elevation (m)'
]

def read_sheet(file_path, sheet_name=None):
    """
    Read an Excel file dynamically: either a single sheet or merge sheets starting with 'Attributes'.
    
    Args:
        file_path (str): Path to the Excel file.
        sheet_name (str, optional): Specific sheet to read. If None, process based on sheet count and names.
    
    Returns:
        pd.DataFrame: The resulting DataFrame, or None if an error occurs.
    """
    output_csv_path = 'filtered_combined_data.csv'
    
    # Check for cached result if no specific sheet is requested
    if sheet_name is None and os.path.exists(output_csv_path):
        print(f"Loading cached DataFrame from '{output_csv_path}'.")
        return pd.read_csv(output_csv_path)
    
    try:
        # Open the Excel file
        excel_file = pd.ExcelFile(file_path)
        sheet_names = excel_file.sheet_names
        
        # If a specific sheet_name is provided, read only that sheet
        if sheet_name:
            df = pd.read_excel(
                file_path,
                sheet_name=sheet_name,
                usecols=lambda x: x in required_columns,
                engine='openpyxl'
            )
            df = df.reset_index().rename(columns={'index': 'row_index'})
            print(f"Loaded sheet '{sheet_name}' with columns: {df.columns.tolist()}")
            return df
        
        # Case 1: Only one sheet exists
        if len(sheet_names) == 1:
            df = pd.read_excel(
                file_path,
                sheet_name=sheet_names[0],
                usecols=lambda x: x in required_columns,
                engine='openpyxl'
            )
            df = df.reset_index().rename(columns={'index': 'row_index'})
            print(f"Loaded single sheet '{sheet_names[0]}' with shape: {df.shape}")
            return df
        
        # Case 2: Multiple sheets, select those starting with 'Attributes'
        attribute_sheets = [s for s in sheet_names if s.startswith('Attributes')]
        if not attribute_sheets:
            raise ValueError("No sheets starting with 'Attributes' found in a multi-sheet file.")
        
        # Read all 'Attributes' sheets concurrently
        dfs = []
        with ThreadPoolExecutor() as executor:
            results = list(executor.map(
                lambda s: pd.read_excel(
                    file_path,
                    sheet_name=s,
                    usecols=lambda x: x in required_columns,
                    engine='openpyxl'
                ),
                attribute_sheets
            ))
        dfs = [df.reset_index().rename(columns={'index': 'row_index'}) for df in results if df is not None]
        
        # Concatenate the DataFrames if there are multiple, or use the single one
        if len(dfs) > 1:
            combined_df = pd.concat(dfs, ignore_index=True)
            print(f"Combined {len(dfs)} 'Attributes' sheets into DataFrame with shape: {combined_df.shape}")
        elif len(dfs) == 1:
            combined_df = dfs[0]
            print(f"Loaded single 'Attributes' sheet with shape: {combined_df.shape}")
        else:
            raise ValueError("No valid 'Attributes' sheets could be processed.")
        
        # Optional: Save to CSV for caching (comment out if not needed)
        combined_df.head()
        # print(f"Saved combined DataFrame to '{output_csv_path}'.")
        
        return combined_df
    
    except Exception as e:
        print(f"Error processing file '{file_path}': {e}")
        return None