FROM python:3.10-slim

WORKDIR /app

# Install system dependencies (needed for psycopg2 compilation)
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port (Documentation only, compose handles mapping)
EXPOSE 8000

# Run with reload by default, can be overridden in compose
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
