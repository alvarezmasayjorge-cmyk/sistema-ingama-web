import { useState, useEffect } from 'react';
import { validateSchema, SCHEMAS } from '../validators';

export function useLocalStorage(key, initialValue, schemaKey = null) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (!item) return initialValue;

      const parsed = JSON.parse(item);

      // Si se proporcionó schemaKey, validar estructura
      if (schemaKey && SCHEMAS[schemaKey]) {
        const result = validateSchema(parsed, SCHEMAS[schemaKey]);
        if (!result.valid) {
          console.warn(
            `[useLocalStorage] Datos corruptos en "${key}". Se filtraron ${result.filtered || "varios"} items inválidos.`
          );
          // Si quedó vacío después de filtrar, volver a iniciales
          if (Array.isArray(result.data) && result.data.length === 0) {
            return initialValue;
          }
          return result.data;
        }
      }

      return parsed;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}
