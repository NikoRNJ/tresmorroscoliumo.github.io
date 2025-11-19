
// Standalone reproduction script without external dependencies

// --- Minimal Date Utils ---

function parseISO(dateStr: string): Date {
    // YYYY-MM-DD
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
}

function format(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function isBefore(date1: Date, date2: Date): boolean {
    return date1.getTime() < date2.getTime();
}

// --- Logic from Codebase ---

function getDatesBetween(startDate: string, endDate: string): string[] {
    const dates: string[] = [];
    let currentDate = parseISO(startDate);
    const end = parseISO(endDate);

    // while (isBefore(currentDate, end))
    while (currentDate.getTime() < end.getTime()) {
        dates.push(format(currentDate));
        currentDate = addDays(currentDate, 1);
    }

    return dates;
}

function checkOverlap(
    existingStart: string,
    existingEnd: string,
    newStart: string,
    newEnd: string
): boolean {
    // Logic from apps/web/app/api/bookings/hold/route.ts
    // .lt('start_date', endDate)
    // .gt('end_date', startDate)

    // lt(start_date, newEnd) -> existingStart < newEnd
    // gt(end_date, newStart) -> existingEnd > newStart

    // String comparison works for ISO dates
    const condition1 = existingStart < newEnd;
    const condition2 = existingEnd > newStart;

    return condition1 && condition2;
}

// --- Test Scenarios ---

const scenarios = [
    {
        name: 'Standard Booking (Jan 1 - Jan 3)',
        existing: { start: '2025-01-01', end: '2025-01-03' },
        tests: [
            { new: { start: '2025-01-03', end: '2025-01-05' }, expectedOverlap: false, desc: 'Book after checkout' },
            { new: { start: '2024-12-30', end: '2025-01-01' }, expectedOverlap: false, desc: 'Book before checkin' },
            { new: { start: '2025-01-02', end: '2025-01-04' }, expectedOverlap: true, desc: 'Overlap checkout day' },
            { new: { start: '2025-01-01', end: '2025-01-02' }, expectedOverlap: true, desc: 'Overlap first night' },
            { new: { start: '2025-01-02', end: '2025-01-03' }, expectedOverlap: true, desc: 'Overlap second night' },
        ]
    },
    {
        name: 'Green Day Bug Scenario',
        existing: { start: '2025-02-10', end: '2025-02-12' }, // Occupies 10th and 11th. Checkout 12th.
        tests: [
            // User sees 12th as Green (Available). Tries to book 12th-14th.
            { new: { start: '2025-02-12', end: '2025-02-14' }, expectedOverlap: false, desc: 'Start on checkout day' },

            // User sees 9th as Green. Tries to book 9th-11th.
            // 9th is free. 10th is occupied.
            // Should overlap.
            { new: { start: '2025-02-09', end: '2025-02-11' }, expectedOverlap: true, desc: 'End inside existing booking' },
        ]
    }
];

console.log('Running Availability Logic Tests (Standalone)...\n');

scenarios.forEach(scenario => {
    console.log(`Scenario: ${scenario.name}`);
    console.log(`Existing Booking: ${scenario.existing.start} to ${scenario.existing.end}`);

    const occupiedDays = getDatesBetween(scenario.existing.start, scenario.existing.end);
    console.log(`Occupied Days (Calendar): ${occupiedDays.join(', ')}`);

    scenario.tests.forEach(test => {
        const overlap = checkOverlap(
            scenario.existing.start,
            scenario.existing.end,
            test.new.start,
            test.new.end
        );

        const status = overlap === test.expectedOverlap ? 'PASS' : 'FAIL';
        console.log(`  [${status}] ${test.desc} (${test.new.start} - ${test.new.end}): Overlap = ${overlap}`);

        if (status === 'FAIL') {
            console.error(`    Expected ${test.expectedOverlap}, got ${overlap}`);
        }

        if (overlap) {
            const startIsOccupied = occupiedDays.includes(test.new.start);
            if (!startIsOccupied) {
                console.warn(`    POTENTIAL BUG: Booking overlaps, but Start Date (${test.new.start}) is NOT marked as occupied!`);
                console.warn(`    This means the user sees it as GREEN but the server rejects it.`);
            }
        }
    });
    console.log('');
});
