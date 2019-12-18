# Scripts to compare old/new data from Calibr
# Laura Hughes, lhughes@scripps.edu,20 February 2018

# setup -------------------------------------------------------------------

library(tidyverse)
library(data.table)
library(readxl)
# import data -------------------------------------------------------------
# version from 2017-08-22
file1 = '~/GitHub/repurpos-backend/data/reframe_short_20170822.csv'
data1 = read_csv(file1)

# calculate averages
data1 = data1 %>% 
  group_by(genedata_id, calibr_id) %>% 
  mutate(n = n(), avg = ifelse(n >1 , mean(ac50), NA)) %>% 
  ungroup()

# version from 2018-02-16
file2 = '~/GitHub/repurpos-backend/data/20180216_EC50_DATA_RFM_IDs.xlsx'
data2 = read_excel(file2, sheet = 2)
data2_ids = read_excel(file2, sheet = 3, col_names = F)


# merge new data w/ calibr_ids for join to old ----------------------------
colnames(data2_ids) = c('calibr_id', 'ID', 'smiles', 'substring')
data2 = left_join(data2, data2_ids, by = 'ID') %>% 
  rename(genedata_id = id)

# check merge --> calibr_ids for all.
sum(is.na(data2$calibr_id))

# pull just the relevant categories to merge ------------------------------
data1 = data1 %>% 
  select(calibr_id, ac50, datamode, genedata_id, assay_title, smiles, avg, num_measurements = n) %>% 
  mutate(date1 = '2017-08-22')

data2 = data2 %>% select(calibr_id, ID, genedata_id, ac50, assay_title = `assay title`, smiles) %>% mutate(date2 = '2018-02-16')


# Merge! + checks ---------------------------------------------------------
comb = full_join(data1, data2, by = c("calibr_id", "genedata_id"))

cytotox_assays = c('A00086','A00087','A00145','A00148','A00187','A00206','A00215','A00219')
comb = comb %>% 
  mutate(both = !is.na(date1) & !is.na(date2),
         data1_only = !is.na(date1) & is.na(date2),
         data2_only = is.na(date1) & !is.na(date2),
         missing_data = data1_only & !genedata_id %in% cytotox_assays) %>% 
  arrange(genedata_id, calibr_id, ac50.x)


# Check assay titles match ------------------------------------------------

comb = comb %>% mutate(assay_titles_disagree = assay_title.x != assay_title.y)

# Check smiles match ------------------------------------------------------
comb = comb %>% mutate(smiles_disagree = smiles.x != smiles.y)

# find values that are only in data1 --------------------------------------
comb %>% filter(data1_only) %>% count(assay_title.x)



# Find average disagree ---------------------------------------------------
# rounding to avoid 
comb = comb %>% mutate(ac50_disagree = ifelse(num_measurements > 1, 
                                              signif(avg, 2) != signif(ac50.y, 2), 
                                              signif(ac50.x, 2) != signif(ac50.y, 2)))


comb %>% filter(both, ac50_disagree) %>% select(assay_title.x, calibr_id, num_measurements, ac50.x, ac50.y, avg) %>% View()


# rename, export ----------------------------------------------------------
comb %>% select(calibr_id, genedata_id, 
                assay_title1 = assay_title.x, assay_title2 = assay_title.y, assay_titles_disagree,
                missing_data, both, data1_only, data2_only,
                ac50_disagree, ac50_1 = ac50.x, avg_1 = avg, ac50_2 = ac50.y, 
                smiles_disagree, smiles1 = smiles.x, smiles2 = smiles.y) %>% 
  write_csv('~/Documents/repurpose/data/ac50data_comparison.csv')



# counts ------------------------------------------------------------------
comb %>% count(missing_data)

comb %>% count(assay_titles_disagree)

comb %>% count(smiles_disagree)

comb %>% filter(both) %>% count(ac50_disagree)

comb %>% filter(data1_only) %>% count(assay_title.x)
