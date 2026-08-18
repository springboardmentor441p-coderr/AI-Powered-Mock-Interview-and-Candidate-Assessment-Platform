export const MALE_AVATAR = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80";
export const FEMALE_AVATAR = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80";

export const getAvatarForUser = (gender, name = '') => {
  if (gender) {
    const g = String(gender).toLowerCase();
    if (g === 'male' || g === 'm') return MALE_AVATAR;
    if (g === 'female' || g === 'f') return FEMALE_AVATAR;
  }
  const n = String(name).toLowerCase();
  const femaleKeywords = [
    'sarah', 'priya', 'advika', 'jessica', 'emma', 'sophia', 'emily', 'anna',
    'mary', 'maria', 'elena', 'lisa', 'laura', 'rachel', 'patricia', 'jennifer',
    'elizabeth', 'hannah', 'chloe', 'samantha', 'amanda', 'kate', 'katie'
  ];
  if (femaleKeywords.some(k => n.includes(k))) {
    return FEMALE_AVATAR;
  }
  return MALE_AVATAR;
};
