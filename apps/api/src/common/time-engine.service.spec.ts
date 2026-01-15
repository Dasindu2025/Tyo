import { TimeEngineService } from './time-engine.service';

describe('TimeEngineService', () => {
  let service: TimeEngineService;

  beforeEach(() => {
    service = new TimeEngineService();
  });

  it('should split an entry that crosses midnight', () => {
    const start = new Date('2026-01-10T22:00:00Z');
    const end = new Date('2026-01-11T02:00:00Z');
    
    const segments = service.splitEntryByDay(start, end);
    
    expect(segments).toHaveLength(2);
    expect(formatDate(segments[0].date)).toBe('2026-01-10');
    expect(segments[0].durationMinutes).toBe(120);
    expect(formatDate(segments[1].date)).toBe('2026-01-11');
    expect(segments[1].durationMinutes).toBe(120);
  });

  it('should calculate breakdown correctly', () => {
    const start = new Date('2026-01-10T17:00:00'); // 5 PM
    const end = new Date('2026-01-10T23:00:00');   // 11 PM
    
    const rules = [
      { name: 'Day', start: '08:00', end: '18:00' },
      { name: 'Evening', start: '18:00', end: '22:00' },
      { name: 'Night', start: '22:00', end: '08:00' },
    ];
    
    const breakdown = service.calculateBreakdown(start, end, rules);
    
    expect(breakdown.day).toBe(1);      // 17:00 - 18:00
    expect(breakdown.evening).toBe(4);  // 18:00 - 22:00
    expect(breakdown.night).toBe(1);    // 22:00 - 23:00
  });

  function formatDate(date: Date) {
    return date.toISOString().split('T')[0];
  }
});
