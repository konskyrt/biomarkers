import pandas as pd
import numpy as np


# Function to create new task IDs and names with custom floor names
def create_new_task_ids_and_names(task_name, building_floors, start_id):
    if not isinstance(task_name, str):
        return [], start_id
    task_info = []
    for building, floor_names in building_floors.items():
        for floor_name in floor_names:
            new_task_id = start_id
            start_id += 1
            new_task_name = f"{building} - {task_name} - {floor_name}"
            task_info.append((new_task_id, new_task_name, floor_name))
    return task_info, start_id

# Define your tasks to expand and building floors
tasks_to_expand = [
    "Aushub",
    "Rohbau 1",
    "Rohbau 2",
    "Bodenbelag",
    "Fassade",
    "Elektro 1",
    "Elektro 2",
    "Heizung Kälte 1",
    "Heizung Kälte 2",
    "Lüftung 1",
    "Lüftung 2",
    "Sprinkler 1",
    "Sprinkler 2",
    "Sanitär 1",
    "Sanitär 2",
    "Haustechnik",
    "Gipser",
    "Fensterbau",
    "Türen",
    "Möbel",
    "Holzbau",
]
