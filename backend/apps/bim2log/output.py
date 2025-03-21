import pandas as pd

def export_results(cadmium_elements_df, timeline_df, validation_df, timeline_building_name):
    elements_file = f'Objects_{timeline_building_name}.xlsx'
    timeline_file = f'Updated_Timeline_{timeline_building_name}_Export.xlsx'
    validation_file = 'Validation_Report.xlsx'

    cadmium_elements_df.to_excel(elements_file, index=False)
    timeline_df.to_excel(timeline_file, index=False)

    with pd.ExcelWriter(validation_file) as writer:
        validation_df.to_excel(writer, index=False)

    print(f"Exported results to:\n- {elements_file}\n- {timeline_file}\n- {validation_file}")
