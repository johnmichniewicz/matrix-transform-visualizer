// ==================================================
// CompositeCanvas.js - Composite Matrix Transformation AnimatedCanvas Class
// ==================================================

import { AnimatedCanvas } from '/static/AnimatedCanvas.js';

// ==================================================
// 1. CLASS DEFINITION
// ==================================================
export class ACanvas extends AnimatedCanvas {
    constructor(canvasId) {
        super(canvasId); //this is what AnimatedCanvas expects
    


        

        // ----------------------
        // 1b. MATRIX & VECTOR
        // ----------------------


        // ----------------------
        // 1c. FRACTIONAL MATRICES
        // ----------------------
        this.transformationMatrixSet = [];

        this.applyA = true;
        this.drawTestVector = false;
        this.showEigenvectors = true;

        this.transformationA = {
            matrices: [],
            label: "A",
            baseMatrix: [],
            passive: false,
            active: true
        };
        
    }

    setMatrix(matrix) {
        this.A = matrix;
        this.transformationA.baseMatrix = matrix;
    }
    setVector(vector) { this.x = vector; }
    async refresh() {
        await this.updateValues();                 // server call
        await this.updateTransformationMatrixSequence();
    }

    getValues() {
        return {
            eigenvalues: this.eigvals,
            eigenvectors: this.eigvecs
        };
    }
    
    setAPassive() {
        this.transformationA.passive = true;
        this.transformationA.active = false;
    } 

    setAActive() {
        this.transformationA.active = true;
        this.transformationA.passive = false;
    } 

    // ----------------------
    // 2. SERVER COMMUNICATION
    // ----------------------
    async updateValues() {
        try {
            const resp = await fetch("/computeA", {
                method: "POST",
                headers: {"Content-Type":"application/json"},
                body: JSON.stringify({A:this.A, x:this.x})
            });
            const data = await resp.json();
            this.Ax = data.Ax;
            this.eigvals = data.eigvals;
            this.eigvecs = data.eigvecs;
        } catch(e) {
            console.error("Server error:", e);
        }
    }

    async updateTransformationMatrixSequence() {
        try {
            const resp = await fetch("/calculateTransformationMatrixSequenceSmart", {
                method: "POST",
                headers: {"Content-Type":"application/json"},
                body: JSON.stringify({toTransform:[this.transformationA], n_steps:this.nSteps})
            });
            const data = await resp.json();
            this.transformationA.matrices = data.transformationMatrixSequence[0];
            this.transformationSequences = [];
            
            if (this.applyA) {
                this.addTransformation(this.transformationA);
            }
        } catch(e) {
            console.error("Server error fetching fractional matrices:", e);
        }
    }

    
    drawFrame(){
            // Call the parent to draw grids
            super.drawFrame();
            //if (this.eigvecs.length>0){ 
            //this.drawTransformedLine([0,0], this.eigvecs[0], "magenta",3);}
            this.drawTransformedLine([0,0], this.x, "magenta",3, "x");
            // Draw eigenvectors
            if (this.showEigenvectors){
                for(let i=0;i<this.eigvecs.length;i++){
                    const v = this.eigvecs[i];
                    this.drawLine([v[0]*-20,v[1]*-20],[v[0]*20,v[1]*20], i===0?"blue":'green',5);
                }
            }

            // Draw vector x
            if (this.drawTestVector){    
                this.drawLine([0,0], this.x, "blue",3);
                this.drawTransformedLine([0,0], this.x, "magenta",3);
            }
    }



}
