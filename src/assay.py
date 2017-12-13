# Generic assay description page for repurpos.us
# Built using Flask
# Laura Hughes, lhughes@scripps.edu

from flask import Flask, url_for
from flask import render_template
import pandas as pd

# Import assay data file
data_file = 'data/assay_descriptions.csv'
df = pd.read_csv(data_file)


# Create Flask app
app = Flask(__name__) # Use __name__ for single app; __main__ for multiple mods

@app.route('/assays/')

def make_assays(row_id = 0):

    # temporarily, and not particularly intelligently: pull out just the first row as a test case.
    # assay_df = df.iloc[[0]].to_dict()
    # longer term-- embed as json?
    assay_df = {
        'title': df.at[row_id,'title'],
        'id': df.at[row_id, 'id'],
        'summary': df.at[row_id,'summary'],
        'overview': {
            'purpose': df.at[row_id, 'purpose'],
            'type': df.at[row_id, 'type (binding, functional, ADMET)'],
            'org': df.at[row_id, 'host_organism'],
            'strain': df.at[row_id, 'strain'],
            'detection': df.at[row_id, 'detection_method (UV-Vis, Fluorescence, Luminescence)'],
            'kit': df.at[row_id, 'kit']
            },
        'incub_summary': df.at[row_id, 'incubation_description'],

        'incub': {
            'cell_source': df.at[row_id, 'cell_provider'],
            'time': df.at[row_id, 'hours_incubation'],
            'temp': df.at[row_id, 'temperature_celsius'],
            'conc': df.at[row_id, 'drug_concentration'],
            'link': df.at[row_id, 'incubation_link']
        },

        'detect_summary': df.at[row_id, 'detection_description'],

        'detect': {
            'kit': df.at[row_id, 'kit'],
            'source': df.at[row_id, 'assay_provider'],
            'dye': df.at[row_id, 'dye'],
            'conc': df.at[row_id, 'dye_concentration'],
            'ex': df.at[row_id, 'wavelength_abs/ex'],
            'em': df.at[row_id, 'wavelength_em'],
            'detector': df.at[row_id, 'detector'],
            'link': df.at[row_id, 'detection_link']
        },

    }

    return render_template('assay.html', df = assay_df)
