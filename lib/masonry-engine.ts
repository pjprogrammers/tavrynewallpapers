export interface MasonryPosition {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface MasonryLayout {
  positions: MasonryPosition[];
  containerHeight: number;
  columnCount: number;
}

export function getColumnCount(containerWidth: number): number {
  if (containerWidth < 480) return 2;
  if (containerWidth < 640) return 2;
  if (containerWidth < 768) return 2;
  if (containerWidth < 1024) return 3;
  if (containerWidth < 1280) return 4;
  return 5;
}

export function getColumnWidth(
  containerWidth: number,
  columnCount: number,
  gap: number
): number {
  return (containerWidth - (columnCount - 1) * gap) / columnCount;
}

function findShortestColumn(columnHeights: number[], itemIndex: number): number {
  const min = Math.min(...columnHeights);
  const max = Math.max(...columnHeights);
  const range = max - min;

  // Soft balancing: when columns are near-equal, distribute round-robin
  // to prevent runs of same-aspect-ratio images from creating visual imbalance
  if (range < 60) {
    return itemIndex % columnHeights.length;
  }

  return columnHeights.indexOf(min);
}

export function computeMasonryLayout(
  items: { aspectRatio: number }[],
  columnCount: number,
  columnWidth: number,
  gap: number,
  existingHeights?: number[]
): MasonryLayout {
  if (columnWidth <= 0 || columnCount <= 0) {
    return { positions: [], containerHeight: 0, columnCount };
  }

  const columnHeights = existingHeights
    ? [...existingHeights]
    : new Array(columnCount).fill(0);

  const positions: MasonryPosition[] = [];

  for (let i = 0; i < items.length; i++) {
    const minCol = findShortestColumn(columnHeights, i);
    const height = columnWidth * items[i].aspectRatio;

    positions.push({
      left: minCol * (columnWidth + gap),
      top: columnHeights[minCol],
      width: columnWidth,
      height,
    });

    columnHeights[minCol] += height + gap;
  }

  return {
    positions,
    containerHeight: Math.max(...columnHeights, 0),
    columnCount,
  };
}

export function getWallpaperAspectRatio(wallpaper: {
  width?: number;
  height?: number;
  aspectRatio?: string;
}): number {
  if (wallpaper.width && wallpaper.height) {
    return wallpaper.height / wallpaper.width;
  }
  if (wallpaper.aspectRatio) {
    const parts = wallpaper.aspectRatio.split(":");
    if (parts.length === 2) {
      const w = parseFloat(parts[0]);
      const h = parseFloat(parts[1]);
      if (w > 0 && h > 0) {
        return h / w;
      }
    }
  }
  return 1.5;
}

export function hashIdToColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 25%, 22%)`;
}
