export function getPronouns(dog) {
  const isMale = dog?.sex === 'male';

  return isMale
    ? { subject: 'he', object: 'him', possessive: 'his', Subject: 'He', Object: 'Him', Possessive: 'His' }
    : { subject: 'she', object: 'her', possessive: 'her', Subject: 'She', Object: 'Her', Possessive: 'Her' };
}