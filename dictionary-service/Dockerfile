FROM python:3.12-slim

WORKDIR /app

# Install uv.
RUN pip install --no-cache-dir uv

# Copy dependency files first for better caching.
COPY pyproject.toml .

# Create virtual environment and install dependencies.
RUN uv sync

COPY app ./app

EXPOSE 8100

CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8100"]
