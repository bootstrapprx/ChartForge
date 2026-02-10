# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set the working directory in the container
WORKDIR /app

# Install system dependencies required for building Python packages
# - build-essential & gcc: for compiling C extensions
# - libpq-dev: for psycopg2
# - python3-dev: for C extensions for Python
# - libffi-dev: for cffi-based packages
# - curl: for general purpose URL transfers (e.g., health checks)
RUN apt-get update && apt-get install -y \
    build-essential \
    gcc \
    libpq-dev \
    python3-dev \
    libffi-dev \
    curl \
  && rm -rf /var/lib/apt/lists/*

# Upgrade pip
RUN python -m pip install --upgrade pip

# Copy and install Python dependencies
COPY ./requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Verify uvicorn installation
RUN which uvicorn && uvicorn --version

# Add the bin directory to the PATH
ENV PATH="/usr/local/bin:${PATH}"

# Copy the application code into the container
COPY . .

# The command to run the application is specified in docker-compose.yml
# This CMD is a fallback for running the container directly.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
