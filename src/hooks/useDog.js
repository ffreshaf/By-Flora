import { useEffect, useState } from 'react';
import { getAllDogs } from '../db/dogs.js';

export function useDog() {
  const [dog, setDog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const dogs = await getAllDogs();
    setDog(dogs[0] || null);
    setLoading(false);
  }

  return { dog, loading, reload: load };
}