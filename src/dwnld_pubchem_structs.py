# Purpose: Download 2D chemical structures from PubChem for each of the repurpose compounds
# Initially: reading the structs by hitting the website, but it's slow to change.
# Therefore: downloading and caching all the structs.
#
# Overview of PubChem Terms of Use: http://pubchemdocs.ncbi.nlm.nih.gov/programmatic-access
# PubChem docs at: http://pubchemdocs.ncbi.nlm.nih.gov/pug-rest$_Toc494865566

import pandas as pd
import requests
import urllib
import numpy as np
from time import sleep
from scipy import misc

# -- set up query conditions --
img_dims = '200x150' # number of pixel dimensions for each structure. Note that the structure will be

# example query: https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/2244/PNG?image_size=200x150
url_stub1 = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/'
url_stub2 = '/PNG?image_size='

# -- import list of PubChem CIDs (chemical IDs) --
assay_data = pd.read_csv('src/static/assay_data.csv')
cids = assay_data['PubChem CID']
cids = cids[~cids.isnull()]

# pull out just the CID digits
cids = [x.replace('CID', '') for x in cids]

ids = ['2165', '49856296', '128467', '3385']
ids = ['2165']

for cid in ids:
    print(cid)
url = url_stub1 + cid + url_stub2 + img_dims
resp = requests.get(url)
img_data = resp.content

    if resp.status_code == 200:
        with open(cid + '.png', 'wb') as handler:
            handler.write(img_data)

    sleep(0.2) # delay 0.2 s to avoid making too frequent calls to API; should be < 5/s


x = misc.imread('2165.png')

f = x[115:120,10:20]

import matplotlib.pyplot as plt
plt.imshow(x)
plt.show()
plt.imshow(f)
plt.show()

f
zeros = np.argwhere(f < 245)

zeros = f < 245

r = f[:,:,0]
g = f[:,:,1]
b = f[:,:, 2]

g0 = np.argwhere(g < 245)
r0 = np.argwhere(r < 245)
b0 = np.argwhere(b < 245)

z = f.sum(axis = 2) < 245*3
z
r = np.argwhere(z == True)
r
x = r[:,0]
y = r[:,1]

q = f[x,y, :]
q.shape
plt.imshow(q)
plt.show()

f.shape
