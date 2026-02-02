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


reduce size with 
ogr2ogr -simplify 0.5 src/client/views/components/geojson/countries.geojson src/client/views/components/geojson/countries-full.geojson
ogr2ogr -simplify 1 src/client/views/components/geojson/countries-simple.geojson src/client/views/components/geojson/countries-full.geojson

Note: Due to rendering issues with simplified geometries in three-globe (degenerate polygons, 
border misalignment), the full geojson is preferred for accurate globe visualization despite 
its larger file size. Both mapshaper and ogr2ogr simplification cause rendering problems.