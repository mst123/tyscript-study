"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
exports.isTheCoordBetween = exports.findCoordIndex = exports.insertIntersectingCoords = exports.insertIntersectingCoordsInLines = exports.featurePointsToCoordinates = exports.makePolygons = exports.splitPolygonByLine = exports.splitPolygonsByLines = void 0;
var angular2_uuid_1 = require("angular2-uuid");
var turf = require("@turf/turf");
function splitPolygonsByLines(polygons, lines) {
    var _this = this;
    this.intersectingCoordinates = [];
    this.coordinateMatches = [];
    var linesWithIntersections = this.insertIntersectingCoordsInLines(lines);
    var splitPolygons = polygons.map(function (polygon) {
        return JSON.parse(JSON.stringify({
            id: angular2_uuid_1.UUID.UUID(),
            polygon: polygon
        }));
    });
    linesWithIntersections.forEach(function (line) {
        var newSplits = [];
        splitPolygons.forEach(function (split) {
            var splitResult = _this.splitPolygonByLine(split.polygon, line);
            if (splitResult.length > 0) {
                newSplits.push({
                    parent: split,
                    children: splitResult
                });
            }
        });
        newSplits.forEach(function (split) {
            var parentIndex = splitPolygons.findIndex(function (parent) { return parent.id === split.parent.id; });
            splitPolygons.splice(parentIndex, 1);
            // replace parent with children
            splitPolygons = __spreadArrays(splitPolygons.slice(0, parentIndex), split.children, splitPolygons.slice(parentIndex));
        });
        _this.splitPolygonsWithLines.push({
            line: line,
            splitPolygons: splitPolygons
        });
    });
    var result = {
        polygons: splitPolygons.map(function (split) { return split.polygon; }),
        areas: polygons.map(function (polygon) { return ({
            polygon: polygon,
            area: turf.area(polygon)
        }); }),
        points: this.intersectingCoordinates
    };
    console.table(result.areas);
    return result;
}
exports.splitPolygonsByLines = splitPolygonsByLines;
function splitPolygonByLine(polygon, line) {
    var result = [];
    var intersectingFeatures = turf.lineIntersect(polygon, line);
    var intersectingCoords = this.featurePointsToCoordinates(intersectingFeatures.features);
    if (intersectingCoords.length < 2 || intersectingCoords.length % 2 !== 0) {
        return []; // invalid intersection
    }
    this.intersectingCoordinates = __spreadArrays(this.intersectingCoordinates, intersectingCoords);
    var polygonInsertionResult = this.insertIntersectingCoords(polygon.coordinates[0], intersectingCoords);
    polygon.coordinates[0] = polygonInsertionResult.coords;
    var lineInsertionResult = this.insertIntersectingCoords(line.coordinates, intersectingCoords);
    line.coordinates = lineInsertionResult.coords;
    var coordIntersections = polygonInsertionResult.indexes.map(function (idx) { return ({
        coord: idx.coord,
        coordIdx: idx.sourceIndex,
        polygonIdx: idx.insertedIndex,
        lineIdx: undefined
    }); });
    coordIntersections = coordIntersections.map(function (int) {
        int.lineIdx = lineInsertionResult.indexes
            .find(function (lineResult) { return JSON.stringify(lineResult.coord) === JSON.stringify(int.coord); }).insertedIndex;
        return int;
    });
    for (var i = 0; i < coordIntersections.length; i += 2) {
        var newPolygons = this.makePolygons(polygon, coordIntersections[i], coordIntersections[coordIntersections.length - (i + 1)], line);
        if (newPolygons.length === 2) {
            newPolygons.forEach(function (poly) { return result.push({ id: angular2_uuid_1.UUID.UUID(), polygon: poly }); });
        }
    }
    return result;
}
exports.splitPolygonByLine = splitPolygonByLine;
function makePolygons(existingPolygon, sourceIntersection, destinationIntersection, line) {
    var lineStartIndex = sourceIntersection.lineIdx < destinationIntersection.lineIdx ?
        sourceIntersection.lineIdx : destinationIntersection.lineIdx;
    var lineEndIndex = sourceIntersection.lineIdx === lineStartIndex ? destinationIntersection.lineIdx : sourceIntersection.lineIdx;
    var lineSegment = line.coordinates.slice(lineStartIndex, lineEndIndex + 1);
    var upperCoords = existingPolygon.coordinates[0]
        .slice(sourceIntersection.polygonIdx, destinationIntersection.polygonIdx + 1);
    var lineForUpperPolygon;
    if (upperCoords.length === 0) {
        lineForUpperPolygon = JSON.parse(JSON.stringify(lineSegment));
        lineForUpperPolygon.push(lineForUpperPolygon[0]);
    }
    else if (JSON.stringify(upperCoords[upperCoords.length - 1]) === JSON.stringify(lineSegment[0])) {
        lineForUpperPolygon = JSON.parse(JSON.stringify(lineSegment.slice(1, lineSegment.length)));
    }
    else {
        lineForUpperPolygon = JSON.parse(JSON.stringify(lineSegment.reverse().slice(1, lineSegment.length)));
    }
    var upperPolygonCoords = __spreadArrays(upperCoords, lineForUpperPolygon);
    var lineForLowerPolygon;
    var lowerPolygonCoordsFirstHalf = existingPolygon.coordinates[0].slice(0, sourceIntersection.polygonIdx + 1);
    var lowerPolygonCoordsSecondHalf = existingPolygon.coordinates[0]
        .slice(destinationIntersection.polygonIdx + 1, existingPolygon.coordinates[0].length);
    if (JSON.stringify(lowerPolygonCoordsFirstHalf[lowerPolygonCoordsFirstHalf.length - 1]) === JSON.stringify(lineSegment[0])) {
        lineForLowerPolygon = lineSegment.slice(1, lineSegment.length);
    }
    else {
        lineForLowerPolygon = lineSegment.reverse().slice(1, lineSegment.length);
    }
    var lowerPolygonCoords = __spreadArrays(lowerPolygonCoordsFirstHalf, lineForLowerPolygon, lowerPolygonCoordsSecondHalf);
    var result = [];
    try {
        var upperPolygon = Object.assign({
            type: 'Polygon',
            coordinates: [upperPolygonCoords]
        });
        if (upperPolygon) {
            result.push(upperPolygon);
        }
    }
    catch (error) {
    }
    try {
        var lowerPolygon = Object.assign({
            type: 'Polygon',
            coordinates: [lowerPolygonCoords]
        });
        result.push(lowerPolygon);
    }
    catch (error) {
    }
    return result;
}
exports.makePolygons = makePolygons;
function featurePointsToCoordinates(featurePoints) {
    return featurePoints.map(function (feature) {
        return feature.geometry.coordinates;
    });
}
exports.featurePointsToCoordinates = featurePointsToCoordinates;
function insertIntersectingCoordsInLines(lines) {
    lines = JSON.parse(JSON.stringify(lines));
    var insertedPairs = [];
    var _loop_1 = function (i) {
        var _loop_2 = function (j) {
            if (i === j) {
                return "continue";
            }
            if (insertedPairs.some(function (pair) { return pair === "" + j + i; })) {
                return "continue";
            }
            var intersection = turf.lineIntersect(lines[i], lines[j]);
            var intersectingPoints = this_1.featurePointsToCoordinates(intersection.features);
            lines[i].coordinates = this_1.insertIntersectingCoords(lines[i].coordinates, intersectingPoints).coords;
            lines[j].coordinates = this_1.insertIntersectingCoords(lines[j].coordinates, intersectingPoints).coords;
            insertedPairs.push("" + i + j);
        };
        for (var j = 0; j < lines.length; j++) {
            _loop_2(j);
        }
    };
    var this_1 = this;
    for (var i = 0; i < lines.length; i++) {
        _loop_1(i);
    }
    return lines;
}
exports.insertIntersectingCoordsInLines = insertIntersectingCoordsInLines;
function insertIntersectingCoords(coords, insertingCoords) {
    var _this = this;
    var result = Object.assign({
        coords: JSON.parse(JSON.stringify(coords)),
        indexes: []
    });
    insertingCoords
        .filter(function (coord) { return !result.coords.some(function (pCoord) { return JSON.stringify(pCoord) === JSON.stringify(coord); }); })
        .forEach(function (coord, index) {
        var coordIndex = _this.findCoordIndex(coord, result.coords);
        if (coordIndex >= 0) {
            result.coords.splice(coordIndex + 1, 0, coord);
        }
    });
    insertingCoords.forEach(function (coord, i) {
        var insertedIndex = result.coords.findIndex(function (rCoord) {
            var isFound = JSON.stringify(rCoord) === JSON.stringify(coord);
            return isFound;
        });
        if (insertedIndex >= 0) {
            result.indexes.push({
                coord: coord,
                insertedIndex: insertedIndex,
                sourceIndex: i
            });
        }
        else {
            result.indexes.push({
                coord: coord,
                insertedIndex: result.coords.findIndex(function (pCoord) { return JSON.stringify(pCoord) === JSON.stringify(coord); }),
                sourceIndex: i
            });
        }
    });
    return result;
}
exports.insertIntersectingCoords = insertIntersectingCoords;
function findCoordIndex(coord, coordinates) {
    var _this = this;
    return coordinates.findIndex(function (co, i) {
        var isFound = _this.isTheCoordBetween(coordinates[i], coordinates[i + 1], coord);
        return isFound;
    });
}
exports.findCoordIndex = findCoordIndex;
function isTheCoordBetween(source, destination, coord) {
    if (!source || !destination || !coord) {
        return false;
    }
    source = turf.point(source);
    destination = turf.point(destination);
    coord = turf.point(coord);
    var sourceToDestinationDistance = turf.distance(source, destination);
    var sourceToCoordDistance = turf.distance(source, coord);
    var destinationToCoordDistance = turf.distance(destination, coord);
    var sourceToCoodBearing = +turf.rhumbBearing(source, coord).toFixed(2);
    var sourceToDestinationBearing = +turf.rhumbBearing(source, destination).toFixed(2);
    var isBetween = sourceToCoodBearing === sourceToDestinationBearing &&
        sourceToDestinationDistance > sourceToCoordDistance && sourceToDestinationDistance > destinationToCoordDistance;
    return isBetween;
}
exports.isTheCoordBetween = isTheCoordBetween;
