# Matrix Transform Visualizer

This is an experimental work-in-progress repo.

A small Flask web app for visualizing 2D linear algebra transformations, eigenvectors, eigenvalues, and matrix decompositions.

## Features

- Interactive 2x2 matrix and vector inputs
- Animated active/passive matrix transformations
- Eigenvalue and eigenvector display
- Visualization of decomposition-style transformations using `P`, `D`, and `P⁻¹`

## Requirements

- Python 3.12+
- pip

## Setup

Create a virtual environment and install dependencies:

```sh
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
```

## Run

```sh
python server.py
```

Then open:

```text
http://127.0.0.1:5000
```

For Flask debug mode during development:

```sh
FLASK_DEBUG=1 python server.py
```

## Project structure

```text
server.py              Flask backend and matrix calculations
static/                JavaScript canvas visualizations
templates/index.html   Main web page
requirements.txt       Python dependencies
```

## Notes

Virtual environments and Python cache files are intentionally ignored by Git. Recreate the environment locally using `requirements.txt`.
