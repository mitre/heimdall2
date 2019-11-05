#!/bin/bash

ls *.json | sort | xargs -I {} sh -c "echo {} ; inspec_tools summary -j {} -o {}.info"
