#!/bin/bash

ls *.info | xargs -I {} sh -c "cat {} | jq .status > {}.counts"
