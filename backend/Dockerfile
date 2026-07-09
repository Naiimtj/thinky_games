FROM python:3.12-slim

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PYTHON_DOWNLOADS=never \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install uv (the dependency manager) from PyPI.
RUN pip install --no-cache-dir uv==0.11.1

WORKDIR /app

# mysqldump/mysql client used by the on-demand admin backup endpoints.
RUN apt-get update && \
    apt-get install -y --no-install-recommends default-mysql-client && \
    rm -rf /var/lib/apt/lists/*

# Install dependencies first (better layer caching), production group only.
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

# Copy the application source.
COPY app ./app
COPY alembic ./alembic
COPY alembic.ini ./alembic.ini

ENV PATH="/app/.venv/bin:$PATH"

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
