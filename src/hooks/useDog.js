import {
  useEffect,
  useState,
  useCallback
} from 'react';

import { getAllDogs } from '../db/dogs.js';
import { getSetting, setSetting } from '../db/settings.js';
import { useAuth } from '../contexts/AuthContext.jsx';

const ACTIVE_DOG_KEY = 'activeDogId';

export function useDog() {
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
      console.log('Loading dogs for household:', household.id);

      const dogs = await getAllDogs(household.id);

      console.log('Dogs loaded:', dogs);

      setAllDogs(dogs);

      if (dogs.length === 0) {
        console.log('No dogs found for household:', household.id);
        setDog(null);
        setLoading(false);
        return;
      }

      console.log('Loading active dog for user:', user.uid);

      const activeId = await getSetting(
        user.uid,
        ACTIVE_DOG_KEY
      );

      console.log('Active dog ID for user:', user.uid, 'is', activeId);

      let active = dogs.find(
        d => d.id === activeId
      );

      console.log('Active dog for user:', user.uid, 'is', active);

      if (!active) {
        active = dogs[0];

        console.log('No active dog found, setting first dog as active for user:', user.uid, 'to', active.id);

        await setSetting(
          user.uid,
          ACTIVE_DOG_KEY,
          active.id
        );

        console.log('Active dog set for user:', user.uid, 'to', active.id);
      }

      setDog(active);

      console.log('Dog state updated for user:', user.uid, 'to', active);

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

    await setSetting(
      user.uid,
      ACTIVE_DOG_KEY,
      id
    );

    await load();
  }

  return {
    dog,
    allDogs,
    loading,
    reload: load,
    switchDog
  };
}