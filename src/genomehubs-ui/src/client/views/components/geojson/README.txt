// GeoJSON for world countries. For brevity, this is a minimal example with a few countries. Replace with a full dataset for production.


install topojson

conda install -y topojson

fetch natural earth downloads from https://www.naturalearthdata.com/downloads/110m-cultural-vectors/

and https://www.naturalearthdata.com/downloads/110m-physical-vectors/

combine with 

topojson \
    -o world-110m.json \
    -- \
    land=ne_110m_land.shp \
    states=ne_110m_admin_1_states_provinces.shp


    jq '.features |= map(.properties |= {ISO_A2, ADMIN})' '/Users/rchallis/Downloads/ne_110m_ocea
n.geojson' > '/Users/rchallis/Downloads/ne_110m_ocean.filtered.geojson'