#!/bin/bash

# ==========================================================
# Quick Database Schema Application Script
# Agricultural Trading Platform
# ==========================================================

# Navigate to project root
cd "$(dirname "$0")"

# Run the database apply script
./database/apply-schema.sh
