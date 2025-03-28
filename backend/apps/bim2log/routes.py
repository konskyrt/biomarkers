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
    # Reject non-SSE clients first
    if 'text/event-stream' not in request.accept_mimetypes:
        return jsonify(error="This endpoint only accepts SSE clients"), 406

    logging.basicConfig(level=logging.DEBUG)
    logger = logging.getLogger(__name__)

    detail_level = request.form.get('detail_level', 'medium')
    logger.info("Detail level requested: %s", detail_level)

    if 'elements' not in request.files or 'timeline' not in request.files:
        return jsonify({'error': 'Both elements and timeline files are required'}), 400

    # Retrieve files from request
    elements_file = request.files['elements']
    timeline_file = request.files['timeline']
    
    # Read file contents immediately in the request context
    elements_filename = elements_file.filename
    elements_file_content = elements_file.read()
    timeline_file_content = timeline_file.read()

    # Use a fixed temp directory if TMPDIR is set, otherwise use system temp
    temp_dir = os.environ.get('TMPDIR', tempfile.gettempdir())
    logger.info(f"Using temp directory: {temp_dir}")
    
    # Ensure the temp directory exists
    os.makedirs(temp_dir, exist_ok=True)
    
    ifc_temp_path = os.path.join(temp_dir, 'temp_input.ifc')
    elements_excel_path = os.path.join(temp_dir, 'temp_elements.xlsx')
    timeline_path = os.path.join(temp_dir, 'temp_timeline.xlsx')

    def generate():
        # Initial status message
        yield f"data: {json.dumps({'type': 'status', 'message': 'Starting processing...'})}\n\n"

        try:    
            # Process elements file - using content already read from the request
            if elements_filename.lower().endswith('.ifc'):
                # Write the file content that was already read
                with open(ifc_temp_path, 'wb') as f:
                    f.write(elements_file_content)
                combined_df = process_ifc_to_dataframe(ifc_temp_path)
            else:
                # Write the file content that was already read
                with open(elements_excel_path, 'wb') as f:
                    f.write(elements_file_content)
                combined_df = read_sheet(elements_excel_path)
            yield f"data: {json.dumps({'type': 'status', 'message': 'Elements file processed.'})}\n\n"

            # Save and read timeline file with proper file handling
            with open(timeline_path, 'wb') as f:
                f.write(timeline_file_content)
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
            yield f"data: {json.dumps({'type': 'status', 'message': 'Starting final data aggregation...'})}\n\n"
            
            # Optimize aggregations by using copy to defragment
            elements_df = elements_df.copy()
            
            # Use more efficient approach for groupby operations
            logger.debug("Aggregating object summary...")
            yield f"data: {json.dumps({'type': 'status', 'message': 'Aggregating object summary...'})}\n\n"
            object_summary = elements_df.groupby(['FloorName', 'associated_task'], observed=True).agg({
                'objectId': 'count',
                'sv/ConvexHullVolume': 'sum'
            }).reset_index().rename(columns={
                'objectId': 'objectCount',
                'sv/ConvexHullVolume': 'totalVolume'
            }).to_dict(orient='records')

            logger.debug("Aggregating ending tasks...")
            yield f"data: {json.dumps({'type': 'status', 'message': 'Aggregating task data...'})}\n\n"
            ending_tasks = elements_df.groupby(['associated_task'], observed=True).agg({
                'objectId': 'count',
                'sv/ConvexHullVolume': 'sum'
            }).reset_index().rename(columns={
                'objectId': 'objectCount',
                'sv/ConvexHullVolume': 'totalVolume'
            }).to_dict(orient='records')

            logger.debug("Aggregating validation summary...")
            yield f"data: {json.dumps({'type': 'status', 'message': 'Preparing validation summary...'})}\n\n"
            validation_summary = validation_df.groupby('Reason', observed=True).agg({
                'ObjectId': 'count'
            }).reset_index().to_dict(orient='records')

            # Build the final schedule.
            logger.debug("Building final schedule...")
            yield f"data: {json.dumps({'type': 'status', 'message': 'Building final schedule...'})}\n\n"
            schedule_columns = ['Start', 'End', 'name', 'Building', 'floor', 'sv/ConvexHullVolume',
                                'Top Elevation (m)', 'Bottom Elevation (m)']
            
            # Optimize by only selecting necessary columns and avoiding full dict conversion of large dataframe
            if all(col in timeline_df.columns for col in schedule_columns):
                # Only select necessary columns to reduce memory usage
                final_schedule_df = timeline_df[schedule_columns].copy()
            else:
                final_schedule_df = timeline_df.copy()
                
            # Efficient way to handle timestamp conversion
            for col in final_schedule_df.select_dtypes(include=['datetime64']):
                final_schedule_df[col] = final_schedule_df[col].apply(
                    lambda x: x.isoformat() if pd.notna(x) else None
                )
            
            # Replace NaN values with None for JSON serialization
            final_schedule_df = final_schedule_df.where(pd.notna(final_schedule_df), None)
            final_schedule = final_schedule_df.to_dict(orient='records')

            logger.debug("Creating final response...")
            yield f"data: {json.dumps({'type': 'status', 'message': 'Finalizing results...'})}\n\n"
            
            # Log unique IFC types for debugging
            ifc_types = elements_df['ifc/Type'].unique()
            logger.info(f"Unique ifc/Types found: {ifc_types.tolist()}")
            yield f"data: {json.dumps({'type': 'status', 'message': 'Preparing response data...'})}\n\n"
            
            # Convert the results dictionary to json
            result = {
                'objectSummary': object_summary,
                'endingTasks': ending_tasks,
                'validationSummary': validation_summary
            }
            
            # Log the structure of the result
            logger.info("Result structure:")
            logger.info(f"- Object Summary: {len(object_summary)} items")
            logger.info(f"- Ending Tasks: {len(ending_tasks)} items")
            logger.info(f"- Validation Summary: {len(validation_summary)} items")
            
            # Make sure we're sending data in the expected format by the frontend
            final_result = {
                'type': 'result',
                'data': result
            }
            
            result_json = json.dumps(final_result)
            logger.info(f"Response size: {len(result_json)} bytes")
            
            # Break the result into chunks if it's very large (> 1MB)
            if len(result_json) > 1024 * 1024:
                logger.info(f"Response is large ({len(result_json)} bytes), sending in chunks")
                chunk_size = 500 * 1024  # 500KB chunks
                for i in range(0, len(result_json), chunk_size):
                    chunk = result_json[i:i + chunk_size]
                    if i == 0:
                        logger.info(f"Sending chunk start marker")
                        yield f"data: {json.dumps({'type': 'result_start', 'message': 'Starting large result transfer'})}\n\n"
                    logger.info(f"Sending chunk {i//chunk_size + 1} of {(len(result_json) + chunk_size - 1)//chunk_size}, size: {len(chunk)} bytes")
                    yield f"data: {chunk}\n\n"
                logger.info(f"Sending chunk end marker")
                yield f"data: {json.dumps({'type': 'result_end', 'message': 'Result transfer complete'})}\n\n"
            else:
                logger.info(f"Sending normal response of size {len(result_json)} bytes")
                yield f"data: {result_json}\n\n"
            
            logger.info("Processing completed successfully")
            yield f"data: {json.dumps({'type': 'status', 'message': 'Processing completed successfully'})}\n\n"

        except Exception as e:
            logger.exception(f"Processing failed: {str(e)}")
            yield f"data: {json.dumps({'type': 'error', 'message': f'Processing failed: {str(e)}'})}\n\n"

        finally:
            # Always send a completion message, even if there was an error
            yield f"data: {json.dumps({'type': 'complete', 'message': 'Stream closed'})}\n\n"
            
            # Clean up temporary files
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