import ifcopenshell
import ifcopenshell.geom
import numpy as np
import pandas as pd
from ifcopenshell.util.shape import (
    get_volume,
    get_area,
    get_top_elevation,
    get_bottom_elevation,
)
import os

def process_ifc_to_dataframe(ifc_path: str) -> pd.DataFrame:
    """
    Processes an IFC file and returns the extracted element data as a pandas DataFrame.
    
    Parameters:
        ifc_path (str): The path to the IFC file.
    
    Returns:
        pd.DataFrame: The DataFrame containing the extracted data.
    """
    file_name = os.path.basename(ifc_path)

    # Load the IFC model
    model = ifcopenshell.open(ifc_path)
    settings = ifcopenshell.geom.settings()
    settings.set(settings.USE_WORLD_COORDS, True)

    # Helper function to get materials
    def get_material(element):
        try:
            materials = element.IsDefinedBy
            if materials:
                for rel in materials:
                    if hasattr(rel, "RelatingMaterial"):
                        material = rel.RelatingMaterial
                        if hasattr(material, "Name"):
                            return material.Name
                        elif hasattr(material, "Materials"):  # Composite materials
                            return ", ".join([m.Name for m in material.Materials])
            return "No material assigned"
        except Exception as e:
            return f"Error retrieving material: {e}"

    # Helper function to get floor and building names
    def get_floor_and_building(element):
        floor_name = None
        building_name = None
        if hasattr(element, "ContainedInStructure"):
            for rel in element.ContainedInStructure:
                if rel.is_a("IfcRelContainedInSpatialStructure"):
                    spatial = rel.RelatingStructure
                    if spatial.is_a("IfcBuildingStorey"):
                        floor_name = spatial.Name
                        if hasattr(spatial, "Decomposes"):
                            for rel2 in spatial.Decomposes:
                                if rel2.is_a("IfcRelAggregates"):
                                    building = rel2.RelatingObject
                                    if building.is_a("IfcBuilding"):
                                        building_name = building.Name
        return floor_name, building_name

    # Utility functions for additional attributes
    def get_all_instance_data(ifc_instance):
        pset_dict = {}
        for x in get_related_property_sets(ifc_instance):
            pset_dict.update(get_property_single_value(x))
        for x in get_related_quantities(ifc_instance):
            pset_dict.update(get_quantity_single_value(x))
        for x in get_related_type_definition(ifc_instance):
            pset_dict.update(get_type_single_value(x))
        return pset_dict

    def get_related_property_sets(ifc_instance):
        properties_list = []
        for x in ifc_instance.IsDefinedBy:
            if x.is_a("IfcRelDefinesByProperties"):
                if x.RelatingPropertyDefinition.is_a("IfcPropertySet"):
                    properties_list.append(x.RelatingPropertyDefinition)
        return properties_list

    def get_related_quantities(ifc_instance):
        quantities_list = []
        for x in ifc_instance.IsDefinedBy:
            if x.is_a("IfcRelDefinesByProperties"):
                if x.RelatingPropertyDefinition.is_a("IfcElementQuantity"):
                    quantities_list.append(x.RelatingPropertyDefinition)
        return quantities_list

    def get_property_single_value(x):
        attributes_dicts = {}
        for y in x.HasProperties:
            if y.is_a("IfcPropertySingleValue") and y.NominalValue is not None:
                attributes_dicts.update({y.Name: y.NominalValue.wrappedValue})
            if y.is_a("IfcComplexProperty"):
                for z in y.HasProperties:
                    if z.NominalValue is not None:
                        attributes_dicts.update({z.Name: z.NominalValue.wrappedValue})
        return attributes_dicts

    def get_quantity_single_value(x):
        quantities_dicts = {}
        for y in x.Quantities:
            if y.is_a('IfcQuantityArea'):
                quantities_dicts.update({y.Name: y.AreaValue})
            if y.is_a('IfcQuantityLength'):
                quantities_dicts.update({y.Name: y.LengthValue})
            if y.is_a('IfcQuantityVolume'):
                quantities_dicts.update({y.Name: y.VolumeValue})
            if y.is_a('IfcQuantityCount'):
                quantities_dicts.update({y.Name: y.CountValue})
            if y.is_a('IfcQuantityWeight'):
                quantities_dicts.update({y.Name: y.WeightValue})
        return quantities_dicts

    def get_related_type_definition(ifc_instance):
        defined_by_type_list = [x.RelatingType for x in ifc_instance.IsDefinedBy if x.is_a("IfcRelDefinesByType")]
        return defined_by_type_list

    def get_type_single_value(x):
        type_attr_dicts = {}
        if x.HasPropertySets:
            try:
                for y in x.HasPropertySets:
                    if y.Name is not None:
                        type_attr_dicts.update({"TypeDefinition_" + x.Name: y.Name})
            except Exception:
                print(f"Type Value Exception for IfcGlobalID {x.GlobalId}")
        return type_attr_dicts


    # Headers (same as original, excluding "Additional Attributes" for later expansion)
    headers = [
        "File Name", "ObjectID", "GlobalId", "type", "Name", "Description", "ObjectType",
        "Floor", "Building", "Material", "Volume (m³)", "Surface Area (m²)",
        "Top Elevation (m)", "Bottom Elevation (m)",
        "Centroid X (m)", "Centroid Y (m)", "Centroid Z (m)",
        "Min X (m)", "Max X (m)", "Min Y (m)", "Max Y (m)"
    ]

    # Collect data from IFC elements
    data = []
    for element in model.by_type("IfcElement"):
        if element.Representation:
            try:
                # Basic properties
                object_id = element.id()
                global_id = element.GlobalId
                entity_type = element.is_a()
                name = element.Name or "N/A"
                description = element.Description or "N/A"
                object_type = element.ObjectType or "N/A"
                material = get_material(element)
                floor_name, building_name = get_floor_and_building(element)

                # Geometry calculations
                shape = ifcopenshell.geom.create_shape(settings, element)
                volume = get_volume(shape.geometry)
                surface_area = get_area(shape.geometry)
                top_elevation = get_top_elevation(shape.geometry)
                bottom_elevation = get_bottom_elevation(shape.geometry)

                # Extract vertices for centroid and bounding box
                vertices = shape.geometry.verts
                if vertices and len(vertices) > 0:
                    verts = np.array(vertices).reshape(-1, 3)
                    centroid = verts.mean(axis=0)
                    centroid_x, centroid_y, centroid_z = centroid[0], centroid[1], centroid[2]
                    min_x, min_y, _ = verts.min(axis=0)
                    max_x, max_y, _ = verts.max(axis=0)
                else:
                    centroid_x = centroid_y = centroid_z = 0.0
                    min_x = max_x = min_y = max_y = 0.0

                # Additional attributes
                additional_attributes = get_all_instance_data(element)

                # Append data row (excluding additional attributes for now)
                row = [
                    file_name, object_id, global_id, entity_type, name, description, object_type,
                    floor_name or "N/A", building_name or "N/A", material,
                    f"{volume:.2f}", f"{surface_area:.2f}", f"{top_elevation:.2f}", f"{bottom_elevation:.2f}",
                    f"{centroid_x:.2f}", f"{centroid_y:.2f}", f"{centroid_z:.2f}",
                    f"{min_x:.2f}", f"{max_x:.2f}", f"{min_y:.2f}", f"{max_y:.2f}"
                ]
                data.append((row, additional_attributes))
            except Exception as e:
                print(f"Error processing element {element.id()} ({element.GlobalId}): {e}")

    # Create initial DataFrame with base data
    df = pd.DataFrame([row for row, _ in data], columns=headers)

    # Optimize DataFrame expansion by creating a dictionary for all attributes first,
    # then creating a dataframe at once instead of adding columns one by one
    all_attrs = [attrs for _, attrs in data]
    extra_columns = sorted(set().union(*[set(attrs.keys()) for attrs in all_attrs]))
    
    # Create a dictionary with all the extra columns data
    extra_data = {}
    for key in extra_columns:
        extra_data[key] = [attrs.get(key, "") for attrs in all_attrs]
    
    # Create a dataframe with all the extra columns and join with original df
    extra_df = pd.DataFrame(extra_data)
    df = pd.concat([df, extra_df], axis=1)

    # Renaming the column
    df.rename(columns={'type': 'ifc/Type', 'Floor': 'floor', 'ObjectID': 'objectId', 'Name': 'name',
                     'Centroid X (m)': 'sv/Centroid/X','Centroid Y (m)': 'sv/Centroid/Y',
                     'Centroid Z (m)': 'sv/Centroid/Z','Volume (m³)': 'sv/ConvexHullVolume',}, inplace=True)

    print("DataFrame created successfully.")
    return df