import { useEffect, useState, useCallback } from 'react';
import { getAllDogs } from '../db/dogs.js';
import { getSetting, setSetting } from '../db/settings.js';

const ACTIVE_DOG_KEY = 'activeDogId';

export function useDog() {
  const [dog, setDog] = useState(null);
  const [allDogs, setAllDogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const dogs = await getAllDogs();
    setAllDogs(dogs);

    if (dogs.length === 0) {
      setDog(null);
      setLoading(false);
      return;
    }

    const activeId = await getSetting(ACTIVE_DOG_KEY);
    let active = dogs.find((d) => d.id === activeId);

    if (!active) {
      active = dogs[0];
      await setSetting(ACTIVE_DOG_KEY, active.id);
    }

    setDog(active);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function switchDog(id) {
    await setSetting(ACTIVE_DOG_KEY, id);
    await load();
  }

  return { dog, allDogs, loading, reload: load, switchDog };
}