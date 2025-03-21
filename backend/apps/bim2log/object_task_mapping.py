import pandas as pd
from functools import reduce
from .task_generator import create_new_task_ids_and_names

def classify_element_based_on_sourceuri(source_uri, mappings, name=None):
    # if 'GAS' in source_uri or 'KAN' in source_uri or 'WKL' in source_uri:
    #     return mappings['sanitar']
    # elif 'F03' in source_uri:
    #     return mappings['fassade']
    # elif 'F45' in source_uri:
    #     return mappings['spr']
    # elif 'F20' in source_uri:
    #     return mappings['hek']
    # elif 'SZH' in source_uri:
    #     return mappings['szh']
    # elif 'F40' in source_uri:
    #     return mappings['sanitar']
    # elif 'F50' in source_uri:
    #     return mappings['electro']
    # elif 'F30' in source_uri or 'EBK' in source_uri:
    #     return mappings['luftung']
    # elif 'BST' in source_uri or 'TWM' in source_uri:
    #     return mappings['fnd']
    # else:
        return mappings

def map_elements_to_tasks(df_elements, df_tasks, mappings):
    # Initialize the associated_task column
    df_elements['associated_task'] = None
    
    # Filter tasks where HasElements is True
    new_tasks = df_tasks[df_tasks['HasElements'] == True]
    
    for index, element in df_elements.iterrows():
        source_uri = str(element.get('sourceUri', ''))
        element_name = str(element.get('name', ''))
        
        # Get the appropriate mapping dictionary
        mapping_dict = classify_element_based_on_sourceuri(source_uri, mappings, element_name)
        
        # Check if ifc/Type is valid
        if pd.notna(element['ifc/Type']) and isinstance(element['ifc/Type'], str):
            element_type = element['ifc/Type'].lower()
            task_category = mapping_dict.get(element_type, None)
            
            if task_category:
                # Find tasks matching both task_category and floor
                matching_tasks = new_tasks[
                    (new_tasks['name'].str.contains(task_category, case=False)) &
                    (new_tasks['floor'] == element['FloorName'])
                ]
                if not matching_tasks.empty:
                    # Use 'name' instead of 'Task'
                    df_elements.at[index, 'associated_task'] = matching_tasks.iloc[0]['name']
    
    return df_elements

def map_objectid_to_taskguid(df_elements, df_tasks, task_ifc_mapping):
    if 'TaskGuid' not in df_elements.columns:
        df_elements['TaskGuid'] = None

    validation_report = []
    unique_ifc_types = df_elements['ifc/Type'].dropna().unique()
    print("Unique ifc/Types found in df_elements:", unique_ifc_types)

    unique_ifc_types_from_df = set(df_elements['ifc/Type'].dropna().str.lower())
    # all_mapped_types = set(reduce(lambda acc, d: acc | set(d.keys()), task_ifc_mapping.values(), set()))
    # unmapped_ifc_types = unique_ifc_types_from_df - all_mapped_types
    # print("ifc/Types not found in the mapping dictionaries:", unmapped_ifc_types)

    for index, element in df_elements.iterrows():
        associated_task = element['associated_task']
        matching_tasks = df_tasks[
            (df_tasks['name'] == associated_task) &
            (df_tasks['floor'] == element['FloorName'])
        ]

        task_guid = None
        if not matching_tasks.empty:
            task_guid = matching_tasks.iloc[0]['guid']
            df_elements.at[index, 'TaskGuid'] = task_guid

        validation_report.append({
            'ObjectId': element['objectId'],
            'Success': bool(task_guid),
            'TaskGuid': task_guid,
            'Reason': 'Match found' if task_guid else 'No matching task found'
        })

    validation_df = pd.DataFrame(validation_report)
    return df_elements, validation_df
