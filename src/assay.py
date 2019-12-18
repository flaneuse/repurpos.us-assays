# Generic assay description page for repurpos.us
# Built using Flask
# Laura Hughes, lhughes@scripps.edu

from flask import Flask, url_for
from flask import render_template
from functools import partial
import pandas as pd

# Import assay data file
data_file = 'data/assay_descriptions.csv'
df = pd.read_csv(data_file)


# Create Flask app
app = Flask(__name__) # Use __name__ for single app; __main__ for multiple mods

# Create homepage
@app.route('/')
def make_homepage():
    return render_template('assay_home.html', df = df)


# Create homepage
@app.route('/search-mockup')
def make_search():
    assay_df = {
        'title': df.title,
        'id': df.genedata_id
    }
    return render_template('search.html', df = assay_df)

# individual page template
def make_assays(row_id):
    # Filter data to put in the right format.
    # Perhaps not smartest way... too manual
    assay_df = {
        'title': df.at[row_id,'title'],
        'id': df.at[row_id, 'genedata_id'],
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

# --- Create individual pages ---
# key is that the add_url_rule() function requires the view function to be a function, not string / html / etc.
# BUT-- need to change the view function to pass it different data.
# Therefore, using the python `partial` function to do so.
# https://stackoverflow.com/questions/14342969/python-flask-route-with-dynamic-first-component/14349852#14349852
for idx, row in df.iterrows():
    app.add_url_rule(
    "/" + str(row.id), # url
    "page" + str(row.id),
    partial(make_assays, row.id) # view function to render the page
    )

if __name__ == '__main__':
    app.run(host='127.0.0.1',port=5050,debug=True)
