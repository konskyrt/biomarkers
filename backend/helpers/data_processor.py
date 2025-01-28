import pandas as pd

print("data_processor.py loaded")


def process_excel_file(file_path):
    """Processes an Excel file and returns aggregated data."""
    try:
        excel_data = pd.ExcelFile(file_path)
        sheet_data = {}
        
        # Process all sheets
        for sheet_name in excel_data.sheet_names:
            sheet_df = excel_data.parse(sheet_name)
            aggregated_data = aggregate_data(sheet_df)
            sheet_data[sheet_name] = aggregated_data

        return {"status": "success", "data": sheet_data}
    except Exception as e:
        return {"status": "error", "message": str(e)}

def aggregate_data(df):
    """Aggregates data based on EBKP and FloorName."""
    if 'EBKP' not in df or 'FloorName' not in df:
        return {"error": "Required columns (EBKP, FloorName) are missing."}

    floors = df['FloorName'].unique()
    ebkp_categories = df['EBKP'].unique()

    result = []
    for ebkp in ebkp_categories:
        row = {"EBKP": ebkp}
        for floor in floors:
            floor_data = df[(df['EBKP'] == ebkp) & (df['FloorName'] == floor)]
            row[floor] = floor_data['Volume (m3)'].sum() if 'Volume (m3)' in df else len(floor_data)
        result.append(row)
    
    return result
