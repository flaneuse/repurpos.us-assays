# Generic assay description page for repurpos.us
# Built using Flask
# Laura Hughes, lhughes@scripps.edu

from flask import Flask, url_for
from flask import render_template
import pandas as pd

# Import assay data file
data_file = 'data/assay_descriptions.csv'
df = pd.read_csv(data_file)

# print(df.head())

print(df.at[0,'title'])

# Create Flask app
app = Flask(__name__) # Use __name__ for single app; __main__ for multiple mods

@app.route('/assays/')

def make_assays():
    # assay_df = {
    #     'assay_title': 'Assay Title',
    #     'id': 1,
    #     'summary': 'This is a summary. It is short.',
    #     'purpose': 'Malaria test',
    #     'type': 'functional',
    #     'org': 'Homo sapiens',
    #     'strain': 'HepG2',
    #     'detection': 'fluorescence'
    # }
    #

    # temporarily, and not particularly intelligently: pull out just the first row as a test case.
    # assay_df = df.iloc[[0]].to_dict()
    # longer term-- embed as json?
    assay_df = {
        'title': df.at[0,'title'],
        'id': df.at[0, 'id'],
        'summary': df.at[0,'summary'],
        'overview': {
            'purpose': df.at[0, 'purpose'],
            'type': df.at[0, 'type (binding, functional, ADMET)'],
            'org': df.at[0, 'host_organism'],
            'strain': df.at[0, 'strain'],
            'detection': df.at[0, 'detection_method (UV-Vis, Fluorescence, Luminescence)'],
            'kit': df.at[0, 'kit']
            },
        'incub_summary': df.at[0, 'incubation_description'],

        'incub': {
            'cell_source': df.at[0, 'cell_provider'],
            'time': df.at[0, 'hours_incubation'],
            'temp': df.at[0, 'temperature_celsius'],
            'conc': df.at[0, 'drug_concentration'],
            'link': df.at[0, 'incubation_link']
        },

        'detect_summary': df.at[0, 'detection_description'],

        'detect': {
            'kit': df.at[0, 'kit'],
            'source': df.at[0, 'assay_provider'],
            'dye': df.at[0, 'dye'],
            'conc': df.at[0, 'dye_concentration'],
            'ex': df.at[0, 'wavelength_abs/ex'],
            'em': df.at[0, 'wavelength_em'],
            'detector': df.at[0, 'detector'],
            'link': df.at[0, 'detection_link']
        },

    }

    return render_template('assay.html', df = assay_df, title = 'fjsdk')
