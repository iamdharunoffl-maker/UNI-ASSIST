export const isActive = (item) =>
  String(item?.status || '').toLowerCase() === 'active';
