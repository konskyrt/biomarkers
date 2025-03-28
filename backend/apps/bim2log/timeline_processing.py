import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def extract_simplified_task(name):
    if isinstance(name, str):
        parts = name.split(' - ')
        return parts[1] if len(parts) > 1 else name
    return ""

def process_timeline(base_timeline_df, df_tasks):
    base_timeline_df['Simplified_Task'] = base_timeline_df['name'].apply(extract_simplified_task)
    base_timeline_df['Start'] = pd.to_datetime(base_timeline_df['Start'])
    base_timeline_df['End'] = pd.to_datetime(base_timeline_df['End'])
    base_timeline_df['Duration'] = (base_timeline_df['End'] - base_timeline_df['Start']).dt.days
    task_total_durations = base_timeline_df.groupby('Simplified_Task')['Duration'].sum()
    df_tasks['isNew'] = df_tasks['Start'].notna()

    # Corrected line: Use 'name' instead of 'Task'
    df_tasks['Simplified_Task'] = df_tasks['name'].apply(extract_simplified_task)
    task_floor_counts = df_tasks.groupby('Simplified_Task')['floor'].nunique()

    df_tasks['Duration_Per_Floor'] = df_tasks['Simplified_Task'].map(
        lambda x: task_total_durations.get(x, 0) / task_floor_counts.get(x, 1)
        if task_floor_counts.get(x, 1) != 0 else 0
    )

    df_tasks['HasElements'] = df_tasks['Duration_Per_Floor'] > 0

    # Add Building column
    df_tasks['Building'] = df_tasks['name'].apply(lambda x: x.split(' - ')[0] if isinstance(x, str) and ' - ' in x else "")

    if 'HasElements' not in df_tasks.columns:
        raise ValueError(f"Column 'HasElements' not found in df_tasks. Available columns: {df_tasks.columns.tolist()}")

    print("Processed Timeline:")
    df_tasks.head()

    def generate_dates(row, current_start_dates):
        if row['Duration_Per_Floor'] > 0:
            task = row['Simplified_Task']
            duration_per_floor = row['Duration_Per_Floor']

            if task not in current_start_dates:
                start_date = base_timeline_df[base_timeline_df['Simplified_Task'] == task]['Start'].min()
                current_start_dates[task] = start_date if pd.notna(start_date) else datetime(2023, 1, 1)

            start_date = current_start_dates[task]
            end_date = start_date + timedelta(days=duration_per_floor)
            current_start_dates[task] = end_date

            return start_date, end_date
        return None, None

    current_start_dates = {}
    new_dates = df_tasks.apply(
        generate_dates, axis=1, result_type='expand', args=(current_start_dates,)
    )
    df_tasks[['Start', 'End']] = new_dates

    return df_tasks