#!/bin/bash

/genomehubs/genomehubs-api &
/genomehubs/genomehubs-ui &

sleep 5

node /genomehubs/test-ui.mjs /genomehubs/tests /genomehubs/tests-out