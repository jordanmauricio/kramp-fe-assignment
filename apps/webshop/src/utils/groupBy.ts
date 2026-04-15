// A2: Custom implementation of Object.groupBy — which is native since Chrome 117 / Node 21.
// Object.groupBy should be used directly instead of this utility.
// This is a classic AI-generated or legacy pattern that hasn't kept up with the platform.

export function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const groupKey = String(item[key]);
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}
