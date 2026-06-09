import os

from flask import Flask, request, jsonify, render_template
import numpy as np
from scipy.linalg import logm, expm
from werkzeug.middleware.proxy_fix import ProxyFix

app = Flask(__name__)

app.wsgi_app = ProxyFix(
    app.wsgi_app,
    x_for=1,
    x_proto=1,
    x_host=1,
)


def calculate_eigen(matrix):
    # Eigen decomposition

    eigvals_raw, eigvecs_raw = np.linalg.eig(matrix)

    # Snap tiny imaginary parts and tiny values to real zero
    eigvals_raw = [0.0 if abs(v) < 1e-10 else v for v in eigvals_raw]

    eigvals = []
    eigvecs = []

    for i in range(len(eigvals_raw)):
        val = eigvals_raw[i]
        if np.isreal(val):
            vec = np.real(eigvecs_raw[:, i])  # pick the i-th column
            norm = np.linalg.norm(vec)
            if norm > 1e-12:
                vec = vec / norm
                # avoid duplicates (parallel or antiparallel)
                duplicate = any(abs(np.dot(vec, prev)) > 0.999 for prev in eigvecs)
                if not duplicate:
                    eigvals.append(float(np.real(eigvals_raw[i])))
                    eigvecs.append(vec.tolist())

    return ((eigvals, eigvecs))

def fractional_transform(matrix, n_steps):

    # Small eigenvalues cause the fractional matrices to converge VERY quickly 
    # check if they are small so I can use a linear approximation later
    eigvals, _ = np.linalg.eig(matrix)
    threshold = 1e-3
    has_small = np.any(np.abs(eigvals) < threshold)

    transformation_matrix_set = []

    for k in range(n_steps + 1):
        t = k / n_steps
        if has_small:
            # Linear fallback for matrices with tiny eigenvalues
            F = (1 - t) * np.eye(matrix.shape[0]) + t * matrix
        else:
            # Regular fractional matrix
            F = expm(t * logm(matrix)) 
        F_real = np.real(F)  # remove small imaginary parts
        transformation_matrix_set.append(F_real.tolist())
    return transformation_matrix_set
# ------------------------------
# Routes 
# ------------------------------
@app.route("/")
def index():
    return render_template("index.html")

# ------------------------------
# ACanvas 
# ------------------------------
@app.route("/computeA", methods=["POST"])
def compute_A():
    data = request.json
    A = np.array(data["A"], dtype=float)
    x = np.array(data["x"], dtype=float)
    
    # Compute Ax
    Ax = A @ x

    eigvals, eigvecs = calculate_eigen(A)
            

    return jsonify({
        "Ax": Ax.tolist(),
        "eigvals": eigvals,
        "eigvecs": eigvecs
    })

# ------------------------------
# PCanvas 
# ------------------------------
@app.route("/computeP", methods=["POST"])
def compute_P():
    data = request.json

    # original matrix A for which to compute P
    A = np.array(data["A"], dtype=float)
    x = np.array(data["x"], dtype=float)

    # Compute Ax
    Ax = A @ x

    #eigenvectors are rows of eigvecs. 
    eigvals, eigvecs = calculate_eigen(A)

    if (len(eigvecs) == 1):
        eigvecs.append(eigvecs[0])
    if (len(eigvecs) == 0):
        eigvecs = [[0,0],[0,0]] 
    
    P = np.transpose(eigvecs)          
    P = np.linalg.inv(P)
    return jsonify({
        "Ax": Ax.tolist(),
        "P": P.tolist()
    })
# ------------------------------
# PInvCanvas 
# ------------------------------
@app.route("/compute_PInv", methods=["POST"])
def compute_PInv():
    data = request.json
    A = np.array(data["A"], dtype=float)
    x = np.array(data["x"], dtype=float)

    # Compute Ax
    Ax = A @ x

    eigvals, eigvecs = calculate_eigen(A)
    #eigenvectors are rows of eigvecs. 
    
    exists = False 
    Pinv = np.array([[0,0],[0,0]])
    if (np.linalg.matrix_rank(eigvecs) == 2):
        P = np.transpose(eigvecs)
        Pinv = np.linalg.inv(P)
        exists = True
        

    Pinv = Pinv.tolist()         

    return jsonify({
        "Ax": Ax.tolist(),
        "Pinv": Pinv,
        "exists": exists
    })
# ------------------------------
# CompositeCanvas 
# ------------------------------
@app.route("/computePDP", methods=["POST"])
def compute_PDP():
    data = request.json
    A = np.array(data["A"], dtype=float)
    x = np.array(data["x"], dtype=float)

    # Compute Ax
    Ax = A @ x

    eigvals, eigvecs = calculate_eigen(A)
    #eigenvectors are rows of eigvecs. 
    
    exists = False 
    P1 = np.array([[0,0],[0,0]])
    P = np.array([[0,0],[0,0]])
    D = np.diag(eigvals)

    if (np.linalg.matrix_rank(eigvecs) == 2):
        P = np.transpose(eigvecs)
        P1 = np.linalg.inv(P)
        exists = True
        
    P = P.tolist()
    D = D.tolist()
    P1 = P1.tolist()         

    return jsonify({
        "Ax": Ax.tolist(),
        "P1": P1,
        "P": P,
        "D": D,
        "eigvals": eigvals,
        "eigvecs": eigvecs,
        "exists": exists
    })
# ------------------------------
# Fractional matrices endpoint
# ------------------------------
@app.route("/calculateTransformationMatrixSequence", methods=["POST"])
def calculate_transformation_matrix_sequence():
    data = request.json
    matrices_to_transform = np.array(data["matricesToTransform"], dtype=float)
    n_steps = int(data.get("n_steps", 50))
   
    transformation_matrix_sequence = [] 

    for matrix_to_transform in matrices_to_transform:
        transformation_matrix_set = {'active' : [], 'passive': [], 'passive_exists': False} 
        transformation_matrix_set['active'] = (fractional_transform(matrix_to_transform, n_steps))

        if (np.linalg.matrix_rank(matrix_to_transform) == 2):
            matrix_to_transform_inverse = np.linalg.inv(matrix_to_transform)
            transformation_matrix_set['passive_exists'] = True 

            transformation_matrix_set['passive'] = fractional_transform(matrix_to_transform_inverse, n_steps)
        transformation_matrix_sequence.append(transformation_matrix_set)

    return jsonify({"transformationMatrixSequence": transformation_matrix_sequence})

@app.route("/calculateTransformationMatrixSequenceSmart", methods=["POST"])
def calculate_transformation_matrix_sequence_smart():
    data = request.json
    transformations = np.array(data["toTransform"])
    base_matrices = []
    bases = np.eye(2)
    n_steps = int(data.get("n_steps", 50))

    transformation_matrix_sequence = [] 
    for transformation in transformations:
        base_matrix = transformation["baseMatrix"]
        if (transformation["passive"]):
            if (np.linalg.matrix_rank(base_matrix) == 2):
                base_matrix_passive = np.linalg.inv(base_matrix)
                aware_matrix = np.linalg.inv(bases) @ base_matrix_passive @ bases  
                bases = base_matrix @ bases #update bases after transform
        if (transformation["active"]):
            aware_matrix = np.linalg.inv(bases) @ base_matrix @ bases
        aware_matrix_transformation_set = fractional_transform(aware_matrix, n_steps) 

        transformation_matrix_sequence.append(aware_matrix_transformation_set)


   
    return jsonify({"transformationMatrixSequence": transformation_matrix_sequence})

if __name__ == "__main__":
    debug = os.environ.get("FLASK_DEBUG", "0") == "1"
    app.run(debug=debug)
