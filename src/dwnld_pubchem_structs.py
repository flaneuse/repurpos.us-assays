# Purpose: Download 2D chemical structures from PubChem for each of the repurpose compounds
# Initially: reading the structs by hitting the website, but it's slow to change.
# Therefore: downloading and caching all the structs.
#
# Overview of PubChem Terms of Use: http://pubchemdocs.ncbi.nlm.nih.gov/programmatic-access
# PubChem docs at: http://pubchemdocs.ncbi.nlm.nih.gov/pug-rest$_Toc494865566

import pandas as pd
import requests
import numpy as np
from time import sleep
from scipy import misc
import imageio



# -- set up query conditions --
img_dims = '400x300' # number of pixel dimensions for each structure. Note that the structure will be

# example query: https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/2244/PNG?image_size=200x150
url_stub1 = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/'
url_stub2 = '/PNG?image_size='

# -- import list of PubChem CIDs (chemical IDs) --
assay_data = pd.read_csv('src/static/assay_data.csv')
cids = assay_data['PubChem CID']
cids = cids[~cids.isnull()]

# pull out just the CID digits
cids = [x.replace('CID', '') for x in cids]
cids = np.array(cids)
cids = np.unique(cids)
len(cids)


def add_border(cropped, rgb_thresh, border_size):
    crop_height, crop_width, rgb = cropped.shape
    empty_row = np.ones((border_size, crop_width, 3)) * rgb_thresh
    empty_col = np.ones((border_size * 2 + crop_height, border_size, 3)) * rgb_thresh

    # add lower border
    cropped = np.insert(cropped, crop_height, empty_row, axis = 0)
    # add upper border
    cropped = np.insert(cropped, 0, empty_row, axis = 0)

    # add left/right borders
    cropped = np.hstack((empty_col, cropped, empty_col))

    return cropped

def crop_struct(img_file, rgb_thresh = 245, write_file = True, border_size = 5):
    img = misc.imread(img_file)

    nonzero_pix = np.argwhere(img.sum(axis = 2) < rgb_thresh*3)

    # find cropping boundaries
    xmin, ymin = nonzero_pix.min(axis = 0)
    xmax, ymax = nonzero_pix.max(axis = 0)

    # crop the image
    cropped = img[xmin:xmax+1,ymin:ymax+1, :]

    # add a buffer
    cropped = add_border(cropped, rgb_thresh, border_size)

    if (write_file == True):
        misc.imsave(img_file, cropped)

    return cropped

# testing function
import matplotlib.pyplot as plt
img_file = '21650.png'
x = misc.imread(img_file)
plt.imshow(x)
plt.show()
cropped = crop_struct(img_file, 245)

plt.imshow(cropped)
plt.show()

# test ids
ids = ['2165', '49856296', '128467', '3385']


# loop through all CIDs and download the chemical structure.
for cid in cids:
    # print(cid)
    url = url_stub1 + cid + url_stub2 + img_dims
    resp = requests.get(url)
    img_data = resp.content

    # save file
    if resp.status_code == 200:
        with open('src/static/img/' + cid + '.png', 'wb') as handler:
            handler.write(img_data)
    else:
        print('error: ' + cid)

    # crop and override file
    cropped = crop_struct('src/static/img/' + cid + '.png')

    # delay 0.2 s to avoid making too frequent calls to API; should be < 5/s
    sleep(0.2)
