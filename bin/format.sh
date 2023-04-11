#! /bin/bash

isort --profile black ../matchmaker && black ../matchmaker && ruff --fix ../matchmaker