import { UUID } from 'angular2-uuid';
import * as turf from '@turf/turf';

export function splitPolygonsByLines(polygons: any[], lines: any[]) {
  this.intersectingCoordinates = [];
  this.coordinateMatches = [];
  const linesWithIntersections = this.insertIntersectingCoordsInLines(lines);
  let splitPolygons = polygons.map(polygon => {
    return JSON.parse(JSON.stringify({
      id: UUID.UUID(),
      polygon
    }));
  });

  linesWithIntersections.forEach(line => {
    const newSplits = [];
    splitPolygons.forEach(split => {
      const splitResult = this.splitPolygonByLine(split.polygon, line);
      if (splitResult.length > 0) {
        newSplits.push({
          parent: split,
          children: splitResult
        });
      }
    });
    newSplits.forEach(split => {
      const parentIndex = splitPolygons.findIndex(parent => parent.id === split.parent.id);
      splitPolygons.splice(parentIndex, 1);
      // replace parent with children
      splitPolygons = [...splitPolygons.slice(0, parentIndex), ...split.children, ...splitPolygons.slice(parentIndex)];
    });
    this.splitPolygonsWithLines.push({
      line,
      splitPolygons
    });
  });
  const result = {
    polygons: splitPolygons.map(split => split.polygon),
    areas: polygons.map(polygon => ({
      polygon,
      area: turf.area(polygon)
    })),
    points: this.intersectingCoordinates
  };
  console.table(result.areas);
  return result;
}
export function splitPolygonByLine(polygon, line) {
  const result = [];
  const intersectingFeatures = turf.lineIntersect(polygon, line);
  const intersectingCoords = this.featurePointsToCoordinates(intersectingFeatures.features);
  if (intersectingCoords.length < 2 || intersectingCoords.length % 2 !== 0) {
    return []; // invalid intersection
  }
  this.intersectingCoordinates = [...this.intersectingCoordinates, ...intersectingCoords];
  const polygonInsertionResult = this.insertIntersectingCoords(polygon.coordinates[0], intersectingCoords);
  polygon.coordinates[0] = polygonInsertionResult.coords;
  const lineInsertionResult = this.insertIntersectingCoords(line.coordinates, intersectingCoords);
  line.coordinates = lineInsertionResult.coords;
  let coordIntersections = polygonInsertionResult.indexes.map(idx => ({
    coord: idx.coord,
    coordIdx: idx.sourceIndex,
    polygonIdx: idx.insertedIndex,
    lineIdx: undefined
  }));
  coordIntersections = coordIntersections.map(int => {
    int.lineIdx = lineInsertionResult.indexes
      .find(lineResult => JSON.stringify(lineResult.coord) === JSON.stringify(int.coord)).insertedIndex;
    return int;
  });
  for (let i = 0; i < coordIntersections.length; i += 2) {
    const newPolygons = this.makePolygons(polygon, coordIntersections[i], coordIntersections[coordIntersections.length - (i + 1)], line);
    if (newPolygons.length === 2) {
      newPolygons.forEach(poly => result.push({ id: UUID.UUID(), polygon: poly }));
    }
  }
  return result;
}
export function makePolygons(existingPolygon, sourceIntersection, destinationIntersection, line) {
  const lineStartIndex = sourceIntersection.lineIdx < destinationIntersection.lineIdx ?
    sourceIntersection.lineIdx : destinationIntersection.lineIdx;
  const lineEndIndex = sourceIntersection.lineIdx === lineStartIndex ? destinationIntersection.lineIdx : sourceIntersection.lineIdx;
  const lineSegment: any[] = line.coordinates.slice(lineStartIndex, lineEndIndex + 1);

  const upperCoords = existingPolygon.coordinates[0]
    .slice(sourceIntersection.polygonIdx, destinationIntersection.polygonIdx + 1);
  let lineForUpperPolygon;
  if (upperCoords.length === 0) {
    lineForUpperPolygon = JSON.parse(JSON.stringify(lineSegment));
    lineForUpperPolygon.push(lineForUpperPolygon[0]);
  } else if (JSON.stringify(upperCoords[upperCoords.length - 1]) === JSON.stringify(lineSegment[0])) {
    lineForUpperPolygon = JSON.parse(JSON.stringify(lineSegment.slice(1, lineSegment.length)));
  } else {
    lineForUpperPolygon = JSON.parse(JSON.stringify(lineSegment.reverse().slice(1, lineSegment.length)));
  }
  const upperPolygonCoords = [
    ...upperCoords,
    ...lineForUpperPolygon
  ];
  let lineForLowerPolygon;
  const lowerPolygonCoordsFirstHalf = existingPolygon.coordinates[0].slice(0, sourceIntersection.polygonIdx + 1);
  const lowerPolygonCoordsSecondHalf = existingPolygon.coordinates[0]
    .slice(destinationIntersection.polygonIdx + 1, existingPolygon.coordinates[0].length);
  if (JSON.stringify(lowerPolygonCoordsFirstHalf[lowerPolygonCoordsFirstHalf.length - 1]) === JSON.stringify(lineSegment[0])) {
    lineForLowerPolygon = lineSegment.slice(1, lineSegment.length);
  } else {
    lineForLowerPolygon = lineSegment.reverse().slice(1, lineSegment.length);
  }
  const lowerPolygonCoords = [
    ...lowerPolygonCoordsFirstHalf,
    ...lineForLowerPolygon,
    ...lowerPolygonCoordsSecondHalf
  ];
  const result = [];
  try {
    const upperPolygon = Object.assign({
      type: 'Polygon',
      coordinates: [upperPolygonCoords]
    })
    if (upperPolygon) {
      result.push(upperPolygon);
    }
  } catch (error) {
  }
  try {
    const lowerPolygon = Object.assign({
      type: 'Polygon',
      coordinates: [lowerPolygonCoords]
    });
    result.push(lowerPolygon);
  } catch (error) {

  }

  return result;
}
export function featurePointsToCoordinates(featurePoints: any[]) {
  return featurePoints.map(feature => {
    return feature.geometry.coordinates;
  });
}

export function insertIntersectingCoordsInLines(lines: any[]) {
  lines = JSON.parse(JSON.stringify(lines));
  const insertedPairs = [];
  for (let i = 0; i < lines.length; i++) {
    for (let j = 0; j < lines.length; j++) {
      if (i === j) {
        continue;
      }
      if (insertedPairs.some(pair => pair === `${j}${i}`)) {
        continue;
      }
      const intersection = turf.lineIntersect(lines[i], lines[j]);
      const intersectingPoints = this.featurePointsToCoordinates(intersection.features);
      lines[i].coordinates = this.insertIntersectingCoords(lines[i].coordinates, intersectingPoints).coords;
      lines[j].coordinates = this.insertIntersectingCoords(lines[j].coordinates, intersectingPoints).coords;
      insertedPairs.push(`${i}${j}`);
    }
  }
  return lines;
}

export function insertIntersectingCoords(coords: any[], insertingCoords: any[]) {
  const result = Object.assign({
    coords: JSON.parse(JSON.stringify(coords)),
    indexes: []
  });
  insertingCoords
    .filter(coord => !result.coords.some(pCoord => JSON.stringify(pCoord) === JSON.stringify(coord)))
    .forEach((coord, index) => {
      const coordIndex = this.findCoordIndex(coord, result.coords);
      if (coordIndex >= 0) {
        result.coords.splice(coordIndex + 1, 0, coord);
      }
    });
  insertingCoords.forEach((coord, i) => {
    const insertedIndex = result.coords.findIndex(rCoord => {
      const isFound = JSON.stringify(rCoord) === JSON.stringify(coord)
      return isFound;
    });
    if (insertedIndex >= 0) {
      result.indexes.push({
        coord,
        insertedIndex,
        sourceIndex: i
      });
    } else {
      result.indexes.push({
        coord,
        insertedIndex: result.coords.findIndex(pCoord => JSON.stringify(pCoord) === JSON.stringify(coord)),
        sourceIndex: i
      });
    }
  });
  return result;
}

export function findCoordIndex(coord, coordinates: any[]) {
  return coordinates.findIndex((co, i) => {
    const isFound = this.isTheCoordBetween(coordinates[i], coordinates[i + 1], coord);
    return isFound;
  });
}

export function isTheCoordBetween(source, destination, coord) {
  if (!source || !destination || !coord) {
    return false;
  }
  source = turf.point(source);
  destination = turf.point(destination);
  coord = turf.point(coord);
  const sourceToDestinationDistance = turf.distance(source, destination);
  const sourceToCoordDistance = turf.distance(source, coord);
  const destinationToCoordDistance = turf.distance(destination, coord);
  const sourceToCoodBearing = +turf.rhumbBearing(source, coord).toFixed(2);
  const sourceToDestinationBearing = +turf.rhumbBearing(source, destination).toFixed(2);
  const isBetween = sourceToCoodBearing === sourceToDestinationBearing &&
    sourceToDestinationDistance > sourceToCoordDistance && sourceToDestinationDistance > destinationToCoordDistance;
  return isBetween;
}