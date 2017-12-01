import React, { Component } from 'react';
import {Line, Polygon, Bezier, Rectangle, Freehand} from './Shape.js';
import {CoincidentConstraint, ParallelLineConstraint, PerpendicularLineConstraint, VerticalLineConstraint, HorizontalLineConstraint, angle} from './GeometricConstraintSolver.js';

var c = require('cassowary');


const SELECT_DISTANCE = 7;

class DrawingLine extends React.Component {

  render() {
    let style = {
      fill: "none",
      strokeWidth: "1px",
      stroke: this.props.color,
      strokeLinejoin: "round",
      strokeLinecap: "round",
    }
    //console.log(this.props.line);
    const pathData = "M " + this.props.line.map(p => `${p['x']} ${p['y']}`);
    // console.log(pathData);
    // console.log(<path d={pathData} style={style}/>);
    return <path d={pathData} style={style}/>;
  }
}

class DrawingPath extends React.Component {
  render() {
    let style = {
      fill: "none",
      strokeWidth: "1px",
      stroke: this.props.color,
      strokeLinejoin: "round",
      strokeLinecap: "round",
    }
    // console.log(this.props.points);
    const pathData = "M " + this.props.points[0]['x'] + " " + this.props.points[0]['y'] +
                     " C " + this.props.points.slice(1).map(p => `${p['x']} ${p['y']}`);
    // console.log(pathData);
    // console.log(<path d={pathData} style={style}/>);
    return <path d={pathData} style={style}/>
  }
}


class Drawing extends React.Component {
  //TODO: MAYBE REFACTOR SO THAT BEZIERS AND OTHERS ARE DRAWN WITH THE SAME PROCESS
  render() {
    let shapeArray = this.props.shapes;
    let newShapeArray = this.props.newShapes;
    let lineArray = [];
    let lineArrayAndColor = [];
    let lineArrayAndEndpointColor = [];
    let lineArrayAndType = [];
    let color = "black";
    shapeArray.forEach((shape) => {
      if (!shape.rendersPath()) {
        if (shape.selected === true) {
          color = "blue";
        } else {
          color = "black";
        }
        let type = shape.shape_;
        let endpointColor = ["black", "black"]
        if (shape.p1_selected === true) {
          endpointColor[0] = "blue";
        }
        if (shape.p2_selected === true) {
          endpointColor[1] = "blue";
        }

        lineArray = lineArray.concat(shape.toLines());
        lineArrayAndColor = lineArrayAndColor.concat(shape.toLines().map(entry => color));
        lineArrayAndEndpointColor = lineArrayAndEndpointColor.concat(shape.toLines().map(entry => endpointColor));
        lineArrayAndType = lineArrayAndType.concat(shape.toLines().map(entry => type));
      }
    });

    newShapeArray.forEach((shape) => {
      if (!shape.rendersPath()) {
        if (shape.selected === true) {
          color = "blue";
        } else {
          color = "black";
        }
        let type = shape.shape_;
        let endpointColor = ["black", "black"]
        if (shape.p1_selected === true) {
          endpointColor[0] = "blue";
        }
        if (shape.p2_selected === true) {
          endpointColor[1] = "blue";
        }

        lineArray = lineArray.concat(shape.toLines());
        lineArrayAndColor = lineArrayAndColor.concat(shape.toLines().map(entry => color));
        lineArrayAndEndpointColor = lineArrayAndEndpointColor.concat(shape.toLines().map(entry => endpointColor));
        lineArrayAndType = lineArrayAndType.concat(shape.toLines().map(entry => type));
      }
    });

    //console.log(lineArrayAndType);

    let pathShapes = shapeArray.filter(shape => shape.rendersPath());
    // console.log(pathShapes);
    let pathsDrawing = pathShapes.map((shape, index) => (
      <DrawingPath key={index} points={shape.toPath()} color={shape.selected ? "blue" : "black"} selected={shape.selected}/>
    ));

    // lineArray = lineArray.concat(this.props.lines);

    //let freehandColors = this.props.lines.map(line => "black");

    // lineArrayAndColor = lineArrayAndColor.concat(freehandColors);

    // console.log(lineArray);
    // console.log(lineArrayAndColor);

    let style = {
      width: "100%",
      height: "100%",
    }

    // let freehandDrawing = this.props.lines.map((line, index) => (
    //       <DrawingLine key={index} line={line} color={freehandColors[index]}/>
    //     ))

    let drawing = <svg style={style}>
        {lineArray.map((line, index) => (
          <DrawingLine key={index} line={line} color={lineArrayAndColor[index]}/>
        ))}
        {lineArray.map((line, index) => {
          if (lineArrayAndType[index] !== "freehand" || lineArrayAndColor[index] === "blue") { //change to freehand to remove points from freehand lines
            return <circle key={index} cx={`${line[0].x}`} cy={`${line[0].y}`} r="2" fill={lineArrayAndEndpointColor[index][0]}/>
          } else {
            return
          }
        })}
        {lineArray.map((line, index) => {
          if (lineArrayAndType[index] !== "freehand" || lineArrayAndColor[index] === "blue") { //change to freehand to remove points from freehand lines
            return <circle key={index} cx={`${line[1].x}`} cy={`${line[1].y}`} r="2" fill={lineArrayAndEndpointColor[index][1]}/>
          } else {
            return
          }
        })}
        {/*freehandDrawing*/}
        {pathsDrawing}
        {pathShapes.map(shape => shape.toPath().map(point => {
          if (shape.selected || !shape.selected) { //TODO: bad style just want it to display for testing purposes
            return <circle cx={`${point.x}`} cy={`${point.y}`} r="2" fill={"blue"}/>
          }
        }))}

      </svg>

    let drawing2 = <svg style={style}>
          {this.props.shapes.map(shape => shape.svgRender())}
          {this.props.newShapes.map(shape => shape.svgRender())}
        </svg>

    return (
      drawing2
    )
  }
}


class DrawArea extends React.Component {
  constructor() {
    super();
    this.state = {
      isDrawing: false,
      tool: undefined,
      //lines: [], //will be a list of lists
      start: undefined,
      shapes: [], //will be a list of shapes
      selected: undefined, //will be whatever object is 'selected'
      constraints: [], //list of constraint objects
      pivotPoint: undefined,
      originalShapes: undefined,
      newShapes: [],
      selectedLines: [],
      selectedPoints: [],
      originalPoint: undefined,
      dragStart: undefined,
      onDragEndCallbacks: [],
      mouseDragged: false,

      solverPoints: [], //holds array of c.Point objects
      //file: undefined,
    };
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);

    this.solver = new c.SimplexSolver();
    //this.handleKeyPress = this.handleKeyPress.bind(this);
  }



  handleMouseDown(mouseEvent) {
    //console.log("mouse down");

    //helper functions
    let functionAverageX = (total, amount, index, array) => {
      if (index === 1) {
        total = total.x;
      }
      total += amount.x;
      if( index === array.length-1 ) {
        return total/array.length;
      }else {
        return total;
      }
    };

    let functionAverageY = (total, amount, index, array) => {
      if (index === 1) {
        total = total.y;
      }
      total += amount.y;
      if( index === array.length-1 ) {
        return total/array.length;
      }else {
        return total;
      }
    };
    //end of helper functions

    this.setState({
      mousedown: true,
    });
    if (mouseEvent.button !== 0) {
      return;
    }
    var point = this.relativeCoordinatesForEvent(mouseEvent);
    let oldShapes = this.state.shapes;

    switch (this.state.tool) {
      case "FREEHAND":

        let freehandCurve = new Freehand(point);
        oldShapes.push(freehandCurve);

        this.setState({
            shapes: oldShapes,
            isDrawing: true,
        });
        break;
      case "LINE": //TODO: Make function like Polygon but using constraints
        if (this.state.isDrawing) {
          this.solver.endEdit();
          this.setState({
            isDrawing: false
          })
        } else {
          //NEW STUFF
          let line = new Line(point, this.solver);
          this.solver
            .addEditVar(line.p2_.x)
            .addEditVar(line.p2_.y)
            .beginEdit();
          oldShapes.push(line);
          this.setState({
            shapes: oldShapes,
            isDrawing: true,
          });
            // console.log("shapes", this.state.shapes);


          //SOLVER STUFF
          //create c.Point(s)
          // let p1 = new c.Point(point.x, point.y);
          // let p2 = new c.Point(point.x, point.y);
          // //add points to solver
          // this.solver
          //   .addPointStays([p1, p2])
          //   .addEditVar(p2.x)
          //   .addEditVar(p2.y)
          //   .beginEdit();
          //
          // let oldPoints = this.state.solverPoints;
          // oldPoints.push(p1);
          // oldPoints.push(p2);
          // this.setState({
          //   solverPoints: oldPoints
          // });
        }
        break;
      case "POLYGON":
        if (this.state.isDrawing) {
          if (oldShapes[oldShapes.length -1].closed()) {
            // console.log('closed');
            this.setState({
              isDrawing: false,
            });
          } else {
            // console.log('not closed');
            oldShapes[oldShapes.length-1].addPoint(point);
            this.setState({
              shapes: oldShapes,
              //isDrawing: true, //this is redundant, but i may refactor later
            })
          }
        } else {
          let polygon = new Polygon(point);

          oldShapes.push(polygon);
          this.setState({
            shapes: oldShapes,
            isDrawing: true,
          });
        }
        break;
      case "RECTANGLE":
        let rectangle = new Rectangle(point);

        oldShapes.push(rectangle);

        this.setState({
          shapes: oldShapes,
          isDrawing: true,
        });

        break;
      case "BEZIER":
        //console.log(this.state.isDrawing);
        //console.log(this.state.shapes);
        if (this.state.isDrawing) {
          this.setState({
            isDrawing: false,
          });
        } else {
          let bezier = new Bezier(point, point, point, point);
          oldShapes.push(bezier);
          this.setState({
            shapes: oldShapes,
            isDrawing: true,
          });
        }
        break;
      case "EDIT": //need to be able to select points and lines
        // let selected = [];
        // let lines = this.state.selectedLines;
        // let sPoints = this.state.selectedPoints;
        // this.state.shapes.forEach((shape) => {  //todo: refactor forEach to some?
        //   let obj = shape.selectedObjectAt(point);
        //
        //   if (obj) {
        //     if (Array.isArray(obj)) {
        //       selected.push(obj[0]);
        //       selected.push(obj[1]);
        //
        //       if (selected[selected.length-1].shape_ === "line") {
        //         lines.push(obj[0]);
        //       } else {
        //         sPoints.push(obj[0]);
        //       }
        //     } else {
        //       selected.push(obj);
        //
        //       if (selected[selected.length-1].shape_ === "line") {
        //         lines.push(obj);
        //       } else {
        //         sPoints.push(obj);
        //       }
        //     }
        //     console.log(obj);
        //     //break
        //   }
        // });
        //
        // this.setState({
        //   selected: selected,
        //   selectedLines: lines,
        //   selectedPoints: sPoints,
        // });
        // //console.log('selectedLines', this.state.selectedLines);
        // break;
      case "SELECT":
        //click and drag
        let anySelected = false;
        this.state.shapes.forEach((shape) => {
          let callback = shape.selectObjectAt(point);
          if (callback) {
            let oldCallbacks = this.state.onDragEndCallbacks;
            oldCallbacks.push(callback);
            this.setState({onDragEndCallbacks: oldCallbacks});
            anySelected = true;
          }
        })
        console.log(anySelected);
        let selectedPoints = [];

        if (anySelected) {
          this.state.shapes.forEach(line => {
            if (line.shape_ === 'line') {
              selectedPoints = selectedPoints.concat(line.selectedPoints());
            }
          });
        } else {
          this.state.shapes.forEach(line => {
            if (line.shape_ === 'line') {
              line.deselect();
            }
          })
        }
        //console.log(selectedPoints);
        if (selectedPoints.length > 0) {
          selectedPoints.forEach(point => {
            this.solver.addEditVar(point.x)
                       .addEditVar(point.y);
          });
          this.solver.beginEdit();
        }

        this.setState({
          selectedPoints: selectedPoints,
          dragStart: point,
        });

        console.log('selected Points:', this.state.selectedPoints);

        // let selectedPoints = this.state.
        break;
      case "PAN":
      case "MOVE":
        var point = this.relativeCoordinatesForEvent(mouseEvent);
        let originalShapes = [];
        this.state.shapes.forEach(shape => {
          let newShape = undefined;
          switch (shape.shape_) {   //different shapes can be added here
            case "freehand":
            case "polygon":
              newShape = new Polygon;
              break;
            case "rectangle":
              newShape = new Rectangle;
              break;
            case "line":
              console.log("shape: ", shape.toLine());
              newShape = new Line({x:100,y:100}, this.solver);
              break;
          }
          newShape = Object.assign( Object.create( Object.getPrototypeOf(shape)), shape);
          originalShapes.push(newShape);
        })
        this.setState({pivotPoint:point, originalShapes:originalShapes});
        break;
      case "SCALE":
      case "ROTATE":
        originalShapes = [];
        let originalPoint = this.relativeCoordinatesForEvent(mouseEvent);
        let points = [];

        this.state.shapes.forEach(shape => {
          let newShape = undefined;
          switch (shape.shape_) {   //different shapes can be added here
            case "freehand":
            case "polygon":
              newShape = new Polygon;
              break;
            case "rectangle":
              newShape = new Rectangle;
              break;
            case "line":
              newShape = new Line({x:100,y:100}, this.solver);
              break;
          }

          if (shape.selected) {
            //points = (shape.shape_ === "line") ? points.concat(shape.points()) : points.concat(shape.points());
            points = points.concat(shape.toLine());
          }

          newShape = Object.assign( Object.create( Object.getPrototypeOf(shape)), shape);
          originalShapes.push(newShape);
        })

        let averageX = points.length > 1 ? points.reduce(functionAverageX) : undefined;
        let averageY = points.length > 1 ? points.reduce(functionAverageY) : undefined;

        let pivotPoint = {x:averageX, y:averageY}
        //console.log(pivotPoint);

        this.setState({pivotPoint:pivotPoint, originalShapes:originalShapes, originalPoint:originalPoint});
        break;
      case "ZOOMIN":
      case "ZOOMOUT":
        // originalShapes = [];
        // points = [];
        //
        // this.state.shapes.forEach(shape => {
        //   let newShape = undefined;
        //   switch (shape.shape_) {   //different shapes can be added here
        //     case "freehand":
        //     case "polygon":
        //       newShape = new Polygon;
        //       break;
        //     case "rectangle":
        //       newShape = new Rectangle;
        //       break;
        //     case "line":
        //       console.log(shape);
        //       newShape = new Line;
        //       break;
        //   }
        //
        //   //points = (shape.shape_ === "line") ? points.concat(shape.points()) : points.concat(shape.points());
        //   points = points.concat(shape.points());
        //
        //   newShape = Object.assign( Object.create( Object.getPrototypeOf(shape)), shape);
        //   originalShapes.push(newShape);
        // })
        //
        // averageX = points.length > 1 ? points.reduce(functionAverageX) : undefined;
        // averageY = points.length > 1 ? points.reduce(functionAverageY) : undefined;
        //
        // pivotPoint = {x:320, y:240} //320 and 240 is center for now, could use object centers {x:averageX, y:averageY}
        // //console.log("pivot point",pivotPoint);
        //
        // let newShapes = [];
        // var pivot = pivotPoint;
        //
        // let factor = undefined;
        //
        // if (this.state.tool === "ZOOMOUT") {
        //   factor = .9;
        // } else if (this.state.tool === "ZOOMIN") {
        //   factor = 1.1;
        // }
        //
        // // console.log("scale factor",factor);
        // //
        // // console.log(originalShapes);
        //
        // if (originalShapes.length > 0) {
        //   originalShapes.forEach((shape) => {
        //
        //     const functionScale = (factor, shape) => {
        //       let newShape = undefined;
        //       switch (shape.shape_) {   //different shapes can be added here
        //         case "freehand":
        //         case "polygon":
        //           newShape = new Polygon;
        //           break;
        //         case "rectangle":
        //           newShape = new Rectangle;
        //           break;
        //         case "line":
        //           newShape = new Line;
        //           break;
        //       }
        //
        //       newShape = Object.assign( Object.create( Object.getPrototypeOf(shape)), shape);
        //
        //       let newPoints = newShape.points().map(shapePoint => { //TODO: fix for line
        //         //console.log(pivot);
        //         let angle = this.functionGetAngle(shapePoint, pivot) + Math.PI;
        //         let dist = this.distance(shapePoint, pivot);
        //         let newPoint = {x:pivot.x+Math.cos(angle)*factor*dist, y:pivot.y+Math.sin(angle)*factor*dist};
        //         return newPoint;
        //       })
        //
        //         newShape.points(newPoints);
        //
        //         return newShape;
        //       }
        //
        //     let newShape = functionScale(factor, shape);
        //
        //     newShapes.push(newShape);
        //
        //   });
        // };
        //
        // this.setState({newShapes: newShapes});

        break;
      default:
        return;
    }

  }

  distanceSquared(p1, p2) {
    return (p1.x - p2.x)**2 + (p1.y - p2.y)**2;
  }

  distance(p1, p2) {
    return Math.sqrt((p1.x - p2.x)**2 + (p1.y - p2.y)**2);
  }

  relativeCoordinatesForEvent(mouseEvent) {
    const boundingRect = this.refs.drawArea.getBoundingClientRect();
    return {
      x: mouseEvent.clientX - boundingRect.left,
      y: mouseEvent.clientY - boundingRect.top,
    };
  }

  isPointOrArrayOfPoints(shape) {
    if (Array.isArray(shape)===true) {
      let result = shape.map(point => {return point.x !== undefined && point.y !== undefined;})
      return result.every(entry => entry===true)
    } else {
      return shape.x !== undefined && shape.y !== undefined;
    }
  }

  functionGetAngle(p1, p2) {return Math.atan2(p2.y - p1.y, p2.x - p1.x);}

  handleMouseMove(mouseEvent) {
    //console.log("mouse move");
    this.constraintUpdate(); //TODO: MOVE THIS?

    var point = this.relativeCoordinatesForEvent(mouseEvent);
    if (!this.state.isDrawing) {
      switch (this.state.tool) {
        case "SELECT":
          //console.log('selected Points 2:', this.state.selectedPoints);
          if (this.state.mousedown === true) {
            var point = this.relativeCoordinatesForEvent(mouseEvent);
            let dx = point.x - this.state.dragStart.x;
            let dy = point.y - this.state.dragStart.y;

            console.log('selectedPoints: ', this.state.selectedPoints);
            this.state.selectedPoints.forEach(sPoint => {
              // console.log(sPoint);
              // console.log(this.solver._editVarList);
              this.solver.suggestValue(sPoint.x, sPoint.x.value + dx)
                         .suggestValue(sPoint.y, sPoint.y.value + dy)
                         .resolve();
            });

            this.setState({
              dragStart: point,
              mouseDragged: true,
            });
          }

        break;
        case "EDIT": //TODO: change this to use coincident constraint with pointer
          // if (this.state.mousedown && this.state.selected) {
          //   // console.log("input", point)
          //   for (var i=0; i < this.state.selected.length; i++) {
          //     if (this.isPointOrArrayOfPoints(this.state.selected[i])) {
          //       if (Array.isArray(this.state.selected[i]) === false) {
          //         this.state.selected[i].x = point.x;
          //         this.state.selected[i].y = point.y;
          //         this.setState({});
          //       } else {
          //         for (var j=0; j < this.state.selected[i].length; j++) {
          //           this.state.selected[i][j].x = point.x;
          //           this.state.selected[i][j].y = point.y;
          //           this.setState({});
          //         }
          //       }
          //     }
          //   }
          // }


          // this.state.lines.map((line, index) => {
          //   var point = this.relativeCoordinatesForEvent(mouseEvent);
          //   let d1 = this.distanceSquared(line[0], point)**(1/2);
          //   let d2 = this.distanceSquared(line[1], point)**(1/2);
          //   let total = this.distanceSquared(line[0], line[1])**(1/2);
          //   // console.log(d1+d2);
          //   // console.log("total", total)
          //
          //   //doesnt work for freehand lines
          //   if ((d1 + d2) < (total+1) || (d1 + d2) < (total-1)) {
          //     // console.log(index);
          //   }
          //
          // })
          break;
        case "PAN":
        case "MOVE":
          if (this.state.mousedown === true) {
            var point = this.relativeCoordinatesForEvent(mouseEvent);
            let newShapes = [];

            this.state.originalShapes.forEach((shape) => {
              if (shape.selected) {
                let newShape = Object.assign( Object.create( Object.getPrototypeOf(shape)), shape);

                let newPoints = newShape.toLine().map(shapePoint => {
                    return ({x:shapePoint.x+(point.x-this.state.pivotPoint.x), y:shapePoint.y+(point.y-this.state.pivotPoint.y)}) //denomiator sets speed of movement
                  });
                newShape.pointsToCPoints(newPoints, this.solver);
                newShapes.push(newShape);

              }
            // this.state.originalShapes.forEach((shape) => {
            //   if (this.state.tool === "PAN" || shape.selected) {
            //     let newShape = undefined;
            //     switch (shape.shape_) {   //different shapes can be added here
            //       case "freehand":
            //       case "polygon":
            //         newShape = new Polygon;
            //         break;
            //       case "rectangle":
            //         newShape = new Rectangle;
            //         break;
            //       case "line":
            //         newShape = new Line({x:undefined,y:undefined}, this.solver);
            //         break;
            //     }
            //
            //     newShape = Object.assign( Object.create( Object.getPrototypeOf(shape)), shape);
            //     let newPoints = newShape.toLine().map(shapePoint => {
            //       //console.log(point.x-this.state.pivotPoint.x, point.y-this.state.pivotPoint.y)
            //       return ({x:shapePoint.x+(point.x-this.state.pivotPoint.x), y:shapePoint.y+(point.y-this.state.pivotPoint.y)}) //denomiator sets speed of movement
            //     });
            //     //console.log(newPoints);
            //     newShape.pointsToCPoints(newPoints, this.solver);
            //     newShapes.push(newShape);
            //   }
            });

            if (this.state.tool === "PAN") {
              this.setState({shapes: newShapes, newShapes:[]});
              break;
            } else if (this.state.tool === "MOVE") {
              this.setState({newShapes: newShapes});
            }

            //console.log(newShapes)
          }
          break;
        case "ROTATE":
          const functionRotate = (angle, pivot, shape) => {
            let newShape = Object.assign( Object.create( Object.getPrototypeOf(shape)), shape);

            let newPoints = newShape.toLine().map(shapePoint => { //TODO: fix for lines to points()

              let distanceToPivot = this.distance(shapePoint, pivot);
              let angleWithPivot = this.functionGetAngle(shapePoint, pivot);
              let delta = angleWithPivot + angle + Math.PI;

              let newPoint = {x:pivot.x+Math.cos(delta)*distanceToPivot, y:pivot.y+Math.sin(delta)*distanceToPivot};
              //console.log(angleWithPivot);

              //let newPoint = {x:100, y:100};
              return newPoint;
            })

              newShape.pointsToCPoints(newPoints, this.solver);

              return newShape;
            }

          if (this.state.mousedown === true) {
            let newShapes = [];

            var point = this.relativeCoordinatesForEvent(mouseEvent);
            let ogPoint = this.state.originalPoint;
            let pivot = this.state.pivotPoint;
            let ogAngle = this.functionGetAngle(ogPoint, pivot);
            let newAngle = this.functionGetAngle(point, pivot);
            //console.log(newAngle - ogAngle);

            //functionRotate(newAngle - ogAngle, pivot, this.state.originalShapes[0]);

            this.state.originalShapes.forEach((shape) => {
              if (shape.selected) {
                let newShape = functionRotate(newAngle - ogAngle, pivot, shape);
                //console.log(newShape);
                newShapes.push(newShape);
              }
            });
            //console.log(newShapes, this.state.shapes);
            this.setState({newShapes: newShapes});

            }
          break;
        case "SCALE":
          if (this.state.mousedown === true) {
            let newShapes = [];

            let ogPoint = this.state.originalPoint;
            var pivot = this.state.pivotPoint;

            let factor = this.distance(point, pivot)/this.distance(ogPoint, pivot); // if point is inside shape factor should be less than 1

            //console.log("scale factor",factor);

            this.state.originalShapes.forEach((shape) => {
              if (shape.selected) {

                const functionScale = (factor, shape) => {
                  let newShape = Object.assign( Object.create( Object.getPrototypeOf(shape)), shape);

                  let newPoints = newShape.toLine().map(shapePoint => {
                    let angle = this.functionGetAngle(shapePoint, pivot) + Math.PI;
                    let dist = this.distance(shapePoint, pivot);
                    let newPoint = {x:pivot.x+Math.cos(angle)*factor*dist, y:pivot.y+Math.sin(angle)*factor*dist};
                    return newPoint;
                  })

                    newShape.pointsToCPoints(newPoints, this.solver);

                    return newShape;
                  }

                let newShape = functionScale(factor, shape);

                newShapes.push(newShape);
              }
            });

            this.setState({newShapes: newShapes});

            }
          break;
        default:
          return;
      }
    }

    var point = this.relativeCoordinatesForEvent(mouseEvent);
    let oldShapes = this.state.shapes;
    //let oldState = this.state.lines;

    switch (this.state.tool) {
      case "LINE":
        var lastLine = oldShapes[oldShapes.length - 1];
        this.solver
          .suggestValue(lastLine.p2_.x, point.x)
          .suggestValue(lastLine.p2_.y, point.y)
          .resolve();
        this.setState({});

        //NEW STUFF
        // var lastPoint = this.state.solverPoints[this.state.solverPoints.length-1];
        // this.solver
        //   .suggestValue(lastPoint.x, point.x)
        //   .suggestValue(lastPoint.y, point.y)
        //   .resolve();
        // console.log(lastPoint.x);


        //OLD STUFF
        // oldShapes[oldShapes.length - 1].p2(point); //update second point of line
        // this.setState({  //TODO: FACTOR THIS OUT OF ALL CASES?
        //   shapes: oldShapes,
        // });
      break;

      case "BEZIER":
      case "RECTANGLE":
        //console.log(this.state.isDrawing);
        if (!this.state.isDrawing) {break;};
      case "POLYGON":
        oldShapes[oldShapes.length -1].lastPoint(point); //update the last point of the polygon
        this.setState({
          shapes: oldShapes,
        });
        break;
      case "FREEHAND":
        // console.log("old: ", oldState);
        // var lastLine = oldState[oldState.length - 1];  //this can't be a 'let' declaration because it's defined above
        //                                               //I thought it wouldn't matter because JavaScript does everything at runtime
        //                                               //but React seems to have a compile-like phase
        // lastLine.push(point);
        //
        // var temp = oldState.slice(0,oldState.length - 1)
        // temp.push(lastLine);
        //
        // var newState = temp;
        //
        // // console.log("new: ", newState)
        //
        // this.setState({
        //     lines: newState,
        // });
        oldShapes[oldShapes.length - 1].lastPoint(point);
        this.setState({
          shapes: oldShapes,
        });
        break;
      default:
        return;
    }
  }

  handleMouseUp(mouseEvent) {
    let inCanvas = mouseEvent.srcElement ? mouseEvent.srcElement.localName : false;
    let inCanvasBoolean = inCanvas === "svg";
    let oldShapes = this.state.shapes;
    // console.log("mouse up");
    // console.log(inCanvasBoolean);

    this.setState({
      mousedown: false,
    })

    if (inCanvasBoolean || this.state.tool === "POLYGON" || this.state.tool === "RECTANGLE" || this.state.tool === "FREEHAND" || this.state.tool === "SELECT") { //this is a hack not sure why it is neccesary
      //console.log(this.state.tool);
      switch (this.state.tool) {
        case "FREEHAND":
          this.setState({ isDrawing: false });
          break;
        case "SELECT":
          //console.log("ender");
          this.solver.endEdit();
          console.log("dragged", this.state.mouseDragged);
          if (!this.state.mouseDragged) {
              this.state.onDragEndCallbacks.forEach(callback => callback());
          }
          this.setState({
            mouseDragged: false,
            onDragEndCallbacks: [],
          });
          break;
        case "EDIT":
          //console.log(this.state.selected);
          break;
        case "POLYGON": //close polygon using constraints
          let lastShape = oldShapes[oldShapes.length -1];
          let b = oldShapes.length > 0 ? lastShape.closed() : false;

          if (b) {
            let points = lastShape.points();
            let lp = points.length;
            let oldConstraints = this.state.constraints;
            let c = CoincidentConstraint(points[0], points[lp-1]);
            oldConstraints.push(c);
            this.setState({
              constraints: oldConstraints,
            });
            this.constraintUpdate();
          }
          break;
        case "LINE":
          //do nothing
          break;
        case "RECTANGLE":
          //console.log("mouse going up");
          this.setState({ isDrawing: false });
          break;
        case "ROTATE": // fall-through, or statement doesn't work
        case "SCALE":
        case "MOVE":
          let unselectedShapes = [];
          this.state.shapes.forEach(shape => {
            if (shape.selected === false) {
              unselectedShapes.push(shape);
            }
          })
          let allShapes = this.state.newShapes.concat(unselectedShapes);
          this.setState( {shapes: allShapes} );
          break;
        case "PAN":
          //console.log(this.state.shapes);
          break;
        case "ZOOMOUT":
        case "ZOOMIN":
          this.setState( {shapes: this.state.newShapes} );
          break
        default:
          return;
      }
    }
  }

  onClickTool(toolName) {
    this.setState({
      tool: toolName
    });
  }

  onClickNoTool() {
    this.setState({
        tool: undefined,
    });
  }


//------------------------constraints------------------------


  test() {
    //testing
    let selected = this.state.selected;
    let sPoints = this.state.selectedPoints;
    let p = sPoints.length;
    let lines = this.state.selectedLines;
    let l = lines.length;

    console.log("selected", selected);
    console.log("lines", lines);
    console.log("points", sPoints);

    if (p >= 2) {
      let c = CoincidentConstraint(sPoints[p-1], sPoints[p-2]);
      console.log(c);
    }

    if (l >= 2) {
      console.log("ready to roll")

      let a = angle(lines[l-1], lines[l-2]) /(2*Math.PI) * 360; //in degrees
      if (a < 0) { a = 180 + a};
      //if (a === 0) {a = 90};
      console.log(a);
    }
    //end of testing
  }

  coincident() { //assumes selected is a point
    let points = this.state.selectedPoints;
    let pl = points.length;


    if (pl === 2) {
      var eq = new c.Equation(points[pl-1].x, new c.Expression(points[0].x));
      var eq2 = new c.Equation(points[pl-1].y, new c.Expression(points[0].y));

      this.solver.addConstraint(eq)
                 .addConstraint(eq2)
    }
    //cle = c.Expression.fromConstant(db[0].y).plus(db[1].y).divide(2);
    //cleq = new c.Equation(mp[0].y, cle);

    //solver.addConstraint(cleq);
    // let sPoints = this.state.selectedPoints;
    // let p = sPoints.length;
    //
    // let oldConstraints = this.state.constraints;
    // let c = CoincidentConstraint(sPoints[p-1], sPoints[p-2]);
    // oldConstraints.push(c);
    // this.setState({
    //   constraints: oldConstraints,
    // });
    // this.constraintUpdate();
  }

  horizontal() { //assumes selected is a line
    // this.state.selected.p2_.y = this.state.selected.p1_.y;
    this.state.selectedLines[this.state.selectedLines.length-1].angle(0);
    this.setState({}); //call render
  }

  makeHorizontal() {
    let oldConstraints = this.state.constraints;
    let c = HorizontalLineConstraint(this.state.selectedLines[this.state.selectedLines.length-1]);
    oldConstraints.push(c);
    this.setState({
      constraints: oldConstraints,
    });
    this.constraintUpdate();
  }

  makeVertical() {
    let oldConstraints = this.state.constraints;
    let c = VerticalLineConstraint(this.state.selectedLines[this.state.selectedLines.length-1]);
    oldConstraints.push(c);
    this.setState({
      constraints: oldConstraints,
    });
    this.constraintUpdate();
  }

  makeParallel() {
    let oldConstraints = this.state.constraints;
    let c = ParallelLineConstraint(this.state.selectedLines[this.state.selectedLines.length-2], this.state.selectedLines[this.state.selectedLines.length-1]);
    oldConstraints.push(c);
    this.setState({
      constraints: oldConstraints,
    });
    this.constraintUpdate();
  }

  makePerpendicular() {
    let oldConstraints = this.state.constraints;
    let c = PerpendicularLineConstraint(this.state.selectedLines[this.state.selectedLines.length-2], this.state.selectedLines[this.state.selectedLines.length-1]);
    oldConstraints.push(c);
    this.setState({
      constraints: oldConstraints,
    });
    this.constraintUpdate();
  }

//------------------------component mount functions------------------------
  componentDidMount() {
    document.addEventListener("mouseup", this.handleMouseUp);
  }

  componentWillUnmount() {
    document.removeEventListener("mouseup", this.handleMouseUp);
  }

//------------------------------------------------

  handleDownload() {
    let filename = "test.svg";
    let shapeArray = this.state.shapes;
    let lineArray = [];
    shapeArray.forEach((shape) => {
      lineArray = lineArray.concat(shape.toLines());
    });

    //lineArray = lineArray.concat(this.state.lines);

    let svgString = lineArray.map(line => `<path d="M ${line.map(p => `${p['x']} ${p['y']}`)}" stroke-linejoin="round" stroke-linecap="round" stroke-width="1px" stroke="black" fill="none"/>`);

    let text = `<svg
      width="640"
      height="480"
      xmlns="http://www.w3.org/2000/svg"
      xmlns:svg="http://www.w3.org/2000/svg">
      ${svgString.join("")}
    </svg>`
    var pom = document.createElement('a');
    pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    pom.setAttribute('download', filename);

    if (document.createEvent) {
        var event = document.createEvent('MouseEvents');
        event.initEvent('click', true, true);
        pom.dispatchEvent(event);
    }
    else {
        pom.click();
    }
  }

  handleSave() {
    let filename = "test.txt";
    let state = this.state;
    let text = JSON.stringify(state);

    // console.log(state);
    // console.log(text);
    // console.log(Object.getOwnPropertyNames(state.shapes[0]))

    var pom = document.createElement('a');
    pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    pom.setAttribute('download', filename);

    if (document.createEvent) {
        var event = document.createEvent('MouseEvents');
        event.initEvent('click', true, true);
        pom.dispatchEvent(event);
    }
    else {
        pom.click();
    }
  }

  handleUpload(e) { //only works for polygons -shapes- now, needs to maintain constraints as well
    e.preventDefault();
    let files = e.target.files;
    let file = files[0];
    let loadedFileIntoState = [];

    var self = this;
    //console.log(this.state)
    let stateLoaded = (stateOfInterest) => {
      if (stateOfInterest.length === 1) {
        let oldState = JSON.parse(stateOfInterest[0]);
        let state = this.state;
        let oldShapes = oldState.shapes;

        let newShapes = oldShapes.map(oldShape => {
          //console.log(oldShape.shape_);
          let newShape = undefined;

          switch (oldShape.shape_) {   //different shapes can be added here
            case "freehand":
            case "polygon":
              newShape = new Polygon;
              break;
            case "rectangle":
              newShape = new Rectangle;
              break;
          }

          newShape = Object.assign( Object.create( Object.getPrototypeOf(newShape)), oldShape); //this is so we maintain class methods
          return newShape
        })

        this.setState({
          isDrawing: false,
          tool: undefined,
          //lines: [], //will be a list of lists
          start: undefined,
          shapes: [], //will be a list of shapes
          selected: undefined, //will be whatever object is 'selected'
          constraints: [], //list of constraint objects
          pivotPoint: undefined,
          originalShapes: undefined,
          newShapes: [],
          selectedLines: [],
          selectedPoints: [],
          originalPoint: undefined,
        });

        this.setState({shapes:newShapes});
      } else {
        //console.log("come again!");
        stateLoaded(stateOfInterest);
      }
    }

    var reader = new FileReader();
    reader.onload = (event) => {
        const file = event.target.result;
        const allLines = file.split(/\r\n|\n/);
        // Reading line by line
        allLines.map((line) => {
            //console.log(line);
            loadedFileIntoState.push(line);
            stateLoaded(loadedFileIntoState);
        });
    };

    reader.readAsText(files[0]);
    //console.log(loadedFileIntoState);
    //this.setState(loadedFileIntoState[0]);
  }

  constraintUpdate() {
    let changed = false;
    this.state.constraints.forEach((constraint) => {
      changed = changed || constraint.satisfy();
    });

    if (changed) {

      this.setState({}); //re-render
    }
  }

// hotkeys
  handleKeyPress(e) {
    let code = (e.keyCode ? e.keyCode : e.which);
    console.log(code);
    switch (code) {
      case 13: //enter
        switch (this.state.tool) {
          case "POLYGON":
              this.setState({isDrawing:false})
            break;
          default:
            return;
        }
        break;
      case 27: //esc
        switch (this.state.tool) {
          case "POLYGON":
              let oldShapes = this.state.shapes;
              let lastShape = oldShapes[oldShapes.length -1];
              //console.log("lastShape", lastShape);

              let points = lastShape.points().slice(0, lastShape.points().length - 1);
              //console.log("lastShape Points", points);

              lastShape.points(points);
              //console.log("oldShapes", oldShapes);

              this.setState({
                isDrawing:false,
              })
            break;
          default:
            return;
        }
        break;
      case 80: //p
        this.setState({tool:"POLYGON"})
        break;
      case 70: //f
        this.setState({tool:"FREEHAND"})
        break;
      case 69: //e
        this.setState({tool:"EDIT"})
        break;
      case 65: //a
        this.setState({tool:"SELECT"})
        break;
      case 77: //m
        this.setState({tool:"MOVE"})
        break;
      case 82: //r
        this.setState({tool:"ROTATE"})
        break;
      case 83: //s
        this.setState({tool:"SCALE"})
        break;
      case 187: //+
        this.setState({tool:"ZOOMIN"})
        break;
      case 189: //-
        this.setState({tool:"ZOOMOUT"})
        break;
      case 72: //h
        this.setState({tool:"PAN"})
        break;
      case 8: //delete
        let unselectedShapes = [];
        this.state.shapes.forEach(shape => {
          if (shape.selected === false) {
            unselectedShapes.push(shape);
          }
        })
        this.setState( {shapes: unselectedShapes, newShapes:[]} );
        break;
      case 84: //test
        //console.log(this.state.file)
        break;
      default:
        return;
    }
  }

  render() {
    this.solver.resolve;
    let pointer = "";

    switch (this.state.tool) { //tooltips
      case "FREEHAND":
        pointer = "crosshair";
        break;
      case "POLYGON":
        pointer = "crosshair";
        break;
      case "EDIT":
        pointer = "default";
        break;
      case "MOVE":
        pointer = "move";
        break;
      case "ROTATE":
        pointer = "alias";
        break;
      case "SELECT":
        pointer = "default";
        break;
      case "ZOOMIN":
        pointer = "zoom-in";
        break;
      case "ZOOMOUT":
        pointer = "zoom-out";
        break;
      case "SCALE":
        pointer = "nwse-resize";
        break;
      case "PAN":
        pointer = "all-scroll";
        break;
      default:
        pointer = "crosshair";
    }

    // console.log("drawing: ", this.state.isDrawing);
    // console.log("state: ",this.state.lines);
    let drawAreaStyle = {
      width: "500px",
      height: "500px",
      border: "1px solid black",
      float: "left",
      cursor: pointer,
      float: "left",
    }

    let activeButtonStyle = {
      outline: "none",
      boxSizing: "border-box",
      borderTop: "none",
      background: "#EBBC14",
      padding: "4px 8px",
      borderRadius: "8px",
      boxShadow: "none",
      textShadow: "none",
      color: "#000000",
      fontSize: "12px",
      fontFamily: "Helvetica",
      textDecoration: "none",
      verticalAlign: "middle",
    }

    let inactiveButtonStyle = {
      outline: "none",
      boxSizing: "border-box",
      borderTop: "none",
      background: "#add8e6",
      padding: "4px 8px",
      borderRadius: "8px",
      boxShadow: "none",
      textShadow: "none",
      color: "#000000",
      fontSize: "12px",
      fontFamily: "Helvetica",
      textDecoration: "none",
      verticalAlign: "middle",
    }

    let defaultButtonStyle = {
      outline: "none",
      boxSizing: "border-box",
      borderTop: "none",
      background: "#A38FDF",
      padding: "4px 8px",
      borderRadius: "8px",
      boxShadow: "none",
      textShadow: "none",
      color: "#000000",
      fontSize: "12px",
      fontFamily: "Helvetica",
      textDecoration: "none",
      verticalAlign: "middle",
    }

    let downloadButtonStyle = {
      outline: "none",
      boxSizing: "border-box",
      borderTop: "none",
      background: "#E6926E",
      padding: "4px 8px",
      borderRadius: "8px",
      boxShadow: "none",
      textShadow: "none",
      color: "#000000",
      fontSize: "12px",
      fontFamily: "Helvetica",
      textDecoration: "none",
      verticalAlign: "middle",
    }


    //let's consolidate line and polygon tool to polyline
    //<tr><td><button style={this.state.tool === "LINE" ? activeButtonStyle : inactiveButtonStyle} onClick={(e) => this.onClickLine(e)}>Line</button></td></tr>

    return (
      <div>
        <div
          style={drawAreaStyle}
          ref="drawArea"
          onMouseDown={this.handleMouseDown}
          onMouseMove={this.handleMouseMove}
          onMouseUp={this.handleMouseUp}
          onKeyDown={(e) => this.handleKeyPress(e)}
          tabIndex="0"
        >
          <Drawing shapes={this.state.shapes}
                   newShapes={this.state.newShapes}/>
        </div>

        <table style={{float:"left"}}>
          <tbody>
            <tr><td><b>Tools</b></td></tr>
            <tr><td><button style={this.state.tool === "LINE" ? activeButtonStyle : inactiveButtonStyle} onClick={(e) => this.onClickTool("LINE")}>Line</button></td></tr>
            <tr><td><button style={this.state.tool === "FREEHAND" ? activeButtonStyle : inactiveButtonStyle} onClick={(e) => this.onClickTool("FREEHAND")}>Free Hand</button></td></tr>
            <tr><td><button style={this.state.tool === "RECTANGLE" ? activeButtonStyle : inactiveButtonStyle} onClick={(e) => this.onClickTool("RECTANGLE")}>Rectangle</button></td></tr>
            <tr><td><button style={this.state.tool === "POLYGON" ? activeButtonStyle : inactiveButtonStyle} onClick={(e) => this.onClickTool("POLYGON")}>Polygon</button></td></tr>
            <tr><td><button style={this.state.tool === "BEZIER" ? activeButtonStyle : inactiveButtonStyle} onClick={(e) => this.onClickTool("BEZIER")}>Bezier</button></td></tr>
            <tr><td><button style={this.state.tool === "EDIT" ? activeButtonStyle : inactiveButtonStyle} onClick={(e) => this.onClickTool("EDIT")}>Edit</button></td></tr>
            <tr><td><button style={this.state.tool === "SELECT" ? activeButtonStyle : inactiveButtonStyle} onClick={(e) => this.onClickTool("SELECT")}>Select</button></td></tr>
            <tr><td><button style={this.state.tool === "MOVE" ? activeButtonStyle : inactiveButtonStyle} onClick={(e) => this.onClickTool("MOVE")}>Move</button></td></tr>
            <tr><td><button style={this.state.tool === "ROTATE" ? activeButtonStyle : inactiveButtonStyle} onClick={(e) => this.onClickTool("ROTATE")}>Rotate</button></td></tr>
            <tr><td><button style={this.state.tool === "SCALE" ? activeButtonStyle : inactiveButtonStyle} onClick={(e) => this.onClickTool("SCALE")}>Scale</button></td></tr>
            <tr><td><button style={this.state.tool === "ZOOMIN" ? activeButtonStyle : inactiveButtonStyle} onClick={(e) => this.onClickTool("ZOOMIN")}>Zoom In</button></td></tr>
            <tr><td><button style={this.state.tool === "ZOOMOUT" ? activeButtonStyle : inactiveButtonStyle} onClick={(e) => this.onClickTool("ZOOMOUT")}>Zoom Out</button></td></tr>
            <tr><td><button style={this.state.tool === "PAN" ? activeButtonStyle : inactiveButtonStyle} onClick={(e) => this.onClickTool("PAN")}>Pan</button></td></tr>
            <tr><td><button style={this.state.tool === undefined ? activeButtonStyle : inactiveButtonStyle} onClick={(e) => this.onClickNoTool(e)}>No Tool</button></td></tr>
            <tr><td><b>Constraints</b></td></tr>
            <tr>
              <td>
                <button style={defaultButtonStyle} onClick={(e) => {}}>TODO: Dimension</button>
                <button style={defaultButtonStyle} onClick={(e) => this.coincident(e)}>Coincident</button>
              </td>
            </tr>
            <tr>
              <td>
                <button style={defaultButtonStyle} onClick={(e) => this.makeHorizontal(e)}>Horizontal</button>
                <button style={defaultButtonStyle} onClick={(e) => this.makeVertical(e)}>Vertical</button>
                <button style={defaultButtonStyle} onClick={(e) => this.test(e)}>Test</button>
              </td>
            </tr>
            <tr>
              <td>
                <button style={defaultButtonStyle} onClick={(e) => this.makeParallel(e)}>Parallel</button>
                <button style={defaultButtonStyle} onClick={(e) => this.makePerpendicular(e)}>Perpendicular</button>
                <button style={defaultButtonStyle} onClick={(e) => this.test(e)}>TODO: Fixed</button>
              </td>
            </tr>
            <tr><td><b>File</b></td></tr>
            <tr><td><button style={downloadButtonStyle} onClick={(e) => this.handleDownload(e)}>Download SVG</button></td></tr>
            <tr><td><button style={downloadButtonStyle} onClick={(e) => this.handleSave(e)}>Save</button></td></tr>
            <tr><td><div style={downloadButtonStyle}>Upload: <input type="file" name="uploadedFile" onChange={(e) => this.handleUpload(e)}/></div></td></tr>
            <tr><td><a href="http://fabmodules.org/" target="_blank" style={downloadButtonStyle}>fab modules</a></td></tr>
          </tbody>
        </table>
      </div>
    );
  }
}

// <form onSubmit={(e) => this.handleUpload(e)}>
//     <button style={downloadButtonStyle}>Upload</button>
//     <input type="file" name="uploadedFile" />
// </form>

class App extends Component {
  render() {
    // <canvas style={canvasStyle} width="490" height="220">
    //   {document.write(svg)}
    // </canvas>

    return (
      <div>
        <DrawArea/>
      </div>
    );
  }
}

export default App;
