// src/contexts/DogContext.jsx
import { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { getAllDogs } from '../db/dogs.js';
import { getSetting, setSetting } from '../db/settings.js';
import { useAuth } from './AuthContext.jsx';

const ACTIVE_DOG_KEY = 'activeDogId';
const DogContext = createContext(null);

export function DogProvider({ children }) {
  const { user, household } = useAuth();

  const [dog, setDog] = useState(null);
  const [allDogs, setAllDogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!household?.id || !user?.uid) {
      setDog(null);
      setAllDogs([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const dogs = await getAllDogs(household.id);
      setAllDogs(dogs);

      if (dogs.length === 0) {
        setDog(null);
        setLoading(false);
        return;
      }

      const activeId = await getSetting(user.uid, ACTIVE_DOG_KEY);
      let active = dogs.find(d => d.id === activeId);

      if (!active) {
        active = dogs[0];
        await setSetting(user.uid, ACTIVE_DOG_KEY, active.id);
      }

      setDog(active);
    } catch (error) {
      console.error('Failed to load dogs:', error);
      setDog(null);
      setAllDogs([]);
    }
    setLoading(false);
  }, [household?.id, user?.uid]);

  useEffect(() => {
    load();
  }, [load]);

  async function switchDog(id) {
    if (!user?.uid) return;
    await setSetting(user.uid, ACTIVE_DOG_KEY, id);
    await load();
  }

  return (
    <DogContext.Provider value={{ dog, allDogs, loading, reload: load, switchDog }}>
      {children}
    </DogContext.Provider>
  );
}

export function useDog() {
  return useContext(DogContext);
}