export function calculateCentroid(seats: any[]) {
  if (!seats.length) return null;

  const sumX = seats.reduce((a, s) => a + s.posX, 0);
  const sumY = seats.reduce((a, s) => a + s.posY, 0);

  return {
    x: sumX / seats.length,
    y: sumY / seats.length,
  };
}

export function distance(seat: any, centroid: { x: number; y: number }) {
  return Math.sqrt(
    Math.pow(seat.posX - centroid.x, 2) +
    Math.pow(seat.posY - centroid.y, 2)
  );
}