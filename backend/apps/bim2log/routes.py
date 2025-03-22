from flask import Blueprint, request, jsonify, Response
from flask_cors import CORS
import pandas as pd
import os
import logging
import tempfile
import json

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

    detail_level = request.form.get('detail_level', 'medium')
    logger.info("Detail level requested: %s", detail_level)

    if 'elements' not in request.files or 'timeline' not in request.files:
        return jsonify({'error': 'Both elements and timeline files are required'}), 400

    elements_file = request.files['elements']
    timeline_file = request.files['timeline']

    # Use temporary files
    temp_dir = tempfile.gettempdir()
    ifc_temp_path = os.path.join(temp_dir, 'temp_input.ifc')
    elements_excel_path = os.path.join(temp_dir, 'temp_elements.xlsx')
    timeline_path = os.path.join(temp_dir, 'temp_timeline.xlsx')

    def generate():
        # Initial status message
        yield f"data: {json.dumps({'type': 'status', 'message': 'Starting processing...'})}\n\n"

        try:    
            # Process elements file
            if elements_file.filename.lower().endswith('.ifc'):
                elements_file.save(ifc_temp_path)
                combined_df = process_ifc_to_dataframe(ifc_temp_path)
            else:
                elements_file.save(elements_excel_path)
                combined_df = read_sheet(elements_excel_path)
            yield f"data: {json.dumps({'type': 'status', 'message': 'Elements file processed.'})}\n\n"

            # Save and read timeline file
            timeline_file.save(timeline_path)
            timeline_df = pd.read_excel(timeline_path, sheet_name='Timeline')
            yield f"data: {json.dumps({'type': 'status', 'message': 'Timeline file read.'})}\n\n"

            if combined_df is None:
                raise ValueError("Failed to process the elements file.")

            # Step 1: Perform floor assignment
            timeline_building_name = "Biel"  # Could be dynamic
            elements_df, metadata, assigned_floors, building_floors = perform_floor_assignment(
                combined_df, timeline_building_name
            )
            elements_df.rename(columns={'Assignedfloor': 'FloorName'}, inplace=True)
            logger.info("Floor assignment completed.")
            yield f"data: {json.dumps({'type': 'status', 'message': 'Floor assignment completed.'})}\n\n"

            # Step 3: Timeline data already read above; log sample details
            logger.debug("Timeline data read. Columns: %s", timeline_df.columns.tolist())
            logger.debug("Timeline sample:\n%s", timeline_df.head().to_string())

            # Step 4: Generate new tasks based on the requested detail level.
            logger.info("Generating new tasks...")
            if detail_level == "medium":
                tasks_to_expand = [
                    "Aushub", "Rohbau 1", "Rohbau 2", "Bodenbelag", "Fassade",
                    "Elektro 1", "Elektro 2", "Heizung Kälte 1", "Heizung Kälte 2",
                    "Lüftung 1", "Lüftung 2", "Sprinkler 1", "Sprinkler 2",
                    "Sanitär 1", "Sanitär 2", "Haustechnik", "Gipser",
                    "Fensterbau", "Türen", "Möbel", "Holzbau"
                ]
            else:
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
            yield f"data: {json.dumps({'type': 'status', 'message': 'New tasks generated and added to timeline.'})}\n\n"

            # Process timeline
            logger.debug("Calling process_timeline...")
            timeline_df = process_timeline(timeline_df, timeline_df)
            logger.debug("process_timeline done. Columns: %s", timeline_df.columns.tolist())
            yield f"data: {json.dumps({'type': 'status', 'message': 'Timeline processed.'})}\n\n"

            # Step 6: Map elements to tasks and create validation report
            elements_df = map_elements_to_tasks(elements_df, timeline_df, mappings)
            elements_df, validation_df = map_objectid_to_taskguid(elements_df, timeline_df, mappings)
            yield f"data: {json.dumps({'type': 'status', 'message': 'Elements mapped to tasks.'})}\n\n"

            # Convert volume column to numeric
            elements_df['sv/ConvexHullVolume'] = pd.to_numeric(
                elements_df['sv/ConvexHullVolume'], errors='coerce'
            ).fillna(0)

            # Final aggregation steps
            logger.debug("Starting final aggregation steps...")
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
            schedule_columns = ['Start', 'End', 'name', 'Building', 'floor', 'sv/ConvexHullVolume',
                                'Top Elevation (m)', 'Bottom Elevation (m)']
            if all(col in timeline_df.columns for col in schedule_columns):
                final_schedule = timeline_df[schedule_columns].to_dict(orient='records')
            else:
                final_schedule = timeline_df.to_dict(orient='records')

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
            yield f"data: {json.dumps({'type': 'result', 'data': response})}\n\n"

        except Exception as e:
            logger.exception("Processing failed")
            yield f"data: {json.dumps({'type': 'error', 'message': f'Processing failed: {str(e)}'})}\n\n"

        finally:
            for path in [ifc_temp_path, elements_excel_path, timeline_path]:
                try:
                    if os.path.exists(path):
                        os.remove(path)
                except Exception as e:
                    logger.error(f"Cleanup failed: {str(e)}")


    # Return the streaming response
    return Response(
    generate(),
    mimetype='text/event-stream',
    headers={
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    }
)