/**
 * Liturgical Calendar System for Cúria Digital
 * Sistema de Calendário Litúrgico com cores e leituras
 */

class LiturgicalCalendar {
    constructor() {
        this.currentSeason = this.getCurrentLiturgicalSeason();
        this.init();
    }

    init() {
        this.updateDailyInfo();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Update calendar daily at midnight
        this.scheduleDaily();
    }

    scheduleDaily() {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        const msUntilMidnight = tomorrow.getTime() - now.getTime();
        
        setTimeout(() => {
            this.updateDailyInfo();
            // Set up daily recurring update
            setInterval(() => this.updateDailyInfo(), 24 * 60 * 60 * 1000);
        }, msUntilMidnight);
    }

    updateDailyInfo() {
        const today = new Date();
        this.updateDate(today);
        this.updateLiturgicalSeason(today);
        this.updateDailyReadings(today);
        this.updateUpcomingCelebrations();
    }

    updateDate(date) {
        const dateElement = document.getElementById('today-date');
        if (dateElement) {
            dateElement.textContent = date.toLocaleDateString('pt-BR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        }
    }

    updateLiturgicalSeason(date) {
        const season = this.getCurrentLiturgicalSeason(date);
        const seasonElement = document.getElementById('liturgical-season');
        const colorElement = document.getElementById('liturgical-color');

        if (seasonElement) {
            seasonElement.textContent = season.name;
        }

        if (colorElement) {
            colorElement.className = `liturgical-color ${season.color}`;
        }
    }

    getCurrentLiturgicalSeason(date = new Date()) {
        const year = date.getFullYear();
        const month = date.getMonth() + 1; // JavaScript months are 0-indexed
        const day = date.getDate();

        // Calculate Easter date for the current year
        const easter = this.calculateEaster(year);
        
        // Advent (4 Sundays before Christmas)
        const adventStart = this.getAdventStart(year);
        const christmas = new Date(year, 11, 25); // December 25
        
        // Christmas season ends on Epiphany (January 6)
        const epiphany = new Date(year + 1, 0, 6);
        
        // Lent starts on Ash Wednesday (47 days before Easter)
        const ashWednesday = new Date(easter);
        ashWednesday.setDate(easter.getDate() - 47);
        
        // Holy Week starts on Palm Sunday
        const palmSunday = new Date(easter);
        palmSunday.setDate(easter.getDate() - 7);
        
        // Easter season lasts 50 days until Pentecost
        const pentecost = new Date(easter);
        pentecost.setDate(easter.getDate() + 49);

        const currentDate = new Date(year, month - 1, day);

        // Check liturgical seasons in order
        if (currentDate >= adventStart && currentDate < christmas) {
            return { name: 'Advento', color: 'purple' };
        } else if (currentDate >= christmas && currentDate <= epiphany) {
            return { name: 'Natal', color: 'white' };
        } else if (currentDate >= ashWednesday && currentDate < palmSunday) {
            return { name: 'Quaresma', color: 'purple' };
        } else if (currentDate >= palmSunday && currentDate < easter) {
            return { name: 'Semana Santa', color: 'red' };
        } else if (currentDate >= easter && currentDate <= pentecost) {
            return { name: 'Páscoa', color: 'white' };
        } else {
            return { name: 'Tempo Comum', color: 'green' };
        }
    }

    calculateEaster(year) {
        // Algorithm to calculate Easter date
        const a = year % 19;
        const b = Math.floor(year / 100);
        const c = year % 100;
        const d = Math.floor(b / 4);
        const e = b % 4;
        const f = Math.floor((b + 8) / 25);
        const g = Math.floor((b - f + 1) / 3);
        const h = (19 * a + b - d - g + 15) % 30;
        const i = Math.floor(c / 4);
        const k = c % 4;
        const l = (32 + 2 * e + 2 * i - h - k) % 7;
        const m = Math.floor((a + 11 * h + 22 * l) / 451);
        const month = Math.floor((h + l - 7 * m + 114) / 31);
        const day = ((h + l - 7 * m + 114) % 31) + 1;
        
        return new Date(year, month - 1, day);
    }

    getAdventStart(year) {
        const christmas = new Date(year, 11, 25);
        const christmasDay = christmas.getDay(); // 0 = Sunday, 1 = Monday, etc.
        
        // Find the 4th Sunday before Christmas
        let daysToSubtract = christmasDay === 0 ? 28 : (christmasDay + 21);
        
        const adventStart = new Date(christmas);
        adventStart.setDate(christmas.getDate() - daysToSubtract);
        
        return adventStart;
    }

    updateDailyReadings(date) {
        // In a real implementation, this would fetch from a liturgical calendar API
        // For now, we'll use sample readings based on the season
        const season = this.getCurrentLiturgicalSeason(date);
        const readings = this.getSampleReadings(season, date);

        const firstReadingEl = document.getElementById('first-reading');
        const psalmEl = document.getElementById('psalm-reading');
        const secondReadingEl = document.getElementById('second-reading');
        const gospelEl = document.getElementById('gospel-reading');

        if (firstReadingEl) firstReadingEl.textContent = readings.firstReading;
        if (psalmEl) psalmEl.textContent = readings.psalm;
        if (secondReadingEl) secondReadingEl.textContent = readings.secondReading || '-';
        if (gospelEl) gospelEl.textContent = readings.gospel;
    }

    getSampleReadings(season, date) {
        const dayOfWeek = date.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday

        // Sample readings based on liturgical season
        const readings = {
            'Advento': {
                firstReading: 'Is 2,1-5',
                psalm: 'Sl 121',
                secondReading: isWeekend ? 'Rm 13,11-14' : '',
                gospel: 'Mt 24,37-44'
            },
            'Natal': {
                firstReading: 'Is 9,1-6',
                psalm: 'Sl 95',
                secondReading: isWeekend ? 'Tt 2,11-14' : '',
                gospel: 'Lc 2,1-14'
            },
            'Quaresma': {
                firstReading: 'Gn 2,7-9; 3,1-7',
                psalm: 'Sl 50',
                secondReading: isWeekend ? 'Rm 5,12-19' : '',
                gospel: 'Mt 4,1-11'
            },
            'Semana Santa': {
                firstReading: 'Is 50,4-7',
                psalm: 'Sl 21',
                secondReading: isWeekend ? 'Fl 2,6-11' : '',
                gospel: 'Mt 26,14-27'
            },
            'Páscoa': {
                firstReading: 'At 2,14.22-33',
                psalm: 'Sl 15',
                secondReading: isWeekend ? '1Pd 1,17-21' : '',
                gospel: 'Lc 24,13-35'
            },
            'Tempo Comum': {
                firstReading: 'Eclo 27,5-8',
                psalm: 'Sl 91',
                secondReading: isWeekend ? '1Cor 15,54-58' : '',
                gospel: 'Lc 6,39-45'
            }
        };

        return readings[season.name] || readings['Tempo Comum'];
    }

    updateUpcomingCelebrations() {
        const celebrations = this.getUpcomingCelebrations();
        const celebrationsContainer = document.querySelector('.celebrations-list');
        
        if (celebrationsContainer) {
            celebrationsContainer.innerHTML = '';
            
            celebrations.forEach(celebration => {
                const celebrationElement = document.createElement('div');
                celebrationElement.className = 'celebration-item';
                celebrationElement.innerHTML = `
                    <div class="celebration-date">${celebration.date}</div>
                    <div class="celebration-info">
                        <span class="celebration-name">${celebration.icon} ${celebration.name}</span>
                        <span class="celebration-type">${celebration.type}</span>
                    </div>
                `;
                celebrationsContainer.appendChild(celebrationElement);
            });
        }
    }

    getUpcomingCelebrations() {
        const now = new Date();
        const year = now.getFullYear();
        
        // Calculate important dates
        const easter = this.calculateEaster(year);
        const christmas = new Date(year, 11, 25);
        const newYear = new Date(year + 1, 0, 1);
        const epiphany = new Date(year + 1, 0, 6);
        
        const celebrations = [
            {
                date: this.formatShortDate(christmas),
                name: 'Natal do Senhor',
                type: 'Solenidade',
                icon: '🎄',
                fullDate: christmas
            },
            {
                date: this.formatShortDate(newYear),
                name: 'Santa Maria, Mãe de Deus',
                type: 'Solenidade',
                icon: '👼',
                fullDate: newYear
            },
            {
                date: this.formatShortDate(epiphany),
                name: 'Epifania do Senhor',
                type: 'Solenidade',
                icon: '⭐',
                fullDate: epiphany
            },
            {
                date: this.formatShortDate(easter),
                name: 'Domingo de Páscoa',
                type: 'Solenidade',
                icon: '🌅',
                fullDate: easter
            }
        ];

        // Filter and sort upcoming celebrations
        return celebrations
            .filter(celebration => celebration.fullDate > now)
            .sort((a, b) => a.fullDate - b.fullDate)
            .slice(0, 3); // Show only next 3 celebrations
    }

    formatShortDate(date) {
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short'
        }).toUpperCase().replace('.', '');
    }

    // Method to get feast data for a specific date (for future API integration)
    async getFeastData(date) {
        // This would integrate with a liturgical calendar API
        // For example: http://calapi.inadiutorium.cz/api/v0/en/calendars/general-en/
        try {
            // Placeholder for API call
            const response = await fetch(`/api/liturgical-calendar/${date.toISOString().split('T')[0]}`);
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.warn('Could not fetch liturgical data from API:', error);
        }
        
        // Fallback to local data
        return this.getSampleReadings(this.getCurrentLiturgicalSeason(date), date);
    }

    // Method to export calendar data
    exportCalendarData(startDate, endDate) {
        const data = [];
        const current = new Date(startDate);
        
        while (current <= endDate) {
            const season = this.getCurrentLiturgicalSeason(current);
            const readings = this.getSampleReadings(season, current);
            
            data.push({
                date: current.toISOString().split('T')[0],
                dayOfWeek: current.toLocaleDateString('pt-BR', { weekday: 'long' }),
                season: season.name,
                color: season.color,
                readings: readings
            });
            
            current.setDate(current.getDate() + 1);
        }
        
        return data;
    }
}

// Initialize Liturgical Calendar
const liturgicalCalendar = new LiturgicalCalendar();

// Export for global access
window.liturgicalCalendar = liturgicalCalendar;

export default LiturgicalCalendar;
