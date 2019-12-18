# @name:        2018-03-28_RFMids.py
# @summary:
# @description:
# @sources:
# @depends:
# @author:      Laura Hughes
# @email:       lhughes@scripps.edu
# @license:     Apache-2.0
# @date:        28 March 2018


import pandas as pd

# Read in files, throw away extra columns
rfm_file = "/Users/laurahughes/GitHub/repurpos.us-assays/src/data/20180216_EC50_DATA_RFM_IDs.csv"
init_file = "/Users/laurahughes/GitHub/repurpos.us-assays/src/static/assay_data.csv"

init = pd.read_csv(init_file)
init.head()
init.shape
init = init[['substring', 'calibr_id', 'smiles', 'inchi_key']].drop_duplicates()

rfm = pd.read_csv(rfm_file, header = None, names = ['calibr_id', 'rfm_id', 'calibr_id2', 'smiles', 'hvac_id'])

rfm.shape

# merge using both calibr_id and smiles strings
merged = pd.merge(init, rfm, how="left", on=["calibr_id", "smiles"], indicator = True)

merged['_merge'].value_counts()

# 7 values where there's no RFM ID available:
merged[merged['_merge'] == 'left_only']

unmatched_ids = merged[merged['_merge'] == 'left_only'].calibr_id

# Left join on calibr_id:
merged2 = pd.merge(init, rfm, how="left", on=["calibr_id"], indicator = True)

# all merge
merged2['_merge'].value_counts()

# pull out the mismatched values
unmatched = merged2[merged2['calibr_id'].isin(unmatched_ids)]

unmatched.to_csv('/Users/laurahughes/GitHub/repurpos.us-assays/src/static/2018-03-28_mismatchedsmiles.csv')



tmp
