// ==================================================
// AnimatedCanvas.js - AnimatedCanvas Class
// ==================================================

// ==================================================
// 1. CLASS DEFINITION
// ==================================================
export class AnimatedCanvas {
    // ----------------------
    // Constructor
    // ----------------------
    constructor(canvasId,  scale=50) {
        // ----------------------
        // 1a. HTML ELEMENTS
        // ----------------------
        this.canvas = document.getElementById(canvasId);
        this.canvas.display = "block";
        this.ctx = this.canvas.getContext("2d");
        this.width = this.canvas.width;
        this.height = this.canvas.height;


        // ----------------------
        // 1d. ANIMATION VARIABLES
        // ----------------------
        this.paused = false;

        // ----------------------
        // 1e. GRID SETTINGS
        // ----------------------
        this.scale = scale;
        this.scale = 50 * (this.width / 500); // assumes width and height scale equally
        this.gridSpacing = 1;

        // Original grid styling
        this.originalGridColor = "#4d4d4d";
        this.originalGridlineThickness = 1;
        this.originalAxesColor = "#606060";
        this.originalAxesThickness = 2;

        // Transformed grid styling
        this.transformedGridColor = "#f0f0f0";
        this.transformedGridlineThickness = 1;
        this.transformedAxesColor = "white";
        this.transformedAxesThickness = 2;

        // Generate grids once
        this.originalGridLines = this.makeGridLines(
            this.originalGridColor, this.originalGridlineThickness,
            this.originalAxesColor, this.originalAxesThickness
        );

        this.transformedGridLines = this.makeGridLines(
            this.transformedGridColor, this.transformedGridlineThickness,
            this.transformedAxesColor, this.transformedAxesThickness
        );

        // ----------------------
        // 1f. MULTIPLE TRANSFORMATIONS
        // ----------------------
        this.transformationSequences = []; // Holds multiple sequential transformations
        this.showBasisVectors = true;

        // Bind draw to this
        this.animate = this.animate.bind(this);
    }

    showCanvas(){
        this.canvas.style.display = "block";
    }
    
    hideCanvas(){
        this.canvas.style.display = "none";
    }

    // ----------------------
    // 2. MULTIPLE TRANSFORMATION SEQUENCES
    // ----------------------
addTransformation(transformation) {
    this.transformationSequences.push({
        matrices: transformation.matrices,
        name: transformation.label || "",
        active: transformation.active  ,
        passive: transformation.passive ,
        nSteps: transformation.nSteps || 50,
        t: this.paused ? 1 : 0,    
        tStep: 1 / (transformation.nSteps || 50),
        freezeFrames: 60,
        endFreezeFrames: this.endFreezeFrames || 60,
        finished: false
    });
}
    // ----------------------
    // 4. DRAWING FUNCTIONS
    // ----------------------
    drawLine(p0, p1, color, widthLine=1, label="", labelColor=color){
        const cx0 = this.width/2 + p0[0]*this.scale;
        const cy0 = this.height/2 - p0[1]*this.scale;
        const cx1 = this.width/2 + p1[0]*this.scale;
        const cy1 = this.height/2 - p1[1]*this.scale;
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = widthLine;
        this.ctx.beginPath();
        this.ctx.moveTo(cx0, cy0);
        this.ctx.lineTo(cx1, cy1);
        this.ctx.stroke();
        // Draw the label above the line
        if (label) {
            const offset = 15; // pixels away from the line
            // Calculate line direction vector
            const dx = cx1 - cx0;
            const dy = cy1 - cy0;
            // Normalize perpendicular vector
            const length = Math.sqrt(dx*dx + dy*dy);
            const px = -dy / length; // perpendicular x
            const py = dx / length;  // perpendicular y
            // Position text near the end, offset above
            const textX = cx1 - 2*px * offset;
            const textY = cy1 - py * offset;
            
            this.ctx.save();
            this.ctx.font = "24px sans-serif";
            this.ctx.fillStyle = labelColor; 
            this.ctx.fillText(label, textX, textY);
            this.ctx.restore();
        }
    }

drawTransformedLine(p0, p1, color, widthLine=1, originalLabel="", isBaseVector=false, showLabel=true, isGridLine=false) {
    if (this.transformationSequences.length === 0) {
        return this.drawLine(p0, p1, color, widthLine, originalLabel, color);
    }

    let [x0, y0] = p0;
    let [x1, y1] = p1;

    let globalLabel = originalLabel;  // starts with originalLabel
    let labelToDraw = originalLabel;

    for (let seq of this.transformationSequences) {
        const step = Math.min(Math.floor(seq.t * seq.nSteps), seq.nSteps ); //not -1 ! it has nsteps
        let F = seq.matrices[step];
        if (seq.passive){
            if (!isBaseVector){
                F = [[1,0],[0,1]];
            }
        }
        if (seq.active && isGridLine) {
            F = [[1,0],[0,1]];
        }

        // Apply transformation
        const nx0 = F[0][0] * x0 + F[0][1] * y0;
        const ny0 = F[1][0] * x0 + F[1][1] * y0;
        const nx1 = F[0][0] * x1 + F[0][1] * y1;
        const ny1 = F[1][0] * x1 + F[1][1] * y1;
        [x0, y0] = [nx0, ny0];
        [x1, y1] = [nx1, ny1];

        if (seq.t < 1) {
            // Sequence is moving: show globalLabel only
            labelToDraw = globalLabel;
        } else {
            // Sequence finished: update globalLabel
            if (seq.active) {
                globalLabel = seq.name + globalLabel; // prepend active
            } else if (seq.passive) {
                globalLabel = `[${globalLabel}]` + seq.name; // wrap for passive
            } else {
                globalLabel = seq.name + globalLabel; // fallback
            }

            labelToDraw = globalLabel; // during end freeze
        }
    }
    if (!showLabel) {labelToDraw="";}

    this.drawLine([x0, y0], [x1, y1], color, widthLine, labelToDraw, color);
}

    // ----------------------
    // 5. GRID CREATION
    // ----------------------
    makeGridLines(gridColor, gridlineThickness, axesColor, axesThickness){
        const factor = 10;
        const xMin = -factor*this.width/(2*this.scale);
        const xMax =  factor*this.width/(2*this.scale);
        const yMin = -factor*this.height/(2*this.scale);
        const yMax =  factor*this.height/(2*this.scale);

        const lines = [];
        // Axes
        lines.push([[xMin,0],[xMax,0], axesColor, axesThickness]);
        lines.push([[0,yMin],[0,yMax], axesColor, axesThickness]);

        // Vertical grid lines
        for(let x=xMin;x<=xMax;x+=this.gridSpacing){
            if(x===0) continue;
            lines.push([[x,yMin],[x,yMax], gridColor, gridlineThickness]);
        }

        // Horizontal grid lines
        for(let y=yMin;y<=yMax;y+=this.gridSpacing){
            if(y===0) continue;
            lines.push([[xMin,y],[xMax,y], gridColor, gridlineThickness]);
        }
        return lines;
    }

    drawOriginalGrid(){
        for(let l of this.originalGridLines){
            this.drawLine(l[0],l[1],l[2],l[3]);
        }
    }

    drawTransformedGrid(){
        for(let l of this.transformedGridLines){
            this.drawTransformedLine(l[0],l[1],l[2],l[3], "",true, false, true);
        }
    }

    // ----------------------
    // 6. MAIN DRAW LOOP
    // ----------------------

    static(){
        this.paused = true;
        this.transformationSequences.forEach(seq => seq.t = 1);
    }

    dynamic(){
        this.paused = false;
        this.transformationSequences.forEach(seq => {
            seq.t = 0;
            seq.finished = false;
            seq.freezeFrames = 0;
        });
    }

    drawFrame(){
        this.ctx.clearRect(0,0,this.width,this.height);

        this.drawOriginalGrid();
        this.drawTransformedGrid();

        // Draw basis vectors i and j
        if (this.showBasisVectors) {
            this.drawTransformedLine([0,0], [1,0], "orange",3, "i", true );
            this.drawTransformedLine([0,0], [0,1], "orange",3, "j", true);
        }
    }

    // Animate fractional transform
    animate(){
        if(!this.paused){
            // Find the first sequence that is not finished
            const seq = this.transformationSequences.find(s => !s.finished);

            if(seq){
                if(seq.freezeFrames > 0){
                    // Freeze period at the end
                    seq.freezeFrames--;
                    if(seq.freezeFrames === 0) seq.finished = true;
                } else {
                    // Normal animation step
                    seq.t += seq.tStep;
                    if(seq.t >= 1){
                        seq.t = 1;
                        seq.freezeFrames = seq.endFreezeFrames ?? 60;
                    }
                }
            } else {
                // All sequences finished, optional auto-reset
                this.transformationSequences.forEach(s => {
                    s.t = 0;
                //    s.freezeFrames = 0;
                    s.finished = false;
                });
            }
        }

        this.drawFrame();
        requestAnimationFrame(this.animate);
    }
}
