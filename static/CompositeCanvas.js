// ==================================================
// CompositeCanvas.js - Composite Matrix Transformation AnimatedCanvas Class
// ==================================================

import { AnimatedCanvas } from '/static/AnimatedCanvas.js';

// ==================================================
// 1. CLASS DEFINITION
// ==================================================
export class CompositeCanvas extends AnimatedCanvas {
    constructor(canvasId,  matrixPId, matrixDId, matrixP1Id) {
        super(canvasId); //this is what AnimatedCanvas expects
    

        this.applyP = true;
        this.applyD = true;
        this.applyP1 = true;

        

        // ----------------------
        // 1b. MATRIX & VECTOR
        // ----------------------

        this.Ax = [0,0];
        this.eigvals = [];
        this.eigvecs = [];
        this.P = [];
        this.D = [];
        this.P1 = [];

        // ----------------------
        // 1c. FRACTIONAL MATRICES
        // ----------------------
        this.transformationMatrixSet = [];

        this.drawTestVector = false;
        this.showEigenvectors = true;
        this.showBasisVectors = false;

        this.transformationP1 = { 
            matrices: [],
            label: "P⁻¹",
            baseMatrix: [],
            active: true,
            passive: false 
        };

        this.transformationD = {
            matrices: [],
            label: "D",
            baseMatrix: [],
            active: true,
            passive: false
        };

        this.transformationP = {
            matrices: [],
            label: "P",
            baseMatrix: [],
            active: true,
            passive: false
        };        
    }

    setMatrix(matrix) { this.A = matrix; }
    setVector(vector) { this.x = vector; }
    async refresh() {
        await this.updateValues();                 // server call
        await this.updateTransformationMatrixSequence();
    }

    getValues() {
        return {
            P: this.transformationP.baseMatrix,
            D: this.transformationD.baseMatrix,
            P1: this.transformationP1.baseMatrix
        };
    }


    setPPassive() {
        this.transformationP.passive = true;
        this.transformationP.active = false;
    } 

    setPActive() {
        this.transformationP.active = true;
        this.transformationP.passive = false;
    } 

    setDPassive() {
        this.transformationD.passive = true;
        this.transformationD.active = false;
    } 
    setDActive() {
        this.transformationD.active = true;
        this.transformationD.passive = false;
    } 

    setP1Active() {
        this.transformationP1.active = true;
        this.transformationP1.passive = false;
    } 
    setP1Passive() {
        this.transformationP1.passive = true;
        this.transformationP1.active = false;
    } 
    // ----------------------
    // 2. SERVER COMMUNICATION
    // ----------------------
    async updateValues() {
        try {
            const resp = await fetch("/computePDP", {
                method: "POST",
                headers: {"Content-Type":"application/json"},
                body: JSON.stringify({A:this.A, x:this.x})
            });
            const data = await resp.json();
            this.Ax = data.Ax;
            this.transformationP.baseMatrix = data.P;
            this.transformationD.baseMatrix = data.D;
            this.transformationP1.baseMatrix = data.P1;
            console.log(this.P1);
            this.eigvals = data.eigvals;
            this.eigvecs = data.eigvecs;
        } catch(e) {
            console.error("Server error:", e);
        }
    }

    async wupdateTransformationMatrixSequence() {
        try {
            const resp = await fetch("/calculateTransformationMatrixSequence", {
                method: "POST",
                headers: {"Content-Type":"application/json"},
                body: JSON.stringify({matricesToTransform:[this.P, this.D, this.P1], n_steps:this.nSteps})
            });
            const data = await resp.json();
            this.transformationP['matrices'] = data.transformationMatrixSequence[0]['active'];
            this.transformationD['matrices'] = data.transformationMatrixSequence[1]['active'];
            this.transformationP1['matrices'] = data.transformationMatrixSequence[2]['active'];
            this.transformationSequences = [];

            if (this.transformationP.passive){
            this.transformationP["matrices"] = data.transformationMatrixSequence[0]['passive'];}

            if (this.transformationD.passive){
            this.transformationD["matrices"] = data.transformationMatrixSequence[1]['passive'];}

            if (this.transformationP1.passive){
            this.transformationP1["matrices"] = data.transformationMatrixSequence[2]['passive'];}

            if(this.applyP1){ this.addTransformation(this.transformationP1 );}
            if(this.applyD){ this.addTransformation(this.transformationD );}
            if(this.applyP){ this.addTransformation(this.transformationP);}
        } catch(e) {
            console.error("Server error fetching fractional matrices:", e);
        }
    }

    async updateTransformationMatrixSequence() {
        try {
            const resp = await fetch("/calculateTransformationMatrixSequenceSmart", {
                method: "POST",
                headers: {"Content-Type":"application/json"},
                body: JSON.stringify({toTransform:[this.transformationP1, this.transformationD, this.transformationP], n_steps:this.nSteps})
            });
            const data = await resp.json();
            this.transformationP1['matrices'] = data.transformationMatrixSequence[0];
            this.transformationD['matrices'] = data.transformationMatrixSequence[1];
            this.transformationP['matrices'] = data.transformationMatrixSequence[2];
            this.transformationSequences = [];


            if(this.applyP1){ this.addTransformation(this.transformationP1 );}
            if(this.applyD){ this.addTransformation(this.transformationD );}
            if(this.applyP){ this.addTransformation(this.transformationP);}
        } catch(e) {
            console.error("Server error fetching fractional matrices:", e);
        }
    }
    
    drawFrame(){
            // Call the parent to draw grids
            super.drawFrame();
            if (this.eigvecs.length>0){ 
            this.drawTransformedLine([0,0], this.x, "magenta",3, "x");}
            // Draw unit eigenvectors
            if (this.showEigenvectors){
                for(let i=0;i<this.eigvecs.length;i++){
                    const v = this.eigvecs[i];
                    this.drawLine([0,0], [v[0], v[1]], i===0 ? "blue" : "green", 4, `v${i + 1}`);
                }
            }

            // Draw vector x
            if (this.drawTestVector){    
                this.drawLine([0,0], this.x, "blue",3);
                this.drawTransformedLine([0,0], this.x, "magenta",3);
            }
    }



}
