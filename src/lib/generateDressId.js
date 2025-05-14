import { nanoid } from 'nanoid';
import slugify from 'slugify';

export const generateDressId = (name, brand) => {
  const base = slugify(`${brand}-${name}`, { lower: true, strict: true });
  return `MuG-${base}-${nanoid(6).toUpperCase()}`;
};
