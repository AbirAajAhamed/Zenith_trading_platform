# Dockerfile for Zenith Trading Bot Backend

# 1. Base Image: Start with a lightweight Python image
FROM python:3.11-slim

# 2. Install TA-Lib's C dependencies using apt-get
# This is allowed inside a Docker build process
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libta-lib-dev \
    && rm -rf /var/lib/apt/lists/*

# 3. Set the working directory inside the container
WORKDIR /app

# 4. Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 5. Copy the rest of the application code
COPY . .

# 6. Expose the port the app runs on
EXPOSE 8000

# 7. Define the command to start the application
CMD ["gunicorn", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]