# Generic assay description page for repurpos.us
# Built using Flask
# Laura Hughes, lhughes@scripps.edu

from flask import Flask, url_for
from flask import render_template
import pandas as pd

# Import assay data file
data_file = 'data/assay_descriptions.csv'
df = pd.read_csv(data_file)

# print(df)
# for idx, row in df.iterrows():
#     print(df.at[idx, 'assay_name'])

# Create Flask app
app = Flask(__name__) # Use __name__ for single app; __main__ for multiple mods

@app.route('/')
def make_homepage():
    return render_template('all_assays.html', df = df)

#
# @app.route('/<int:row_id>')
# def make_indiv(row_id):
#     # print()
#     # for row in df:
#     for idx, row in df.iterrows():
#         print("starting for loop")
#         print(idx)
#         # print(row)
#         # print('row([id]): ')
#         # print(row['id'])
#         # print(type(row['id']))
#         # print('input: ')
#         # print(row_id)
#         # print(type(row_id))
#         # print('logic:')
#         # print(row['id'] == row_id)
#         # if row['id'] == row_id:
#         # print("LOGIC IS TRU")
#         # return render_template(template, object=row)
#         # for i in range(5): # Doesn't work outside make_homepage; need to not override make_homepage each time.
#             # return render_template('test.html', id = row)
#         return "hello world."

@app.route('/assays/')
def make_assays(row_id = 0):

    # temporarily, and not particularly intelligently: pull out just the first row as a test case.
    # assay_df = df.iloc[[0]].to_dict()
    # longer term-- embed as json?
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

# if __name__ == '__main__':
#     app.run(debug=True, use_reloader=True)
