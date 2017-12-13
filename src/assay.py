# Generic assay description page for repurpos.us
# Built using Flask
# Laura Hughes, lhughes@scripps.edu

from flask import Flask, url_for
from flask import render_template
import pandas as pd



# Create Flask app
app = Flask(__name__) # Use __name__ for single app; __main__ for multiple mods

@app.route('/assays/')

def make_assays():
    assay_df = {
        'assay_title': 'Assay Title',
        'id': 1,
        'summary': 'This is a summary. It is short.',
        'purpose': 'Malaria test',
        'type': 'functional',
        'org': 'Homo sapiens',
        'strain': 'HepG2',
        'detection': 'fluorescence'

    }

    return render_template('assay.html', df = assay_df, title = 'fjsdk')
