from flask import Blueprint, request, jsonify
import pandas as pd
import os
import logging

# Use relative imports for internal modules
from .ifc_reader import process_ifc_to_dataframe
from .data_loader import read_sheet
from .data_transformer import perform_floor_assignment
from .timeline_processing import process_timeline
from .object_task_mapping import map_elements_to_tasks, map_objectid_to_taskguid
from .task_generator import create_new_task_ids_and_names
from .object_dictionary import mappings

bim2log_bp = Blueprint('bim2log', __name__)

@bim2log_bp.route('/process', methods=['POST'])
def process_files():
    logging.basicConfig(level=logging.DEBUG)
    logger = logging.getLogger(__name__)

    # Expect a detail level parameter from the form data. Default to "medium".
    detail_level = request.form.get('detail_level', 'medium')
    logger.info("Detail level requested: %s", detail_level)

    if 'elements' not in request.files or 'timeline' not in request.files:
        return jsonify({'error': 'Both elements and timeline files are required'}), 400

    elements_file = request.files['elements']
    timeline_file = request.files['timeline']

    # Process the elements file
    if elements_file.filename.lower().endswith('.ifc'):
        # Save IFC file temporarily and process to DataFrame
        ifc_temp_path = 'temp_input.ifc'
        elements_file.save(ifc_temp_path)
        combined_df = process_ifc_to_dataframe(ifc_temp_path)
    else:
        # Save Excel file temporarily and read with read_sheet
        elements_excel_path = 'temp_elements.xlsx'
        elements_file.save(elements_excel_path)
        combined_df = read_sheet(elements_excel_path)

    # Save timeline file temporarily as Excel
    timeline_path = 'temp_timeline.xlsx'
    timeline_file.save(timeline_path)

    try:
        if combined_df is None:
            raise ValueError("Failed to process the elements file.")

        # Step 1: Perform floor assignment
        timeline_building_name = "Biel"  # Could be dynamic
        elements_df, metadata, assigned_floors, building_floors = perform_floor_assignment(
            combined_df, timeline_building_name
        )
        elements_df.rename(columns={'Assignedfloor': 'FloorName'}, inplace=True)
        logger.info("Floor assignment completed.")

        # Step 3: Read timeline data
        print("Reading timeline data...")
        timeline_df = pd.read_excel(timeline_path, sheet_name='Timeline')
        print("Timeline data read.")
        logger.debug("Timeline data read. Columns: %s", timeline_df.columns.tolist())
        logger.debug("Timeline sample:\n%s", timeline_df.head().to_string())

        logger.info("Generating new tasks...")
        # Step 4: Generate new tasks based on the requested detail level.
        # For now, if detail_level is "medium", use the following tasks:
        if detail_level == "medium":
            tasks_to_expand = [
                "Aushub", "Rohbau 1", "Rohbau 2", "Bodenbelag", "Fassade",
                "Elektro 1", "Elektro 2", "Heizung Kälte 1", "Heizung Kälte 2",
                "Lüftung 1", "Lüftung 2", "Sprinkler 1", "Sprinkler 2",
                "Sanitär 1", "Sanitär 2", "Haustechnik", "Gipser",
                "Fensterbau", "Türen", "Möbel", "Holzbau"
            ]
        else:
            # For other levels (e.g. 'low' or 'high') you can set different lists.
            # For now, we simply use the medium list as a fallback.
            tasks_to_expand = [
                "Aushub", "Rohbau 1", "Rohbau 2", "Bodenbelag", "Fassade",
                "Elektro 1", "Elektro 2", "Heizung Kälte 1", "Heizung Kälte 2",
                "Lüftung 1", "Lüftung 2", "Sprinkler 1", "Sprinkler 2",
                "Sanitär 1", "Sanitär 2", "Haustechnik", "Gipser",
                "Fensterbau", "Türen", "Möbel", "Holzbau"
            ]
        logger.info("Tasks to expand: %s", tasks_to_expand)

        if 'guid' in timeline_df.columns:
            start_id = timeline_df['guid'].max() + 1
        else:
            start_id = 1

        all_new_tasks = []
        for task in tasks_to_expand:
            task_info, start_id = create_new_task_ids_and_names(task, building_floors, start_id)
            all_new_tasks.extend(task_info)

        new_tasks_df = pd.DataFrame(all_new_tasks, columns=['guid', 'name', 'floor'])
        for col in timeline_df.columns:
            if col not in new_tasks_df.columns:
                new_tasks_df[col] = pd.NA
        timeline_df = pd.concat([timeline_df, new_tasks_df], ignore_index=True)
        logger.info("New tasks added to timeline.")

        logger.debug("Concatenated timeline_df columns: %s", timeline_df.columns.tolist())
        logger.debug("Concatenated sample:\n%s", timeline_df.head().to_string())
        print("New tasks added:")
        timeline_df.head()

        logger.debug("Calling process_timeline...")
        timeline_df = process_timeline(timeline_df, timeline_df)
        logger.debug("process_timeline done. Columns: %s", timeline_df.columns.tolist())
        print("Processed Timeline DataFrame columns:", timeline_df.columns.tolist())
        print("First few rows of timeline_df:\n", timeline_df.head())
        print("Processed Timeline:")
        timeline_df.head()

        print("Processing elements and Timeline:")
        # Step 6: Map elements to tasks and create a validation report
        elements_df = map_elements_to_tasks(elements_df, timeline_df, mappings)
        print("Processed elements and Timeline:")
        elements_df, validation_df = map_objectid_to_taskguid(elements_df, timeline_df, mappings)
        print("Processed objectId and Timeline:")

        # Convert volume column to numeric (it may be a string from IFC processing)
        elements_df['sv/ConvexHullVolume'] = pd.to_numeric(
            elements_df['sv/ConvexHullVolume'], errors='coerce'
        ).fillna(0)
        print("Converted volume to numeric:")

        logger.debug("Starting final aggregation steps...")
        logger.debug(f"elements_df columns: {elements_df.columns.tolist()}")
        logger.debug(f"validation_df columns: {validation_df.columns.tolist()}")
        logger.debug(f"elements_df sample:\n{elements_df.head().to_string()}")
        logger.debug(f"validation_df sample:\n{validation_df.head().to_string()}")

        object_summary = elements_df.groupby(['FloorName', 'associated_task']).agg(
            objectCount=('objectId', 'count'),
            totalVolume=('sv/ConvexHullVolume', 'sum')
        ).reset_index().to_dict(orient='records')

        ending_tasks = elements_df.groupby(['associated_task']).agg(
            objectCount=('objectId', 'count'),
            totalVolume=('sv/ConvexHullVolume', 'sum')
        ).reset_index().to_dict(orient='records')

        validation_summary = validation_df.groupby('Reason').agg(
            count=('ObjectId', 'count')
        ).reset_index().to_dict(orient='records')

        # Build the final schedule.
        # Define the columns that you want to include in the final schedule.
        schedule_columns = ['Start', 'End', 'name', 'Building', 'floor', 'sv/ConvexHullVolume',
                            'Top Elevation (m)', 'Bottom Elevation (m)']
        if all(col in timeline_df.columns for col in schedule_columns):
            final_schedule = timeline_df[schedule_columns].to_dict(orient='records')
        else:
            final_schedule = timeline_df.to_dict(orient='records')

        # Convert any pd.Timestamp values (or NaT) in the final schedule to ISO strings or None.
        def convert_record(rec):
            for key, value in rec.items():
                if isinstance(value, pd.Timestamp):
                    rec[key] = value.isoformat() if not pd.isna(value) else None
                elif pd.isna(value):
                    rec[key] = None
            return rec

        final_schedule = [convert_record(r) for r in final_schedule]

        response = {
            'finalSchedule': final_schedule,
            'objectSummary': object_summary,
            'endingTasks': ending_tasks,
            'validationSummary': validation_summary
        }
        return jsonify(response)
    except Exception as e:
        logger.exception("Processing failed")
        return jsonify({'error': f'Processing failed: {str(e)}'}), 500
    finally:
        # Optionally, remove temporary files here
        pass
