const countLeaveDays = (start_date, end_date, duration) => {
  if (duration === 'first_half' || duration === 'second_half') {
    return 0.5;
  }

  const start = new Date(start_date);
  const end   = new Date(end_date);

  // count every calendar day start to end inclusive
  // sandwich days (Sundays, off Saturdays, holidays) in between are automatically counted
  const diffMs = end - start;
  const days   = Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1;

  return days;
};